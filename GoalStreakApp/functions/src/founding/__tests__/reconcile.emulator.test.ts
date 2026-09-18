/**
 * reconcile.emulator.test.ts
 *
 * Emulator integration tests for the reconcilePendingGrants scheduled function.
 * Validates that pending Pro grants are retried and transitioned to 'granted'
 * on success, and that failures leave the record pending for the next run.
 *
 * Property 7: Pro grant eventually completes or stays pending — every assigned
 * number has proGrantStatus in {pending, granted}; a pending grant is retried
 * until granted.
 *
 * **Validates: Requirements R5.3, R5.4, R5.5**
 *
 * Run with:
 *   firebase emulators:exec --only firestore \
 *     "npx jest --testPathPattern=reconcile.emulator" \
 *     --project demo-goalstreak
 *
 * Or start the emulator separately and run jest directly:
 *   firebase emulators:start --only firestore &
 *   npx jest --testPathPattern=reconcile.emulator
 */

// ---------------------------------------------------------------------------
// Environment setup — MUST come before any firebase-admin import so the
// module-level initializeApp() in reconcile.ts picks up the emulator host.
// ---------------------------------------------------------------------------
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.REVENUECAT_SECRET_KEY = 'test-secret-key';

import { App, deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { grantProEntitlement } from '../revenuecat';

// Mock RevenueCat so no real HTTP calls are made during tests.
jest.mock('../revenuecat');

// Import after env vars and mock are in place so the module-level
// initializeApp() inside reconcile.ts runs against the emulator.
import { reconcileHandler } from '../reconcile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const mockGrant = grantProEntitlement as jest.MockedFunction<typeof grantProEntitlement>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_PROFILES_COLLECTION = 'userProfiles';
const PROJECT_ID = 'demo-goalstreak';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1_000;

// Emulator round-trips can take several seconds on first run.
jest.setTimeout(30_000);

// ---------------------------------------------------------------------------
// Admin app lifecycle
// ---------------------------------------------------------------------------

let app: App;

beforeAll(() => {
  if (getApps().length === 0) {
    app = initializeApp({ projectId: PROJECT_ID });
  } else {
    app = getApps()[0];
  }
});

afterAll(async () => {
  if (app) {
    await deleteApp(app);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Delete all documents in a collection (for test isolation). */
async function clearCollection(collectionPath: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection(collectionPath).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

/** Seed a userProfiles doc with pending grant status. */
async function seedPendingProfile(uid: string, foundingNumber: number): Promise<void> {
  const db = getFirestore();
  await db
    .collection(USER_PROFILES_COLLECTION)
    .doc(uid)
    .set({
      foundingMember: true,
      foundingNumber,
      foundingRecord: {
        number: foundingNumber,
        grantedAt: Timestamp.now(),
        proExpiresAt: null,
        proGrantStatus: 'pending',
        lastAttemptAt: null,
      },
    });
}

/** Read the userProfiles document for a given uid. */
async function readProfile(uid: string): Promise<FirebaseFirestore.DocumentData | null> {
  const db = getFirestore();
  const snap = await db.collection(USER_PROFILES_COLLECTION).doc(uid).get();
  return snap.exists ? (snap.data() ?? null) : null;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearCollection(USER_PROFILES_COLLECTION);
  // Default mock: RevenueCat returns pending (avoids real HTTP calls).
  mockGrant.mockResolvedValue({ status: 'pending' });
});

// ---------------------------------------------------------------------------
// Test 1: Single pending doc — grant succeeds on reconciler run (R5.4)
// ---------------------------------------------------------------------------

describe('Test 1: single pending doc — grant succeeds', () => {
  it('transitions proGrantStatus to granted and sets proExpiresAt without touching badge or number', async () => {
    const uid = 'user-pending-1';
    await seedPendingProfile(uid, 42);

    const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
    mockGrant.mockResolvedValueOnce({ status: 'granted', proExpiresAt: expiresAt });

    await reconcileHandler();

    const profile = await readProfile(uid);
    expect(profile).not.toBeNull();

    // Grant should have succeeded (R5.4)
    expect(profile!.foundingRecord.proGrantStatus).toBe('granted');

    // proExpiresAt should be a Firestore Timestamp (not null) (R5.4)
    expect(profile!.foundingRecord.proExpiresAt).toBeTruthy();
    expect(profile!.foundingRecord.proExpiresAt).toBeInstanceOf(Timestamp);

    // Badge and number must not be touched (R5.6)
    expect(profile!.foundingMember).toBe(true);
    expect(profile!.foundingNumber).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Test 2: Grant still fails — stays pending (R5.5)
// ---------------------------------------------------------------------------

describe('Test 2: grant still fails — stays pending', () => {
  it('leaves proGrantStatus as pending and updates lastAttemptAt without touching badge or number', async () => {
    const uid = 'user-pending-fail';
    await seedPendingProfile(uid, 7);

    // RevenueCat continues to fail
    mockGrant.mockResolvedValue({ status: 'pending' });

    await reconcileHandler();

    const profile = await readProfile(uid);
    expect(profile).not.toBeNull();

    // Status must remain pending (R5.5)
    expect(profile!.foundingRecord.proGrantStatus).toBe('pending');

    // lastAttemptAt should be updated to reflect the retry (R5.5)
    expect(profile!.foundingRecord.lastAttemptAt).toBeTruthy();
    expect(profile!.foundingRecord.lastAttemptAt).toBeInstanceOf(Timestamp);

    // Badge and number must not be touched (R5.6)
    expect(profile!.foundingMember).toBe(true);
    expect(profile!.foundingNumber).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Test 3: No pending docs — runs without error (R5.4)
// ---------------------------------------------------------------------------

describe('Test 3: no pending docs — runs without error', () => {
  it('resolves cleanly and does not call grantProEntitlement when there are no pending docs', async () => {
    // No docs seeded — collection is empty

    await expect(reconcileHandler()).resolves.toBeUndefined();

    // RevenueCat must not be called at all
    expect(mockGrant).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Test 4: Multiple pending docs — each processed independently (R5.5)
// ---------------------------------------------------------------------------

describe('Test 4: multiple pending docs — processed independently', () => {
  it('grants 2 out of 3, leaves the third pending', async () => {
    await seedPendingProfile('user-multi-1', 1);
    await seedPendingProfile('user-multi-2', 2);
    await seedPendingProfile('user-multi-3', 3);

    const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
    mockGrant
      .mockResolvedValueOnce({ status: 'granted', proExpiresAt: expiresAt })
      .mockResolvedValueOnce({ status: 'granted', proExpiresAt: expiresAt })
      .mockResolvedValueOnce({ status: 'pending' });

    await reconcileHandler();

    const profiles = await Promise.all([
      readProfile('user-multi-1'),
      readProfile('user-multi-2'),
      readProfile('user-multi-3'),
    ]);

    const statuses = profiles.map((p) => p!.foundingRecord.proGrantStatus);

    // 2 should be granted, 1 should remain pending (R5.5)
    const grantedCount = statuses.filter((s) => s === 'granted').length;
    const pendingCount = statuses.filter((s) => s === 'pending').length;

    expect(grantedCount).toBe(2);
    expect(pendingCount).toBe(1);

    // RevenueCat should have been called once per profile (R5.5)
    expect(mockGrant).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// Property 7: proGrantStatus is always in {pending, granted} (R5.3, R5.4, R5.5)
// ---------------------------------------------------------------------------

describe('Property 7: proGrantStatus is always in {pending, granted}', () => {
  it('every foundingRecord.proGrantStatus is either pending or granted after a reconciler run', async () => {
    // Seed a mix: some succeed, some fail
    await seedPendingProfile('user-prop-1', 10);
    await seedPendingProfile('user-prop-2', 11);
    await seedPendingProfile('user-prop-3', 12);

    const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
    mockGrant
      .mockResolvedValueOnce({ status: 'granted', proExpiresAt: expiresAt })
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce({ status: 'granted', proExpiresAt: expiresAt });

    await reconcileHandler();

    const db = getFirestore();
    const snap = await db.collection(USER_PROFILES_COLLECTION).get();

    const validStatuses = new Set(['pending', 'granted']);

    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.foundingRecord) {
        const status = data.foundingRecord.proGrantStatus;
        expect(validStatuses.has(status)).toBe(true);
        // Must never be undefined, null, or any other value
        expect(status).not.toBeUndefined();
        expect(status).not.toBeNull();
      }
    });
  });
});

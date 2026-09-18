/**
 * concurrency.emulator.test.ts
 *
 * Emulator concurrency tests for the founding slot claim transaction.
 * Fires N simultaneous handleUserCreated calls and validates the atomic
 * properties that must hold under concurrent access.
 *
 * Properties validated:
 * - Property 1: Cap is never exceeded — claimed ∈ [0, 100]; no more than 100
 *   accounts have foundingMember == true.
 * - Property 2: Numbers are unique and contiguous — no two accounts share a
 *   foundingNumber in 1..100.
 * - Property 3: Counter is monotonic non-decreasing — no operation ever
 *   decreases claimed.
 *
 * **Validates: Requirements R3.3, R3.4, R3.6, R15.2, R15.3**
 *
 * Run with:
 *   firebase emulators:exec --only firestore \
 *     "npx jest --testPathPattern=concurrency.emulator" \
 *     --project demo-goalstreak
 *
 * Or start the emulator separately and run jest directly:
 *   firebase emulators:start --only firestore &
 *   npx jest --testPathPattern=concurrency.emulator
 */

// ---------------------------------------------------------------------------
// Environment setup — MUST come before any firebase-admin import so the
// module-level initializeApp() in onCreate.ts picks up the emulator host.
// ---------------------------------------------------------------------------
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.REVENUECAT_SECRET_KEY = 'test-secret-key';

import { App, deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { grantProEntitlement } from '../revenuecat';

// Mock RevenueCat so no real HTTP calls are made during tests.
jest.mock('../revenuecat');

// Import after env vars and mock are set so onCreate.ts module-level
// initializeApp() runs against the emulator.
import { handleUserCreated } from '../onCreate';

// ---------------------------------------------------------------------------
// Constants (mirrored from config.ts)
// ---------------------------------------------------------------------------

const COUNTER_COLLECTION = 'counters';
const COUNTER_DOC_ID = 'foundingMembers';
const CONFIG_COLLECTION = 'config';
const CONFIG_DOC_ID = 'foundingMembers';
const USER_PROFILES_COLLECTION = 'userProfiles';

const PROJECT_ID = 'demo-goalstreak';

// Concurrent emulator tests are slow — give generous timeout.
jest.setTimeout(60_000);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const mockGrant = grantProEntitlement as jest.MockedFunction<
  typeof grantProEntitlement
>;

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
// Helpers (copied from onUserCreated.emulator.test.ts for isolation)
// ---------------------------------------------------------------------------

/**
 * Delete all documents in a collection (for test isolation).
 * Safe for small test collections (< 500 docs).
 */
async function clearCollection(collectionPath: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection(collectionPath).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

/** Seed the config document with a launchTimestamp. */
async function seedConfig(launchTimestamp: string): Promise<void> {
  const db = getFirestore();
  await db
    .collection(CONFIG_COLLECTION)
    .doc(CONFIG_DOC_ID)
    .set({ launchTimestamp });
}

/** Seed the counter document with a claimed value. */
async function seedCounter(claimed: number): Promise<void> {
  const db = getFirestore();
  await db
    .collection(COUNTER_COLLECTION)
    .doc(COUNTER_DOC_ID)
    .set({ claimed });
}

/** Read the current claimed counter value. Returns null if the doc is absent. */
async function readClaimed(): Promise<number | null> {
  const db = getFirestore();
  const snap = await db
    .collection(COUNTER_COLLECTION)
    .doc(COUNTER_DOC_ID)
    .get();
  if (!snap.exists) return null;
  const val = snap.data()?.claimed;
  return typeof val === 'number' ? val : null;
}

/** Read the userProfiles document for a given uid. */
async function readProfile(
  uid: string,
): Promise<FirebaseFirestore.DocumentData | null> {
  const db = getFirestore();
  const snap = await db
    .collection(USER_PROFILES_COLLECTION)
    .doc(uid)
    .get();
  return snap.exists ? (snap.data() ?? null) : null;
}

/**
 * Builds a minimal mock UserRecord matching the shape handleUserCreated expects.
 * @param uid          Firebase Auth UID
 * @param createdAtIso ISO 8601 string for `metadata.creationTime`
 */
function makeUser(
  uid: string,
  createdAtIso: string,
): functions.auth.UserRecord {
  return {
    uid,
    email: `${uid}@test.com`,
    emailVerified: false,
    displayName: uid,
    disabled: false,
    metadata: {
      creationTime: createdAtIso,
      lastSignInTime: createdAtIso,
      toJSON: () => ({}),
    },
    providerData: [],
    toJSON: () => ({}),
  } as unknown as functions.auth.UserRecord;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Clear all collections touched by the tests to ensure isolation.
  await Promise.all([
    clearCollection(USER_PROFILES_COLLECTION),
    clearCollection(COUNTER_COLLECTION),
    clearCollection(CONFIG_COLLECTION),
  ]);

  // Default mock: RevenueCat returns pending (avoids real HTTP calls).
  mockGrant.mockResolvedValue({ status: 'pending' });
});

// ---------------------------------------------------------------------------
// Test suite 1: Last-slot race — N=10 callers, claimed=99, only 1 slot left
// Validates: Property 1 (cap never exceeded), R3.3, R3.4, R3.6, R15.2, R15.3
// ---------------------------------------------------------------------------

describe('Concurrency: last-slot race (N=10, claimed=99)', () => {
  it('grants foundingNumber 100 to exactly one account and leaves counter at 100', async () => {
    const T0 = '2025-01-01T00:00:00Z';
    const signupTime = '2025-01-02T00:00:00Z'; // after T0 — all callers eligible

    await seedConfig(T0);
    await seedCounter(99); // one slot remaining

    const N = 10;
    const uids = Array.from({ length: N }, (_, i) => `race-user-${i}`);

    // Fire all N handleUserCreated calls simultaneously. (R3.4)
    await Promise.all(
      uids.map((uid) => handleUserCreated(makeUser(uid, signupTime))),
    );

    // Read all profiles.
    const profiles = await Promise.all(uids.map((uid) => readProfile(uid)));

    // Count how many accounts were granted a founding slot.
    const foundingProfiles = profiles.filter(
      (p) => p !== null && p.foundingMember === true,
    );
    const nonFoundingProfiles = profiles.filter(
      (p) => p !== null && p.foundingMember === false,
    );

    // Exactly one account should have received founding membership. (R3.4, R15.2)
    expect(foundingProfiles).toHaveLength(1);

    // The winner must have foundingNumber 100 — the last slot. (R3.2, R3.3)
    expect(foundingProfiles[0]!.foundingNumber).toBe(100);
    expect(foundingProfiles[0]!.foundingRecord.number).toBe(100);

    // All other accounts are non-founding. (R3.5)
    expect(nonFoundingProfiles).toHaveLength(N - 1);
    nonFoundingProfiles.forEach((p) => {
      expect(p!.foundingMember).toBe(false);
    });

    // Counter must end at exactly 100 — never exceeds the cap. (R3.6, R15.2)
    const finalClaimed = await readClaimed();
    expect(finalClaimed).toBe(100);

    // Uniqueness: collect all non-zero foundingNumbers across all profiles
    // and confirm there are no duplicates. (R3.3, R15.3)
    const allNumbers = profiles
      .filter((p) => p !== null && typeof p.foundingNumber === 'number' && p.foundingNumber > 0)
      .map((p) => p!.foundingNumber as number);

    const uniqueNumbers = new Set(allNumbers);
    expect(uniqueNumbers.size).toBe(allNumbers.length); // no duplicates
  });
});

// ---------------------------------------------------------------------------
// Test suite 2: General race — N=5 callers, claimed=0, all 5 slots available
// Validates: Property 2 (unique numbers), Property 3 (monotonic counter),
//            R3.3, R3.6, R15.3
// ---------------------------------------------------------------------------

describe('Concurrency: general race (N=5, claimed=0)', () => {
  it('assigns unique, non-duplicate founding numbers to all 5 winning accounts', async () => {
    const T0 = '2025-01-01T00:00:00Z';
    const signupTime = '2025-01-02T00:00:00Z'; // after T0

    await seedConfig(T0);
    await seedCounter(0); // all 100 slots available

    const N = 5;
    const uids = Array.from({ length: N }, (_, i) => `general-race-user-${i}`);

    // Fire all N calls simultaneously.
    await Promise.all(
      uids.map((uid) => handleUserCreated(makeUser(uid, signupTime))),
    );

    // Read all profiles.
    const profiles = await Promise.all(uids.map((uid) => readProfile(uid)));

    // All N callers have available slots — every account should be a founding member.
    const foundingProfiles = profiles.filter(
      (p) => p !== null && p.foundingMember === true,
    );
    expect(foundingProfiles).toHaveLength(N);

    // Collect the assigned founding numbers.
    const assignedNumbers = foundingProfiles.map(
      (p) => p!.foundingNumber as number,
    );

    // Property 2: Numbers are unique — no two accounts share a foundingNumber. (R3.3, R15.3)
    const uniqueNumbers = new Set(assignedNumbers);
    expect(uniqueNumbers.size).toBe(N);

    // Numbers must all be in the valid range [1, N]. (R3.2)
    assignedNumbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(N);
    });

    // Numbers form a contiguous set 1..N (all slots assigned exactly once).
    const sortedNumbers = [...assignedNumbers].sort((a, b) => a - b);
    sortedNumbers.forEach((n, idx) => {
      expect(n).toBe(idx + 1);
    });

    // foundingRecord.number must match the flat foundingNumber field for each winner.
    foundingProfiles.forEach((p) => {
      expect(p!.foundingRecord.number).toBe(p!.foundingNumber);
    });

    // Property 3: Counter is monotonic non-decreasing — final value equals
    // the number of winning accounts (N). (R3.6, R13.1)
    const finalClaimed = await readClaimed();
    expect(finalClaimed).toBe(N);
  });
});

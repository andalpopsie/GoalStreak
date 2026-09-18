/**
 * onUserCreated.emulator.test.ts
 *
 * Integration tests for handleUserCreated using the Firestore emulator.
 * The handler is called directly with a mock UserRecord — no Functions
 * emulator required, just Firestore.
 *
 * Run with:
 *   firebase emulators:exec --only firestore \
 *     "npx jest --testPathPattern=onUserCreated.emulator"
 *
 * Or start the emulator separately and run jest directly:
 *   firebase emulators:start --only firestore &
 *   npx jest --testPathPattern=onUserCreated.emulator
 *
 * Requirements: R1, R2, R3, R13
 */

// ---------------------------------------------------------------------------
// Environment setup — MUST come before any firebase-admin import so the
// module-level initializeApp() in onCreate.ts picks up the emulator host.
// With ts-jest/CommonJS, `import` compiles to synchronous `require()` calls
// that run after this assignment.
// ---------------------------------------------------------------------------
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.REVENUECAT_SECRET_KEY = 'test-secret-key';

import { App, deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { grantProEntitlement } from '../revenuecat';

// Mock RevenueCat so no real HTTP calls are made during tests.
jest.mock('../revenuecat');

// Import after env vars and mock are in place so the module-level
// initializeApp() inside onCreate.ts runs against the emulator.
import { handleUserCreated } from '../onCreate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const mockGrant = grantProEntitlement as jest.MockedFunction<typeof grantProEntitlement>;

// ---------------------------------------------------------------------------
// Constants (mirrored from config.ts)
// ---------------------------------------------------------------------------

const COUNTER_COLLECTION = 'counters';
const COUNTER_DOC_ID = 'foundingMembers';
const CONFIG_COLLECTION = 'config';
const CONFIG_DOC_ID = 'foundingMembers';
const USER_PROFILES_COLLECTION = 'userProfiles';

const PROJECT_ID = 'demo-goalstreak';
// Emulator round-trips can take several seconds on first run.
// 30 s is generous but avoids spurious timeouts on cold starts.
jest.setTimeout(30_000);



// ---------------------------------------------------------------------------
// Admin app lifecycle
// ---------------------------------------------------------------------------

let app: App;

beforeAll(() => {
  // If onCreate.ts already initialised an app at module load time, reuse it;
  // otherwise initialise now.
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

/**
 * Delete all documents in a collection (for test isolation).
 * Safe for test collections — assumes < 500 docs (Firestore batch write cap).
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
  const snap = await db.collection(COUNTER_COLLECTION).doc(COUNTER_DOC_ID).get();
  if (!snap.exists) return null;
  const val = snap.data()?.claimed;
  return typeof val === 'number' ? val : null;
}

/** Read the userProfiles document for a given uid. */
async function readProfile(uid: string): Promise<FirebaseFirestore.DocumentData | null> {
  const db = getFirestore();
  const snap = await db.collection(USER_PROFILES_COLLECTION).doc(uid).get();
  return snap.exists ? (snap.data() ?? null) : null;
}

/**
 * Builds a minimal mock UserRecord matching the shape handleUserCreated expects.
 * @param uid          Firebase Auth UID
 * @param createdAtIso ISO 8601 string for `metadata.creationTime`
 */
function makeUser(uid: string, createdAtIso: string): functions.auth.UserRecord {
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
// Test 1: Eligible signup happy path (R1.4, R3.1, R3.2, R6.1, R6.2)
// ---------------------------------------------------------------------------

describe('Test 1: eligible signup after T0 with claimed < 100', () => {
  it('sets foundingMember: true, assigns the correct founding number, and increments the counter', async () => {
    const T0 = '2025-01-01T00:00:00Z';
    const signupTime = '2025-01-01T01:00:00Z'; // after T0
    const startingClaimed = 5;

    await seedConfig(T0);
    await seedCounter(startingClaimed);

    const uid = 'user-eligible-1';
    await handleUserCreated(makeUser(uid, signupTime));

    const profile = await readProfile(uid);
    expect(profile).not.toBeNull();
    expect(profile!.foundingMember).toBe(true);

    // foundingNumber flat field (R6.1)
    expect(profile!.foundingNumber).toBe(startingClaimed + 1); // 6

    // foundingRecord.number (R6.1, R3.2)
    expect(profile!.foundingRecord).toBeDefined();
    expect(profile!.foundingRecord.number).toBe(startingClaimed + 1); // 6

    // Counter must have incremented by exactly 1 (R3.1, R3.6)
    const claimed = await readClaimed();
    expect(claimed).toBe(startingClaimed + 1); // 6
  });
});

// ---------------------------------------------------------------------------
// Test 2: Pre-T0 signup (R1.3, R2.6)
// ---------------------------------------------------------------------------

describe('Test 2: pre-T0 signup', () => {
  it('sets foundingMember: false and leaves the counter unchanged', async () => {
    const T0 = '2025-06-01T00:00:00Z'; // far future launch
    const signupTime = '2025-01-01T00:00:00Z'; // before T0
    const startingClaimed = 3;

    await seedConfig(T0);
    await seedCounter(startingClaimed);

    const uid = 'user-pre-t0';
    await handleUserCreated(makeUser(uid, signupTime));

    const profile = await readProfile(uid);
    expect(profile).not.toBeNull();
    expect(profile!.foundingMember).toBe(false);

    // Counter must be unchanged (R2.6)
    const claimed = await readClaimed();
    expect(claimed).toBe(startingClaimed); // still 3
  });
});

// ---------------------------------------------------------------------------
// Test 3: 101st signup — sold out (R3.5, R13.3)
// ---------------------------------------------------------------------------

describe('Test 3: 101st signup when claimed = 100', () => {
  it('sets foundingMember: false and leaves claimed at 100', async () => {
    const T0 = '2025-01-01T00:00:00Z';
    const signupTime = '2025-01-02T00:00:00Z'; // after T0, eligible timing

    await seedConfig(T0);
    await seedCounter(100); // all 100 slots already taken

    const uid = 'user-101st';
    await handleUserCreated(makeUser(uid, signupTime));

    const profile = await readProfile(uid);
    expect(profile).not.toBeNull();
    expect(profile!.foundingMember).toBe(false);

    // Counter must stay at 100 — never exceeds cap (R3.5, R3.6, R13.1)
    const claimed = await readClaimed();
    expect(claimed).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Idempotency — re-invoking for the same uid does not claim again
// (R3.3, R6.7)
// ---------------------------------------------------------------------------

describe('Test 4: idempotency', () => {
  it('does not claim a second slot when handleUserCreated is called twice for the same uid', async () => {
    const T0 = '2025-01-01T00:00:00Z';
    const signupTime = '2025-01-01T12:00:00Z';

    await seedConfig(T0);
    await seedCounter(0);

    const uid = 'user-idempotent';
    const user = makeUser(uid, signupTime);

    // First invocation — should claim slot #1
    await handleUserCreated(user);

    const profileAfterFirst = await readProfile(uid);
    expect(profileAfterFirst!.foundingMember).toBe(true);
    expect(profileAfterFirst!.foundingNumber).toBe(1);
    expect(profileAfterFirst!.foundingRecord.number).toBe(1);

    const claimedAfterFirst = await readClaimed();
    expect(claimedAfterFirst).toBe(1);

    // Second invocation — must NOT claim another slot
    await handleUserCreated(user);

    const profileAfterSecond = await readProfile(uid);
    expect(profileAfterSecond!.foundingNumber).toBe(1); // still 1, not 2
    expect(profileAfterSecond!.foundingRecord.number).toBe(1); // still 1

    // Counter must still be 1 — not incremented again (R3.3)
    const claimedAfterSecond = await readClaimed();
    expect(claimedAfterSecond).toBe(1); // still 1, not 2
  });
});

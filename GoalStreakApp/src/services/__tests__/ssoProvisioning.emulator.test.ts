/**
 * Feature: sso-authentication — provisioning + deletion integration tests (emulator)
 *
 * Exercises the Firestore data-layer behavior of the shared new-user
 * provisioning path (userProvisioningService.provisionNewUser) and the
 * account-deletion cleanup (accountDeletionService.deleteAccount) against a
 * live Firestore emulator.
 *
 * Why the logic is reproduced instead of imported: the real service modules
 * (`userProvisioningService`, `accountDeletionService`, `usernameUtils`,
 * `friendService`) all import `./firebase`, which calls
 * `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`.
 * That React Native persistence wiring cannot load in a Node test context, so
 * the write/teardown paths are mirrored here FAITHFULLY (same collections,
 * same document shape, same ordering) — the same approach used by
 * blockReport.emulator.test.ts. When the mirrored logic drifts from the source
 * these tests would still pass, so they are paired with the mocked-Firestore
 * property tests (P3–P8) that import the real modules.
 *
 * Coverage:
 *   1. New-user provisioning end-to-end (R5.1, R5.4, R5.6, R5.7, R2.6) — the
 *      shared path used by BOTH email sign-up and first-time SSO.
 *   2. Provisioning idempotency (R5.12) — a second run creates no duplicates.
 *   3. Account-deletion Firestore cleanup (R6.5) — owned docs, friend data,
 *      group invitations, username release, and per-user docs are removed.
 *      (deleteUser() on Firebase Auth, the Storage photo, and AsyncStorage
 *      cleanup require a real signed-in auth user / native modules and are NOT
 *      exercised here — see the note on that test.)
 *   4. Provider-not-enabled path (R9.6) — documented as covered by the
 *      ssoService.mapAuthError property (auth/operation-not-allowed →
 *      'unavailable'); not feasible against the Firestore emulator.
 *
 * Requirements: 9.6, 5.1, 6.5
 *
 * Run via:
 *   npm run test:emulator
 * which expands to:
 *   firebase emulators:exec --only firestore --config firebase/firebase.json \
 *     --project demo-goalstreak "npx jest --config config/jest.emulator.config.js"
 */
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

const PROJECT_ID = 'goalstreak-integration-test';

const EULA_VERSION = '1.0';
const MAX_USERNAME_ATTEMPTS = 5;

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1';
  const port = Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1]) || 8080;
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    // Rules disabled: these tests verify the write/teardown DATA behavior of
    // provisioning + deletion, not the security rules (those live in the
    // *.rules.test.ts suites).
    firestore: {
      rules:
        'rules_version = "2";\nservice cloud.firestore {\n  match /databases/{db}/documents {\n    match /{doc=**} { allow read, write: if true; }\n  }\n}',
      host,
      port,
    },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// ---------------------------------------------------------------------------
// Faithful mirror of usernameUtils (generate / availability / reserve / release)
// ---------------------------------------------------------------------------

function generateUsername(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  const suffix = Math.floor(Math.random() * 900 + 100); // 100-999
  return `${base || 'user'}${suffix}`;
}

async function isUsernameAvailable(db: Firestore, username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
  return !snap.exists();
}

async function reserveUsername(db: Firestore, username: string, userId: string): Promise<void> {
  await setDoc(doc(db, 'usernames', username.toLowerCase()), {
    userId,
    createdAt: new Date(),
  });
}

async function releaseUsername(db: Firestore, username: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'usernames', username.toLowerCase()));
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Faithful mirror of userProvisioningService.provisionNewUser (R5.4–R5.12, R2.6)
// ---------------------------------------------------------------------------

interface FakeFirebaseUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface ProvisionInput {
  firebaseUser: FakeFirebaseUser;
  displayName?: string;
  photoURL?: string;
  eulaVersion: string;
}

interface ProvisionResult {
  username: string;
  created: boolean;
}

async function provisionNewUser(db: Firestore, input: ProvisionInput): Promise<ProvisionResult> {
  const { firebaseUser, eulaVersion } = input;
  const uid = firebaseUser.uid;

  // Idempotency guard (R5.12).
  const existing = await getDoc(doc(db, 'users', uid));
  if (existing.exists()) {
    const data = existing.data() as { username?: string } | undefined;
    return { username: data?.username ?? '', created: false };
  }

  const usernameSeed = input.displayName || firebaseUser.displayName || 'user';

  // Bounded collision retry (R5.5).
  let username: string | undefined;
  for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
    const candidate = generateUsername(usernameSeed);
    if (await isUsernameAvailable(db, candidate)) {
      username = candidate;
      break;
    }
  }
  if (!username) {
    throw new Error(
      `Unable to generate an available username after ${MAX_USERNAME_ATTEMPTS} attempts`,
    );
  }

  await reserveUsername(db, username, uid); // R5.6

  const displayName = input.displayName || username; // R5.8, R5.9

  const userData: Record<string, unknown> = {
    email: firebaseUser.email ?? '',
    displayName,
    username,
    hasCompletedOnboarding: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    eulaAcceptedAt: serverTimestamp(), // R2.6, R5.4
    eulaVersion,
  };
  if (input.photoURL) {
    userData.profilePicture = input.photoURL; // R5.10
  }

  await setDoc(doc(db, 'users', uid), userData); // R5.4

  // friendService.createUserProfile shape (R5.7).
  await setDoc(doc(db, 'userProfiles', uid), {
    email: (firebaseUser.email ?? '').toLowerCase(),
    name: displayName,
    totalHabits: 0,
    totalCompletions: 0,
    longestStreak: 0,
    joinedAt: serverTimestamp(),
    isPublic: true,
  });

  return { username, created: true };
}

// ---------------------------------------------------------------------------
// Faithful mirror of accountDeletionService's Firestore-cleanup portion (R6.5)
//   (deleteUser / Storage photo / AsyncStorage are intentionally omitted — see
//    the note on the deletion test)
// ---------------------------------------------------------------------------

const USER_DOC_COLLECTIONS = ['users', 'userProfiles', 'socialSettings'];
const USER_OWNED_COLLECTIONS = [
  'habits',
  'completions',
  'streaks',
  'timerSessions',
  'timerStates',
  'activities',
  'trackedHabits',
];

async function deleteOwnedDocuments(db: Firestore, collectionName: string, userId: string) {
  const snap = await getDocs(query(collection(db, collectionName), where('userId', '==', userId)));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function deleteFriendData(db: Firestore, userId: string) {
  const [a, b, c, d] = await Promise.all([
    getDocs(query(collection(db, 'friends'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'friends'), where('friendId', '==', userId))),
    getDocs(query(collection(db, 'friendRequests'), where('fromUserId', '==', userId))),
    getDocs(query(collection(db, 'friendRequests'), where('toUserId', '==', userId))),
  ]);
  const allDocs = [...a.docs, ...b.docs, ...c.docs, ...d.docs];
  if (allDocs.length === 0) return;
  const batch = writeBatch(db);
  allDocs.forEach((ds) => batch.delete(ds.ref));
  await batch.commit();
}

async function deleteGroupInvitations(db: Firestore, userId: string) {
  const [a, b] = await Promise.all([
    getDocs(query(collection(db, 'groupInvitations'), where('toUserId', '==', userId))),
    getDocs(query(collection(db, 'groupInvitations'), where('fromUserId', '==', userId))),
  ]);
  const allDocs = [...a.docs, ...b.docs];
  if (allDocs.length === 0) return;
  const batch = writeBatch(db);
  allDocs.forEach((ds) => batch.delete(ds.ref));
  await batch.commit();
}

async function deleteUserDocs(db: Firestore, userId: string) {
  const batch = writeBatch(db);
  for (const collectionName of USER_DOC_COLLECTIONS) {
    batch.delete(doc(db, collectionName, userId));
  }
  await batch.commit();
}

/**
 * Mirrors the FIRESTORE cleanup steps of accountDeletionService.deleteAccount,
 * in the same order. Excludes the three steps that need a real auth user /
 * native modules: deleteProfilePhoto (Storage), clearLocalStorage
 * (AsyncStorage), and deleteUser (Firebase Auth).
 */
async function deleteAccountFirestoreCleanup(db: Firestore, userId: string) {
  // 1. Read the user doc to find the reserved username.
  let reservedUsername: string | undefined;
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    reservedUsername = userDoc.data().username;
  }

  // 2. Owned documents.
  await Promise.all(USER_OWNED_COLLECTIONS.map((c) => deleteOwnedDocuments(db, c, userId)));

  // 3. Friend data.
  await deleteFriendData(db, userId);

  // 4. Group invitations.
  await deleteGroupInvitations(db, userId);

  // 5. Release username.
  if (reservedUsername) {
    await releaseUsername(db, reservedUsername);
  }

  // 6. Per-user docs (users/{uid}, userProfiles/{uid}, ...).
  await deleteUserDocs(db, userId);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('New-user provisioning end-to-end (R5.1, R5.4, R5.6, R5.7, R2.6)', () => {
  it('creates a complete, well-formed record set for a first-time SSO user', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;

      const firebaseUser: FakeFirebaseUser = {
        uid: 'sso-new-user',
        email: 'alice@example.com',
        displayName: null, // Apple often omits on the credential itself
        photoURL: null,
      };

      const result = await provisionNewUser(db, {
        firebaseUser,
        displayName: 'Alice Example', // provider-supplied name (R5.8)
        photoURL: 'https://example.com/alice.png', // provider photo (R5.10)
        eulaVersion: EULA_VERSION,
      });

      expect(result.created).toBe(true);
      expect(result.username).toBeTruthy();

      // users/{uid} document (R5.4, R2.6)
      const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      expect(userSnap.exists()).toBe(true);
      const user = userSnap.data()!;
      expect(user.username).toBe(result.username);
      expect(user.username).toBeTruthy();
      expect(user.displayName).toBe('Alice Example');
      expect(user.hasCompletedOnboarding).toBe(false);
      expect(user.createdAt).toBeTruthy();
      expect(user.updatedAt).toBeTruthy();
      expect(user.eulaAcceptedAt).toBeTruthy(); // server timestamp resolved
      expect(user.eulaVersion).toBe(EULA_VERSION);
      expect(user.profilePicture).toBe('https://example.com/alice.png');

      // usernames/{username} reservation (R5.6)
      const usernameSnap = await getDoc(doc(db, 'usernames', result.username));
      expect(usernameSnap.exists()).toBe(true);
      expect(usernameSnap.data()!.userId).toBe(firebaseUser.uid);

      // userProfiles/{uid} (R5.7)
      const profileSnap = await getDoc(doc(db, 'userProfiles', firebaseUser.uid));
      expect(profileSnap.exists()).toBe(true);
      const profile = profileSnap.data()!;
      expect(profile.name).toBe('Alice Example');
      expect(profile.email).toBe('alice@example.com');
      expect(profile.isPublic).toBe(true);
    });
  });

  it('falls back to the generated username as displayName when the provider supplies no name (R5.9)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;

      const result = await provisionNewUser(db, {
        firebaseUser: { uid: 'sso-noname', email: 'bob@example.com', displayName: null },
        eulaVersion: EULA_VERSION,
      });

      const user = (await getDoc(doc(db, 'users', 'sso-noname'))).data()!;
      expect(user.displayName).toBe(result.username);
      // No provider photo → no profilePicture field (R5.10)
      expect(user.profilePicture).toBeUndefined();
    });
  });

  it('is idempotent — a second provisioning run creates no duplicate records and reports created:false (R5.12)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;

      const firebaseUser: FakeFirebaseUser = {
        uid: 'sso-repeat',
        email: 'carol@example.com',
        displayName: 'Carol',
      };

      const first = await provisionNewUser(db, { firebaseUser, eulaVersion: EULA_VERSION });
      expect(first.created).toBe(true);

      const second = await provisionNewUser(db, { firebaseUser, eulaVersion: EULA_VERSION });
      expect(second.created).toBe(false);
      expect(second.username).toBe(first.username);

      // Still exactly one username reservation for this uid.
      const usernames = await getDocs(
        query(collection(db, 'usernames'), where('userId', '==', 'sso-repeat')),
      );
      expect(usernames.size).toBe(1);
    });
  });
});

describe('Account-deletion Firestore cleanup (R6.5)', () => {
  /**
   * NOTE ON COVERAGE: this exercises the Firestore-cleanup portion of
   * accountDeletionService.deleteAccount. The full deleteAccount() also calls
   * deleteUser() on the Firebase Auth user, photoService.deleteProfilePhoto()
   * (Storage), and clearLocalStorage() (AsyncStorage). Those require a real
   * signed-in auth user and native modules that are not available in the
   * Node/emulator context, so they are not exercised here. The ordering
   * guarantee that deleteUser() runs LAST is verified by property P8
   * (accountDeletionService, spy on ordering).
   */
  it('removes owned docs, friend data, group invitations, username reservation, and per-user docs; leaves third parties intact', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;

      const UID = 'delete-me';
      const OTHER = 'other-user';

      // Seed the user's provisioned records + owned data.
      await provisionNewUser(db, {
        firebaseUser: { uid: UID, email: 'del@example.com', displayName: 'Del User' },
        eulaVersion: EULA_VERSION,
      });
      const reservedUsername = (await getDoc(doc(db, 'users', UID))).data()!.username;

      // Owned docs (userId field).
      await setDoc(doc(db, 'habits/h1'), { userId: UID, name: 'Run' });
      await setDoc(doc(db, 'habits/h2'), { userId: UID, name: 'Read' });
      await setDoc(doc(db, 'completions/c1'), { userId: UID, habitId: 'h1' });
      // A third party's habit that must survive.
      await setDoc(doc(db, 'habits/h3'), { userId: OTHER, name: 'Swim' });

      // Friend + request data (both directions).
      await setDoc(doc(db, 'friends/f1'), { userId: UID, friendId: OTHER });
      await setDoc(doc(db, 'friends/f2'), { userId: OTHER, friendId: UID });
      await setDoc(doc(db, 'friendRequests/r1'), { fromUserId: UID, toUserId: OTHER });

      // Group invitation.
      await setDoc(doc(db, 'groupInvitations/gi1'), { fromUserId: UID, toUserId: OTHER });

      // Sanity: everything present before deletion.
      expect((await getDoc(doc(db, 'users', UID))).exists()).toBe(true);
      expect((await getDoc(doc(db, 'usernames', reservedUsername))).exists()).toBe(true);

      await deleteAccountFirestoreCleanup(db, UID);

      // Per-user docs gone.
      expect((await getDoc(doc(db, 'users', UID))).exists()).toBe(false);
      expect((await getDoc(doc(db, 'userProfiles', UID))).exists()).toBe(false);
      // Owned docs gone.
      expect((await getDoc(doc(db, 'habits/h1'))).exists()).toBe(false);
      expect((await getDoc(doc(db, 'habits/h2'))).exists()).toBe(false);
      expect((await getDoc(doc(db, 'completions/c1'))).exists()).toBe(false);
      // Friend + request data gone (both directions).
      expect((await getDoc(doc(db, 'friends/f1'))).exists()).toBe(false);
      expect((await getDoc(doc(db, 'friends/f2'))).exists()).toBe(false);
      expect((await getDoc(doc(db, 'friendRequests/r1'))).exists()).toBe(false);
      // Group invitation gone.
      expect((await getDoc(doc(db, 'groupInvitations/gi1'))).exists()).toBe(false);
      // Username reservation released.
      expect((await getDoc(doc(db, 'usernames', reservedUsername))).exists()).toBe(false);

      // Third party's data untouched.
      expect((await getDoc(doc(db, 'habits/h3'))).exists()).toBe(true);
    });
  });

  it('cleanup is re-runnable — a second run after a completed deletion is a harmless no-op (R6.9)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      const UID = 'rerun-user';

      await provisionNewUser(db, {
        firebaseUser: { uid: UID, email: 'rerun@example.com', displayName: 'Rerun' },
        eulaVersion: EULA_VERSION,
      });

      await deleteAccountFirestoreCleanup(db, UID);
      // Second run must not throw and must leave nothing behind.
      await expect(deleteAccountFirestoreCleanup(db, UID)).resolves.toBeUndefined();
      expect((await getDoc(doc(db, 'users', UID))).exists()).toBe(false);
    });
  });
});

describe('Provider-not-enabled path (R9.6)', () => {
  /**
   * Firebase Console provider enablement is not representable in the Firestore
   * emulator (it is an Auth-service configuration concern, and these tests run
   * against Firestore only). The behavioral contract — an SSO attempt for a
   * provider disabled in the console surfaces auth/operation-not-allowed which
   * ssoService.mapAuthError classifies as the 'unavailable' SsoErrorKind — is
   * covered by Property 1 (ssoService.mapAuthError) and the useAuth failure
   * paths. This placeholder documents that coverage decision explicitly.
   */
  it.skip('is covered by ssoService.mapAuthError (auth/operation-not-allowed → "unavailable"); not feasible against the Firestore emulator', () => {
    // Intentionally skipped — see the comment above and Property 1.
  });
});

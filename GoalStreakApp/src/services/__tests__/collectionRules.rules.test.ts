/**
 * Firestore security rules tests for the collections restored after the
 * permissive-wildcard rules were replaced with granular per-collection rules.
 *
 * Covers: users, userProfiles, socialSettings, usernames, comments,
 * timerSessions, feedback — the collections that were relying on the old
 * `match /{document=**}` wildcard and broke once it was removed.
 *
 * Run via:
 *   npm run test:emulator
 * (which runs `firebase emulators:exec --only firestore ... jest`)
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

const PROJECT_ID = 'goalstreak-collection-rules-test';
const RULES_PATH = resolve(__dirname, '../../../firebase/firestore.rules');

const ALICE = 'alice-uid';
const BOB = 'bob-uid';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1';
  const port = Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1]) || 8080;

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host,
      port,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// Helper: seed a doc bypassing rules so we can test reads/updates/deletes.
async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

describe('users rules', () => {
  it('allows any authenticated user to read another user profile', async () => {
    await seed(`users/${BOB}`, { displayName: 'Bob', email: 'bob@example.com' });
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, `users/${BOB}`)));
  });

  it('denies reads when unauthenticated', async () => {
    await seed(`users/${BOB}`, { displayName: 'Bob' });
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, `users/${BOB}`)));
  });

  it('allows the owner to write their own doc', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, `users/${ALICE}`), { displayName: 'Alice' }));
  });

  it('denies writing another user doc', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(setDoc(doc(db, `users/${BOB}`), { displayName: 'Hacked' }));
  });
});

describe('userProfiles rules', () => {
  it('allows an authenticated user to query profiles by email (friend search)', async () => {
    await seed(`userProfiles/${BOB}`, { userId: BOB, email: 'bob@example.com' });
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      getDocs(query(collection(db, 'userProfiles'), where('email', '==', 'bob@example.com')))
    );
  });

  it('allows the owner to write their own profile', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, `userProfiles/${ALICE}`), { userId: ALICE, name: 'Alice' }));
  });

  it('denies writing another user profile', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(setDoc(doc(db, `userProfiles/${BOB}`), { userId: BOB }));
  });
});

describe('socialSettings rules', () => {
  it('allows an authenticated user to read another user settings (notification check)', async () => {
    await seed(`socialSettings/${BOB}`, { userId: BOB, allowFriendRequests: true });
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, `socialSettings/${BOB}`)));
  });

  it('allows the owner to write their own settings', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, `socialSettings/${ALICE}`), { userId: ALICE }));
  });

  it('denies writing another user settings', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(setDoc(doc(db, `socialSettings/${BOB}`), { userId: BOB }));
  });
});

describe('usernames rules', () => {
  it('allows authenticated availability checks (read)', async () => {
    await seed('usernames/taken', { userId: BOB, createdAt: new Date() });
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, 'usernames/taken')));
  });

  it('allows reserving a username tied to your own uid', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, 'usernames/alice'), { userId: ALICE, createdAt: new Date() }));
  });

  it('denies reserving a username under someone else uid', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(setDoc(doc(db, 'usernames/spoof'), { userId: BOB, createdAt: new Date() }));
  });

  it('allows the owner to release (delete) their username', async () => {
    await seed('usernames/alice', { userId: ALICE, createdAt: new Date() });
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'usernames/alice')));
  });

  it('denies deleting a username owned by someone else', async () => {
    await seed('usernames/bob', { userId: BOB, createdAt: new Date() });
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(deleteDoc(doc(db, 'usernames/bob')));
  });
});

describe('comments rules', () => {
  const commentData = { activityId: 'act1', userId: ALICE, userName: 'Alice', text: 'nice!' };

  it('allows an authenticated user to read comments (comment count)', async () => {
    await seed('comments/c1', commentData);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertSucceeds(
      getDocs(query(collection(db, 'comments'), where('activityId', '==', 'act1')))
    );
  });

  it('allows the author to create their own comment', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(addDoc(collection(db, 'comments'), commentData));
  });

  it('denies creating a comment under another uid', async () => {
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(addDoc(collection(db, 'comments'), commentData));
  });

  it('denies updates and deletes (immutable)', async () => {
    await seed('comments/c1', commentData);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(db, 'comments/c1'), { text: 'edited' }));
    await assertFails(deleteDoc(doc(db, 'comments/c1')));
  });
});

describe('timerSessions rules', () => {
  const sessionData = { userId: ALICE, habitId: 'h1', duration: 600 };

  it('allows an authenticated user to read timer sessions', async () => {
    await seed('timerSessions/s1', sessionData);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, 'timerSessions/s1')));
  });

  it('allows the owner to create their own session', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, 'timerSessions/s1'), sessionData));
  });

  it('denies creating a session under another uid', async () => {
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(setDoc(doc(db, 'timerSessions/s1'), sessionData));
  });
});

describe('feedback rules', () => {
  it('allows any authenticated user to submit feedback', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      addDoc(collection(db, 'feedback'), { userId: ALICE, rating: 5, source: 'app' })
    );
  });

  it('denies feedback submission when unauthenticated', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      addDoc(collection(db, 'feedback'), { userId: 'anonymous', rating: 5 })
    );
  });

  it('denies clients from reading feedback back', async () => {
    await seed('feedback/f1', { userId: ALICE, rating: 5 });
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(getDoc(doc(db, 'feedback/f1')));
  });
});

/**
 * Feature: report-and-block — Firestore service integration tests (emulator)
 *
 * Exercises the data-layer behavior of friendService.blockUser and
 * friendService.reportContent against a live Firestore emulator. The batch
 * teardown here mirrors friendService.blockUser exactly (same four query
 * shapes + single writeBatch); the app's real service module can't be imported
 * in a node context because firebase.ts wires React Native AsyncStorage
 * persistence, so the write path is reproduced faithfully instead.
 *
 * Requirements: 1.4, 1.8, 1.9 (blockUser teardown), 4.5 (reportContent)
 *
 * Run via:
 *   firebase emulators:exec --only firestore \
 *     "npx jest --config config/jest.emulator.config.js" --project goalstreak-test
 */
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

const PROJECT_ID = 'goalstreak-integration-test';

const ALICE = 'alice-uid';
const BOB = 'bob-uid';
const CAROL = 'carol-uid';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1';
  const port = Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1]) || 8080;
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    // Rules disabled: these tests verify the write/teardown data behavior,
    // not the security rules (those are covered in moderationRules.rules.test.ts).
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

/** Mirrors friendService.blockUser: gather + single-batch teardown. */
async function blockUser(db: Firestore, blockerId: string, blockedUserId: string) {
  const blocksCol = collection(db, 'blocks');
  const friendsCol = collection(db, 'friends');
  const requestsCol = collection(db, 'friendRequests');

  // Idempotent pre-check
  const existing = await getDocs(
    query(
      blocksCol,
      where('blockerId', '==', blockerId),
      where('blockedUserId', '==', blockedUserId)
    )
  );
  if (!existing.empty) return;

  const [f1, f2, r1, r2] = await Promise.all([
    getDocs(
      query(friendsCol, where('userId', '==', blockerId), where('friendId', '==', blockedUserId))
    ),
    getDocs(
      query(friendsCol, where('userId', '==', blockedUserId), where('friendId', '==', blockerId))
    ),
    getDocs(
      query(
        requestsCol,
        where('fromUserId', '==', blockerId),
        where('toUserId', '==', blockedUserId)
      )
    ),
    getDocs(
      query(
        requestsCol,
        where('fromUserId', '==', blockedUserId),
        where('toUserId', '==', blockerId)
      )
    ),
  ]);

  const batch = writeBatch(db);
  batch.set(doc(blocksCol), { blockerId, blockedUserId, createdAt: serverTimestamp() });
  [f1, f2, r1, r2].forEach((snap) => snap.forEach((d) => batch.delete(d.ref)));
  await batch.commit();
}

/** Mirrors friendService.reportContent. */
async function reportContent(
  db: Firestore,
  input: {
    reporterId: string;
    reportedUserId: string;
    contentType: string;
    contentId: string;
    reason: string;
  }
) {
  const ref = doc(collection(db, 'reports'));
  await setDoc(ref, { ...input, status: 'pending', timestamp: serverTimestamp() });
  return ref.id;
}

describe('blockUser teardown (R1.4, R1.8, R1.9)', () => {
  it('creates the block doc and removes both friendships + pending requests between the pair, leaving third parties intact', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;

      // Seed: A↔B friendship (both directions), a pending A→B request, and a
      // third-party A↔C friendship that must survive.
      await setDoc(doc(db, 'friends/ab'), { userId: ALICE, friendId: BOB });
      await setDoc(doc(db, 'friends/ba'), { userId: BOB, friendId: ALICE });
      await setDoc(doc(db, 'friendRequests/ab'), {
        fromUserId: ALICE,
        toUserId: BOB,
        status: 'pending',
      });
      await setDoc(doc(db, 'friends/ac'), { userId: ALICE, friendId: CAROL });

      await blockUser(db, ALICE, BOB);

      // Block doc exists with correct fields
      const blocks = await getDocs(
        query(collection(db, 'blocks'), where('blockerId', '==', ALICE))
      );
      expect(blocks.size).toBe(1);
      expect(blocks.docs[0].data().blockedUserId).toBe(BOB);
      expect(blocks.docs[0].data().createdAt).toBeTruthy();

      // Both friendship docs between A and B are gone
      expect((await getDoc(doc(db, 'friends/ab'))).exists()).toBe(false);
      expect((await getDoc(doc(db, 'friends/ba'))).exists()).toBe(false);
      // Pending request between the pair is gone
      expect((await getDoc(doc(db, 'friendRequests/ab'))).exists()).toBe(false);
      // Third-party friendship survives
      expect((await getDoc(doc(db, 'friends/ac'))).exists()).toBe(true);
    });
  });

  it('is idempotent — a repeat block does not create a second record', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      await blockUser(db, ALICE, BOB);
      await blockUser(db, ALICE, BOB);
      const blocks = await getDocs(
        query(collection(db, 'blocks'), where('blockerId', '==', ALICE))
      );
      expect(blocks.size).toBe(1);
    });
  });
});

describe('reportContent persistence (R4.5)', () => {
  it('persists a report with status pending and a server timestamp', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      const id = await reportContent(db, {
        reporterId: ALICE,
        reportedUserId: BOB,
        contentType: 'user',
        contentId: BOB,
        reason: 'harassment',
      });
      const snap = await getDoc(doc(db, 'reports', id));
      expect(snap.exists()).toBe(true);
      const data = snap.data()!;
      expect(data.status).toBe('pending');
      expect(data.reporterId).toBe(ALICE);
      expect(data.timestamp).toBeTruthy();
    });
  });
});

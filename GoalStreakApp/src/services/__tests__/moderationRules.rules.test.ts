/**
 * Feature: report-and-block — Firestore security rules tests
 *
 * Validates the `blocks` and `reports` rules from firebase/firestore.rules
 * against a live Firestore emulator using @firebase/rules-unit-testing.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 *
 * Run via:
 *   firebase emulators:exec --only firestore \
 *     "npx jest --config config/jest.emulator.config.js" --project goalstreak-test
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'goalstreak-rules-test';
const RULES_PATH = resolve(__dirname, '../../../firebase/firestore.rules');

const ALICE = 'alice-uid';
const BOB = 'bob-uid';
const CAROL = 'carol-uid';

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

describe('blocks rules', () => {
  const blockData = { blockerId: ALICE, blockedUserId: BOB, createdAt: new Date() };

  it('allows create when blockerId == uid (R6.3)', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, 'blocks/b1'), blockData));
  });

  it('denies create when blockerId != uid (R6.3)', async () => {
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(setDoc(doc(db, 'blocks/b1'), blockData));
  });

  it('denies create when unauthenticated (R6.3)', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'blocks/b1'), blockData));
  });

  it('allows read for the blocker (R6.4)', async () => {
    await seed('blocks/b1', blockData);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, 'blocks/b1')));
  });

  it('allows read for the blocked party (R6.4, R6.5)', async () => {
    await seed('blocks/b1', blockData);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertSucceeds(getDoc(doc(db, 'blocks/b1')));
  });

  it('denies read for an unrelated third party (R6.6)', async () => {
    await seed('blocks/b1', blockData);
    const db = testEnv.authenticatedContext(CAROL).firestore();
    await assertFails(getDoc(doc(db, 'blocks/b1')));
  });

  it('allows delete only for the blocker (R6.3)', async () => {
    await seed('blocks/b1', blockData);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'blocks/b1')));
  });

  it('denies delete for the blocked party (R6.3)', async () => {
    await seed('blocks/b1', blockData);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(deleteDoc(doc(db, 'blocks/b1')));
  });

  it('denies delete for an unrelated third party (R6.6)', async () => {
    await seed('blocks/b1', blockData);
    const db = testEnv.authenticatedContext(CAROL).firestore();
    await assertFails(deleteDoc(doc(db, 'blocks/b1')));
  });

  it('always denies update, even by the blocker (R6.8)', async () => {
    await seed('blocks/b1', blockData);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(db, 'blocks/b1'), { blockedUserId: CAROL }));
  });
});

describe('reports rules', () => {
  const reportData = {
    reporterId: ALICE,
    reportedUserId: BOB,
    contentType: 'user',
    contentId: BOB,
    reason: 'harassment',
    status: 'pending',
    timestamp: new Date(),
  };

  it('allows create when reporterId == uid (R6.1)', async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, 'reports/r1'), reportData));
  });

  it('denies create when reporterId != uid (R6.1)', async () => {
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(setDoc(doc(db, 'reports/r1'), reportData));
  });

  it('denies create when unauthenticated (R6.2)', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'reports/r1'), reportData));
  });

  it('allows the reporter to read their own report (R6.7)', async () => {
    await seed('reports/r1', reportData);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, 'reports/r1')));
  });

  it('denies read for a non-reporter (R6.7)', async () => {
    await seed('reports/r1', reportData);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(db, 'reports/r1')));
  });

  it('always denies update (R6.9)', async () => {
    await seed('reports/r1', reportData);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(db, 'reports/r1'), { status: 'reviewed' }));
  });

  it('always denies delete (R6.9)', async () => {
    await seed('reports/r1', reportData);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(deleteDoc(doc(db, 'reports/r1')));
  });
});

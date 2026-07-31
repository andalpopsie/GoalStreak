/**
 * Firestore rules tests for group invitation acceptance (self-join).
 *
 * Verifies an invited user can add ONLY themselves to a group, that this
 * requires a pending invitation, and that the path can't be abused to tamper
 * with the group or add someone else.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'goalstreak-group-join';
const RULES_PATH = resolve(__dirname, '../../../firebase/firestore.rules');

const ALICE = 'alice-uid'; // admin
const BOB = 'bob-uid';     // invited
const CAROL = 'carol-uid'; // uninvited third party

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1';
  const port = Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1]) || 8080;
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(RULES_PATH, 'utf8'), host, port },
  });
});
afterAll(async () => { if (testEnv) await testEnv.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

// Seed a group owned by ALICE with just ALICE as member.
async function seedGroup() {
  await seed('groups/g1', {
    adminId: ALICE,
    name: 'Morning Runners',
    status: 'active',
    memberIds: [ALICE],
    members: [{ userId: ALICE, userName: 'Alice', role: 'admin' }],
  });
}
async function seedPendingInvite(toUser: string) {
  await seed(`groupInvitations/g1_${toUser}`, {
    groupId: 'g1',
    fromUserId: ALICE,
    toUserId: toUser,
    status: 'pending',
  });
}

// The membership update a joining user performs.
function joinUpdate(newMemberId: string, newMemberName: string) {
  return {
    memberIds: [ALICE, newMemberId],
    members: [
      { userId: ALICE, userName: 'Alice', role: 'admin' },
      { userId: newMemberId, userName: newMemberName, role: 'member' },
    ],
    updatedAt: new Date(),
  };
}

describe('groups read', () => {
  it('allows any authenticated user to read a group (even non-members)', async () => {
    await seedGroup();
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertSucceeds(getDoc(doc(db, 'groups/g1')));
  });
  it('denies unauthenticated reads', async () => {
    await seedGroup();
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'groups/g1')));
  });
});

describe('groups self-join (accept invitation)', () => {
  it('allows an invited user to add only themselves', async () => {
    await seedGroup();
    await seedPendingInvite(BOB);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertSucceeds(updateDoc(doc(db, 'groups/g1'), joinUpdate(BOB, 'Bob')));
  });

  it('denies self-join without a pending invitation', async () => {
    await seedGroup();
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(updateDoc(doc(db, 'groups/g1'), joinUpdate(BOB, 'Bob')));
  });

  it('denies adding someone other than yourself', async () => {
    await seedGroup();
    await seedPendingInvite(BOB); // Bob is invited...
    const db = testEnv.authenticatedContext(BOB).firestore();
    // ...but Bob tries to add Carol instead of himself.
    await assertFails(updateDoc(doc(db, 'groups/g1'), joinUpdate(CAROL, 'Carol')));
  });

  it('denies changing other fields while joining (e.g. adminId)', async () => {
    await seedGroup();
    await seedPendingInvite(BOB);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(updateDoc(doc(db, 'groups/g1'), {
      ...joinUpdate(BOB, 'Bob'),
      adminId: BOB, // attempt to seize admin
    }));
  });

  it('denies removing an existing member under the guise of joining', async () => {
    await seedGroup();
    await seedPendingInvite(BOB);
    const db = testEnv.authenticatedContext(BOB).firestore();
    // Replaces ALICE with BOB (removal) — hasAll(old) fails.
    await assertFails(updateDoc(doc(db, 'groups/g1'), {
      memberIds: [BOB],
      members: [{ userId: BOB, userName: 'Bob', role: 'member' }],
      updatedAt: new Date(),
    }));
  });
});

describe('groups admin update still works', () => {
  it('allows the admin to update the group', async () => {
    await seedGroup();
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(updateDoc(doc(db, 'groups/g1'), { name: 'Evening Runners', updatedAt: new Date() }));
  });

  it('denies a non-admin, non-invited user from updating', async () => {
    await seedGroup();
    const db = testEnv.authenticatedContext(CAROL).firestore();
    await assertFails(updateDoc(doc(db, 'groups/g1'), { name: 'Hacked', updatedAt: new Date() }));
  });
});

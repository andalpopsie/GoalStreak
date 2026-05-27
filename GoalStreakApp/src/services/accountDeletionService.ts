// Account Deletion Service - Apple Guideline 5.1.1(v) compliance
//
// Permanently deletes a user's account and all associated data across:
//   • Firebase Auth (deletes the auth user)
//   • Firestore (all user-owned and user-referenced documents)
//   • Firebase Storage (profile photos)
//   • Local AsyncStorage caches
//
// This is an irreversible operation. The caller should require confirmation
// (and ideally re-authentication) before invoking deleteAccount.

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  WriteBatch,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { photoService } from './photoService';
import { releaseUsername } from '../utils/usernameUtils';

// Firestore batch writes are limited to 500 ops; we keep a safe margin.
const BATCH_LIMIT = 400;

// Collections that store one document per user, keyed by uid.
const USER_DOC_COLLECTIONS = [
  'users',
  'userProfiles',
  'socialSettings',
];

// Collections containing documents owned by a user via a `userId` field.
const USER_OWNED_COLLECTIONS = [
  'habits',
  'completions',
  'streaks',
  'timerSessions',
  'timerStates',
  'activities',
  'trackedHabits',
];

/**
 * Re-authenticate the current user with their password.
 * Firebase requires recent authentication for sensitive operations like deletion.
 */
export async function reauthenticate(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No authenticated user with an email address');
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

/**
 * Helper: commit a batch and start a fresh one when the op count gets near the limit.
 */
async function flushBatchIfNeeded(
  batch: WriteBatch,
  opCount: number,
): Promise<{ batch: WriteBatch; opCount: number }> {
  if (opCount >= BATCH_LIMIT) {
    await batch.commit();
    return { batch: writeBatch(db), opCount: 0 };
  }
  return { batch, opCount };
}

/**
 * Delete all documents in a collection where field === userId.
 */
async function deleteOwnedDocuments(
  collectionName: string,
  userIdField: string,
  userId: string,
): Promise<number> {
  const q = query(collection(db, collectionName), where(userIdField, '==', userId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return 0;

  let batch = writeBatch(db);
  let opCount = 0;
  let deleted = 0;

  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    opCount++;
    deleted++;
    ({ batch, opCount } = await flushBatchIfNeeded(batch, opCount));
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return deleted;
}

/**
 * Delete friend relationships and friend requests involving the user (either side).
 */
async function deleteFriendData(userId: string): Promise<void> {
  // Friends are stored with userId/friendId fields — delete both directions.
  const friendsAsUser = query(
    collection(db, 'friends'),
    where('userId', '==', userId),
  );
  const friendsAsFriend = query(
    collection(db, 'friends'),
    where('friendId', '==', userId),
  );

  // Friend requests can have the user as sender (fromUserId) or recipient (toUserId).
  const requestsAsSender = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', userId),
  );
  const requestsAsRecipient = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId),
  );

  const [a, b, c, d] = await Promise.all([
    getDocs(friendsAsUser),
    getDocs(friendsAsFriend),
    getDocs(requestsAsSender),
    getDocs(requestsAsRecipient),
  ]);

  const allDocs = [...a.docs, ...b.docs, ...c.docs, ...d.docs];
  if (allDocs.length === 0) return;

  let batch = writeBatch(db);
  let opCount = 0;

  for (const docSnap of allDocs) {
    batch.delete(docSnap.ref);
    opCount++;
    ({ batch, opCount } = await flushBatchIfNeeded(batch, opCount));
  }

  if (opCount > 0) {
    await batch.commit();
  }
}

/**
 * Delete group invitations sent to or from this user.
 */
async function deleteGroupInvitations(userId: string): Promise<void> {
  const invitesAsRecipient = query(
    collection(db, 'groupInvitations'),
    where('toUserId', '==', userId),
  );
  const invitesAsSender = query(
    collection(db, 'groupInvitations'),
    where('fromUserId', '==', userId),
  );

  const [a, b] = await Promise.all([
    getDocs(invitesAsRecipient),
    getDocs(invitesAsSender),
  ]);

  const allDocs = [...a.docs, ...b.docs];
  if (allDocs.length === 0) return;

  let batch = writeBatch(db);
  let opCount = 0;

  for (const docSnap of allDocs) {
    batch.delete(docSnap.ref);
    opCount++;
    ({ batch, opCount } = await flushBatchIfNeeded(batch, opCount));
  }

  if (opCount > 0) {
    await batch.commit();
  }
}

/**
 * Delete the user's per-user document from a collection (doc id === userId).
 */
async function deleteUserDocs(userId: string): Promise<void> {
  const batch = writeBatch(db);
  for (const collectionName of USER_DOC_COLLECTIONS) {
    batch.delete(doc(db, collectionName, userId));
  }
  await batch.commit();
}

/**
 * Clear local storage caches that key off the userId or contain account data.
 */
async function clearLocalStorage(userId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userScopedKeys = keys.filter(
      (key) =>
        key.includes(userId) ||
        key.startsWith('@goalstreak_') ||
        key.startsWith('@goalfer_'),
    );
    if (userScopedKeys.length > 0) {
      await AsyncStorage.multiRemove(userScopedKeys);
    }
  } catch (error) {
    // Non-fatal — cache cleanup failures shouldn't block account deletion.
    console.warn('Failed to clear local storage during deletion:', error);
  }
}

/**
 * Delete the user's profile photo from Firebase Storage.
 * Non-fatal if the photo doesn't exist.
 */
async function deleteProfilePhoto(userId: string): Promise<void> {
  try {
    await photoService.deleteProfilePhoto(userId);
  } catch (error: any) {
    // 'storage/object-not-found' is expected if the user never uploaded a photo.
    if (error?.code !== 'storage/object-not-found') {
      console.warn('Failed to delete profile photo during deletion:', error);
    }
  }
}

/**
 * Permanently delete the current user's account and all associated data.
 *
 * Order matters:
 *   1. Delete Firestore data first (while we still have auth)
 *   2. Release the username
 *   3. Delete Storage assets
 *   4. Clear local cache
 *   5. Delete the Firebase Auth user (this signs us out)
 *
 * If any Firestore step fails partway, the auth user is preserved so the user
 * can retry. Firestore security rules protect orphaned data from other users.
 */
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  const userId = user.uid;

  // 1. Read the user doc first so we can release the username later.
  let reservedUsername: string | undefined;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      reservedUsername = userDoc.data().username;
    }
  } catch (error) {
    // Non-fatal — proceeding without the username just means we leak one
    // entry in the usernames collection (orphaned but harmless).
    console.warn('Could not read user doc for username release:', error);
  }

  // 2. Delete user-owned documents across known collections.
  await Promise.all(
    USER_OWNED_COLLECTIONS.map((collectionName) =>
      deleteOwnedDocuments(collectionName, 'userId', userId),
    ),
  );

  // 3. Delete friend relationships and requests (both sides of the relation).
  await deleteFriendData(userId);

  // 4. Delete group invitations involving this user.
  await deleteGroupInvitations(userId);

  // 5. Release the user's reserved username so it becomes available again.
  if (reservedUsername) {
    try {
      await releaseUsername(reservedUsername);
    } catch (error) {
      console.warn('Failed to release username during deletion:', error);
    }
  }

  // 6. Delete per-user documents (users/{uid}, userProfiles/{uid}, etc.).
  await deleteUserDocs(userId);

  // 7. Delete profile photo from Storage.
  await deleteProfilePhoto(userId);

  // 8. Clear local AsyncStorage caches.
  await clearLocalStorage(userId);

  // 9. Finally, delete the Firebase Auth user. This signs the user out.
  // If this throws 'auth/requires-recent-login', the caller must re-auth first.
  await deleteUser(user);
}

/**
 * Convenience: re-authenticate then delete in one call.
 */
export async function reauthenticateAndDeleteAccount(
  password: string,
): Promise<void> {
  await reauthenticate(password);
  await deleteAccount();
}

/**
 * The public service object — keeps imports consistent with the rest of the codebase.
 */
export const accountDeletionService = {
  reauthenticate,
  deleteAccount,
  reauthenticateAndDeleteAccount,
};

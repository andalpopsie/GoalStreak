// Username utilities for GoalStreak
import { collection, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const usernamesCollection = collection(db, 'usernames');

/**
 * Generate a username from a display name.
 * Lowercases, strips non-alphanumeric chars, appends random digits.
 * Example: "Popsie Andal" → "popsieandal42"
 */
export function generateUsername(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);

  const suffix = Math.floor(Math.random() * 900 + 100); // 100-999
  return `${base || 'user'}${suffix}`;
}

/**
 * Validate username format.
 * Rules: 3-20 chars, lowercase alphanumeric + underscores, must start with a letter.
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' };
  }

  if (!/^[a-z][a-z0-9_]*$/.test(username)) {
    return { isValid: false, error: 'Username must start with a letter and contain only lowercase letters, numbers, and underscores' };
  }

  return { isValid: true };
}

/**
 * Check if a username is available in Firestore.
 * Uses a dedicated `usernames` collection where doc ID = username.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const docRef = doc(usernamesCollection, username.toLowerCase());
  const docSnap = await getDoc(docRef);
  return !docSnap.exists();
}

/**
 * Reserve a username for a user.
 * Creates a doc in `usernames/{username}` → { userId }.
 */
export async function reserveUsername(username: string, userId: string): Promise<void> {
  const normalized = username.toLowerCase();
  await setDoc(doc(usernamesCollection, normalized), {
    userId,
    createdAt: new Date(),
  });
}

/**
 * Release a previously reserved username.
 */
export async function releaseUsername(username: string): Promise<void> {
  await deleteDoc(doc(usernamesCollection, username.toLowerCase()));
}

/**
 * Resolve a user's display name for denormalizing into activities, group
 * members, etc. The app stores profile data in two places — `userProfiles`
 * (social) and `users` (auth) — and older accounts may be missing one. Check
 * both, then the authenticated user, before giving up. This avoids baking
 * "Unknown User" into feed/group records when the real name is available.
 */
export async function resolveUserDisplayName(userId: string): Promise<string> {
  // 1. Social profile
  try {
    const profileSnap = await getDoc(doc(collection(db, 'userProfiles'), userId));
    if (profileSnap.exists()) {
      const data = profileSnap.data() as { name?: string; email?: string };
      if (data?.name) return data.name;
      if (data?.email) return data.email.split('@')[0];
    }
  } catch {
    // fall through to next source
  }

  // 2. Auth-managed user record
  try {
    const userSnap = await getDoc(doc(collection(db, 'users'), userId));
    if (userSnap.exists()) {
      const data = userSnap.data() as { displayName?: string; name?: string; email?: string };
      if (data?.displayName) return data.displayName;
      if (data?.name) return data.name;
      if (data?.email) return data.email.split('@')[0];
    }
  } catch {
    // fall through to next source
  }

  // 3. Currently authenticated user (only valid when resolving self)
  try {
    const { getAuth } = await import('firebase/auth');
    const current = getAuth().currentUser;
    if (current && current.uid === userId) {
      if (current.displayName) return current.displayName;
      if (current.email) return current.email.split('@')[0];
    }
  } catch {
    // ignore
  }

  return 'Unknown User';
}

// User Provisioning Service - shared first-time-user record creation
//
// A single provisioning path used by both email sign-up and first-time SSO
// authentication (R5.1). It creates the users/{uid} document, reserves a
// username, creates the userProfiles document, and persists the EULA fields.
//
// This module contains no platform SDK calls; it operates purely on an
// already-authenticated Firebase user plus provider-supplied profile data.

import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { generateUsername, isUsernameAvailable, reserveUsername } from '../utils/usernameUtils';
import friendService from './friendService';

/** Maximum username generation attempts before provisioning fails (R5.5). */
const MAX_USERNAME_ATTEMPTS = 5;

/**
 * Input for provisioning a first-time user's Firestore records.
 * Implemented by task 3.3 (provisionNewUser).
 */
export interface ProvisionInput {
  firebaseUser: User; // the authenticated user (uid, email, displayName, photoURL)
  displayName?: string; // provider- or form-supplied name (R5.8)
  photoURL?: string; // provider-supplied photo (R5.10)
  eulaVersion: string; // current EULA_Version ('1.0')
}

/** Result of a provisioning run. Implemented by task 3.3. */
export interface ProvisionResult {
  username: string;
  created: boolean; // false when the user already existed (R5.12)
}

/**
 * New-user detection with a fixed precedence (R5.2, R5.3).
 *
 * Precedence:
 *   1. When the `getAdditionalUserInfo` new-user flag is defined (i.e. not
 *      null/undefined), return it directly.
 *   2. Otherwise, fall back to the negation of the users/{uid} document
 *      existence: a user is new when no document exists yet.
 *
 * @param firebaseUser              the authenticated Firebase user
 * @param additionalUserInfoIsNew   the `getAdditionalUserInfo(result).isNewUser`
 *                                  flag, or null/undefined when unavailable
 */
export async function isNewUser(
  firebaseUser: User,
  additionalUserInfoIsNew?: boolean | null
): Promise<boolean> {
  // The provider-supplied flag takes precedence whenever it is defined.
  if (additionalUserInfoIsNew !== undefined && additionalUserInfoIsNew !== null) {
    return additionalUserInfoIsNew;
  }

  // Fallback: a user is new when no users/{uid} document exists yet.
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  return !userDoc.exists();
}

/**
 * Idempotent provisioning of a first-time user's record set (R5.4–R5.12, R2.6).
 *
 * Extracted from `signUp()` so email sign-up and first-time SSO share one path
 * (R5.1). The record shape mirrors `signUp()` exactly so behavior matches.
 *
 * Behavior:
 *   - If a `users/{uid}` document already exists, return the existing username
 *     with `created: false` and write nothing — this makes re-runs against an
 *     already-provisioned user a no-op (R5.12).
 *   - Otherwise generate a unique username (up to 5 attempts, R5.5), reserve it
 *     (R5.6), write `users/{uid}` with the EULA fields (R2.6, R5.4, R5.8–R5.10),
 *     and create the `userProfiles/{uid}` document (R5.7).
 *   - On a partial failure the function throws without swallowing the error, so
 *     the next authentication can re-run provisioning; records already written
 *     are safe to overwrite on retry (R5.11).
 */
export async function provisionNewUser(input: ProvisionInput): Promise<ProvisionResult> {
  const { firebaseUser, eulaVersion } = input;
  const uid = firebaseUser.uid;

  // Idempotency guard: if the user already has a record, do not write anything
  // and report that nothing was created (R5.12).
  const existing = await getDoc(doc(db, 'users', uid));
  if (existing.exists()) {
    const data = existing.data() as { username?: string } | undefined;
    return { username: data?.username ?? '', created: false };
  }

  // Generate a unique username, bounded to MAX_USERNAME_ATTEMPTS tries (R5.5).
  // The generation seed prefers the supplied display name, falling back to any
  // provider name on the Firebase user and finally a generic seed.
  const usernameSeed = input.displayName || firebaseUser.displayName || 'user';

  let username: string | undefined;
  for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
    const candidate = generateUsername(usernameSeed);
    if (await isUsernameAvailable(candidate)) {
      username = candidate;
      break;
    }
  }

  // All attempts collided: fail before reserving anything (R5.5, R5.11).
  if (!username) {
    throw new Error(
      `Unable to generate an available username after ${MAX_USERNAME_ATTEMPTS} attempts`
    );
  }

  // Reserve the username in the dedicated collection (R5.6).
  await reserveUsername(username, uid);

  // displayName falls back to the generated username when absent (R5.8, R5.9).
  const displayName = input.displayName || username;

  // Build the users/{uid} record, mirroring signUp()'s shape. profilePicture is
  // only set when a provider photo is supplied (R5.10).
  const userData: Record<string, unknown> = {
    email: firebaseUser.email ?? '',
    displayName,
    username,
    hasCompletedOnboarding: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Record EULA acceptance (zero-tolerance clause) for SSO users too (R2.6, R5.4).
    eulaAcceptedAt: serverTimestamp(),
    eulaVersion,
  };
  if (input.photoURL) {
    userData.profilePicture = input.photoURL;
  }

  await setDoc(doc(db, 'users', uid), userData);

  // Create the social profile document (R5.7).
  await friendService.createUserProfile(uid, firebaseUser.email ?? '', displayName);

  return { username, created: true };
}

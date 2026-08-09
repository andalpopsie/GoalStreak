// SSO Provider Adapters — types, configuration guard, and error classification.
//
// This module holds the SSO subsystem's pure, side-effect-light logic: the
// shared types produced by the provider adapters, the configuration guard that
// blocks a flow when a required OAuth client id is missing, and the error
// classifier that normalizes raw SDK/Firebase errors into a single SsoError.
//
// The Apple credential adapter (getAppleCredential / isAppleAvailable) lives
// below. The Google credential converter (getGoogleCredential) is implemented
// in a separate task and intentionally omitted here.
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { fetchSignInMethodsForEmail, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import type { AuthCredential } from 'firebase/auth';
import { auth } from './firebase';
import { config } from '../config/environment';

// The providers Goalfer supports, matching Firebase's providerId values.
export type SsoProviderId = 'apple.com' | 'google.com';

/** Profile fields a provider may supply on first authorization (R3.3, R5.8–R5.10). */
export interface SsoProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
}

/** The output of a provider adapter: a Firebase credential plus captured profile. */
export interface SsoCredentialResult {
  credential: AuthCredential; // fed to signInWithCredential / reauthenticate / link
  profile: SsoProfile; // captured for provisioning
  providerId: SsoProviderId;
}

/**
 * Discriminated error kind so callers can branch cancel vs network vs generic
 * (R3.5–R3.7, R4.5–R4.8, R6.8, R9.6).
 */
export type SsoErrorKind =
  | 'cancelled'
  | 'network'
  | 'timeout'
  | 'collision'
  | 'unavailable'
  | 'missing-config'
  | 'generic';

/** Normalized SSO error carrying its classification (and the colliding method). */
export class SsoError extends Error {
  kind: SsoErrorKind;
  existingMethod?: string; // populated for 'collision' via fetchSignInMethodsForEmail

  constructor(kind: SsoErrorKind, message: string, existingMethod?: string) {
    super(message);
    this.name = 'SsoError';
    this.kind = kind;
    this.existingMethod = existingMethod;
    // Restore the prototype chain for instanceof checks after transpilation.
    Object.setPrototypeOf(this, SsoError.prototype);
  }
}

/**
 * Validates that the OAuth client identifiers required by `provider` are present
 * and non-empty. Throws SsoError('missing-config') naming the first missing
 * identifier so the affected SSO flow never starts (R9.2).
 */
export function assertSsoConfig(provider: SsoProviderId): void {
  const { appleClientId, googleIosClientId, googleWebClientId } = config.sso;

  if (provider === 'apple.com') {
    if (!isPresent(appleClientId)) {
      throw new SsoError(
        'missing-config',
        'Apple sign-in is not configured: appleClientId is missing.'
      );
    }
    return;
  }

  // provider === 'google.com'
  if (!isPresent(googleIosClientId)) {
    throw new SsoError(
      'missing-config',
      'Google sign-in is not configured: googleIosClientId is missing.'
    );
  }
  if (!isPresent(googleWebClientId)) {
    throw new SsoError(
      'missing-config',
      'Google sign-in is not configured: googleWebClientId is missing.'
    );
  }
}

/**
 * Maps a raw Firebase/SDK error to exactly one SsoError kind, resolving the
 * colliding sign-in method for account collisions.
 *
 * Classification (total over the known error space, everything else → generic):
 *  - Apple ERR_REQUEST_CANCELED / Google cancel|dismiss        → 'cancelled'
 *  - auth/network-request-failed / fetch failure               → 'network'
 *  - no-token timeout                                          → 'timeout'
 *  - auth/account-exists-with-different-credential             → 'collision'
 *  - auth/operation-not-allowed                                → 'unavailable'
 *  - anything else                                             → 'generic'
 */
export async function mapAuthError(error: unknown, email?: string): Promise<SsoError> {
  // An already-classified error passes through unchanged.
  if (error instanceof SsoError) {
    return error;
  }

  const code = extractCode(error);
  const message = extractMessage(error);

  if (isCancellation(code, message)) {
    return new SsoError('cancelled', 'Sign-in was cancelled.');
  }

  if (isNetworkFailure(code, message)) {
    return new SsoError('network', 'Network error, please try again.');
  }

  if (isTimeout(code, message)) {
    return new SsoError('timeout', 'Request timed out, please try again.');
  }

  if (code === 'auth/account-exists-with-different-credential') {
    const existingMethod = await resolveExistingMethod(email);
    if (existingMethod) {
      return new SsoError(
        'collision',
        `An account already exists for this email using ${existingMethod}. ` +
          'Sign in with that method, then link Apple or Google from Settings.',
        existingMethod
      );
    }
    // Lookup failed or returned nothing — fall back to a generic collision message (R7.5).
    return new SsoError(
      'collision',
      'An account already exists for this email. Please sign in with your existing account.'
    );
  }

  if (code === 'auth/operation-not-allowed') {
    return new SsoError('unavailable', 'This sign-in option is unavailable.');
  }

  return new SsoError('generic', 'Authentication failed, please try again.');
}

// --- internal helpers -------------------------------------------------------

function isPresent(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Pulls a comparable code from the many shapes SDK/Firebase errors take. */
function extractCode(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const anyErr = error as { code?: unknown; type?: unknown };
    if (typeof anyErr.code === 'string') {
      return anyErr.code;
    }
    // Google's useAuthRequest response reports outcome via `type`
    // (e.g. 'cancel', 'dismiss').
    if (typeof anyErr.type === 'string') {
      return anyErr.type;
    }
  }
  return '';
}

function extractMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const anyErr = error as { message?: unknown };
    if (typeof anyErr.message === 'string') {
      return anyErr.message;
    }
  }
  return '';
}

function isCancellation(code: string, message: string): boolean {
  const cancelCodes = new Set([
    'ERR_REQUEST_CANCELED', // expo-apple-authentication
    'ERR_CANCELED',
    'cancel', // expo-auth-session response type
    'dismiss',
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
  ]);
  if (cancelCodes.has(code)) {
    return true;
  }
  return /\bcancell?ed\b|\bdismiss(ed)?\b/i.test(message);
}

function isNetworkFailure(code: string, message: string): boolean {
  if (code === 'auth/network-request-failed' || code === 'ERR_NETWORK') {
    return true;
  }
  return /network request failed|network error|fetch failed|failed to fetch/i.test(message);
}

function isTimeout(code: string, message: string): boolean {
  if (code === 'ERR_TIMEOUT' || code === 'timeout') {
    return true;
  }
  return /timed out|timeout/i.test(message);
}

/**
 * Resolves the existing sign-in method for a colliding email. Returns undefined
 * when no email is supplied, the lookup fails, or no method is found.
 */
async function resolveExistingMethod(email?: string): Promise<string | undefined> {
  if (!email) {
    return undefined;
  }
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods && methods.length > 0 ? methods[0] : undefined;
  } catch {
    return undefined;
  }
}

// --- Apple credential adapter -----------------------------------------------

/**
 * True only on iOS with an available Apple authentication service (R1.2, R1.5).
 * Android and any platform where the native service reports unavailable return
 * false, so the caller can omit the Apple button entirely.
 */
export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Runs the native Apple sign-in and returns a Firebase credential plus the
 * profile Apple discloses on first authorization (R3.1–R3.4).
 *
 * Nonce contract (see design "research findings"): Apple embeds a hash of the
 * nonce it receives in the returned identity token. Firebase's
 * OAuthProvider('apple.com').credential verifies that sha256(rawNonce) matches
 * that embedded value. So we generate a random raw nonce, send its SHA-256
 * digest to Apple, and hand the *raw* nonce to Firebase.
 *
 * fullName/email are populated only on the user's first authorization; on
 * subsequent sign-ins Apple returns null for both, which is expected and does
 * not block sign-in (R3.4). We simply pass through whatever Apple provides.
 *
 * Any failure is normalized through mapAuthError so callers see a single
 * SsoError (cancellation → 'cancelled', network → 'network', else 'generic').
 */
export async function getAppleCredential(): Promise<SsoCredentialResult> {
  let credentialResponse: AppleAuthentication.AppleAuthenticationCredential | undefined;
  try {
    // 1. Random raw nonce, and 2. its SHA-256 hash for Apple.
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    // 3. Native Apple sign-in with the hashed nonce.
    credentialResponse = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    // 4. Firebase credential built from the identity token + the *raw* nonce.
    const credential = new OAuthProvider('apple.com').credential({
      idToken: credentialResponse.identityToken ?? undefined,
      rawNonce,
    });

    // 5. First-authorization profile capture (null on later sign-ins — R3.4).
    const displayName = formatAppleName(credentialResponse.fullName);
    const email = credentialResponse.email ?? undefined;

    // 6. Adapter result consumed by signInWithCredential / provisioning.
    return {
      credential,
      profile: { displayName, email },
      providerId: 'apple.com',
    };
  } catch (error) {
    // 7. Normalize every failure to a single classified SsoError.
    throw await mapAuthError(error, credentialResponse?.email ?? undefined);
  }
}

/**
 * Joins Apple's tokenized name parts into a display name, using whichever of
 * givenName/familyName are present. Returns undefined when Apple supplies no
 * usable name (e.g. subsequent authorizations).
 */
function formatAppleName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null
): string | undefined {
  if (!fullName) {
    return undefined;
  }
  const parts = [fullName.givenName, fullName.familyName].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0
  );
  return parts.length > 0 ? parts.join(' ') : undefined;
}

// --- Google credential converter --------------------------------------------

/**
 * Converts a Google OAuth id token into a Firebase credential (R4.2).
 *
 * This is a pure, synchronous function: it performs no network or SDK calls and
 * has no side effects. The interactive part of Google sign-in — obtaining the
 * id token via `expo-auth-session`'s `useAuthRequest` hook — lives in the hook
 * layer (see "Google auth-session constraint" in the design); this function
 * only performs the token → credential conversion.
 *
 * The Google profile (display name / photoURL) is not available from the id
 * token alone; it is read from the Firebase user after sign-in
 * (`firebaseUser.photoURL`) by the hook / `onAuthStateChanged`, so `profile` is
 * intentionally left empty here.
 */
export function getGoogleCredential(idToken: string): SsoCredentialResult {
  return {
    credential: GoogleAuthProvider.credential(idToken),
    profile: {},
    providerId: 'google.com',
  };
}

// --- Private-relay email handling (R8.4) ------------------------------------

/** Apple's private-relay proxy domain — the host portion of `<token>@privaterelay.appleid.com`. */
const PRIVATE_RELAY_DOMAIN = 'privaterelay.appleid.com';

/**
 * Detects an Apple private-relay proxied email of the form
 * `<token>@privaterelay.appleid.com` (R8.4).
 *
 * These addresses are opaque, per-app relay proxies rather than a user's real
 * mailbox, so they must never be used as an identity key. Matching is
 * case-insensitive and tolerant of surrounding whitespace; a non-empty token is
 * required before the `@`.
 */
export function isPrivateRelayEmail(email: string | null | undefined): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) {
    // No token before '@', or no '@' at all.
    return false;
  }
  const domain = trimmed.slice(atIndex + 1);
  return domain === PRIVATE_RELAY_DOMAIN;
}

/**
 * Identity-association guard (R8.4): decides whether email equality is valid
 * evidence that two accounts are the same identity.
 *
 * Two emails count as the same identity only when they are equal (case- and
 * whitespace-insensitive) AND *neither* is a private-relay proxy address. A
 * private-relay address on either side always yields `false`, so a linked
 * credential — never the relay email — must be relied on for identity
 * association. This keeps private-relay emails from ever being treated as
 * same-identity evidence.
 */
export function isSameIdentityByEmail(
  emailA: string | null | undefined,
  emailB: string | null | undefined
): boolean {
  if (typeof emailA !== 'string' || typeof emailB !== 'string') {
    return false;
  }
  if (isPrivateRelayEmail(emailA) || isPrivateRelayEmail(emailB)) {
    return false;
  }
  return emailA.trim().toLowerCase() === emailB.trim().toLowerCase();
}

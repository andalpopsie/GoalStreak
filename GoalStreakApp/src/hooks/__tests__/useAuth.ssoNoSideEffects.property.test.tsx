// Feature: sso-authentication, Property 2: Failed or cancelled authentication has no side effects
//
// Property-based test for the useAuth SSO failure paths (signInWithApple /
// signInWithGoogle). Library: fast-check + Jest (jest-expo). Minimum 100
// iterations, one property per file.
//
// Property 2 (design.md): For any authentication attempt that ends in an
// SsoError of any kind (including cancelled and collision), the system creates
// no Firebase user identity, performs no Firestore writes, persists no EULA
// fields, and leaves any pre-existing account and its data unchanged, and the
// resulting state is unauthenticated.
//
// Validates: Requirements 2.7, 7.2, 7.3
//
// Approach (see task 5.2): rather than exercise the real platform SDKs, we test
// the invariant at the function-composition seam. The AuthProvider is rendered
// with @testing-library/react-native's renderHook and every external boundary
// is mocked so a failure injected at ANY stage of the sign-in composition —
//   assertSsoConfig throws  ·  getAppleCredential rejects (any SsoErrorKind)  ·
//   signInWithCredential rejects (any raw Firebase code)  ·  Google request not
//   ready
// — must result in: provisionNewUser NEVER called (no Firestore writes / no
// EULA fields), no successful signInWithCredential identity, and the auth state
// remaining unauthenticated. The failure kind is generated with fast-check to
// cover cancelled / collision / network / timeout / unavailable / generic.
//
// SsoError and mapAuthError are kept REAL (jest.requireActual) so the useAuth
// `error instanceof SsoError` branch and error normalization behave as in
// production; only the side-effecting adapters are replaced with spies.

import React from 'react';
import fc from 'fast-check';
import { renderHook, act } from '@testing-library/react-native';

// ── External boundary mocks ──────────────────────────────────────────────────

// Firebase handles: configured, with placeholder auth/db objects.
jest.mock('../../services/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: () => true,
}));

// firebase/auth: onAuthStateChanged never fires a user (state stays
// unauthenticated); signInWithCredential is a spy we drive per stage;
// getAdditionalUserInfo/fetchSignInMethodsForEmail support the real code paths.
jest.mock('firebase/auth', () => ({
  signInWithCredential: jest.fn(),
  getAdditionalUserInfo: jest.fn(() => ({ isNewUser: true })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  fetchSignInMethodsForEmail: jest.fn(async () => ['password']),
  GoogleAuthProvider: { credential: jest.fn(() => ({})) },
  OAuthProvider: jest.fn(() => ({ credential: jest.fn(() => ({})) })),
}));

// firebase/firestore: setDoc is the raw write boundary — we assert it is never
// touched on a failed/cancelled sign-in.
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(async () => ({ exists: () => false, data: () => undefined })),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
}));

// ssoService: keep SsoError + mapAuthError REAL; replace the side-effecting
// adapters/guards with spies driven per iteration.
jest.mock('../../services/ssoService', () => {
  const actual = jest.requireActual('../../services/ssoService');
  return {
    __esModule: true,
    ...actual,
    assertSsoConfig: jest.fn(),
    getAppleCredential: jest.fn(),
    getGoogleCredential: jest.fn(() => ({ credential: {}, profile: {}, providerId: 'google.com' })),
    isAppleAvailable: jest.fn(async () => false),
  };
});

// Provisioning is the single first-time-user write path — a pure spy so any
// call would indicate a side effect on a failed/cancelled auth.
jest.mock('../../services/userProvisioningService', () => ({
  isNewUser: jest.fn(async () => true),
  provisionNewUser: jest.fn(async () => ({ username: 'generated_user', created: true })),
}));

// Google auth-session hook: request is null (not ready) so signInWithGoogle
// rejects before any exchange; promptAsync is an inert spy.
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn(async () => ({ type: 'dismiss' }))]),
}));

// expo-apple-authentication / expo-crypto are imported by the real ssoService
// module (loaded via requireActual); stub them so the module evaluates.
jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(async () => false),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL' },
}));
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'raw-nonce'),
  digestStringAsync: jest.fn(async () => 'hashed-nonce'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

// Fire-and-forget dependencies pulled in by useAuth at import time.
jest.mock('../../services/subscriptionService', () => ({
  __esModule: true,
  default: { initialize: jest.fn(async () => undefined) },
}));
jest.mock('../../services/accountDeletionService', () => ({
  accountDeletionService: { reauthenticateAndDeleteAccount: jest.fn() },
}));

// ── Imports resolved through the mocks above ─────────────────────────────────
import { signInWithCredential } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { assertSsoConfig, getAppleCredential, SsoError, SsoErrorKind } from '../../services/ssoService';
import { isNewUser, provisionNewUser } from '../../services/userProvisioningService';
import { AuthProvider, useAuth } from '../useAuth';

const mockedAssertSsoConfig = assertSsoConfig as jest.MockedFunction<typeof assertSsoConfig>;
const mockedGetAppleCredential = getAppleCredential as jest.MockedFunction<typeof getAppleCredential>;
const mockedSignInWithCredential = signInWithCredential as jest.MockedFunction<typeof signInWithCredential>;
const mockedSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockedIsNewUser = isNewUser as jest.MockedFunction<typeof isNewUser>;
const mockedProvisionNewUser = provisionNewUser as jest.MockedFunction<typeof provisionNewUser>;

// Every SsoErrorKind, so getAppleCredential can fail with any classification
// (cancelled and collision included, as the property demands).
const ALL_KINDS: SsoErrorKind[] = [
  'cancelled',
  'network',
  'timeout',
  'collision',
  'unavailable',
  'missing-config',
  'generic',
];

// Raw Firebase codes a rejected signInWithCredential can surface; each is
// normalized by the real mapAuthError into an SsoError.
const RAW_SIGNIN_CODES = [
  'auth/account-exists-with-different-credential', // → collision
  'auth/network-request-failed', // → network
  'auth/operation-not-allowed', // → unavailable
  'auth/invalid-credential', // → generic
  'auth/internal-error', // → generic
];

// The failure to inject: one stage of the Apple composition, or a not-ready
// Google request. Every case must end in an SsoError with no side effects.
type FailureCase =
  | { kind: 'apple-assert-config' }
  | { kind: 'apple-get-credential'; errorKind: SsoErrorKind }
  | { kind: 'apple-signin-rejects'; code: string }
  | { kind: 'google-not-ready' };

const failureCaseArb: fc.Arbitrary<FailureCase> = fc.oneof(
  fc.constant<FailureCase>({ kind: 'apple-assert-config' }),
  fc.constantFrom(...ALL_KINDS).map<FailureCase>((errorKind) => ({
    kind: 'apple-get-credential',
    errorKind,
  })),
  fc.constantFrom(...RAW_SIGNIN_CODES).map<FailureCase>((code) => ({
    kind: 'apple-signin-rejects',
    code,
  })),
  fc.constant<FailureCase>({ kind: 'google-not-ready' })
);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth SSO failure paths — Property 2: failed/cancelled auth has no side effects', () => {
  it('never provisions, never writes, and stays unauthenticated for any failure', async () => {
    await fc.assert(
      fc.asyncProperty(failureCaseArb, async (failure) => {
        // Fresh mock state per iteration so captured calls reflect only this run.
        mockedAssertSsoConfig.mockReset();
        mockedGetAppleCredential.mockReset();
        mockedSignInWithCredential.mockReset();
        mockedSetDoc.mockReset();
        mockedIsNewUser.mockReset();
        mockedProvisionNewUser.mockReset();

        // Safe defaults: config passes, detection/provisioning would succeed if
        // (incorrectly) reached — so the assertions below are meaningful.
        mockedAssertSsoConfig.mockImplementation(() => undefined);
        mockedIsNewUser.mockResolvedValue(true);
        mockedProvisionNewUser.mockResolvedValue({ username: 'generated_user', created: true });

        // Inject the failure stage and decide which provider method to invoke.
        let provider: 'apple' | 'google' = 'apple';

        switch (failure.kind) {
          case 'apple-assert-config':
            // Config guard blocks the flow before any credential work (R9.2).
            mockedAssertSsoConfig.mockImplementation(() => {
              throw new SsoError('missing-config', 'Apple sign-in is not configured.');
            });
            break;

          case 'apple-get-credential':
            // The Apple adapter rejects with a classified SsoError of any kind
            // (covers cancelled and collision, as the property requires).
            mockedGetAppleCredential.mockRejectedValue(
              new SsoError(failure.errorKind, `apple failure: ${failure.errorKind}`)
            );
            break;

          case 'apple-signin-rejects':
            // Credential obtained, but the Firebase exchange rejects — no
            // identity is established and provisioning must not run.
            mockedGetAppleCredential.mockResolvedValue({
              credential: {} as never,
              profile: { displayName: 'Test User', email: 'test@example.com' },
              providerId: 'apple.com',
            });
            mockedSignInWithCredential.mockRejectedValue({ code: failure.code });
            break;

          case 'google-not-ready':
          default:
            // Google's useAuthRequest returned a null request; signInWithGoogle
            // rejects before any exchange.
            provider = 'google';
            break;
        }

        const { result, unmount } = renderHook(() => useAuth(), { wrapper });

        let caught: unknown;
        await act(async () => {
          try {
            await (provider === 'apple'
              ? result.current.signInWithApple()
              : result.current.signInWithGoogle());
          } catch (error) {
            caught = error;
          }
        });

        // The attempt fails, and every failure is normalized to an SsoError so
        // the UI can branch on `.kind`.
        expect(caught).toBeInstanceOf(SsoError);

        // No first-time-user records were created and no EULA fields persisted:
        // provisionNewUser is the single provisioning write path (R2.7, R7.2).
        expect(mockedProvisionNewUser).not.toHaveBeenCalled();

        // No raw Firestore document write occurred (R2.7, R7.3).
        expect(mockedSetDoc).not.toHaveBeenCalled();

        // No successful Firebase identity: when the exchange was attempted it
        // rejected; otherwise it was never called (R7.3).
        if (failure.kind === 'apple-signin-rejects') {
          expect(mockedSignInWithCredential).toHaveBeenCalledTimes(1);
        } else {
          expect(mockedSignInWithCredential).not.toHaveBeenCalled();
        }

        // The resulting state is unauthenticated (R2.7, R7.3).
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

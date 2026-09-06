// Feature: sso-authentication, Task 9.2: Example tests for analytics parity
//
// Example (unit) tests for the SSO analytics emission in useAuth
// (`emitSsoAuthAnalytics`, invoked from `finishCredentialSignIn`). These
// complement the SSO property tests by pinning the concrete event contract:
//
//   R11.1 — a successful SSO sign-in emits `login_completed` with a `provider`
//           property set to the Provider_Id (parity with the email flow).
//   R11.2 — provisioning a New_User additionally emits `signup_completed`, also
//           tagged with `provider`.
//   R11.3 — analytics failures are swallowed and never block or surface in the
//           authentication / provisioning flow.
//
// Validates: Requirements 11.1, 11.2, 11.3
//
// Approach: exercise `signInWithApple()` end-to-end through the AuthProvider
// (rendered via @testing-library/react-native's renderHook) with every external
// boundary mocked, mirroring the seam-level setup in
// useAuth.ssoNoSideEffects.property.test.tsx. trackEvent is a jest.fn so we can
// assert exactly which analytics events fire and with what properties. SsoError
// / mapAuthError are kept REAL so the hook's error handling behaves as in
// production.

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// ── External boundary mocks ──────────────────────────────────────────────────

// Firebase handles: configured, with placeholder auth/db objects.
jest.mock('../../services/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: () => true,
}));

// firebase/auth: onAuthStateChanged never fires a user (state stays
// unauthenticated for the duration of the test); signInWithCredential is a spy
// we resolve with a fake user; getAdditionalUserInfo drives new-vs-existing.
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

// firebase/firestore: inert stubs — provisioning is mocked at the service level.
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
// adapters/guards with spies. getAppleCredential resolves with an apple.com
// credential result so finishCredentialSignIn reaches the analytics emission.
jest.mock('../../services/ssoService', () => {
  const actual = jest.requireActual('../../services/ssoService');
  return {
    __esModule: true,
    ...actual,
    assertSsoConfig: jest.fn(),
    getAppleCredential: jest.fn(),
    getGoogleCredential: jest.fn(() => ({ credential: {}, profile: {}, providerId: 'google.com' })),
    isAppleAvailable: jest.fn(async () => true),
  };
});

// Provisioning is mocked; isNewUser is driven per-test to select new vs existing.
jest.mock('../../services/userProvisioningService', () => ({
  isNewUser: jest.fn(async () => true),
  provisionNewUser: jest.fn(async () => ({ username: 'generated_user', created: true })),
}));

// Analytics: trackEvent is the assertion target for this suite.
jest.mock('../../services/enhancedAnalyticsService', () => ({
  trackEvent: jest.fn(),
}));

// Google auth-session hook: request is null (unused here); promptAsync inert.
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn(async () => ({ type: 'dismiss' }))]),
}));

// expo-apple-authentication / expo-crypto are imported by the real ssoService
// module (loaded via requireActual); stub them so the module evaluates.
jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(async () => true),
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
import { signInWithCredential, getAdditionalUserInfo } from 'firebase/auth';
import { getAppleCredential } from '../../services/ssoService';
import { isNewUser, provisionNewUser } from '../../services/userProvisioningService';
import { trackEvent } from '../../services/enhancedAnalyticsService';
import { AuthProvider, useAuth } from '../useAuth';

const mockedGetAppleCredential = getAppleCredential as jest.MockedFunction<
  typeof getAppleCredential
>;
const mockedSignInWithCredential = signInWithCredential as jest.MockedFunction<
  typeof signInWithCredential
>;
const mockedGetAdditionalUserInfo = getAdditionalUserInfo as jest.MockedFunction<
  typeof getAdditionalUserInfo
>;
const mockedIsNewUser = isNewUser as jest.MockedFunction<typeof isNewUser>;
const mockedProvisionNewUser = provisionNewUser as jest.MockedFunction<typeof provisionNewUser>;
const mockedTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// A minimal fake Firebase user with an email so `email_domain` is derivable.
const fakeUser = { uid: 'uid-123', email: 'person@example.com' } as never;

// Configure the Apple happy path up to signInWithCredential; `newUser` selects
// whether provisioning + the signup event should fire.
function primeAppleSignIn(newUser: boolean) {
  mockedGetAppleCredential.mockResolvedValue({
    credential: {} as never,
    profile: { displayName: 'Test User', email: 'person@example.com' },
    providerId: 'apple.com',
  });
  mockedSignInWithCredential.mockResolvedValue({ user: fakeUser } as never);
  mockedGetAdditionalUserInfo.mockReturnValue({ isNewUser: newUser } as never);
  mockedIsNewUser.mockResolvedValue(newUser);
  mockedProvisionNewUser.mockResolvedValue({ username: 'generated_user', created: true });
}

describe('useAuth SSO analytics parity (R11)', () => {
  beforeEach(() => {
    mockedGetAppleCredential.mockReset();
    mockedSignInWithCredential.mockReset();
    mockedGetAdditionalUserInfo.mockReset();
    mockedIsNewUser.mockReset();
    mockedProvisionNewUser.mockReset();
    mockedTrackEvent.mockReset();
  });

  it('emits login_completed AND signup_completed with provider apple.com for a new user (R11.1, R11.2)', async () => {
    primeAppleSignIn(true);

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signInWithApple();
    });

    // Sign-in event fired with the email-flow name + provider property (R11.1).
    expect(mockedTrackEvent).toHaveBeenCalledWith(
      'login_completed',
      expect.objectContaining({ provider: 'apple.com', email_domain: 'example.com' })
    );

    // New-user provisioning also emits the account-creation event (R11.2).
    expect(mockedTrackEvent).toHaveBeenCalledWith(
      'signup_completed',
      expect.objectContaining({ provider: 'apple.com', email_domain: 'example.com' })
    );

    // Exactly the two expected events, no more.
    expect(mockedTrackEvent).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('emits only login_completed (no signup_completed) for an existing user (R11.1)', async () => {
    primeAppleSignIn(false);

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signInWithApple();
    });

    // Existing user still gets the sign-in event tagged with the provider.
    expect(mockedTrackEvent).toHaveBeenCalledWith(
      'login_completed',
      expect.objectContaining({ provider: 'apple.com' })
    );

    // No account-creation event for an existing user (R11.2 gate on new-user).
    expect(mockedTrackEvent).not.toHaveBeenCalledWith('signup_completed', expect.anything());
    expect(mockedProvisionNewUser).not.toHaveBeenCalled();
    expect(mockedTrackEvent).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('swallows analytics failures so sign-in still resolves (R11.3)', async () => {
    primeAppleSignIn(true);
    // Analytics blows up on every emit.
    mockedTrackEvent.mockImplementation(() => {
      throw new Error('analytics offline');
    });

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.signInWithApple();
      } catch (error) {
        caught = error;
      }
    });

    // The failure was contained inside emitSsoAuthAnalytics — sign-in resolves
    // normally and no error surfaces to the caller (R11.3).
    expect(caught).toBeUndefined();
    // The exchange and provisioning still completed despite analytics failing.
    expect(mockedSignInWithCredential).toHaveBeenCalledTimes(1);
    expect(mockedProvisionNewUser).toHaveBeenCalledTimes(1);
    // trackEvent was attempted (and threw), confirming the swallow path ran.
    expect(mockedTrackEvent).toHaveBeenCalled();

    unmount();
  });
});

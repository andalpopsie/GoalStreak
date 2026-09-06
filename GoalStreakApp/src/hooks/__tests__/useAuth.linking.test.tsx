// Feature: sso-authentication, Task 13.3: Example tests for linking flows
//
// Example (unit) tests for the account-linking flow in useAuth
// (`linkProvider`). These complement the linking property test (task 13.2,
// last-provider guard) by pinning the three concrete linking behaviors the
// design calls out:
//
//   R8.1 — Link happy path: linkProvider obtains a credential and calls
//          linkWithCredential, and connectedProviders then reflects the newly
//          linked provider.
//   R8.2 — Stale-login re-auth: when the current session is stale (> 5 min old
//          lastSignInTime), linkProvider re-authenticates (via
//          reauthenticateWithCredential) BEFORE calling linkWithCredential.
//   R8.5 — credential-already-in-use rejection: when linkWithCredential throws
//          auth/credential-already-in-use, linkProvider rejects and the
//          account's linked providers are left unchanged.
//
// Validates: Requirements 8.1, 8.2, 8.5
//
// Approach: exercise linkProvider('apple.com') end-to-end through the
// AuthProvider (rendered via @testing-library/react-native's renderHook) with
// every external boundary mocked, mirroring the seam-level setup in
// useAuth.ssoNoSideEffects.property.test.tsx and useAuth.ssoAnalytics.test.tsx.
// Apple is used as the linking provider throughout because getAppleCredential is
// a plain async adapter (mockable directly), whereas Google's credential comes
// through the useAuthRequest hook flow. SsoError / mapAuthError are kept REAL so
// the hook's error branching (credential-already-in-use, requires-recent-login)
// behaves exactly as in production; only the side-effecting boundaries are
// replaced with spies.

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// ── External boundary mocks ──────────────────────────────────────────────────

// Firebase handles: configured. `auth.currentUser` is mutable so each test can
// install a fake signed-in user with the providerData / metadata it needs.
jest.mock('../../services/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  isFirebaseConfigured: () => true,
}));

// firebase/auth: linkWithCredential + reauthenticateWithCredential are the
// write/verify boundary this suite asserts against; onAuthStateChanged never
// fires a user so the linked-provider state comes solely from refreshes driven
// by linkProvider. The remaining exports are inert stubs so the module loads.
jest.mock('firebase/auth', () => ({
  signInWithCredential: jest.fn(),
  getAdditionalUserInfo: jest.fn(() => ({ isNewUser: false })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  fetchSignInMethodsForEmail: jest.fn(async () => ['password']),
  linkWithCredential: jest.fn(),
  reauthenticateWithCredential: jest.fn(async () => undefined),
  unlink: jest.fn(async () => undefined),
  GoogleAuthProvider: { credential: jest.fn(() => ({})) },
  OAuthProvider: jest.fn(() => ({ credential: jest.fn(() => ({})) })),
}));

// firebase/firestore: inert stubs — linking touches no Firestore documents.
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
// credential result so linkProvider reaches linkWithCredential.
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

// Provisioning is not exercised by linking; inert stubs.
jest.mock('../../services/userProvisioningService', () => ({
  isNewUser: jest.fn(async () => false),
  provisionNewUser: jest.fn(async () => ({ username: 'generated_user', created: false })),
}));

// Analytics is not exercised by linking; inert stub.
jest.mock('../../services/enhancedAnalyticsService', () => ({
  trackEvent: jest.fn(),
}));

// Google auth-session hook: request is null (Google linking path unused here);
// promptAsync inert.
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
import { linkWithCredential, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getAppleCredential, SsoError } from '../../services/ssoService';
import { AuthProvider, useAuth } from '../useAuth';

const mockedLinkWithCredential = linkWithCredential as jest.MockedFunction<
  typeof linkWithCredential
>;
const mockedReauthWithCredential = reauthenticateWithCredential as jest.MockedFunction<
  typeof reauthenticateWithCredential
>;
const mockedGetAppleCredential = getAppleCredential as jest.MockedFunction<
  typeof getAppleCredential
>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// A fake credential result the Apple adapter yields for both linking and
// (when stale) re-authentication.
const appleCredentialResult = {
  credential: { __appleCredential: true } as never,
  profile: { displayName: 'Test User', email: 'person@example.com' },
  providerId: 'apple.com' as const,
};

// Builds a mutable fake signed-in user. `staleMinutes` controls how old the
// last sign-in is (drives the R8.2 re-auth branch), and `providerData` seeds the
// currently linked set.
function installCurrentUser(options: {
  providerData: Array<{ providerId: string }>;
  staleMinutes: number;
}) {
  const lastSignInTime = new Date(Date.now() - options.staleMinutes * 60 * 1000).toISOString();
  const currentUser = {
    uid: 'uid-123',
    email: 'person@example.com',
    // A shallow copy so mutations by linkWithCredential are observable/isolated.
    providerData: [...options.providerData],
    metadata: { lastSignInTime },
  };
  (auth as { currentUser: unknown }).currentUser = currentUser;
  return currentUser;
}

describe('useAuth account linking — example flows (R8.1, R8.2, R8.5)', () => {
  beforeEach(() => {
    mockedLinkWithCredential.mockReset();
    mockedReauthWithCredential.mockReset();
    mockedGetAppleCredential.mockReset();
    (auth as { currentUser: unknown }).currentUser = null;
  });

  it('links a provider and reflects it in connectedProviders on the happy path (R8.1)', async () => {
    // Fresh session (0 min old) so no re-auth is needed; account currently has
    // only the email/password provider.
    const currentUser = installCurrentUser({
      providerData: [{ providerId: 'password' }],
      staleMinutes: 0,
    });

    mockedGetAppleCredential.mockResolvedValue(appleCredentialResult);
    // On a successful link Firebase adds the provider to providerData; mirror
    // that so refreshConnectedProviders observes the newly linked provider.
    mockedLinkWithCredential.mockImplementation(async (user: any, _credential) => {
      user.providerData.push({ providerId: 'apple.com' });
      return { user } as never;
    });

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.linkProvider('apple.com');
    });

    // A credential was obtained and linkWithCredential was called with the
    // current user + that credential (R8.1).
    expect(mockedGetAppleCredential).toHaveBeenCalledTimes(1);
    expect(mockedLinkWithCredential).toHaveBeenCalledTimes(1);
    expect(mockedLinkWithCredential).toHaveBeenCalledWith(
      currentUser,
      appleCredentialResult.credential
    );

    // A fresh session means no re-authentication happened first (R8.2 negative).
    expect(mockedReauthWithCredential).not.toHaveBeenCalled();

    // connectedProviders now reflects the newly linked provider (R8.1).
    expect(result.current.connectedProviders).toContain('apple.com');
    expect(result.current.connectedProviders).toContain('password');

    unmount();
  });

  it('re-authenticates before linking when the session is stale (R8.2)', async () => {
    // Session is 10 minutes old (> 5 min stale window); primary provider is
    // apple.com so reauthenticateCurrentUser can run the Apple re-auth branch.
    installCurrentUser({
      providerData: [{ providerId: 'apple.com' }],
      staleMinutes: 10,
    });

    mockedGetAppleCredential.mockResolvedValue(appleCredentialResult);
    mockedLinkWithCredential.mockResolvedValue({ user: {} } as never);

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.linkProvider('apple.com');
    });

    // Both the re-auth and the link ran...
    expect(mockedReauthWithCredential).toHaveBeenCalledTimes(1);
    expect(mockedLinkWithCredential).toHaveBeenCalledTimes(1);

    // ...and re-authentication happened BEFORE the link (R8.2). invocationCallOrder
    // is a monotonically increasing global sequence across jest mocks.
    const reauthOrder = mockedReauthWithCredential.mock.invocationCallOrder[0];
    const linkOrder = mockedLinkWithCredential.mock.invocationCallOrder[0];
    expect(reauthOrder).toBeLessThan(linkOrder);

    unmount();
  });

  it('rejects and leaves linked providers unchanged on credential-already-in-use (R8.5)', async () => {
    // Fresh session; account currently linked to email/password only.
    const currentUser = installCurrentUser({
      providerData: [{ providerId: 'password' }],
      staleMinutes: 0,
    });

    mockedGetAppleCredential.mockResolvedValue(appleCredentialResult);
    // Firebase reports the credential is already attached to another account.
    mockedLinkWithCredential.mockRejectedValue({ code: 'auth/credential-already-in-use' });

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.linkProvider('apple.com');
      } catch (error) {
        caught = error;
      }
    });

    // The link is rejected with a classified SsoError (R8.5).
    expect(caught).toBeInstanceOf(SsoError);

    // No re-auth was attempted (session was fresh) and the link failed, so the
    // account's linked providers are left unchanged: providerData still holds
    // only the original password provider (R8.5).
    expect(mockedReauthWithCredential).not.toHaveBeenCalled();
    expect(currentUser.providerData).toEqual([{ providerId: 'password' }]);

    // connectedProviders was never refreshed to include the rejected provider.
    expect(result.current.connectedProviders).not.toContain('apple.com');

    unmount();
  });
});

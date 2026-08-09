// Feature: sso-authentication — Example tests for the Apple credential adapter.
//
// Library: Jest (jest-expo). These are example (unit) tests, not property tests.
//
// Covers getAppleCredential() in ssoService:
//   - R3.1  Nonce contract: the SHA-256 *hash* of the nonce is sent to Apple,
//           while the *raw* nonce is handed to Firebase's OAuthProvider.
//   - R3.3  First-authorization profile capture: fullName + email supplied by
//           Apple are captured into the returned profile.
//   - R3.4  Subsequent-authorization null profile: when Apple returns null
//           fullName/email, sign-in still completes with an undefined profile.
//
// _Requirements: 3.1, 3.3, 3.4_
//
// External boundaries are mocked so the test never touches the native Apple
// SDK, expo-crypto, or the Firebase app:
//   - expo-crypto:                randomUUID → fixed raw nonce, digestStringAsync → 'HASHED'
//   - expo-apple-authentication:  signInAsync → a fake credential (set per test)
//   - firebase/auth:              OAuthProvider captures the credential(...) args
//   - ./firebase:                 auth stub so importing ssoService is side-effect-free

// Fixed raw nonce returned by the mocked Crypto.randomUUID.
// (Declared with the `mock` prefix so it may be referenced inside jest.mock factories.)
const mockRawNonce = 'RAW_NONCE_UUID';
// Fixed digest returned by the mocked Crypto.digestStringAsync.
const mockHashedNonce = 'HASHED';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => mockRawNonce),
  digestStringAsync: jest.fn(async () => mockHashedNonce),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn(async () => true),
  AppleAuthenticationScope: { FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL' },
}));

// Firebase auth boundary. OAuthProvider('apple.com').credential(args) records
// the arguments it receives so the test can assert the *raw* nonce (not the
// hash) is what Firebase gets. A GoogleAuthProvider stub is provided because
// ssoService imports it at module load.
jest.mock('firebase/auth', () => {
  const credentialSpy = jest.fn((args: unknown) => ({ __fakeAppleCredential: true, args }));
  class OAuthProvider {
    providerId: string;
    constructor(providerId: string) {
      this.providerId = providerId;
    }
    credential(args: unknown) {
      return credentialSpy(args);
    }
  }
  return {
    OAuthProvider,
    GoogleAuthProvider: {
      credential: jest.fn((idToken: string) => ({ __fakeGoogleCredential: true, idToken })),
    },
    fetchSignInMethodsForEmail: jest.fn(async () => ['password']),
    // Exposed for assertions.
    __credentialSpy: credentialSpy,
  };
});

// Importing ssoService must not initialize the real Firebase app.
jest.mock('../firebase', () => ({ auth: {} }));

import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as firebaseAuth from 'firebase/auth';
import { getAppleCredential } from '../ssoService';

const signInAsyncMock = AppleAuthentication.signInAsync as jest.Mock;
const digestStringAsyncMock = Crypto.digestStringAsync as jest.Mock;
// The recorded OAuthProvider.credential(...) calls.
const credentialSpy = (firebaseAuth as unknown as { __credentialSpy: jest.Mock }).__credentialSpy;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAppleCredential — nonce contract (R3.1)', () => {
  it('sends the hashed nonce to Apple and the raw nonce to Firebase', async () => {
    signInAsyncMock.mockResolvedValue({
      identityToken: 'apple-id-token',
      fullName: { givenName: 'Ada', familyName: 'Lovelace' },
      email: 'ada@example.com',
    });

    await getAppleCredential();

    // The raw nonce is hashed with SHA-256 before being sent to Apple.
    expect(digestStringAsyncMock).toHaveBeenCalledTimes(1);
    expect(digestStringAsyncMock).toHaveBeenCalledWith('SHA-256', mockRawNonce);

    // Apple's signInAsync receives the *hashed* nonce (never the raw value).
    expect(signInAsyncMock).toHaveBeenCalledTimes(1);
    const signInArgs = signInAsyncMock.mock.calls[0][0];
    expect(signInArgs.nonce).toBe(mockHashedNonce);
    expect(signInArgs.nonce).not.toBe(mockRawNonce);

    // Firebase's OAuthProvider.credential receives the *raw* nonce + id token.
    expect(credentialSpy).toHaveBeenCalledTimes(1);
    const credentialArgs = credentialSpy.mock.calls[0][0];
    expect(credentialArgs.rawNonce).toBe(mockRawNonce);
    expect(credentialArgs.rawNonce).not.toBe(mockHashedNonce);
    expect(credentialArgs.idToken).toBe('apple-id-token');
  });
});

describe('getAppleCredential — first-authorization profile capture (R3.3)', () => {
  it('captures displayName and email supplied on first authorization', async () => {
    signInAsyncMock.mockResolvedValue({
      identityToken: 'apple-id-token',
      fullName: { givenName: 'Ada', familyName: 'Lovelace' },
      email: 'ada@example.com',
    });

    const result = await getAppleCredential();

    expect(result.providerId).toBe('apple.com');
    expect(result.profile.displayName).toBe('Ada Lovelace');
    expect(result.profile.email).toBe('ada@example.com');
    expect(result.credential).toBeDefined();
  });
});

describe('getAppleCredential — subsequent-authorization null profile (R3.4)', () => {
  it('still completes sign-in with an undefined profile when Apple returns nulls', async () => {
    signInAsyncMock.mockResolvedValue({
      identityToken: 'apple-id-token',
      fullName: null,
      email: null,
    });

    const result = await getAppleCredential();

    // Sign-in completes: a credential is returned.
    expect(result.credential).toBeDefined();
    expect(result.providerId).toBe('apple.com');

    // No profile fields are populated on a subsequent authorization.
    expect(result.profile.displayName).toBeUndefined();
    expect(result.profile.email).toBeUndefined();
  });
});

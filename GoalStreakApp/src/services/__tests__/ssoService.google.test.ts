// Feature: sso-authentication — Example test for the Google credential converter.
//
// Library: Jest (jest-expo). This is an example (unit) test, not a property test.
//
// Covers getGoogleCredential(idToken) in ssoService:
//   - R4.2  Google credential construction: given an id token, the converter
//           builds a Firebase credential via GoogleAuthProvider.credential and
//           returns an SsoCredentialResult tagged with providerId 'google.com'
//           and an empty profile (the Google profile is read from the Firebase
//           user after sign-in, not from the id token).
//
// _Requirements: 4.2_
//
// External boundaries are mocked so the test never touches the real Firebase
// app or the native SDKs that ssoService imports at module load:
//   - firebase/auth:              GoogleAuthProvider.credential is a spy that
//                                 returns a fake credential; OAuthProvider and
//                                 fetchSignInMethodsForEmail are stubbed because
//                                 ssoService references them at load.
//   - ./firebase:                 auth stub so importing ssoService is side-effect-free
//   - react-native:               Platform stub (ssoService imports Platform)
//   - expo-apple-authentication:  stubbed (imported at module load)
//   - expo-crypto:                stubbed (imported at module load)

// Fake credential object the mocked GoogleAuthProvider.credential returns.
// (Declared with the `mock` prefix so it may be referenced inside jest.mock factories.)
const mockGoogleCredential = { __fakeGoogleCredential: true };

// Firebase auth boundary. GoogleAuthProvider.credential(idToken) records the
// argument it receives so the test can assert the id token is forwarded
// unchanged. OAuthProvider + fetchSignInMethodsForEmail are stubbed because
// ssoService imports them at module load.
jest.mock('firebase/auth', () => {
  const googleCredentialSpy = jest.fn((_idToken: string) => mockGoogleCredential);
  class OAuthProvider {
    providerId: string;
    constructor(providerId: string) {
      this.providerId = providerId;
    }
    credential(args: unknown) {
      return { __fakeAppleCredential: true, args };
    }
  }
  return {
    OAuthProvider,
    GoogleAuthProvider: {
      credential: googleCredentialSpy,
    },
    fetchSignInMethodsForEmail: jest.fn(async () => ['password']),
    // Exposed for assertions.
    __googleCredentialSpy: googleCredentialSpy,
  };
});

// Importing ssoService must not initialize the real Firebase app.
jest.mock('../firebase', () => ({ auth: {} }));

// ssoService imports these at module load; provide inert stubs.
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn(async () => true),
  AppleAuthenticationScope: { FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL' },
}));
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'RAW_NONCE_UUID'),
  digestStringAsync: jest.fn(async () => 'HASHED'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

import * as firebaseAuth from 'firebase/auth';
import { getGoogleCredential } from '../ssoService';

// The recorded GoogleAuthProvider.credential(...) calls.
const googleCredentialSpy = (
  firebaseAuth as unknown as { __googleCredentialSpy: jest.Mock }
).__googleCredentialSpy;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getGoogleCredential — credential construction (R4.2)', () => {
  it('builds a Firebase credential from the id token via GoogleAuthProvider.credential', () => {
    const idToken = 'google-id-token';

    const result = getGoogleCredential(idToken);

    // The id token is forwarded, unchanged, to GoogleAuthProvider.credential.
    expect(googleCredentialSpy).toHaveBeenCalledTimes(1);
    expect(googleCredentialSpy).toHaveBeenCalledWith(idToken);

    // The built credential is returned as-is.
    expect(result.credential).toBe(mockGoogleCredential);
  });

  it('returns an SsoCredentialResult tagged google.com with an empty profile', () => {
    const result = getGoogleCredential('another-id-token');

    expect(result.providerId).toBe('google.com');
    // The Google profile is read from the Firebase user after sign-in, so the
    // converter returns an empty profile.
    expect(result.profile).toEqual({});
  });
});

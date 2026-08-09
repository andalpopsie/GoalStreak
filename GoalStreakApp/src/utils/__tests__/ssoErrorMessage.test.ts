// Feature: sso-authentication — Example tests for collision (and general) error messaging.
//
// Library: Jest (jest-expo). These are example (unit) tests, not property tests.
//
// Covers getSsoErrorDisplay(error) in utils/ssoErrorMessage — the presentation
// half of collision handling (task 7). It maps a normalized `SsoError` (kind +
// message produced by ssoService.mapAuthError) to what the UI renders: an
// optional title, a message, and whether the failure is silent.
//
//   - R7.1  Collision naming the existing method: the display is visible
//           (silent:false), titled "Account already exists", and its message is
//           exactly the SsoError.message that names the existing sign-in method.
//   - R7.4  That message persists as-is (it is returned verbatim for the UI to
//           keep visible until dismissed / a new sign-in action).
//   - R7.5  Collision with no resolvable method: the display is still visible and
//           carries the generic "sign in with your existing account" fallback
//           message the SsoError was constructed with.
//   - Cancellations are silent with an empty message; network/generic failures
//           are visible with a non-empty message.
//
// _Requirements: 7.1, 7.4, 7.5_
//
// SsoError is imported from the real ssoService so we exercise the actual error
// class. ssoService touches Firebase/Expo/RN at module load, so those external
// boundaries are stubbed exactly like ssoService.google.test.ts.
jest.mock('firebase/auth', () => {
  class OAuthProvider {
    providerId: string;
    constructor(providerId: string) {
      this.providerId = providerId;
    }
    credential() {
      return {};
    }
  }
  return {
    OAuthProvider,
    GoogleAuthProvider: { credential: jest.fn(() => ({})) },
    fetchSignInMethodsForEmail: jest.fn(async () => ['password']),
  };
});
jest.mock('../../services/firebase', () => ({ auth: {} }));
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

import { SsoError } from '../../services/ssoService';
import { getSsoErrorDisplay } from '../ssoErrorMessage';

describe('getSsoErrorDisplay — collision messaging (R7.1, R7.4, R7.5)', () => {
  it('shows a titled, non-silent message naming the resolved existing method (R7.1, R7.4)', () => {
    // Mirrors what ssoService.mapAuthError builds when fetchSignInMethodsForEmail
    // resolves to 'password': the message names the existing method and tells the
    // user to sign in with it, then link from Settings.
    const collisionMessage =
      'An account already exists for this email using password. ' +
      'Sign in with that method, then link Apple or Google from Settings.';
    const error = new SsoError('collision', collisionMessage, 'password');

    const display = getSsoErrorDisplay(error);

    expect(display.silent).toBe(false);
    expect(display.title).toBe('Account already exists');
    // The message is returned verbatim (names the existing method, R7.1) and is
    // the persistent copy the UI keeps visible (R7.4).
    expect(display.message).toBe(collisionMessage);
    expect(display.message).toContain('password');
  });

  it('falls back to the generic collision message when no method resolved (R7.5)', () => {
    // ssoService.mapAuthError uses this exact fallback when the method lookup
    // fails or returns nothing — no existingMethod is attached.
    const genericCollision =
      'An account already exists for this email. Please sign in with your existing account.';
    const error = new SsoError('collision', genericCollision);

    const display = getSsoErrorDisplay(error);

    expect(display.silent).toBe(false);
    expect(display.message).toBe(genericCollision);
    expect(display.message).toContain('sign in with your existing account');
    expect(error.existingMethod).toBeUndefined();
  });
});

describe('getSsoErrorDisplay — other error kinds', () => {
  it('is silent with an empty message for a cancellation', () => {
    const error = new SsoError('cancelled', 'Sign-in was cancelled.');

    const display = getSsoErrorDisplay(error);

    expect(display.silent).toBe(true);
    expect(display.message).toBe('');
  });

  it('is visible with a non-empty message for a network failure', () => {
    const error = new SsoError('network', 'Network error, please try again.');

    const display = getSsoErrorDisplay(error);

    expect(display.silent).toBe(false);
    expect(display.message.length).toBeGreaterThan(0);
  });

  it('is visible with a non-empty message for a generic failure', () => {
    const error = new SsoError('generic', 'Authentication failed, please try again.');

    const display = getSsoErrorDisplay(error);

    expect(display.silent).toBe(false);
    expect(display.message.length).toBeGreaterThan(0);
  });
});

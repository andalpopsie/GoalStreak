// Feature: sso-authentication, Property 11: Private-relay emails are never used as identity
//
// Property-based test for ssoService.isPrivateRelayEmail / isSameIdentityByEmail.
// Library: fast-check + Jest (jest-expo). Runs a minimum of 100 iterations.
//
// For any string of the form `<token>@privaterelay.appleid.com`:
//   1. it is detected as a private-relay email, and
//   2. no identity-association decision treats email equality involving such an
//      address as evidence that two accounts are the same identity.
//
// A positive control (two equal, non-relay emails ARE the same identity) is
// included so the guard cannot pass vacuously by always returning false.
//
// Validates: Requirements 8.4
//
// External boundaries are mocked so importing ssoService is side-effect-free
// and iterations never touch the real Firebase app or native SDKs.

import fc from 'fast-check';

// ssoService references these at module load; provide inert stubs so importing
// the pure helpers never initializes the real Firebase app or native modules.
jest.mock('../firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  OAuthProvider: class {},
  GoogleAuthProvider: { credential: jest.fn() },
  fetchSignInMethodsForEmail: jest.fn(),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-apple-authentication', () => ({}));
jest.mock('expo-crypto', () => ({}));

import { isPrivateRelayEmail, isSameIdentityByEmail } from '../ssoService';

const RELAY_DOMAIN = 'privaterelay.appleid.com';

// A non-empty token for the local part of a relay address: realistic Apple
// relay tokens are alphanumerics plus `.`, `_`, `-` (never whitespace or `@`).
const tokenArb: fc.Arbitrary<string> = fc
  .array(
    fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-'.split('')
    ),
    { minLength: 1, maxLength: 40 }
  )
  .map((chars) => chars.join(''));

// Randomly vary case and add surrounding whitespace to prove detection is
// case-insensitive and whitespace-tolerant.
const relayEmailArb: fc.Arbitrary<string> = fc
  .tuple(tokenArb, fc.boolean(), fc.constantFrom('', ' ', '  ', '\t'))
  .map(([token, upper, pad]) => {
    const raw = `${token}@${RELAY_DOMAIN}`;
    const cased = upper ? raw.toUpperCase() : raw;
    return `${pad}${cased}${pad}`;
  });

// An arbitrary email that is NOT a private-relay address, used as the
// counterpart in the identity-association assertions.
const nonRelayEmailArb: fc.Arbitrary<string> = fc
  .emailAddress()
  .filter((e) => !isPrivateRelayEmail(e));

describe('ssoService — Property 11: private-relay emails are never used as identity', () => {
  it('detects relay addresses and never treats them as same-identity evidence', () => {
    fc.assert(
      fc.property(relayEmailArb, nonRelayEmailArb, (relayEmail, otherEmail) => {
        // 1. Detection: any `<token>@privaterelay.appleid.com` is a relay email.
        expect(isPrivateRelayEmail(relayEmail)).toBe(true);

        // 2a. Even an *identical* relay address is not same-identity evidence —
        //     email equality involving a relay address never proves identity.
        expect(isSameIdentityByEmail(relayEmail, relayEmail)).toBe(false);

        // 2b. A relay address on either side never yields same-identity, even
        //     against another arbitrary email.
        expect(isSameIdentityByEmail(relayEmail, otherEmail)).toBe(false);
        expect(isSameIdentityByEmail(otherEmail, relayEmail)).toBe(false);

        // Positive control: two equal NON-relay emails ARE the same identity,
        // so the guard above is not vacuously false.
        expect(isSameIdentityByEmail(otherEmail, otherEmail)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

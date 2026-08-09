// Feature: sso-authentication, Property 14: Missing configuration blocks the affected flow
//
// Property-based test for `assertSsoConfig` in ssoService.
//
// Library: fast-check + Jest (jest-expo). Runs a minimum of 100 iterations.
// One property per file.
//
// Property 14: For any subset of the required OAuth client identifiers being
// absent or empty, `assertSsoConfig` for an affected provider throws a
// 'missing-config' SsoError naming a missing identifier and the corresponding
// SSO flow does not start (assertSsoConfig throws before the flow begins).
//
// **Validates: Requirements 9.2**
//
// assertSsoConfig reads `config.sso` from '../config/environment'
// (appleClientId, googleIosClientId, googleWebClientId). apple.com requires
// appleClientId; google.com requires googleIosClientId AND googleWebClientId.
// Empty/whitespace-only values count as missing.

import fc from 'fast-check';

// Mock the environment module so we can control `config.sso` per iteration.
// The mocked `config` object is mutated in the property body before each call.
jest.mock('../../config/environment', () => ({
  config: {
    sso: {
      appleClientId: '',
      googleIosClientId: '',
      googleWebClientId: '',
    },
  },
}));

// Mock the firebase service module so importing ssoService does not initialize
// the real Firebase app/auth. assertSsoConfig does not use `auth` at all.
jest.mock('../firebase', () => ({
  auth: {},
}));

import { config } from '../../config/environment';
import { assertSsoConfig, SsoError, SsoProviderId } from '../ssoService';

// ── Generators ───────────────────────────────────────────────────────────────

// A present (valid) client id: always has non-whitespace content, so it is
// never treated as missing.
const presentIdArb: fc.Arbitrary<string> = fc.string().map((s) => `id-${s}`);

// Whitespace-only strings (count as missing).
const whitespaceArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), { minLength: 1, maxLength: 6 })
  .map((chars) => chars.join(''));

// A missing value: empty string, whitespace-only, or absent (undefined).
const missingIdArb: fc.Arbitrary<string | undefined> = fc.oneof(
  fc.constant(''),
  whitespaceArb,
  fc.constant(undefined)
);

// Field state: whether the identifier is present, plus its concrete value.
interface FieldState {
  present: boolean;
  value: string | undefined;
}

const fieldStateArb: fc.Arbitrary<FieldState> = fc.oneof(
  presentIdArb.map((value) => ({ present: true, value })),
  missingIdArb.map((value) => ({ present: false, value }))
);

const providerArb: fc.Arbitrary<SsoProviderId> = fc.constantFrom('apple.com', 'google.com');

describe('ssoService.assertSsoConfig — Property 14: missing configuration blocks the affected flow', () => {
  it('throws missing-config naming a missing identifier iff a required id is absent/empty, else does not throw', () => {
    fc.assert(
      fc.property(
        providerArb,
        fieldStateArb,
        fieldStateArb,
        fieldStateArb,
        (provider, appleState, googleIosState, googleWebState) => {
          // Install the generated config for this iteration.
          config.sso = {
            appleClientId: appleState.value as string,
            googleIosClientId: googleIosState.value as string,
            googleWebClientId: googleWebState.value as string,
          };

          // Determine which identifiers are required for the chosen provider and
          // which of those are missing.
          const missingNames: string[] = [];
          if (provider === 'apple.com') {
            if (!appleState.present) missingNames.push('appleClientId');
          } else {
            if (!googleIosState.present) missingNames.push('googleIosClientId');
            if (!googleWebState.present) missingNames.push('googleWebClientId');
          }

          const requiredPresent = missingNames.length === 0;

          if (requiredPresent) {
            // All required identifiers present → the guard must not block.
            expect(() => assertSsoConfig(provider)).not.toThrow();
            return;
          }

          // A required identifier is missing → the guard must throw a
          // missing-config SsoError naming a missing identifier, so the flow
          // never starts.
          let thrown: unknown;
          try {
            assertSsoConfig(provider);
          } catch (e) {
            thrown = e;
          }

          expect(thrown).toBeInstanceOf(SsoError);
          const err = thrown as SsoError;
          expect(err.kind).toBe('missing-config');
          // The message names at least one identifier that is actually missing.
          expect(missingNames.some((name) => err.message.includes(name))).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Feature: sso-authentication, Property 1: Error classification is total and correct
//
// Property-based test for ssoService.mapAuthError.
// Library: fast-check + Jest. Runs a minimum of 100 iterations.
//
// For any raw error drawn from the known SDK/Firebase error space, mapAuthError
// returns exactly one SsoErrorKind and classifies it correctly:
//   cancellations           → 'cancelled'
//   network failures        → 'network'
//   no-token timeouts       → 'timeout'
//   account-exists          → 'collision'
//   provider-not-enabled    → 'unavailable'
//   everything else         → 'generic'
//
// Validates: Requirements 3.5, 3.6, 3.7, 4.5, 4.6, 4.7, 4.8, 6.8, 9.6
//
// External boundaries are mocked so iterations stay cheap and never hit the
// network: firebase/auth's fetchSignInMethodsForEmail and ./firebase's auth.

import fc from 'fast-check';

// Mock the Firebase auth boundary used by the collision path so mapAuthError
// never performs a real network lookup.
jest.mock('../firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  fetchSignInMethodsForEmail: jest.fn(async () => ['password']),
}));

import { mapAuthError, SsoError, SsoErrorKind } from '../ssoService';

// The complete, closed set of valid error kinds — used for the totality check.
const VALID_KINDS: SsoErrorKind[] = [
  'cancelled',
  'network',
  'timeout',
  'collision',
  'unavailable',
  'missing-config',
  'generic',
];

type ErrorCase = { error: unknown; expected: SsoErrorKind };

// ── Generators over the known error space ────────────────────────────────────
// Each generator yields a { error, expected } pair whose classification is
// unambiguous, so the assertion can check exact-kind equality.

const cancelledArb: fc.Arbitrary<ErrorCase> = fc
  .oneof(
    // Apple / Firebase cancellation codes.
    fc
      .constantFrom(
        'ERR_REQUEST_CANCELED',
        'ERR_CANCELED',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request'
      )
      .map((code) => ({ code })),
    // Google useAuthRequest response types.
    fc.constantFrom('cancel', 'dismiss').map((type) => ({ type })),
    // Message-only cancellations.
    fc
      .constantFrom(
        'The user canceled the request.',
        'User cancelled the sign-in.',
        'The sign-in was dismissed.',
        'Operation was cancelled by the user.'
      )
      .map((message) => ({ message }))
  )
  .map((error) => ({ error, expected: 'cancelled' as SsoErrorKind }));

const networkArb: fc.Arbitrary<ErrorCase> = fc
  .oneof(
    fc.constantFrom('auth/network-request-failed', 'ERR_NETWORK').map((code) => ({ code })),
    fc
      .constantFrom(
        'Network request failed',
        'A network error occurred while signing in.',
        'fetch failed',
        'Failed to fetch'
      )
      .map((message) => ({ message }))
  )
  .map((error) => ({ error, expected: 'network' as SsoErrorKind }));

const timeoutArb: fc.Arbitrary<ErrorCase> = fc
  .oneof(
    fc.constantFrom('ERR_TIMEOUT', 'timeout').map((code) => ({ code })),
    fc
      .constantFrom('Request timed out', 'The operation timed out.', 'Sign-in timeout exceeded')
      .map((message) => ({ message }))
  )
  .map((error) => ({ error, expected: 'timeout' as SsoErrorKind }));

const collisionArb: fc.Arbitrary<ErrorCase> = fc
  .record({
    code: fc.constant('auth/account-exists-with-different-credential'),
  })
  .map((error) => ({ error, expected: 'collision' as SsoErrorKind }));

const unavailableArb: fc.Arbitrary<ErrorCase> = fc
  .record({ code: fc.constant('auth/operation-not-allowed') })
  .map((error) => ({ error, expected: 'unavailable' as SsoErrorKind }));

// Codes/strings that must never collide with a more specific category.
const SPECIAL_CODES = new Set<string>([
  'ERR_REQUEST_CANCELED',
  'ERR_CANCELED',
  'cancel',
  'dismiss',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/network-request-failed',
  'ERR_NETWORK',
  'ERR_TIMEOUT',
  'timeout',
  'auth/account-exists-with-different-credential',
  'auth/operation-not-allowed',
]);

// A message that matches none of the cancel/network/timeout regexes.
const CANCEL_NETWORK_TIMEOUT_RE =
  /\bcancell?ed\b|\bdismiss(ed)?\b|network request failed|network error|fetch failed|failed to fetch|timed out|timeout/i;

const genericArb: fc.Arbitrary<ErrorCase> = fc
  .oneof(
    // Known Firebase codes that fall through to generic.
    fc
      .constantFrom(
        'auth/invalid-credential',
        'auth/requires-recent-login',
        'auth/internal-error',
        'auth/user-disabled',
        'auth/invalid-verification-code'
      )
      .map((code) => ({ code })),
    // Arbitrary unknown codes that are not one of the special-cased codes.
    fc
      .string({ minLength: 1, maxLength: 24 })
      .filter((s) => !SPECIAL_CODES.has(s))
      .map((code) => ({ code })),
    // Arbitrary unknown string errors that avoid the classification keywords.
    fc
      .string({ minLength: 0, maxLength: 24 })
      .filter((s) => !SPECIAL_CODES.has(s) && !CANCEL_NETWORK_TIMEOUT_RE.test(s)),
    // Non-object / empty error shapes.
    fc.constantFrom(null, undefined, 42, {}, { foo: 'bar' } as unknown)
  )
  .map((error) => ({ error, expected: 'generic' as SsoErrorKind }));

const errorCaseArb: fc.Arbitrary<ErrorCase> = fc.oneof(
  cancelledArb,
  networkArb,
  timeoutArb,
  collisionArb,
  unavailableArb,
  genericArb
);

describe('ssoService.mapAuthError — Property 1: error classification is total and correct', () => {
  it('returns exactly one valid SsoErrorKind matching the expected classification', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorCaseArb,
        // Email is irrelevant to the classification kind; vary it to exercise
        // both the collision-lookup and no-email paths.
        fc.option(fc.emailAddress(), { nil: undefined }),
        async ({ error, expected }, email) => {
          const result = await mapAuthError(error, email);

          // Always an SsoError.
          expect(result).toBeInstanceOf(SsoError);

          // Totality: kind is always one of the closed set of valid kinds.
          expect(VALID_KINDS).toContain(result.kind);

          // Correctness: the single expected kind is produced.
          expect(result.kind).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

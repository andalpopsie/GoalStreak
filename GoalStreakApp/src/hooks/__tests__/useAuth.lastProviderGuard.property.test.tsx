// Feature: sso-authentication, Property 10: At least one sign-in provider always remains linked
//
// Property-based test for the useAuth last-provider guard helper
// (canUnlinkProvider). Library: fast-check + Jest (jest-expo). Minimum 100
// iterations, one property per file.
//
// Property 10 (design.md): For any set of linked providers, an unlink request
// is permitted if and only if at least one provider would remain after removal;
// unlinking the only remaining provider is rejected and leaves the linked set
// unchanged.
//
// Validates: Requirements 8.6, 8.7
//
// Approach: canUnlinkProvider is a pure, exported predicate, so the property is
// asserted against it directly rather than driving the full unlinkProvider flow.
// The property compares the helper against an independent oracle — "removing the
// provider leaves >= 1 provider linked" — so the guard forbids unlinking exactly
// when it would empty the linked-provider set. Targeted example checks and a
// positive control ensure the equivalence is not satisfied vacuously.
//
// External boundaries are mocked so importing useAuth is side-effect-free and
// iterations never touch the real Firebase app, native SDKs, or Firestore. The
// mock set mirrors the sibling useAuth SSO property test.

import fc from 'fast-check';

// ── External boundary mocks (mirror useAuth.ssoNoSideEffects.property.test) ──

jest.mock('../../services/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: () => true,
}));

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

jest.mock('../../services/userProvisioningService', () => ({
  isNewUser: jest.fn(async () => true),
  provisionNewUser: jest.fn(async () => ({ username: 'generated_user', created: true })),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn(async () => ({ type: 'dismiss' }))]),
}));

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

jest.mock('../../services/subscriptionService', () => ({
  __esModule: true,
  default: { initialize: jest.fn(async () => undefined) },
}));

jest.mock('../../services/accountDeletionService', () => ({
  accountDeletionService: { reauthenticateAndDeleteAccount: jest.fn() },
}));

// ── Import resolved through the mocks above ──────────────────────────────────
import { canUnlinkProvider } from '../useAuth';

// Provider ids include the real Firebase provider ids plus arbitrary strings so
// the guard is exercised beyond the known SSO providers.
const providerIdArb: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom('apple.com', 'google.com', 'password'),
  fc.string({ minLength: 1, maxLength: 12 }),
);

const linkedProvidersArb: fc.Arbitrary<string[]> = fc.array(providerIdArb, {
  minLength: 0,
  maxLength: 6,
});

// Independent oracle: unlinking is permitted iff removing every occurrence of
// the provider leaves at least one provider linked.
const remainsNonEmpty = (linked: readonly string[], toRemove: string): boolean =>
  linked.filter((id) => id !== toRemove).length >= 1;

describe('useAuth — Property 10: at least one sign-in provider always remains linked', () => {
  it('permits unlinking iff removal leaves >= 1 provider (forbids emptying the set)', () => {
    fc.assert(
      fc.property(
        linkedProvidersArb,
        // The provider to remove is sometimes drawn from the linked set (the
        // realistic case) and sometimes an arbitrary id (a not-linked target).
        fc.oneof(providerIdArb, fc.integer({ min: 0, max: 5 })),
        (linked, removeSelector) => {
          const providerToRemove =
            typeof removeSelector === 'number'
              ? linked[removeSelector] ?? 'apple.com'
              : removeSelector;

          const expected = remainsNonEmpty(linked, providerToRemove);

          // Core equivalence: the guard matches the oracle exactly.
          expect(canUnlinkProvider(linked, providerToRemove)).toBe(expected);

          // Reinforce the two directions of the biconditional explicitly:
          // forbidden exactly when removal would empty the linked set.
          if (canUnlinkProvider(linked, providerToRemove)) {
            expect(linked.filter((id) => id !== providerToRemove).length).toBeGreaterThanOrEqual(1);
          } else {
            expect(linked.filter((id) => id !== providerToRemove).length).toBe(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects unlinking the only remaining provider (targeted + positive control)', () => {
    fc.assert(
      fc.property(providerIdArb, (only) => {
        // Sole linked provider -> unlinking it would empty the set -> rejected.
        expect(canUnlinkProvider([only], only)).toBe(false);

        // Positive control: with a second distinct provider present, unlinking
        // one is permitted, so the guard is not vacuously always-false.
        const other = only === 'google.com' ? 'apple.com' : 'google.com';
        expect(canUnlinkProvider([only, other], only)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: sso-authentication, Property 7: Deletion selects the re-auth strategy from the primary provider id
//
// Property-based test for accountDeletionService.reauthenticateForDeletion.
//
// Library: fast-check + Jest (jest-expo). Minimum 100 iterations, one property
// per file. All external boundaries are mocked so nothing real runs:
//   - './firebase': `auth` with a mutable `currentUser` set per iteration
//     ({ providerData: [{ providerId }], email }); `db` placeholder.
//   - 'firebase/auth': EmailAuthProvider.credential + reauthenticateWithCredential
//     are jest.fns we spy on; deleteUser is inert.
//   - './ssoService': getAppleCredential (resolves a fake credential) and
//     getGoogleCredential (returns a fake credential) are jest.fns; SsoError is
//     kept REAL (requireActual) so the unavailable-provider throw is a real
//     SsoError.
//   - './photoService', '../utils/usernameUtils', 'firebase/firestore',
//     AsyncStorage: neutralized so the module evaluates and no cleanup runs.
//
// Property 7 (design.md): For any value of providerData[0].providerId,
// reauthenticateForDeletion selects the matching strategy — password →
// email/password credential, apple.com → Apple credential re-auth, google.com →
// Google credential re-auth — and for an absent or unsupported provider id it
// aborts without attempting deletion.
//
// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.7

import fc from 'fast-check';

// ── External boundary mocks ──────────────────────────────────────────────────

// Firebase handles: a mutable auth.currentUser we rewrite each iteration, plus a
// db placeholder. providerData[0].providerId drives the strategy selection.
// The auth object is created inside the factory (jest hoists jest.mock above
// imports) and mutated later via the imported `auth` reference.
jest.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

// firebase/auth: EmailAuthProvider.credential + reauthenticateWithCredential are
// the write/verify boundary we assert against; deleteUser stays inert (this test
// only exercises re-auth strategy selection, not full deletion).
jest.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: jest.fn(() => ({ __emailCredential: true })) },
  reauthenticateWithCredential: jest.fn(async () => undefined),
  deleteUser: jest.fn(async () => undefined),
}));

// ssoService: keep SsoError REAL so the unavailable throw is a genuine SsoError;
// replace the credential adapters with spies returning fake credentials.
jest.mock('../ssoService', () => {
  const actual = jest.requireActual('../ssoService');
  return {
    __esModule: true,
    SsoError: actual.SsoError,
    getAppleCredential: jest.fn(async () => ({
      credential: { __appleCredential: true },
      profile: {},
      providerId: 'apple.com',
    })),
    getGoogleCredential: jest.fn(() => ({
      credential: { __googleCredential: true },
      profile: {},
      providerId: 'google.com',
    })),
  };
});

// Cleanup-path dependencies pulled in by accountDeletionService at import time —
// neutralized so the module evaluates. They are never reached by re-auth.
jest.mock('../photoService', () => ({
  photoService: { deleteProfilePhoto: jest.fn(async () => undefined) },
}));
jest.mock('../../utils/usernameUtils', () => ({
  releaseUsername: jest.fn(async () => undefined),
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(async () => ({ exists: () => false, data: () => undefined })),
  getDocs: jest.fn(async () => ({ empty: true, docs: [] })),
  query: jest.fn(),
  where: jest.fn(),
  writeBatch: jest.fn(() => ({ delete: jest.fn(), commit: jest.fn(async () => undefined) })),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(async () => []),
  multiRemove: jest.fn(async () => undefined),
}));

// ── Imports resolved through the mocks above ─────────────────────────────────
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getAppleCredential, getGoogleCredential, SsoError } from '../ssoService';
import { reauthenticateForDeletion } from '../accountDeletionService';
import { auth as mockAuth } from '../firebase';

const mockedEmailCredential = EmailAuthProvider.credential as jest.MockedFunction<
  typeof EmailAuthProvider.credential
>;
const mockedReauthWithCredential = reauthenticateWithCredential as jest.MockedFunction<
  typeof reauthenticateWithCredential
>;
const mockedGetAppleCredential = getAppleCredential as jest.MockedFunction<
  typeof getAppleCredential
>;
const mockedGetGoogleCredential = getGoogleCredential as jest.MockedFunction<
  typeof getGoogleCredential
>;

// The generator: the three supported provider ids plus absent/unsupported ones.
type ProviderCase =
  | { providerId: 'password' }
  | { providerId: 'apple.com' }
  | { providerId: 'google.com' }
  | { providerId: undefined } // primary provider absent
  | { providerId: string }; // arbitrary unsupported id

const supportedArb: fc.Arbitrary<ProviderCase> = fc.constantFrom<ProviderCase[]>(
  { providerId: 'password' },
  { providerId: 'apple.com' },
  { providerId: 'google.com' }
);

// Unsupported ids: undefined, empty string, and arbitrary strings that are not
// one of the three supported provider ids.
const unsupportedArb: fc.Arbitrary<ProviderCase> = fc.oneof(
  fc.constant<ProviderCase>({ providerId: undefined }),
  fc
    .string()
    .filter((s) => !['password', 'apple.com', 'google.com'].includes(s))
    .map<ProviderCase>((providerId) => ({ providerId }))
);

const providerCaseArb: fc.Arbitrary<ProviderCase> = fc.oneof(supportedArb, unsupportedArb);

describe('accountDeletionService.reauthenticateForDeletion — Property 7: strategy from primary provider id', () => {
  it('selects the matching re-auth strategy per provider id and aborts on absent/unsupported', async () => {
    await fc.assert(
      fc.asyncProperty(providerCaseArb, async (testCase) => {
        // Fresh mock state per iteration so captured calls reflect only this run.
        mockedEmailCredential.mockReset();
        mockedReauthWithCredential.mockReset();
        mockedGetAppleCredential.mockReset();
        mockedGetGoogleCredential.mockReset();

        mockedEmailCredential.mockReturnValue({ __emailCredential: true } as never);
        mockedReauthWithCredential.mockResolvedValue(undefined as never);
        mockedGetAppleCredential.mockResolvedValue({
          credential: { __appleCredential: true } as never,
          profile: {},
          providerId: 'apple.com',
        });
        mockedGetGoogleCredential.mockReturnValue({
          credential: { __googleCredential: true } as never,
          profile: {},
          providerId: 'google.com',
        });

        // Set the current user's primary provider for this iteration (mutate the
        // shared auth reference the service reads from).
        (mockAuth as unknown as { currentUser: unknown }).currentUser = {
          uid: 'uid-under-test',
          email: 'user@example.com',
          providerData: [{ providerId: testCase.providerId }],
        };

        // A Google id-token provider callback for the google.com branch.
        const getIdTokenForGoogle = jest.fn(async () => 'fake-google-id-token');

        if (testCase.providerId === 'password') {
          // password → EmailAuthProvider credential + reauthenticateWithCredential;
          // neither SSO adapter is touched (R6.4).
          await reauthenticateForDeletion('secret-password', getIdTokenForGoogle);

          expect(mockedEmailCredential).toHaveBeenCalledTimes(1);
          expect(mockedEmailCredential).toHaveBeenCalledWith('user@example.com', 'secret-password');
          expect(mockedReauthWithCredential).toHaveBeenCalledTimes(1);
          expect(mockedGetAppleCredential).not.toHaveBeenCalled();
          expect(mockedGetGoogleCredential).not.toHaveBeenCalled();
        } else if (testCase.providerId === 'apple.com') {
          // apple.com → getAppleCredential + reauthenticateWithCredential; the
          // Google path is not used (R6.2).
          await reauthenticateForDeletion(undefined, getIdTokenForGoogle);

          expect(mockedGetAppleCredential).toHaveBeenCalledTimes(1);
          expect(mockedReauthWithCredential).toHaveBeenCalledTimes(1);
          expect(mockedGetGoogleCredential).not.toHaveBeenCalled();
          expect(mockedEmailCredential).not.toHaveBeenCalled();
        } else if (testCase.providerId === 'google.com') {
          // google.com → getIdTokenForGoogle + getGoogleCredential +
          // reauthenticateWithCredential; the Apple path is not used (R6.3).
          await reauthenticateForDeletion(undefined, getIdTokenForGoogle);

          expect(getIdTokenForGoogle).toHaveBeenCalledTimes(1);
          expect(mockedGetGoogleCredential).toHaveBeenCalledTimes(1);
          expect(mockedGetGoogleCredential).toHaveBeenCalledWith('fake-google-id-token');
          expect(mockedReauthWithCredential).toHaveBeenCalledTimes(1);
          expect(mockedGetAppleCredential).not.toHaveBeenCalled();
          expect(mockedEmailCredential).not.toHaveBeenCalled();
        } else {
          // Absent or unsupported provider id → aborts with a real SsoError and
          // never attempts re-authentication (no deletion path begins) (R6.7).
          let caught: unknown;
          try {
            await reauthenticateForDeletion('secret-password', getIdTokenForGoogle);
          } catch (error) {
            caught = error;
          }

          expect(caught).toBeInstanceOf(SsoError);
          expect((caught as SsoError).kind).toBe('unavailable');
          expect(mockedReauthWithCredential).not.toHaveBeenCalled();
          expect(mockedGetAppleCredential).not.toHaveBeenCalled();
          expect(mockedGetGoogleCredential).not.toHaveBeenCalled();
          expect(mockedEmailCredential).not.toHaveBeenCalled();
        }
      }),
      { numRuns: 100 }
    );
  });
});

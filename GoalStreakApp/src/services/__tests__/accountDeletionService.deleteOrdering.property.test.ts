// Feature: sso-authentication, Property 8: The Firebase Auth user is deleted only after all data cleanup
//
// Property-based test for accountDeletionService — delete ordering.
//
// Library: fast-check + Jest (jest-expo). Minimum 100 iterations, one property
// per file. Every external boundary is mocked and each cleanup operation plus
// the final Firebase Auth deletion pushes a marker onto a shared ordering log,
// so a full deletion run leaves a totally-ordered trace we can assert against:
//   - './firebase': `auth` with a mutable `currentUser` set per iteration; `db`
//     is a placeholder.
//   - 'firebase/auth': `deleteUser` pushes 'deleteUser'; `reauthenticateWith-
//     Credential` pushes 'reauth' (so we exercise "proceeds past re-auth");
//     `EmailAuthProvider.credential` returns a fake credential.
//   - 'firebase/firestore': `getDoc` returns a user doc (optionally with a
//     username), `getDocs` returns docs (optionally) so batches run, and every
//     `writeBatch().commit()` pushes 'batchCommit'. `doc`/`collection`/`query`/
//     `where` are inert.
//   - '../utils/usernameUtils': `releaseUsername` pushes 'releaseUsername'.
//   - './photoService': `deleteProfilePhoto` pushes 'deleteProfilePhoto'.
//   - AsyncStorage: `getAllKeys` returns keys (optionally); `multiRemove` pushes
//     'clearLocalStorage'.
//   - './ssoService': SsoError kept REAL; credential adapters are inert spies.
//
// Property 8 (design.md): For any account-deletion execution that proceeds past
// re-authentication, the Firebase Auth user deletion (deleteUser) occurs only
// after every data-cleanup step (user-owned documents, per-user documents,
// friend data, group invitations, username release, Storage photo, AsyncStorage)
// has completed, and it is the final operation. fast-check varies whether the
// account has a reserved username, whether queried collections contain
// documents, and whether AsyncStorage holds user-scoped keys — deleteUser must
// still be the single last entry in the ordering log across every combination.
//
// Validates: Requirements 6.5

import fc from 'fast-check';

// ── External boundary mocks ──────────────────────────────────────────────────
// All factories return bare jest.fns; per-iteration implementations that push
// onto the test-scoped ordering log are installed inside the property body
// (mirrors accountDeletionService.reauthStrategy.property.test.ts to avoid
// jest.mock hoisting pitfalls).

jest.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: { __db: true },
}));

jest.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: jest.fn(() => ({ __emailCredential: true })) },
  reauthenticateWithCredential: jest.fn(async () => undefined),
  deleteUser: jest.fn(async () => undefined),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ __collection: true })),
  doc: jest.fn(() => ({ __doc: true })),
  getDoc: jest.fn(async () => ({ exists: () => false, data: () => undefined })),
  getDocs: jest.fn(async () => ({ empty: true, docs: [] })),
  query: jest.fn(() => ({ __query: true })),
  where: jest.fn(() => ({ __where: true })),
  writeBatch: jest.fn(() => ({ delete: jest.fn(), commit: jest.fn(async () => undefined) })),
}));

jest.mock('../../utils/usernameUtils', () => ({
  releaseUsername: jest.fn(async () => undefined),
}));

jest.mock('../photoService', () => ({
  photoService: { deleteProfilePhoto: jest.fn(async () => undefined) },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(async () => []),
  multiRemove: jest.fn(async () => undefined),
}));

jest.mock('../ssoService', () => {
  const actual = jest.requireActual('../ssoService');
  return {
    __esModule: true,
    SsoError: actual.SsoError,
    getAppleCredential: jest.fn(async () => ({ credential: {}, profile: {}, providerId: 'apple.com' })),
    getGoogleCredential: jest.fn(() => ({ credential: {}, profile: {}, providerId: 'google.com' })),
  };
});

// ── Imports resolved through the mocks above ─────────────────────────────────
import { reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { releaseUsername } from '../../utils/usernameUtils';
import { photoService } from '../photoService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reauthenticateAndDeleteAccount } from '../accountDeletionService';
import { auth as mockAuth } from '../firebase';

const mockedReauth = reauthenticateWithCredential as jest.MockedFunction<typeof reauthenticateWithCredential>;
const mockedDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>;
const mockedGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockedGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockedWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;
const mockedReleaseUsername = releaseUsername as jest.MockedFunction<typeof releaseUsername>;
const mockedDeletePhoto = photoService.deleteProfilePhoto as jest.MockedFunction<
  typeof photoService.deleteProfilePhoto
>;
const mockedGetAllKeys = AsyncStorage.getAllKeys as jest.MockedFunction<typeof AsyncStorage.getAllKeys>;
const mockedMultiRemove = AsyncStorage.multiRemove as jest.MockedFunction<typeof AsyncStorage.multiRemove>;

const UID = 'uid-under-test';

// Cleanup markers that, when present in a run, must precede the final deleteUser.
const CLEANUP_MARKERS = ['batchCommit', 'releaseUsername', 'deleteProfilePhoto', 'clearLocalStorage'];

interface Scenario {
  hasUsername: boolean; // getDoc returns a reserved username → releaseUsername runs
  queriesReturnDocs: boolean; // getDocs returns docs → owned/friend/invite batches commit
  hasStorageKeys: boolean; // AsyncStorage has user-scoped keys → multiRemove runs
}

const scenarioArb: fc.Arbitrary<Scenario> = fc.record({
  hasUsername: fc.boolean(),
  queriesReturnDocs: fc.boolean(),
  hasStorageKeys: fc.boolean(),
});

describe('accountDeletionService — Property 8: deleteUser runs only after all data cleanup', () => {
  it('always deletes the Firebase Auth user last, after every cleanup step', async () => {
    await fc.assert(
      fc.asyncProperty(scenarioArb, async (scenario) => {
        // Shared ordering log for this iteration — every boundary appends here in
        // call order, so the trace mirrors the real deletion sequence.
        const log: string[] = [];

        // Reset + install per-scenario implementations.
        mockedReauth.mockReset();
        mockedDeleteUser.mockReset();
        mockedGetDoc.mockReset();
        mockedGetDocs.mockReset();
        mockedWriteBatch.mockReset();
        mockedReleaseUsername.mockReset();
        mockedDeletePhoto.mockReset();
        mockedGetAllKeys.mockReset();
        mockedMultiRemove.mockReset();

        mockedReauth.mockImplementation(async () => {
          log.push('reauth');
          return undefined as never;
        });
        mockedDeleteUser.mockImplementation(async () => {
          log.push('deleteUser');
          return undefined as never;
        });
        mockedGetDoc.mockImplementation(
          async () =>
            (scenario.hasUsername
              ? { exists: () => true, data: () => ({ username: 'reserved-name' }) }
              : { exists: () => false, data: () => undefined }) as never,
        );
        mockedGetDocs.mockImplementation(
          async () =>
            (scenario.queriesReturnDocs
              ? { empty: false, docs: [{ ref: { __ref: true } }] }
              : { empty: true, docs: [] }) as never,
        );
        // Each batch commit records a marker; delete is a no-op.
        mockedWriteBatch.mockImplementation(
          () =>
            ({
              delete: jest.fn(),
              commit: jest.fn(async () => {
                log.push('batchCommit');
              }),
            }) as never,
        );
        mockedReleaseUsername.mockImplementation(async () => {
          log.push('releaseUsername');
        });
        mockedDeletePhoto.mockImplementation(async () => {
          log.push('deleteProfilePhoto');
        });
        mockedGetAllKeys.mockImplementation(
          async () => (scenario.hasStorageKeys ? [`${UID}:cache`, '@goalstreak_prefs'] : []) as never,
        );
        mockedMultiRemove.mockImplementation(async () => {
          log.push('clearLocalStorage');
        });

        // Current user with the email/password primary provider so the run
        // proceeds past re-authentication into the cleanup sequence.
        (mockAuth as unknown as { currentUser: unknown }).currentUser = {
          uid: UID,
          email: 'user@example.com',
          providerData: [{ providerId: 'password' }],
        };

        await reauthenticateAndDeleteAccount('secret-password');

        const deleteUserIndex = log.indexOf('deleteUser');
        const deleteUserCount = log.filter((m) => m === 'deleteUser').length;

        // deleteUser happened exactly once and is the final operation.
        expect(deleteUserCount).toBe(1);
        expect(deleteUserIndex).toBe(log.length - 1);

        // Every other logged operation (re-auth + all cleanup) precedes it.
        for (let i = 0; i < log.length - 1; i++) {
          expect(log[i]).not.toBe('deleteUser');
        }

        // Steps that always run must appear before deleteUser: re-auth, at least
        // one batch commit (per-user docs are always committed), and the photo
        // deletion.
        for (const marker of ['reauth', 'batchCommit', 'deleteProfilePhoto']) {
          const idx = log.indexOf(marker);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(deleteUserIndex);
        }

        // Conditional steps, when triggered by the scenario, also precede it.
        if (scenario.hasUsername) {
          const idx = log.indexOf('releaseUsername');
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(deleteUserIndex);
        }
        if (scenario.hasStorageKeys) {
          const idx = log.indexOf('clearLocalStorage');
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(deleteUserIndex);
        }

        // Sanity: no cleanup marker ever appears after deleteUser.
        for (const marker of CLEANUP_MARKERS) {
          const last = log.lastIndexOf(marker);
          if (last >= 0) {
            expect(last).toBeLessThan(deleteUserIndex);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

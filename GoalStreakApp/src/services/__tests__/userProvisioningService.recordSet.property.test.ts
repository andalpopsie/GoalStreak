// Feature: sso-authentication, Property 3: A provisioned new user has a complete, well-formed record set
//
// Property-based test for userProvisioningService.provisionNewUser.
//
// Library: fast-check + Jest (jest-expo). Minimum 100 iterations, one property
// per file. All external boundaries are mocked so no real Firestore/network is
// hit (mirrors userProvisioningService.collisionRetry.property.test.ts):
//   - 'firebase/firestore': doc/getDoc/setDoc/serverTimestamp are jest.fns.
//     getDoc reports the user does NOT exist (treated as new); setDoc captures
//     the written data; serverTimestamp returns a fixed sentinel value.
//   - '../../utils/usernameUtils': generateUsername returns a deterministic
//     available candidate, isUsernameAvailable → true, reserveUsername → jest.fn.
//   - '../friendService': createUserProfile → jest.fn.
//   - '../firebase': db handle placeholder.
//
// Property 3 (design.md): For any new user and any provider profile, after
// provisionNewUser succeeds the users/{uid} document contains a non-empty
// username, hasCompletedOnboarding === false, createdAt, updatedAt,
// eulaAcceptedAt (server timestamp), and eulaVersion === EULA_Version; the same
// username is reserved in usernames; a userProfiles/{uid} document is created;
// the persisted displayName equals the provider display name when supplied and
// the generated username otherwise; and profilePicture is set iff the provider
// supplied a photo URL.
//
// Validates: Requirements 2.6, 5.4, 5.6, 5.7, 5.8, 5.9, 5.10

import fc from 'fast-check';
import type { User } from 'firebase/auth';
import { getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { provisionNewUser } from '../userProvisioningService';
import { generateUsername, isUsernameAvailable, reserveUsername } from '../../utils/usernameUtils';
import friendService from '../friendService';

// A stable sentinel returned by serverTimestamp so we can assert eulaAcceptedAt
// is exactly the server-timestamp marker (R2.6).
const SERVER_TIMESTAMP_SENTINEL = { __serverTimestamp: true } as const;

// Firestore boundary: the global setup mock omits setDoc, so override the
// module locally with exactly the calls provisionNewUser uses.
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
}));

// db handle placeholder — no real Firestore instance required.
jest.mock('../firebase', () => ({ db: {} }));

// Control username generation / availability / reservation entirely.
jest.mock('../../utils/usernameUtils', () => ({
  generateUsername: jest.fn(),
  isUsernameAvailable: jest.fn(),
  reserveUsername: jest.fn(),
}));

// createUserProfile is a downstream write we neutralize.
jest.mock('../friendService', () => ({
  __esModule: true,
  default: { createUserProfile: jest.fn() },
}));

const mockedGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockedSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockedServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;
const mockedGenerateUsername = generateUsername as jest.MockedFunction<typeof generateUsername>;
const mockedIsUsernameAvailable = isUsernameAvailable as jest.MockedFunction<typeof isUsernameAvailable>;
const mockedReserveUsername = reserveUsername as jest.MockedFunction<typeof reserveUsername>;
const mockedCreateUserProfile = friendService.createUserProfile as jest.MockedFunction<
  typeof friendService.createUserProfile
>;

// Deterministic generated username; always available on the first attempt.
const GENERATED_USERNAME = 'generated_user_123';

// Optional-string arbitrary: a present non-empty string or undefined.
const optionalStringArb = fc.option(
  fc.string({ minLength: 1, maxLength: 40 }),
  { nil: undefined },
);

describe('userProvisioningService.provisionNewUser — Property 3: complete, well-formed record set', () => {
  it('writes a complete users/{uid} record, reserves the username, and creates the profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        optionalStringArb, // provider displayName (present | undefined)
        optionalStringArb, // provider photoURL (present | undefined)
        optionalStringArb, // provider email (present | undefined)
        fc.string({ minLength: 1, maxLength: 10 }), // eulaVersion
        async (displayName, photoURL, email, eulaVersion) => {
          // Fresh mock state per iteration so captured calls reflect only this run.
          mockedGetDoc.mockReset();
          mockedSetDoc.mockReset();
          mockedServerTimestamp.mockReset();
          mockedGenerateUsername.mockReset();
          mockedIsUsernameAvailable.mockReset();
          mockedReserveUsername.mockReset();
          mockedCreateUserProfile.mockReset();

          // User does not yet exist → treated as new, so provisioning proceeds.
          mockedGetDoc.mockResolvedValue({
            exists: () => false,
          } as unknown as Awaited<ReturnType<typeof getDoc>>);
          mockedSetDoc.mockResolvedValue(undefined as never);
          mockedServerTimestamp.mockReturnValue(SERVER_TIMESTAMP_SENTINEL as never);
          mockedGenerateUsername.mockReturnValue(GENERATED_USERNAME);
          mockedIsUsernameAvailable.mockResolvedValue(true);
          mockedReserveUsername.mockResolvedValue(undefined);
          mockedCreateUserProfile.mockResolvedValue(undefined as never);

          const firebaseUser = {
            uid: 'uid-under-test',
            email: email ?? null,
            displayName: null,
            photoURL: null,
          } as unknown as User;

          const result = await provisionNewUser({
            firebaseUser,
            displayName,
            photoURL,
            eulaVersion,
          });

          // Provisioning reported a fresh creation with a non-empty username.
          expect(result.created).toBe(true);
          expect(result.username).toBe(GENERATED_USERNAME);
          expect(result.username.length).toBeGreaterThan(0);

          // The same username is reserved in the usernames collection (R5.6).
          expect(mockedReserveUsername).toHaveBeenCalledTimes(1);
          expect(mockedReserveUsername).toHaveBeenCalledWith(
            GENERATED_USERNAME,
            firebaseUser.uid,
          );

          // A userProfiles/{uid} document is created via the friend service (R5.7).
          expect(mockedCreateUserProfile).toHaveBeenCalledTimes(1);

          // The users/{uid} document payload is the 2nd arg of setDoc.
          expect(mockedSetDoc).toHaveBeenCalledTimes(1);
          const writtenData = mockedSetDoc.mock.calls[0][1] as Record<string, unknown>;

          // Non-empty username persisted (R5.4, R5.6).
          expect(writtenData.username).toBe(GENERATED_USERNAME);
          expect(typeof writtenData.username).toBe('string');
          expect((writtenData.username as string).length).toBeGreaterThan(0);

          // Onboarding flag always false at creation (R5.4).
          expect(writtenData.hasCompletedOnboarding).toBe(false);

          // createdAt / updatedAt present (R5.4).
          expect(writtenData.createdAt).toBeDefined();
          expect(writtenData.updatedAt).toBeDefined();

          // eulaAcceptedAt is the server-timestamp sentinel, eulaVersion matches (R2.6).
          expect(writtenData.eulaAcceptedAt).toBe(SERVER_TIMESTAMP_SENTINEL);
          expect(writtenData.eulaVersion).toBe(eulaVersion);

          // displayName == provided value when supplied, else the generated username
          // (R5.8, R5.9).
          const expectedDisplayName = displayName || GENERATED_USERNAME;
          expect(writtenData.displayName).toBe(expectedDisplayName);

          // profilePicture set iff a provider photo URL was supplied (R5.10).
          if (photoURL) {
            expect(writtenData.profilePicture).toBe(photoURL);
          } else {
            expect('profilePicture' in writtenData).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

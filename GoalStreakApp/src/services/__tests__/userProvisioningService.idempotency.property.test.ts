// Feature: sso-authentication, Property 5: Provisioning is idempotent and retry-safe
//
// Property-based test for userProvisioningService.provisionNewUser.
//
// Library: fast-check + Jest (jest-expo). Minimum 100 iterations, one property
// per file. All external boundaries are mocked so no real Firestore/network is
// hit (mirrors userProvisioningService.collisionRetry.property.test.ts):
//   - 'firebase/firestore' (doc, getDoc, setDoc, serverTimestamp) is overridden
//     locally so getDoc's exists() can be driven per-call.
//   - '../../utils/usernameUtils' generateUsername / isUsernameAvailable /
//     reserveUsername are mocked so a fresh username is always available.
//   - '../friendService' createUserProfile is a no-op.
//   - '../firebase' db handle is a placeholder.
//
// Property 5 (design.md): For any uid, running provisionNewUser more than once —
// or re-running it after a prior attempt failed partway — converges to a single
// complete, valid record set with no duplicate users, usernames, or profiles,
// and a run against an already-provisioned user makes no additional writes and
// reports created === false.
//
// Validates: Requirements 5.11, 5.12

import fc from 'fast-check';
import type { User } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';

import { provisionNewUser } from '../userProvisioningService';
import { generateUsername, isUsernameAvailable, reserveUsername } from '../../utils/usernameUtils';
import friendService from '../friendService';

// Firestore boundary: the global setup mock omits setDoc, so override the
// module locally with exactly the calls provisionNewUser uses.
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
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
const mockedGenerateUsername = generateUsername as jest.MockedFunction<typeof generateUsername>;
const mockedIsUsernameAvailable = isUsernameAvailable as jest.MockedFunction<
  typeof isUsernameAvailable
>;
const mockedReserveUsername = reserveUsername as jest.MockedFunction<typeof reserveUsername>;
const mockedCreateUserProfile = friendService.createUserProfile as jest.MockedFunction<
  typeof friendService.createUserProfile
>;

// A Firestore snapshot stub whose exists()/data() we control per call.
function snapshot(exists: boolean, username?: string) {
  return {
    exists: () => exists,
    data: () => (exists ? { username } : undefined),
  } as unknown as Awaited<ReturnType<typeof getDoc>>;
}

// Inputs: an arbitrary uid, and an optional display name / photo URL to exercise
// the fallback branches while keeping the idempotency behavior invariant.
const inputArb = fc.record({
  uid: fc.string({ minLength: 1, maxLength: 24 }).map((s) => `uid-${s}`),
  email: fc.emailAddress(),
  displayName: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  photoURL: fc.option(fc.webUrl(), { nil: undefined }),
});

describe('userProvisioningService.provisionNewUser — Property 5: idempotent and retry-safe', () => {
  it('an already-provisioned user is a no-op: created === false, no writes', async () => {
    await fc.assert(
      fc.asyncProperty(
        inputArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        async (u, existingUsername) => {
          mockedGetDoc.mockReset();
          mockedSetDoc.mockReset();
          mockedGenerateUsername.mockReset();
          mockedIsUsernameAvailable.mockReset();
          mockedReserveUsername.mockReset();
          mockedCreateUserProfile.mockReset();

          // User already exists → provisioning must write nothing.
          mockedGetDoc.mockResolvedValue(snapshot(true, existingUsername));

          const firebaseUser = {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName ?? null,
          } as unknown as User;

          const result = await provisionNewUser({
            firebaseUser,
            displayName: u.displayName,
            photoURL: u.photoURL,
            eulaVersion: '1.0',
          });

          // Reports the existing user, no creation.
          expect(result.created).toBe(false);
          expect(result.username).toBe(existingUsername);

          // No additional writes of any kind (R5.12).
          expect(mockedSetDoc).not.toHaveBeenCalled();
          expect(mockedReserveUsername).not.toHaveBeenCalled();
          expect(mockedCreateUserProfile).not.toHaveBeenCalled();
          expect(mockedGenerateUsername).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('new user then re-run converges to a single record set: setDoc once, reserve once, second run created === false', async () => {
    await fc.assert(
      fc.asyncProperty(inputArb, async (u) => {
        mockedGetDoc.mockReset();
        mockedSetDoc.mockReset();
        mockedGenerateUsername.mockReset();
        mockedIsUsernameAvailable.mockReset();
        mockedReserveUsername.mockReset();
        mockedCreateUserProfile.mockReset();

        // First call: user does not exist yet (new). Every getDoc call after the
        // first reports the user exists — models the record persisted by run #1
        // being visible to run #2 (and any partial-failure re-run).
        const generatedUsername = 'generated-name';
        mockedGetDoc
          .mockResolvedValueOnce(snapshot(false))
          .mockResolvedValue(snapshot(true, generatedUsername));
        mockedSetDoc.mockResolvedValue(undefined as never);
        mockedReserveUsername.mockResolvedValue(undefined);
        mockedCreateUserProfile.mockResolvedValue(undefined as never);
        mockedGenerateUsername.mockReturnValue(generatedUsername);
        // Fresh username always available on the first attempt.
        mockedIsUsernameAvailable.mockResolvedValue(true);

        const firebaseUser = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName ?? null,
        } as unknown as User;
        const input = {
          firebaseUser,
          displayName: u.displayName,
          photoURL: u.photoURL,
          eulaVersion: '1.0',
        };

        // Run #1 provisions the full record set.
        const first = await provisionNewUser(input);
        expect(first.created).toBe(true);
        expect(first.username).toBe(generatedUsername);

        // Run #2 sees the persisted user → no-op.
        const second = await provisionNewUser(input);
        expect(second.created).toBe(false);
        expect(second.username).toBe(generatedUsername);

        // Net effect across both runs is a SINGLE record set: no duplicates.
        expect(mockedSetDoc).toHaveBeenCalledTimes(1);
        expect(mockedReserveUsername).toHaveBeenCalledTimes(1);
        expect(mockedReserveUsername).toHaveBeenCalledWith(generatedUsername, u.uid);
        expect(mockedCreateUserProfile).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: sso-authentication, Property 4: Username collision retry is bounded and correct
//
// Property-based test for userProvisioningService.provisionNewUser.
//
// Library: fast-check + Jest (jest-expo). Minimum 100 iterations, one property
// per file. All external boundaries are mocked so no real Firestore/network is
// hit:
//   - 'firebase/firestore' is globally mocked in src/__tests__/setup.ts; here we
//     drive getDoc to report the user does NOT exist (treated as new) and let
//     setDoc / serverTimestamp / doc be inert jest.fns.
//   - '../../utils/usernameUtils' generateUsername / isUsernameAvailable /
//     reserveUsername are mocked so the availability sequence is fully
//     controlled per iteration.
//   - '../friendService' createUserProfile is a no-op.
//   - '../firebase' db handle is a placeholder.
//
// Property 4 (design.md): For any sequence of username-availability outcomes, if
// at least one generated username is available within 5 attempts then
// provisioning reserves an available username using no more than 5 attempts; if
// all 5 attempts collide then provisioning fails and reserves no username.
//
// Validates: Requirements 5.5

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

const MAX_ATTEMPTS = 5;

// Minimal authenticated user; provisionNewUser reads uid/email/displayName.
const fakeFirebaseUser = {
  uid: 'uid-1',
  email: 'user@example.com',
  displayName: 'Test User',
} as unknown as User;

// The availability sequence: attempt i sees outcome[i] (true === available).
// Length 0..10 exercises both "available within 5", "available exactly at the
// 5th attempt", and "never available" (all 5 collide) regimes.
const availabilitySequenceArb: fc.Arbitrary<boolean[]> = fc.array(fc.boolean(), {
  minLength: 0,
  maxLength: 10,
});

describe('userProvisioningService.provisionNewUser — Property 4: bounded, correct username collision retry', () => {
  it('reserves an available username within 5 attempts, or fails without reserving when all 5 collide', async () => {
    await fc.assert(
      fc.asyncProperty(availabilitySequenceArb, async (sequence) => {
        // Fresh mock state per iteration so call counts reflect only this run.
        mockedGetDoc.mockReset();
        mockedSetDoc.mockReset();
        mockedGenerateUsername.mockReset();
        mockedIsUsernameAvailable.mockReset();
        mockedReserveUsername.mockReset();
        mockedCreateUserProfile.mockReset();

        // User does not yet exist → treated as new, so the retry loop runs.
        mockedGetDoc.mockResolvedValue({
          exists: () => false,
        } as unknown as Awaited<ReturnType<typeof getDoc>>);
        mockedSetDoc.mockResolvedValue(undefined as never);
        mockedReserveUsername.mockResolvedValue(undefined);
        mockedCreateUserProfile.mockResolvedValue(undefined as never);

        // Each generateUsername call yields a distinct candidate; the i-th
        // candidate ("cand{i}") is paired with the i-th availability outcome.
        let genIndex = 0;
        mockedGenerateUsername.mockImplementation(() => `cand${genIndex++}`);

        let availIndex = 0;
        mockedIsUsernameAvailable.mockImplementation(async () => {
          const outcome = sequence[availIndex] ?? false;
          availIndex += 1;
          return outcome;
        });

        // Expected: first available attempt within the first 5 (or -1 if none).
        let firstAvailable = -1;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          if (sequence[i] === true) {
            firstAvailable = i;
            break;
          }
        }

        const input = {
          firebaseUser: fakeFirebaseUser,
          eulaVersion: '1.0',
        };

        if (firstAvailable !== -1) {
          // An available username exists within 5 attempts.
          const result = await provisionNewUser(input);

          // Reserved the first available candidate, exactly once.
          expect(result.created).toBe(true);
          expect(result.username).toBe(`cand${firstAvailable}`);
          expect(mockedReserveUsername).toHaveBeenCalledTimes(1);
          expect(mockedReserveUsername).toHaveBeenCalledWith(
            `cand${firstAvailable}`,
            fakeFirebaseUser.uid
          );

          // Availability checked no more than 5 times, stopping at first hit.
          expect(mockedIsUsernameAvailable).toHaveBeenCalledTimes(firstAvailable + 1);
          expect(mockedIsUsernameAvailable.mock.calls.length).toBeLessThanOrEqual(MAX_ATTEMPTS);
        } else {
          // All 5 attempts collide → provisioning fails, nothing reserved.
          await expect(provisionNewUser(input)).rejects.toThrow();
          expect(mockedReserveUsername).not.toHaveBeenCalled();
          expect(mockedIsUsernameAvailable).toHaveBeenCalledTimes(MAX_ATTEMPTS);
        }
      }),
      { numRuns: 100 }
    );
  });
});

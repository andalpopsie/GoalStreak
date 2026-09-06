// Feature: sso-authentication, Property 6: New-user detection follows a fixed precedence
//
// Property-based test for userProvisioningService.isNewUser.
//
// Library: fast-check + Jest (jest-expo). Minimum 100 iterations, one property
// per file. External boundaries (Firestore) are mocked so no real Firestore is
// hit: `getDoc` is stubbed to return { exists: () => <docExists> } and the
// `./firebase` module (db handle) is mocked to a placeholder.
//
// Property 6 (design.md): For any combination of a getAdditionalUserInfo
// new-user flag (true, false, or unavailable/undefined/null) and a users/{uid}
// document existence state, isNewUser returns the flag when it is defined, and
// otherwise returns the negation of document existence.
//
// Validates: Requirements 5.2, 5.3

import fc from 'fast-check';
import type { User } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

import { isNewUser } from '../userProvisioningService';

// Mock the db handle so no real Firestore instance is required.
jest.mock('../firebase', () => ({
  db: {},
}));

const mockedGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

// A minimal fake authenticated user; only `uid` is read by isNewUser.
const fakeFirebaseUser = { uid: 'test' } as unknown as User;

// The new-user flag can be true, false, or unavailable (undefined / null).
const flagArb: fc.Arbitrary<boolean | undefined | null> = fc.constantFrom(
  true,
  false,
  undefined,
  null
);

const docExistsArb: fc.Arbitrary<boolean> = fc.boolean();

describe('userProvisioningService.isNewUser — Property 6: new-user detection follows a fixed precedence', () => {
  beforeEach(() => {
    mockedGetDoc.mockReset();
  });

  it('returns the flag when defined, otherwise the negation of document existence', async () => {
    await fc.assert(
      fc.asyncProperty(flagArb, docExistsArb, async (flag, docExists) => {
        // Reset per iteration so call-count assertions reflect only this run
        // (fast-check runs many iterations within a single test body).
        mockedGetDoc.mockReset();
        // Stub the Firestore document-existence check for this iteration.
        mockedGetDoc.mockResolvedValue({
          exists: () => docExists,
        } as unknown as Awaited<ReturnType<typeof getDoc>>);

        const result = await isNewUser(fakeFirebaseUser, flag);

        if (flag === true || flag === false) {
          // Flag is defined → it takes precedence and is returned verbatim.
          expect(result).toBe(flag);
          // The document-existence fallback must not be consulted.
          expect(mockedGetDoc).not.toHaveBeenCalled();
        } else {
          // Flag unavailable (undefined/null) → fall back to !docExists.
          expect(result).toBe(!docExists);
          expect(mockedGetDoc).toHaveBeenCalledTimes(1);
        }
      }),
      { numRuns: 100 }
    );
  });
});

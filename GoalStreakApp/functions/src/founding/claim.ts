/**
 * claim.ts — Atomic Firestore transaction for founding slot claims.
 *
 * Runs a single transaction over `counters/foundingMembers` (the Founding_Counter)
 * and `userProfiles/{uid}` to atomically read the current claimed count, assign
 * the next founding number, increment the counter, and write the FoundingRecord.
 *
 * Key properties enforced here:
 * - Property 1: Cap is never exceeded (R3.5, R3.6, R15.2)
 * - Property 2: Numbers are unique and contiguous (R3.2, R3.3)
 * - Property 3: Counter is monotonic non-decreasing (R3.6, R13.1)
 * - Property 5: A number, once assigned, is permanent (R6.7)
 *
 * Requirements covered: R3.1–R3.7, R6.1–R6.7, R13.1
 */

import { Firestore, FieldValue } from 'firebase-admin/firestore';
import {
  COUNTER_COLLECTION,
  COUNTER_DOC_ID,
  USER_PROFILES_COLLECTION,
} from '../config';
import { assignNumberFrom } from './eligibility';

/** Maximum total attempts (1 initial + up to 4 retries on contention). R3.7 */
const MAX_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Atomically claims a founding slot for the given uid.
 *
 * Returns:
 * - `{ number }` — slot successfully claimed (or already claimed for this uid)
 * - `{ soldOut: true }` — all 100 slots are taken (R3.5)
 * - `{ failed: true }` — transaction failed after retries (R3.7)
 *
 * Idempotent: if a `foundingRecord` already exists for this uid the existing
 * number is returned and no second slot is consumed (R3.3).
 *
 * @param db  - Admin Firestore instance
 * @param uid - Firebase Auth UID of the signing-up user
 * @param cap - Founding_Cap (should be FOUNDING_CAP = 100)
 */
export async function claimFoundingSlot(
  db: Firestore,
  uid: string,
  cap: number,
): Promise<{ number: number } | { soldOut: true } | { failed: true }> {
  const counterRef = db
    .collection(COUNTER_COLLECTION)
    .doc(COUNTER_DOC_ID);
  const profileRef = db
    .collection(USER_PROFILES_COLLECTION)
    .doc(uid);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const result = await db.runTransaction(
        async (
          tx,
        ): Promise<{ number: number } | { soldOut: true }> => {
          // ------------------------------------------------------------------
          // 1. Idempotency guard — if this uid already has a founding record,
          //    return the existing number without touching the counter. (R3.3)
          // ------------------------------------------------------------------
          const profileSnap = await tx.get(profileRef);
          if (profileSnap.exists) {
            const data = profileSnap.data();
            const existingNumber = data?.foundingRecord?.number;
            if (typeof existingNumber === 'number' && existingNumber > 0) {
              return { number: existingNumber };
            }
          }

          // ------------------------------------------------------------------
          // 2. Read the current counter value. (R3.1)
          // ------------------------------------------------------------------
          const counterSnap = await tx.get(counterRef);
          const claimed: number = counterSnap.exists
            ? (counterSnap.data()?.claimed ?? 0)
            : 0;

          // ------------------------------------------------------------------
          // 3. Sold-out check. (R3.5, R1.5, R15.2)
          // ------------------------------------------------------------------
          if (claimed >= cap) {
            return { soldOut: true };
          }

          // ------------------------------------------------------------------
          // 4. Assign the next number in claim order. (R3.2)
          //    assignNumberFrom(claimed) === claimed + 1
          // ------------------------------------------------------------------
          const number = assignNumberFrom(claimed);

          // ------------------------------------------------------------------
          // 5. Atomic writes — counter increment + FoundingRecord.
          //    Both writes are inside the same transaction so they succeed or
          //    fail together. (R3.1, R6.1–R6.4)
          //
          //    Counter is ONLY ever incremented (+1) and never decremented —
          //    not on deletion, not on grant failure. (R3.6, R13.1)
          // ------------------------------------------------------------------
          tx.set(counterRef, { claimed: number }, { merge: true });

          tx.set(
            profileRef,
            {
              foundingMember: true,          // boolean flag (R6.2)
              foundingNumber: number,         // flat field for fast reads (R6.1)
              foundingRecord: {
                number,                       // permanent, 1..100 (R3.2, R7.5)
                grantedAt: FieldValue.serverTimestamp(), // R6.3
                proExpiresAt: null,           // set later on successful grant (R4.3)
                proGrantStatus: 'pending' as const,      // R5.3
                lastAttemptAt: null,
              },
            },
            { merge: true },
          );

          return { number };
        },
      );

      // Transaction resolved cleanly — return whatever it produced.
      return result;
    } catch (err: unknown) {
      const isLastAttempt = attempt === MAX_ATTEMPTS - 1;

      if (isLastAttempt) {
        // All retries exhausted — return failure. R3.7
        console.error(
          `claimFoundingSlot: transaction failed after ${MAX_ATTEMPTS} attempts for uid=${uid}`,
          err,
        );
        return { failed: true };
      }

      // Retry on contention (ABORTED) or other transient errors.
      // Non-retryable errors (PERMISSION_DENIED, INVALID_ARGUMENT, etc.) will
      // also be retried here — after MAX_ATTEMPTS they become { failed: true }
      // rather than propagating, preserving the clean return-type contract.
      const code = (err as { code?: string })?.code ?? '';
      const message =
        err instanceof Error ? err.message : String(err);

      console.warn(
        `claimFoundingSlot: attempt ${attempt + 1}/${MAX_ATTEMPTS} failed ` +
          `(code=${code}, uid=${uid}): ${message}. Retrying...`,
      );
      // Brief pause before retrying — the Admin SDK also retries contention
      // internally, but we add an outer loop to handle cases where the SDK
      // exhausts its own retries before ours.
      await sleep(50 * Math.pow(2, attempt)); // 50ms, 100ms, 200ms, 400ms
    }
  }

  // Unreachable — the loop always returns inside MAX_ATTEMPTS iterations.
  return { failed: true };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Resolves after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

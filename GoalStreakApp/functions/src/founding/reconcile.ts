/**
 * reconcile.ts — Scheduled reconciler for pending Pro grants.
 *
 * Runs every 6 hours (≤ 24h interval, R5.4). Queries all `userProfiles`
 * documents where `foundingRecord.proGrantStatus == 'pending'`, re-requests
 * the RevenueCat promotional entitlement for each, and transitions successful
 * grants to `'granted'`. Failed re-requests stay `'pending'` and are retried
 * on the next run.
 *
 * Design invariants:
 * - Never reads or writes `counters/foundingMembers` — the counter is
 *   monotonically non-decreasing and only touched by `claimFoundingSlot`. (R3.6, R13.1)
 * - Never releases or reassigns a Founding_Number. (R5.6)
 * - Never removes an existing `foundingRecord` or `foundingMember` flag.
 *
 * Requirements covered: R5.4, R5.5, R5.6
 */

import * as functions from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { PRO_ENTITLEMENT_ID, USER_PROFILES_COLLECTION } from '../config';
import { grantProEntitlement } from './revenuecat';

// ---------------------------------------------------------------------------
// Admin SDK initialisation — safe to call multiple times (idempotent).
// ---------------------------------------------------------------------------
if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// reconcilePendingGrants — scheduled Cloud Function (R5.4)
// ---------------------------------------------------------------------------

export const reconcilePendingGrants = functions
  .runWith({ secrets: ['REVENUECAT_SECRET_KEY'] })
  .pubsub.schedule('every 6 hours') // interval MUST NOT exceed 24 h (R5.4)
  .onRun(async () => {
    try {
      await reconcileHandler();
    } catch (err) {
      console.error('reconcilePendingGrants: unhandled top-level error', err);
    }
  });

// ---------------------------------------------------------------------------
// Core reconciliation handler — exported for testability (R5.4)
// ---------------------------------------------------------------------------

export async function reconcileHandler(): Promise<void> {
  const db = getFirestore();
  const secretKey = process.env.REVENUECAT_SECRET_KEY;

  if (!secretKey) {
    // Secret absent at runtime — log and bail; grants will retry next run.
    console.error(
      'reconcilePendingGrants: REVENUECAT_SECRET_KEY not available — ' +
        'skipping this run.',
    );
    return;
  }

  // -------------------------------------------------------------------------
  // Query for all profiles with a pending Pro grant. (R5.4)
  // -------------------------------------------------------------------------
  let pendingDocs: FirebaseFirestore.QuerySnapshot;
  try {
    pendingDocs = await db
      .collection(USER_PROFILES_COLLECTION)
      .where('foundingRecord.proGrantStatus', '==', 'pending')
      .get();
  } catch (err) {
    console.error(
      'reconcilePendingGrants: failed to query pending grants — will retry on next run.',
      err,
    );
    return;
  }

  if (pendingDocs.empty) {
    console.log('reconcilePendingGrants: no pending grants found.');
    return;
  }

  console.log(
    `reconcilePendingGrants: found ${pendingDocs.size} pending grant(s) — processing.`,
  );

  // -------------------------------------------------------------------------
  // Process each pending doc. Failures are isolated: one failing grant does
  // not prevent the others from being processed. (R5.5)
  // -------------------------------------------------------------------------
  const results = await Promise.allSettled(
    pendingDocs.docs.map((doc) => processPendingGrant(doc, secretKey)),
  );

  // Log a summary of the run.
  const granted = results.filter(
    (r) => r.status === 'fulfilled' && r.value === 'granted',
  ).length;
  const stillPending = results.filter(
    (r) => r.status === 'fulfilled' && r.value === 'still-pending',
  ).length;
  const errored = results.filter((r) => r.status === 'rejected').length;

  console.log(
    `reconcilePendingGrants: done — granted=${granted}, ` +
      `still-pending=${stillPending}, errored=${errored}`,
  );
}

// ---------------------------------------------------------------------------
// Per-document reconciliation logic
// ---------------------------------------------------------------------------

type GrantOutcome = 'granted' | 'still-pending';

/**
 * Attempts to grant the Pro entitlement for a single pending-grant profile.
 * On success: updates `proGrantStatus` to `'granted'` and sets `proExpiresAt`.
 * On failure: records `lastAttemptAt` only, leaving status `'pending'`. (R5.5)
 * Never touches `foundingMember`, `foundingNumber`, or the counter. (R5.6)
 */
async function processPendingGrant(
  doc: FirebaseFirestore.QueryDocumentSnapshot,
  secretKey: string,
): Promise<GrantOutcome> {
  const uid = doc.id;
  const profileRef = doc.ref;

  const grantResult = await grantProEntitlement(uid, secretKey, PRO_ENTITLEMENT_ID);

  if (grantResult.status === 'granted') {
    // Grant succeeded — transition to 'granted' and record proExpiresAt. (R5.4)
    await profileRef.set(
      {
        foundingRecord: {
          proGrantStatus: 'granted',
          proExpiresAt: Timestamp.fromDate(grantResult.proExpiresAt),
          lastAttemptAt: Timestamp.now(),
        },
      },
      { merge: true },
    );
    console.log(
      `reconcilePendingGrants: granted Pro for uid=${uid}, ` +
        `expires=${grantResult.proExpiresAt.toISOString()}`,
    );
    return 'granted';
  }

  // Grant still failing — record attempt time, leave status pending. (R5.5)
  await profileRef.set(
    { foundingRecord: { lastAttemptAt: Timestamp.now() } },
    { merge: true },
  );
  console.warn(
    `reconcilePendingGrants: Pro grant still pending for uid=${uid} — will retry next run.`,
  );
  return 'still-pending';
}

/**
 * onCreate.ts — The Founding_Function: Auth onCreate trigger.
 *
 * Evaluates founding eligibility, atomically claims a slot, and grants the
 * RevenueCat Pro entitlement for the first 100 accounts created at or after
 * the configured Launch_Timestamp (T0).
 *
 * Requirements covered: R1, R2, R3, R4, R5, R6, R13.1, R15
 *
 * Design principles:
 * - Server authority: all founding writes go through the Admin SDK only.
 * - Never throws: the outer try/catch ensures the function always resolves.
 * - Idempotent: claimFoundingSlot() returns the existing number if the uid
 *   already has a foundingRecord (no double-claim on re-invocation).
 */

import * as functions from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  FOUNDING_CAP,
  PRO_ENTITLEMENT_ID,
  CONFIG_COLLECTION,
  CONFIG_DOC_ID,
  COUNTER_COLLECTION,
  COUNTER_DOC_ID,
  USER_PROFILES_COLLECTION,
} from '../config';
import {
  parseLaunchTimestamp,
  evaluateEligibility,
} from './eligibility';
import { claimFoundingSlot } from './claim';
import { grantProEntitlement } from './revenuecat';

// ---------------------------------------------------------------------------
// Admin SDK initialisation — safe to call multiple times (idempotent). (R1.1)
// ---------------------------------------------------------------------------
if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Founding_Function — Auth onCreate trigger (R1.1, design §1)
// ---------------------------------------------------------------------------

export const onUserCreated = functions
  .runWith({ secrets: ['REVENUECAT_SECRET_KEY'] })
  .auth.user()
  .onCreate(async (user) => {
    // Wrap the entire body so the function never crashes the trigger. (R1.1)
    try {
      await handleUserCreated(user);
    } catch (err) {
      console.error('onUserCreated: unhandled error for uid=' + user.uid, err);
    }
  });

// ---------------------------------------------------------------------------
// Core handler — separated for readability and testability
// ---------------------------------------------------------------------------

/** @internal Exported for emulator integration tests only. */
export async function handleUserCreated(
  user: functions.auth.UserRecord,
): Promise<void> {
  const db = getFirestore();
  const uid = user.uid;
  const profileRef = db.collection(USER_PROFILES_COLLECTION).doc(uid);

  // -------------------------------------------------------------------------
  // Step 1: Read T0 from Firestore config. (R2.1)
  // -------------------------------------------------------------------------
  let launchTimestampUtcMs: number | null = null;
  try {
    const configSnap = await db
      .collection(CONFIG_COLLECTION)
      .doc(CONFIG_DOC_ID)
      .get();

    const rawTimestamp = configSnap.exists
      ? configSnap.data()?.launchTimestamp
      : undefined;

    launchTimestampUtcMs = parseLaunchTimestamp(rawTimestamp);
  } catch (err) {
    console.error(
      'onUserCreated: failed to read config/foundingMembers for uid=' + uid,
      err,
    );
    // Config unreadable → treat as config-invalid (falls through below).
    launchTimestampUtcMs = null;
  }

  // Config-invalid: record error, write non-founding marker, stop. (R2.2, R2.3)
  if (launchTimestampUtcMs === null) {
    console.error(
      'onUserCreated: config/foundingMembers.launchTimestamp is missing or ' +
        'invalid — treating all accounts as ineligible. uid=' + uid,
    );
    await writeNonFoundingMarker(profileRef);
    return;
  }

  // -------------------------------------------------------------------------
  // Step 2: Parse account creation time + read current counter for eligibility.
  // -------------------------------------------------------------------------
  const accountCreatedAtUtcMs = new Date(
    user.metadata.creationTime,
  ).getTime();

  // Optimistic counter read — used only for the eligibility pre-check.
  // The transaction inside claimFoundingSlot() re-reads it atomically. (R3.1)
  let claimed = 0;
  try {
    const counterSnap = await db
      .collection(COUNTER_COLLECTION)
      .doc(COUNTER_DOC_ID)
      .get();
    claimed = counterSnap.exists ? (counterSnap.data()?.claimed ?? 0) : 0;
  } catch (err) {
    // Counter unreadable → leave as non-founding, do not touch counter. (R1.6)
    console.error(
      'onUserCreated: failed to read counters/foundingMembers for uid=' + uid,
      err,
    );
    await writeNonFoundingMarker(profileRef);
    return;
  }

  // -------------------------------------------------------------------------
  // Step 3: Evaluate eligibility. (R1.3, R1.4, R2.4–R2.6, R3.5, R15.1)
  // -------------------------------------------------------------------------
  const outcome = evaluateEligibility({
    accountCreatedAtUtcMs,
    launchTimestampUtcMs,
    claimed,
    cap: FOUNDING_CAP,
  });

  // before-launch or sold-out → non-founding, stop. (R1.3, R1.5, R3.5)
  if (outcome.kind === 'before-launch' || outcome.kind === 'sold-out') {
    await writeNonFoundingMarker(profileRef);
    return;
  }

  // config-invalid already handled in step 1; guard here just in case.
  if (outcome.kind === 'config-invalid') {
    await writeNonFoundingMarker(profileRef);
    return;
  }

  // outcome.kind === 'eligible' — proceed to claim.

  // -------------------------------------------------------------------------
  // Step 4: Atomically claim a founding slot. (R3.1–R3.7, R6.1–R6.7)
  // -------------------------------------------------------------------------
  const claimResult = await claimFoundingSlot(db, uid, FOUNDING_CAP);

  if ('soldOut' in claimResult) {
    // All 100 slots taken (race between eligibility check and transaction). (R3.5)
    await writeNonFoundingMarker(profileRef);
    return;
  }

  if ('failed' in claimResult) {
    // Transaction failed after retries — slot was NOT claimed. Log and bail.
    console.error(
      'onUserCreated: claimFoundingSlot failed after retries for uid=' + uid,
    );
    // Do not write non-founding marker — we can't be certain of state.
    return;
  }

  const { number } = claimResult;

  // -------------------------------------------------------------------------
  // Step 5: Grant RevenueCat Pro entitlement. (R4.1–R4.3, R5.1–R5.3)
  // -------------------------------------------------------------------------
  const secretKey = process.env.REVENUECAT_SECRET_KEY;

  if (!secretKey) {
    // Secret absent at runtime — leave proGrantStatus as 'pending' (set by
    // claimFoundingSlot); reconciler will retry. Do not crash. (R5.3)
    console.warn(
      'onUserCreated: REVENUECAT_SECRET_KEY not available — ' +
        'Pro grant deferred to reconciler for uid=' + uid,
    );
    await profileRef.set(
      { foundingRecord: { lastAttemptAt: Timestamp.now() } },
      { merge: true },
    );
    return;
  }

  const grantResult = await grantProEntitlement(uid, secretKey, PRO_ENTITLEMENT_ID);

  // -------------------------------------------------------------------------
  // Step 6: Record the grant outcome on the FoundingRecord. (R4.3, R5.3)
  // -------------------------------------------------------------------------
  if (grantResult.status === 'granted') {
    // Pro grant succeeded — record proGrantStatus and proExpiresAt. (R4.3)
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
  } else {
    // Grant exhausted retries — record lastAttemptAt; reconciler handles it. (R5.3)
    console.warn(
      'onUserCreated: Pro grant pending for uid=' + uid +
        ' foundingNumber=' + number + '. Reconciler will retry.',
    );
    await profileRef.set(
      {
        foundingRecord: {
          lastAttemptAt: Timestamp.now(),
        },
      },
      { merge: true },
    );
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Writes the non-founding marker to `userProfiles/{uid}`.
 * Uses merge so it never overwrites unrelated profile fields. (R1.5, R3.5)
 */
async function writeNonFoundingMarker(
  profileRef: FirebaseFirestore.DocumentReference,
): Promise<void> {
  try {
    await profileRef.set(
      { foundingMember: false, foundingNumber: 0 },
      { merge: true },
    );
  } catch (err) {
    // Best-effort — failure here does not affect counter or founding numbers.
    console.error(
      'onUserCreated: failed to write non-founding marker for ' +
        profileRef.id,
      err,
    );
  }
}

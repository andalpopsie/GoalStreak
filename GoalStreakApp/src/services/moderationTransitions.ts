// ModerationTransitions - pure block/teardown/report transition helpers
//
// This module is intentionally PURE: no Firestore, no auth, no time/Date access,
// and no other I/O. It models the in-memory transformations that `friendService`
// performs when a user blocks/unblocks someone, tears down existing relationships,
// or constructs a report record. Keeping the logic here (separate from
// `moderationFilter.ts` and free of Firestore) lets `friendService` reuse it and
// lets property-based tests exercise it without a backend.
//
// These functions are a primary target of property-based testing (see the
// report-and-block design's Correctness Properties 6-10).

import { Report, ReportContentType, ReportReason } from '../types/social';

// ── Block-set representation ──
//
// The blocks dataset is represented as an array of directional records. Each
// record captures a single directional block: `blockerId` blocked
// `blockedUserId`. Two users are "in a block relationship" when a record exists
// in either direction between them.
export interface BlockRecord {
  blockerId: string;
  blockedUserId: string;
}

// ── 3.1 Block-set transitions ──

/**
 * Add a directional (blockerId -> blockedUserId) block record idempotently.
 *
 * If a record with the same `blockerId` and `blockedUserId` already exists, the
 * dataset is returned unchanged (no duplicate). The input array is never
 * mutated; a new array is always returned.
 *
 * Requirements: 1.5 (idempotent add), 3.3.
 */
export function block(set: BlockRecord[], blockerId: string, blockedUserId: string): BlockRecord[] {
  const alreadyBlocked = set.some(
    (record) => record.blockerId === blockerId && record.blockedUserId === blockedUserId
  );

  if (alreadyBlocked) {
    return [...set];
  }

  return [...set, { blockerId, blockedUserId }];
}

/**
 * Remove exactly the directional record where `blockerId === blockerId` AND
 * `blockedUserId === blockedUserId`. Records in the opposite direction, or
 * involving other users, are left untouched. The input array is never mutated.
 *
 * Requirements: 1.5, 3.3 (exact-record removal).
 */
export function unblock(
  set: BlockRecord[],
  blockerId: string,
  blockedUserId: string
): BlockRecord[] {
  return set.filter(
    (record) => !(record.blockerId === blockerId && record.blockedUserId === blockedUserId)
  );
}

// ── 3.2 Teardown-selection and Block_List helpers ──

/**
 * Select exactly the directional relationship records that link `userA` and
 * `userB` in EITHER direction. Used to tear down friendships and pending friend
 * requests when a block is applied.
 *
 * Because friendship records ({ userId, friendId }) and friend-request records
 * ({ fromUserId, toUserId }) use different field names, the caller supplies a
 * `getEndpoints` accessor that returns the two user ids a record links. This
 * keeps the helper pure and reusable across both record shapes:
 *
 *   selectTeardownRecords(friendships, A, B, (r) => [r.userId, r.friendId])
 *   selectTeardownRecords(requests, A, B, (r) => [r.fromUserId, r.toUserId])
 *
 * A record is selected when its endpoints are exactly {A, B} in either order.
 * No record involving a third party is ever selected. The input is not mutated.
 *
 * Requirements: 1.8 (friendship teardown), 1.9 (friend-request teardown).
 */
export function selectTeardownRecords<T>(
  records: T[],
  userA: string,
  userB: string,
  getEndpoints: (record: T) => readonly [string, string]
): T[] {
  return records.filter((record) => {
    const [from, to] = getEndpoints(record);
    return (from === userA && to === userB) || (from === userB && to === userA);
  });
}

/**
 * Return exactly the block records where `blockerId === userId` — the user's
 * outgoing blocks (their Block_List). Records where the user is only the blocked
 * party, or that belong to other blockers, are excluded. The input is not
 * mutated. Generic over any record carrying a `blockerId`, so it works with both
 * the lightweight `BlockRecord` and the full `Block` domain type.
 *
 * Requirements: 3.2.
 */
export function selectOutgoingBlocks<T extends { blockerId: string }>(
  blocks: T[],
  userId: string
): T[] {
  return blocks.filter((block) => block.blockerId === userId);
}

// ── 3.3 Report construction ──

export interface BuildReportInput {
  reporterId: string;
  reportedUserId: string;
  contentType: ReportContentType;
  contentId: string;
  reason: ReportReason;
}

/**
 * Build a report record (without the Firestore-assigned `id`) from the supplied
 * inputs. Sets `status` to 'pending' and a populated `timestamp`.
 *
 * The timestamp is passed in (rather than read from the clock) so this function
 * stays pure and deterministic/testable. `friendService` supplies a
 * `serverTimestamp()` when persisting; this helper never calls it.
 *
 * When `contentType === 'user'`, `contentId` is forced to equal
 * `reportedUserId`, guaranteeing the invariant regardless of the caller's input.
 *
 * Requirements: 4.5 (field mapping, status 'pending', timestamp), 4.9 (user
 * content id).
 */
export function buildReport(input: BuildReportInput, timestamp: Date): Omit<Report, 'id'> {
  const contentId = input.contentType === 'user' ? input.reportedUserId : input.contentId;

  return {
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    contentType: input.contentType,
    contentId,
    reason: input.reason,
    timestamp,
    status: 'pending',
  };
}

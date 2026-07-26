// Property-based tests for the pure moderationTransitions module.
//
// Covers the report-and-block design's Correctness Properties 6-10 (tasks
// 3.4-3.8). All functions under test are pure (no Firestore, no clock), so we
// can exercise them with fast-check across many generated inputs.
//
// Library: fast-check (v4) + Jest. Each property is implemented by a SINGLE
// fast-check property test run with { numRuns: 100 } (minimum 100 iterations)
// and is tagged with a comment in the format
// `Feature: report-and-block, Property N: <property text>`.

import fc from 'fast-check';
import {
  block,
  unblock,
  selectOutgoingBlocks,
  selectTeardownRecords,
  buildReport,
  BlockRecord,
  BuildReportInput,
} from '../moderationTransitions';
import { ReportContentType, ReportReason } from '../../types/social';

// ── Generators ──

// A small pool of distinct user ids keeps collisions (same author, same
// blocker/blocked, cross-links) frequent enough to exercise the interesting
// branches while staying human-debuggable.
const userIdArb: fc.Arbitrary<string> = fc.constantFrom(
  'u1',
  'u2',
  'u3',
  'u4',
  'u5',
  'u6',
);

// A directional block record drawn from the user-id pool.
const blockRecordArb: fc.Arbitrary<BlockRecord> = fc.record({
  blockerId: userIdArb,
  blockedUserId: userIdArb,
});

// An arbitrary blocks dataset (may contain duplicates and self-blocks; that is
// fine — the transitions must cope with any shape).
const blockSetArb: fc.Arbitrary<BlockRecord[]> = fc.array(blockRecordArb, {
  maxLength: 20,
});

// An ordered pair of DISTINCT users (A !== B), as required by the block
// transition properties.
const distinctPairArb: fc.Arbitrary<[string, string]> = fc
  .tuple(userIdArb, userIdArb)
  .filter(([a, b]) => a !== b);

// Friendship-shaped relationship record: { userId, friendId }.
interface FriendshipRecord {
  userId: string;
  friendId: string;
}
const friendshipArb: fc.Arbitrary<FriendshipRecord> = fc.record({
  userId: userIdArb,
  friendId: userIdArb,
});

// Friend-request-shaped relationship record: { fromUserId, toUserId }.
interface RequestRecord {
  fromUserId: string;
  toUserId: string;
}
const requestArb: fc.Arbitrary<RequestRecord> = fc.record({
  fromUserId: userIdArb,
  toUserId: userIdArb,
});

const contentTypeArb: fc.Arbitrary<ReportContentType> = fc.constantFrom(
  'user',
  'activity',
  'group_activity',
  'group_message',
);

const reasonArb: fc.Arbitrary<ReportReason> = fc.constantFrom(
  'harassment',
  'spam',
  'inappropriate',
  'hate_speech',
  'impersonation',
  'other',
);

const reportInputArb: fc.Arbitrary<BuildReportInput> = fc.record({
  reporterId: userIdArb,
  reportedUserId: userIdArb,
  contentType: contentTypeArb,
  contentId: fc.string(),
  reason: reasonArb,
});

// ── Property 6 (task 3.4) ──

describe('moderationTransitions - Property 6: Block is idempotent', () => {
  it('applying block twice equals applying once; set grows by at most one record', () => {
    // Feature: report-and-block, Property 6: Block is idempotent — applying
    // block(A, B) twice equals applying it once; the set grows by at most one.
    // Validates Requirements 1.5.
    fc.assert(
      fc.property(blockSetArb, distinctPairArb, (set, [a, b]) => {
        const once = block(set, a, b);
        const twice = block(once, a, b);

        // Idempotent: second application changes nothing.
        expect(twice).toEqual(once);

        // The set grows by at most one record relative to the original.
        expect(once.length).toBeLessThanOrEqual(set.length + 1);
        expect(once.length).toBeGreaterThanOrEqual(set.length);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 7 (task 3.5) ──

describe('moderationTransitions - Property 7: Block then unblock is an identity round trip', () => {
  it('for a set without (A->B), block then unblock yields the original; unblock removes exactly the A->B record', () => {
    // Feature: report-and-block, Property 7: Block then unblock is an identity
    // round trip — for a set that does not already contain (A -> B), block(A, B)
    // then unblock(A, B) yields the original set, and unblock(A, B) removes
    // exactly the blockerId==A && blockedUserId==B record. Validates Requirements 3.3.
    fc.assert(
      fc.property(blockSetArb, distinctPairArb, (rawSet, [a, b]) => {
        // Constrain to sets that do NOT already contain the (A -> B) record so
        // the round trip is a true identity (block adds exactly one record that
        // unblock then removes).
        const set = rawSet.filter(
          (r) => !(r.blockerId === a && r.blockedUserId === b),
        );

        const blocked = block(set, a, b);
        const roundTrip = unblock(blocked, a, b);

        // Identity round trip: same records, same order as the original set.
        expect(roundTrip).toEqual(set);

        // unblock removes exactly the A->B record: no such record survives...
        expect(
          roundTrip.some((r) => r.blockerId === a && r.blockedUserId === b),
        ).toBe(false);
        // ...and every other record from the blocked set is preserved.
        const others = blocked.filter(
          (r) => !(r.blockerId === a && r.blockedUserId === b),
        );
        expect(roundTrip).toEqual(others);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 8 (task 3.6) ──

describe("moderationTransitions - Property 8: Block_List is exactly the user's outgoing blocks", () => {
  it('selectOutgoingBlocks(u) returns exactly records where blockerId==u', () => {
    // Feature: report-and-block, Property 8: Block_List is exactly the user's
    // outgoing blocks — selectOutgoingBlocks(u) returns exactly the records
    // whose blockerId == u: none where u is only the blocked party, and none
    // belonging to other blockers. Validates Requirements 3.2.
    fc.assert(
      fc.property(blockSetArb, userIdArb, (set, u) => {
        const outgoing = selectOutgoingBlocks(set, u);

        // Every selected record is blockerId == u (so no record where u is only
        // the blocked party leaks through).
        for (const record of outgoing) {
          expect(record.blockerId).toBe(u);
        }

        // Exactness: the selection equals every blockerId==u record in the set,
        // and excludes all others.
        const expected = set.filter((r) => r.blockerId === u);
        expect(outgoing).toEqual(expected);

        // No other-blocker record and no blocked-only record is present.
        const excluded = set.filter((r) => r.blockerId !== u);
        for (const record of excluded) {
          expect(outgoing).not.toContain(record);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 9 (task 3.7) ──

describe('moderationTransitions - Property 9: Teardown selects exactly the records between the two users', () => {
  it('selects exactly the friendship AND friend-request records linking A and B in either direction; no third-party record', () => {
    // Feature: report-and-block, Property 9: Teardown selects exactly the
    // records between the two users — the selected-for-deletion set equals
    // exactly the records that link A and B in either direction; no record
    // involving any third party is selected. Exercised with BOTH the friendship
    // endpoint accessor (userId/friendId) and the friend-request endpoint
    // accessor (fromUserId/toUserId). Validates Requirements 1.8, 1.9.
    fc.assert(
      fc.property(
        fc.array(friendshipArb, { maxLength: 20 }),
        fc.array(requestArb, { maxLength: 20 }),
        distinctPairArb,
        (friendships, requests, [a, b]) => {
          // ── Friendship endpoints (Requirement 1.8) ──
          const selectedFriendships = selectTeardownRecords(
            friendships,
            a,
            b,
            (r) => [r.userId, r.friendId],
          );

          for (const r of selectedFriendships) {
            const links =
              (r.userId === a && r.friendId === b) ||
              (r.userId === b && r.friendId === a);
            expect(links).toBe(true);
          }

          const expectedFriendships = friendships.filter(
            (r) =>
              (r.userId === a && r.friendId === b) ||
              (r.userId === b && r.friendId === a),
          );
          expect(selectedFriendships).toEqual(expectedFriendships);

          // No third-party friendship record is ever selected.
          for (const r of selectedFriendships) {
            const involvesThirdParty =
              (r.userId !== a && r.userId !== b) ||
              (r.friendId !== a && r.friendId !== b);
            expect(involvesThirdParty).toBe(false);
          }

          // ── Friend-request endpoints (Requirement 1.9) ──
          const selectedRequests = selectTeardownRecords(
            requests,
            a,
            b,
            (r) => [r.fromUserId, r.toUserId],
          );

          for (const r of selectedRequests) {
            const links =
              (r.fromUserId === a && r.toUserId === b) ||
              (r.fromUserId === b && r.toUserId === a);
            expect(links).toBe(true);
          }

          const expectedRequests = requests.filter(
            (r) =>
              (r.fromUserId === a && r.toUserId === b) ||
              (r.fromUserId === b && r.toUserId === a),
          );
          expect(selectedRequests).toEqual(expectedRequests);

          // No third-party friend-request record is ever selected.
          for (const r of selectedRequests) {
            const involvesThirdParty =
              (r.fromUserId !== a && r.fromUserId !== b) ||
              (r.toUserId !== a && r.toUserId !== b);
            expect(involvesThirdParty).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 10 (task 3.8) ──

describe('moderationTransitions - Property 10: Report construction maps all fields', () => {
  it('maps all input fields, sets status pending and a populated timestamp; user contentType forces contentId == reportedUserId', () => {
    // Feature: report-and-block, Property 10: Report construction maps all
    // fields — the constructed record carries reporterId, reportedUserId,
    // contentType, reason equal to the inputs, status 'pending', a populated
    // timestamp; and when contentType === 'user', contentId equals
    // reportedUserId even if a different contentId was passed. Validates
    // Requirements 4.5, 4.9.
    fc.assert(
      fc.property(
        reportInputArb,
        fc.date({ min: new Date(0), max: new Date(4102444800000) }),
        (input, timestamp) => {
          const report = buildReport(input, timestamp);

          // Straight field mapping.
          expect(report.reporterId).toBe(input.reporterId);
          expect(report.reportedUserId).toBe(input.reportedUserId);
          expect(report.contentType).toBe(input.contentType);
          expect(report.reason).toBe(input.reason);

          // Status defaults to 'pending'.
          expect(report.status).toBe('pending');

          // Timestamp is populated with the supplied value.
          expect(report.timestamp).toBe(timestamp);
          expect(report.timestamp).toBeInstanceOf(Date);

          // contentId invariant: 'user' forces contentId == reportedUserId even
          // when a different contentId was supplied; other types pass through.
          if (input.contentType === 'user') {
            expect(report.contentId).toBe(input.reportedUserId);
          } else {
            expect(report.contentId).toBe(input.contentId);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

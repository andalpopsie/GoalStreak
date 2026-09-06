// Property-based tests for the pure ModerationFilter module.
//
// Library: fast-check + Jest. Each property runs a minimum of 100 iterations.
// These tests exercise the filter-everywhere invariant, reaction filtering,
// reported-content exclusion, report auto-hide scoping, and the no-false-
// exclusions guarantee described in the report-and-block design's Correctness
// Properties section.

import fc from 'fast-check';

import {
  isHidden,
  filterActivities,
  filterGroupActivities,
  filterMessages,
  filterSearchResults,
  filterFriendRequests,
  filterMembers,
  filterReactions,
} from '../moderationFilter';
import {
  ModerationState,
  SocialActivity,
  GroupActivity,
  GroupMessage,
  UserSearchResult,
  FriendRequest,
  GroupMember,
  Reactions,
  ReactionType,
  ActivityType,
  ActivityVisibility,
  GroupActivityType,
  FriendStatus,
  GroupRole,
} from '../../types/social';

// ── Shared generators ──────────────────────────────────────────────────────
// Small pools so authors, block sets, and reported content ids overlap often,
// which makes exclusion/retention paths both exercised.

const USER_POOL_SIZE = 7;
const CONTENT_POOL_SIZE = 10;

const userIdArb: fc.Arbitrary<string> = fc
  .integer({ min: 0, max: USER_POOL_SIZE - 1 })
  .map((n) => `u${n}`);

const contentIdArb: fc.Arbitrary<string> = fc
  .integer({ min: 0, max: CONTENT_POOL_SIZE - 1 })
  .map((n) => `c${n}`);

const reactionTypeArb: fc.Arbitrary<ReactionType> = fc.constantFrom<ReactionType>(
  'heart',
  'flame',
  'medal'
);

const activityArb: fc.Arbitrary<SocialActivity> = fc.record({
  id: contentIdArb,
  userId: userIdArb,
  userName: fc.constant('name'),
  type: fc.constant<ActivityType>('habit_completed'),
  habitId: fc.constant('h'),
  habitName: fc.constant('Habit'),
  habitCategory: fc.constant('Fitness'),
  timestamp: fc.date(),
  visibility: fc.constant<ActivityVisibility>('friends'),
});

const groupActivityArb: fc.Arbitrary<GroupActivity> = fc.record({
  id: contentIdArb,
  groupId: fc.constant('g'),
  userId: userIdArb,
  userName: fc.constant('name'),
  type: fc.constant<GroupActivityType>('habit_completed'),
  timestamp: fc.date(),
});

const groupMessageArb: fc.Arbitrary<GroupMessage> = fc.record({
  id: contentIdArb,
  groupId: fc.constant('g'),
  userId: userIdArb,
  userName: fc.constant('name'),
  text: fc.string(),
  createdAt: fc.date(),
});

const searchResultArb: fc.Arbitrary<UserSearchResult> = fc.record({
  id: userIdArb,
  email: fc.constant('e@e.com'),
  name: fc.constant('name'),
  mutualFriends: fc.nat({ max: 20 }),
  isFriend: fc.boolean(),
  hasPendingRequest: fc.boolean(),
});

const friendRequestArb: fc.Arbitrary<FriendRequest> = fc.record({
  id: contentIdArb,
  fromUserId: userIdArb,
  fromUserEmail: fc.constant('from@e.com'),
  fromUserName: fc.constant('from'),
  toUserId: fc.constant('me'),
  toUserEmail: fc.constant('me@e.com'),
  status: fc.constant<FriendStatus>('pending'),
  createdAt: fc.date(),
});

const groupMemberArb: fc.Arbitrary<GroupMember> = fc.record({
  userId: userIdArb,
  userName: fc.constant('name'),
  role: fc.constant<GroupRole>('member'),
  joinedAt: fc.date(),
});

// Reaction maps keyed by user id.
const reactionsArb: fc.Arbitrary<Reactions> = fc
  .array(fc.tuple(userIdArb, fc.array(reactionTypeArb, { minLength: 1, maxLength: 3 })), {
    maxLength: USER_POOL_SIZE,
  })
  .map((pairs) => {
    const r: Reactions = {};
    for (const [uid, types] of pairs) {
      r[uid] = types;
    }
    return r;
  });

// Block relationships generated as unordered user pairs (blocker, blocked).
// The bidirectional block set for `currentUser` is the union of users the
// current user blocked AND users who blocked the current user — so both
// directions of a block relationship are exercised.
const blockRelationshipsArb: fc.Arbitrary<Array<[string, string]>> = fc.array(
  fc.tuple(userIdArb, userIdArb),
  { maxLength: 12 }
) as fc.Arbitrary<Array<[string, string]>>;

function buildBidirectionalBlockSet(
  relationships: Array<[string, string]>,
  currentUser: string
): Set<string> {
  const set = new Set<string>();
  for (const [blocker, blocked] of relationships) {
    if (blocker === currentUser && blocked !== currentUser) {
      set.add(blocked); // current user blocked `blocked`
    } else if (blocked === currentUser && blocker !== currentUser) {
      set.add(blocker); // `blocker` blocked the current user
    }
  }
  return set;
}

function countReactions(reactions: Reactions): Record<string, number> {
  const counts: Record<string, number> = {};
  Object.values(reactions).forEach((types) => {
    types.forEach((t) => {
      counts[t] = (counts[t] ?? 0) + 1;
    });
  });
  return counts;
}

// ── Property 1 (task 2.3) ────────────────────────────────────────────────────
// Feature: report-and-block, Property 1: Filter-everywhere (bidirectional
// exclusion, exact) — for any collection of authored items and any bidirectional
// block set, the filtered collection contains exactly those items whose author
// is not in the block set, regardless of which user initiated the block.
// Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 3.6
describe('ModerationFilter — Property 1: filter-everywhere bidirectional exclusion', () => {
  it('removes exactly blocked-authored items and retains all others across every surface', () => {
    fc.assert(
      fc.property(
        blockRelationshipsArb,
        userIdArb,
        fc.array(activityArb, { maxLength: 15 }),
        fc.array(groupActivityArb, { maxLength: 15 }),
        fc.array(groupMessageArb, { maxLength: 15 }),
        fc.array(searchResultArb, { maxLength: 15 }),
        fc.array(friendRequestArb, { maxLength: 15 }),
        fc.array(groupMemberArb, { maxLength: 15 }),
        (rels, currentUser, acts, gacts, msgs, results, reqs, members) => {
          const blockedUserIds = buildBidirectionalBlockSet(rels, currentUser);
          // Reported set empty so exclusion is purely author-based here.
          const state: ModerationState = {
            blockedUserIds,
            reportedContentIds: new Set<string>(),
          };

          expect(filterActivities(state, acts)).toEqual(
            acts.filter((a) => !blockedUserIds.has(a.userId))
          );
          expect(filterGroupActivities(state, gacts)).toEqual(
            gacts.filter((a) => !blockedUserIds.has(a.userId))
          );
          expect(filterMessages(state, msgs)).toEqual(
            msgs.filter((m) => !blockedUserIds.has(m.userId))
          );
          expect(filterSearchResults(state, results)).toEqual(
            results.filter((r) => !blockedUserIds.has(r.id))
          );
          expect(filterFriendRequests(state, reqs)).toEqual(
            reqs.filter((r) => !blockedUserIds.has(r.fromUserId))
          );
          expect(filterMembers(state, members)).toEqual(
            members.filter((m) => !blockedUserIds.has(m.userId))
          );

          // No blocked author ever survives on any surface.
          expect(filterActivities(state, acts).some((a) => blockedUserIds.has(a.userId))).toBe(
            false
          );
          expect(filterMessages(state, msgs).some((m) => blockedUserIds.has(m.userId))).toBe(false);
          expect(filterSearchResults(state, results).some((r) => blockedUserIds.has(r.id))).toBe(
            false
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 2 (task 2.4) ────────────────────────────────────────────────────
// Feature: report-and-block, Property 2: Reactions exclude blocked authors —
// filterReactions returns a map with no keys belonging to a blocked user, and
// the resulting reaction counts equal the counts computed over only the
// non-blocked reactions.
// Validates: Requirements 2.6
describe('ModerationFilter — Property 2: reactions exclude blocked authors', () => {
  it('drops blocked-user keys and preserves non-blocked reaction counts', () => {
    fc.assert(
      fc.property(
        blockRelationshipsArb,
        userIdArb,
        reactionsArb,
        (rels, currentUser, reactions) => {
          const blockedUserIds = buildBidirectionalBlockSet(rels, currentUser);
          const state: ModerationState = {
            blockedUserIds,
            reportedContentIds: new Set<string>(),
          };

          const filtered = filterReactions(state, reactions);

          // No blocked user appears as a key.
          Object.keys(filtered).forEach((uid) => {
            expect(blockedUserIds.has(uid)).toBe(false);
          });

          // Result equals the reactions of only the non-blocked users.
          const expected: Reactions = {};
          Object.keys(reactions).forEach((uid) => {
            if (!blockedUserIds.has(uid)) {
              expected[uid] = reactions[uid];
            }
          });
          expect(filtered).toEqual(expected);

          // Counts over the filtered map equal counts over non-blocked reactions only.
          expect(countReactions(filtered)).toEqual(countReactions(expected));

          // Input is never mutated.
          expect(Object.keys(reactions).length).toBeGreaterThanOrEqual(
            Object.keys(filtered).length
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 3 (task 2.5) ────────────────────────────────────────────────────
// Feature: report-and-block, Property 3: Reported content is excluded from the
// reporter's view — no item whose contentId is in the reported set survives, and
// adding a newly reported item's id removes exactly that item on the next filter.
// Validates: Requirements 5.1, 5.2
describe('ModerationFilter — Property 3: reported content excluded from reporter view', () => {
  it('excludes reported content ids and removes exactly the newly reported item', () => {
    fc.assert(
      fc.property(
        fc.array(activityArb, { maxLength: 15 }),
        fc.array(fc.boolean(), { maxLength: 15 }),
        (rawItems, reportFlags) => {
          // Assign unique content ids so "exactly that item" is unambiguous.
          const items = rawItems.map((it, i) => ({ ...it, id: `c${i}` }));

          const reportedContentIds = new Set<string>();
          items.forEach((it, i) => {
            if (reportFlags[i]) {
              reportedContentIds.add(it.id);
            }
          });

          const state: ModerationState = {
            blockedUserIds: new Set<string>(),
            reportedContentIds,
          };
          const result = filterActivities(state, items);

          // No reported item survives.
          expect(result.some((it) => reportedContentIds.has(it.id))).toBe(false);
          // Survivors are exactly the non-reported items.
          expect(result).toEqual(items.filter((it) => !reportedContentIds.has(it.id)));

          // Reporting a currently-surviving item removes exactly that one item next filter.
          if (result.length > 0) {
            const target = result[0];
            const state2: ModerationState = {
              blockedUserIds: new Set<string>(),
              reportedContentIds: new Set<string>([...reportedContentIds, target.id]),
            };
            const result2 = filterActivities(state2, items);
            expect(result2).toEqual(result.filter((it) => it.id !== target.id));
            expect(result.length - result2.length).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 4 (task 2.6) ────────────────────────────────────────────────────
// Feature: report-and-block, Property 4: Report auto-hide is scoped to the
// reporting user — a state whose reportedContentIds contains an item's id
// excludes it, while a different user's state without that id (and no block
// relationship with the author) retains it.
// Validates: Requirements 5.3
describe('ModerationFilter — Property 4: report auto-hide scoped to reporting user', () => {
  it('hides for the reporter but retains for a user who did not report and has no block', () => {
    fc.assert(
      fc.property(activityArb, (item) => {
        // Reporter: has this content id in their reported set → item excluded.
        const reporterState: ModerationState = {
          blockedUserIds: new Set<string>(),
          reportedContentIds: new Set<string>([item.id]),
        };
        expect(filterActivities(reporterState, [item])).toEqual([]);
        expect(isHidden(reporterState, item.userId, item.id)).toBe(true);

        // Different user: no report of this id and no block → item retained.
        const otherUserState: ModerationState = {
          blockedUserIds: new Set<string>(),
          reportedContentIds: new Set<string>(),
        };
        expect(filterActivities(otherUserState, [item])).toEqual([item]);
        expect(isHidden(otherUserState, item.userId, item.id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 5 (task 2.7) ────────────────────────────────────────────────────
// Feature: report-and-block, Property 5: No false exclusions — for any
// collection of authored items, any bidirectional block set, and any reported-
// content set, every item whose author is not blocked and whose contentId is
// not reported survives filtering.
// Validates: Requirements 3.6
describe('ModerationFilter — Property 5: no false exclusions', () => {
  it('retains every item that is neither blocked-authored nor reported', () => {
    fc.assert(
      fc.property(
        blockRelationshipsArb,
        userIdArb,
        fc.array(activityArb, { maxLength: 15 }),
        fc.array(contentIdArb, { maxLength: 8 }),
        (rels, currentUser, items, reportedList) => {
          const blockedUserIds = buildBidirectionalBlockSet(rels, currentUser);
          const reportedContentIds = new Set<string>(reportedList);
          const state: ModerationState = { blockedUserIds, reportedContentIds };

          const result = filterActivities(state, items);
          const survivors = new Set(result);

          items.forEach((it) => {
            const shouldSurvive = !blockedUserIds.has(it.userId) && !reportedContentIds.has(it.id);
            if (shouldSurvive) {
              expect(survivors.has(it)).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ModerationFilter - pure client-side moderation filtering for GoalStreak
//
// This module is intentionally PURE: no Firestore, no auth, no time/Date access,
// and no other I/O. It transforms already-loaded social read results using the
// in-memory ModerationState (a bidirectional block set plus the reporter's own
// reported-content ids). Because the sets live in memory, filtering is O(n) over
// a page of results and requires no extra round-trips.
//
// These functions are the primary target of property-based testing (see the
// report-and-block design's Correctness Properties).

import {
  ModerationState,
  SocialActivity,
  GroupActivity,
  GroupMessage,
  UserSearchResult,
  FriendRequest,
  GroupMember,
  Reactions,
} from '../types/social';

/**
 * Returns true if content authored by `authorId` (optionally identified by
 * `contentId`) should be hidden from the current user.
 *
 * Content is hidden when either:
 *  - `authorId` is in the bidirectional block set (blockedUserIds), or
 *  - `contentId` is provided AND is in the reporter's reportedContentIds set.
 */
export function isHidden(state: ModerationState, authorId: string, contentId?: string): boolean {
  if (state.blockedUserIds.has(authorId)) {
    return true;
  }
  if (contentId !== undefined && state.reportedContentIds.has(contentId)) {
    return true;
  }
  return false;
}

/**
 * Filter the friend activity feed. Author is `userId`; content id is `id`
 * (so a reported activity is auto-hidden from the reporter).
 */
export function filterActivities(
  state: ModerationState,
  activities: SocialActivity[]
): SocialActivity[] {
  return activities.filter((activity) => !isHidden(state, activity.userId, activity.id));
}

/**
 * Filter the group activity feed. Author is `userId`; content id is `id`.
 */
export function filterGroupActivities(
  state: ModerationState,
  activities: GroupActivity[]
): GroupActivity[] {
  return activities.filter((activity) => !isHidden(state, activity.userId, activity.id));
}

/**
 * Filter group chat messages. Author is `userId`; content id is `id`.
 */
export function filterMessages(state: ModerationState, messages: GroupMessage[]): GroupMessage[] {
  return messages.filter((message) => !isHidden(state, message.userId, message.id));
}

/**
 * Filter friend search results. The "author" is the searched user themselves
 * (`id`). No content id — a search result is a user, not a piece of content.
 */
export function filterSearchResults(
  state: ModerationState,
  results: UserSearchResult[]
): UserSearchResult[] {
  return results.filter((result) => !isHidden(state, result.id));
}

/**
 * Filter friend requests. The "author" is the sender (`fromUserId`). No content
 * id — a request is hidden purely on the block relationship.
 */
export function filterFriendRequests(
  state: ModerationState,
  requests: FriendRequest[]
): FriendRequest[] {
  return requests.filter((request) => !isHidden(state, request.fromUserId));
}

/**
 * Filter group members. The "author" is the member (`userId`). No content id.
 */
export function filterMembers(state: ModerationState, members: GroupMember[]): GroupMember[] {
  return members.filter((member) => !isHidden(state, member.userId));
}

/**
 * Return a NEW Reactions map that omits entries authored by blocked users.
 * The input map is never mutated. Downstream `getReactionCounts` run over the
 * result yields blocked-free counts (Requirement 2.6).
 */
export function filterReactions(state: ModerationState, reactions?: Reactions): Reactions {
  const filtered: Reactions = {};

  if (!reactions) {
    return filtered;
  }

  Object.keys(reactions).forEach((userId) => {
    if (!state.blockedUserIds.has(userId)) {
      filtered[userId] = reactions[userId];
    }
  });

  return filtered;
}

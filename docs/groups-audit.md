# Accountability Groups — Flow & Rules Audit

A focused read-through of `src/services/groupService.ts` and `firebase/firestore.rules`,
mapping every Firestore write to the rule that governs it, to catch permission/logic
gaps before App Store submission. Optimization ideas are logged for **after** launch.

_Last updated: July 2026 (pre-submission hardening pass)._

## Write → rule map (current state)

| Operation | Collection / write | Governing rule | Status |
|-----------|--------------------|----------------|--------|
| createGroup | `groups` set (adminId=self) | create: uid==adminId | ✅ |
| updateGroup (name/desc/endDate) | `groups` update | update: isGroupAdmin | ✅ (admin-gated UI) |
| endGroup | `groups` update status=ended | update: isGroupAdmin | ✅ admin / ⚠️ see A |
| checkAndEndExpiredGroups | `groups` update status=ended | update: isGroupAdmin | ⚠️ see A |
| inviteMember | `groupInvitations` set (fromUserId=self) | create/update: party | ✅ |
| acceptInvitation | `groupInvitations` update + `groups` self-join + `groupActivities` create(self) | update party / isSelfJoin / create self | ✅ |
| declineInvitation | `groupInvitations` update status | update: party | ✅ |
| removeMember (admin) | `groups` update + `trackedHabits` delete(member) + `groupActivities` create(member_left) | isGroupAdmin / isGroupAdminOf / isGroupAdminOf | ✅ |
| leaveGroup (member) | `groups` self-leave + own `trackedHabits` delete + `groupActivities` create(self) | isSelfLeave / owner / self | ✅ |
| linkHabits | `trackedHabits` set (userId=self) | create: uid==userId | ✅ |
| unlinkHabit | `trackedHabits` delete (own) | delete: owner | ✅ |
| createGroupActivity | `groupActivities` add (userId=self) | create: self | ✅ |
| addGroupReaction | `groupActivities` **update** (reactions) | update: **isAuthenticated()** | ❌ see B (FIXED) |
| sendMessage | `groups/{id}/messages` add | create: member & uid==userId | ✅ |
| all reads / subscriptions | groups, groupActivities, trackedHabits, groupInvitations | read rules | ✅ |

## Findings

### B — groupActivities update was over-permissive (FIXED in this pass)
`allow update: if isAuthenticated()` let **any** signed-in user modify **any** group
activity — not just their reaction, but `userName`, `type`, `habitName`, etc. (feed
tampering). Reactions are the only legitimate client update.
**Fix:** added `isGroupMemberOf(groupId)` and restricted update to group members whose
change touches only `reactions`/`updatedAt`. Reactions still work; tampering is denied.

### A — non-admin can't auto-end an expired group (LOG, low priority)
`endGroup` / `checkAndEndExpiredGroups` do a `status=ended` update gated to the admin.
If a member (not admin) loads an expired group, the auto-end write is denied — but it's
caught with `console.warn`, so no crash. Consequence: a group can linger "active" past
its endDate until the admin opens the app. Acceptable for launch; revisit if needed
(e.g., a scheduled Cloud Function to end expired groups server-side).

### Accepted tradeoffs (intentional, documented)
- **`groups` read = any authenticated user.** Needed so an invited user can view a group
  before accepting, and for discovery. Exposes group metadata (name, memberIds) to any
  signed-in user. Accepted.
- **`trackedHabits` read = any authenticated user.** Needed for group progress; list
  queries can't easily verify membership. Exposes tracked habit names. Low harm. Accepted.

### Out-of-scope security note (LOG — not groups, but flagged)
- **`streaks` write = `if isAuthenticated()`** — any signed-in user can overwrite *any*
  user's streak doc. This is outside the groups surface but is a genuine over-permissive
  rule worth tightening (restrict writes to the owner via a `userId` field) in a separate
  pass. Not changed here to keep this PR scoped.
- **`groupInvitations` update** doesn't restrict *which* fields a party can change (an
  invitee could alter fields beyond `status`). Low harm; consider field-scoping later.

## Optimization opportunities (post-submission — do NOT do now)

1. **`getGroupProgress` is N+1.** For every tracked habit it runs a separate
   `completions` query and a `streaks` get. With M members × H habits that's O(M·H)
   reads per refresh. Batch completions per user with a date range; batch streak reads.
2. **`subscribeToGroupProgress` re-computes everything on any trackedHabits change** —
   re-runs the full `getGroupProgress` (all completions/streaks for all members). Debounce
   and/or scope to the changed user.
3. **`users` vs `userProfiles` duplication** is the root cause of the "Unknown User"
   whack-a-mole. Consolidate to one source of truth (or keep denormalized member names
   refreshed). Would also let the member-list UI stop showing stale names.
4. **Repeated `getGroup` reads.** removeMember/linkHabits/acceptInvitation/
   createGroupActivity each re-fetch the group. Pass the loaded group where possible.
5. **`getUserGroupCount` fetches full group docs to count.** Use a count() aggregation or
   a lighter projection.
6. **Reactions are a read-modify-write on a map field** (`addGroupReaction`), race-prone
   under concurrency. Consider a reactions subcollection or `arrayUnion`/`arrayRemove`.
7. **`createGroup` wraps a single `set` in a batch** — unnecessary; use `setDoc`.
8. **Denormalized names in `groupActivities` and `messages`** are baked at write time;
   tie into the consolidation in #3.

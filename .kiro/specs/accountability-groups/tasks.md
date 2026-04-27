    eiifcbncigvcdhgvlcjcgkrnredufdnkhjvbnrhbrdcf
    #W` ` `1  #   `   ` Implementation Plan: Accountability Groups

## Overview

Implement the Accountability Groups feature for the Goalfer app, extending the existing Social tab with a Groups tab. Users can form small groups (2–10 members), link habits for accountability tracking, view group progress, and interact via a group activity feed. The implementation follows the existing class-based Firestore service pattern (`friendService.ts`), hook subscription pattern (`useFriends`), and the app's design system (8pt grid, Montserrat, teal/purple palette).

Tasks are ordered by dependency: types → service → hooks → UI components → navigation/integration → final wiring.

## Tasks

- [x] 1. Define group types and extend navigation types
  - [x] 1.1 Add group types to `src/types/social.ts`
    - Add `GroupStatus`, `GroupRole`, `GroupInvitationStatus`, `GroupActivityType` type aliases
    - Add `GroupMember`, `Group`, `GroupInvitation`, `TrackedHabit`, `GroupActivity`, `GroupProgress`, `CreateGroupForm` interfaces
    - Reuse existing `Reactions` and `ReactionType` types for group feed reactions
    - _Requirements: 1.1, 1.4, 2.2, 3.1, 4.2, 5.1, 6.1_

  - [x] 1.2 Add `GroupDetail` route to navigation types in `src/types/index.ts`
    - Add `GroupDetail: { groupId: string }` to `RootStackParamList`
    - _Requirements: 9.3_

- [x] 2. Implement group service layer (`src/services/groupService.ts`)

  - [x] 2.1 Create `GroupService` class with Firestore collection references
    - Set up `groups`, `groupInvitations`, `trackedHabits`, `groupActivities` collection references
    - Follow the same class-based pattern as `friendService.ts` (class with methods, default export of singleton instance)
    - Implement pure validation functions: `validateGroupName`, `validateGroupDescription`, `validateEndDate`
    - Implement `calculateCompletionPercentage` pure function
    - _Requirements: 1.2, 1.3, 1.6, 5.3_

  - [ ]* 2.2 Write property tests for input validation (Properties 1, 3)
    - **Property 1: Group creation input validation** — For any string `name`, `validateGroupName(name)` returns valid only when `name.trim().length` is between 3 and 50 inclusive. For any string `description`, `validateGroupDescription(description)` returns valid only when `description.length` is at most 200.
    - **Property 3: End date validation** — For any Date `d`, `validateEndDate(d)` returns valid only when `d` is at least 1 calendar day in the future.
    - **Validates: Requirements 1.2, 1.3, 1.6**

  - [ ]* 2.3 Write property test for completion percentage calculation (Property 12)
    - **Property 12: Group completion percentage calculation** — For any set of `GroupProgress` entries, `calculateCompletionPercentage` returns `(totalCompletedHabits / totalTrackedHabits) * 100`, rounded to nearest integer. Returns 0 if `totalTrackedHabits` is 0.
    - **Validates: Requirements 5.3**

  - [x] 2.4 Implement group CRUD methods
    - `createGroup(userId, form)`: Validate inputs, check 5-group limit via `getUserGroupCount`, create group document with creator as admin member using `writeBatch`
    - `getGroup(groupId)`: Fetch single group document
    - `updateGroup(groupId, updates)`: Update group fields (name, description, endDate)
    - `endGroup(groupId, adminId)`: Mark group as ended, prevent new activity
    - `getUserGroups(userId)`: Query groups where `memberIds` array-contains userId and status is 'active'
    - `getUserGroupCount(userId)`: Return count of active groups for a user
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 7.1, 7.3, 7.4, 7.5_

  - [ ]* 2.5 Write property tests for group creation and limits (Properties 2, 4)
    - **Property 2: Group creation produces correct document** — For any valid `CreateGroupForm` and userId, `createGroup` produces a Group where `adminId` equals userId, `members` contains exactly one entry with `role: 'admin'`, and `status` is `'active'`.
    - **Property 4: User group limit enforcement** — For any user already in 5 active groups, creating a new group or accepting an invitation is rejected with a descriptive error.
    - **Validates: Requirements 1.4, 1.7, 1.8, 3.5**

  - [x] 2.6 Implement invitation methods
    - `inviteMember(groupId, adminId, friendId, friendName)`: Check 10-member limit, check duplicate pending invitations, create invitation document, trigger notification via `notificationService`
    - `acceptInvitation(invitationId, userId)`: Use `writeBatch` to atomically update invitation status + add member to group. Re-check 10-member limit and 5-group limit (race condition protection). Check group status.
    - `declineInvitation(invitationId)`: Mark invitation as declined
    - `getPendingInvitations(userId)`: Query invitations where `toUserId` equals userId and status is 'pending'
    - `getGroupInvitableFriends(groupId, adminId)`: Return admin's friends not already in the group
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.7 Write property tests for invitation logic (Properties 5, 6, 7, 8)
    - **Property 5: Group member limit enforcement** — For any group with 10 members, inviting or accepting is rejected with a descriptive error.
    - **Property 6: Duplicate invitation prevention** — For any group and user with a pending invitation, creating another invitation is rejected.
    - **Property 7: Invitation acceptance adds member correctly** — Accepting a valid pending invitation adds user to `members` with `role: 'member'`, sets invitation status to `'accepted'`, and increases member count by 1.
    - **Property 8: Invitation decline updates status** — Declining sets status to `'declined'` and removes from pending list.
    - **Validates: Requirements 2.3, 2.4, 2.5, 3.2, 3.3, 3.4**

  - [x] 2.8 Implement member management methods
    - `removeMember(groupId, adminId, memberId)`: Use `writeBatch` to remove member, delete their `trackedHabits`, post system event to `groupActivities`
    - `leaveGroup(groupId, userId)`: Same as removeMember but self-initiated. If admin leaves or is last member, call `endGroup`
    - _Requirements: 7.2, 7.5, 8.2, 8.3_

  - [ ]* 2.9 Write property tests for member removal and group ending (Properties 15, 16, 17)
    - **Property 15: Member removal cleans up all associations** — After removal, group's `members` array does not contain the user, and `getTrackedHabits` returns no entries for that user.
    - **Property 16: Ended group rejects new activity** — For any group with `status: 'ended'`, creating a new group activity is rejected.
    - **Property 17: Admin departure ends group** — When the admin is the only remaining member and leaves, group status is set to `'ended'`.
    - **Validates: Requirements 7.2, 7.3, 7.5, 8.2**

  - [x] 2.10 Implement tracked habits methods
    - `linkHabits(groupId, userId, habits)`: Validate ownership, check 1–6 habit limit per member per group, create `TrackedHabit` documents
    - `unlinkHabit(groupId, userId, habitId)`: Remove `TrackedHabit` document
    - `getTrackedHabits(groupId)`: Query all tracked habits for a group
    - `getUserTrackedHabits(groupId, userId)`: Query tracked habits for a specific user in a group
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.11 Write property tests for habit linking (Properties 9, 10, 11)
    - **Property 9: Habit linking round trip** — Linking habits then querying returns exactly those habits. Unlinking one removes it, remaining set matches original minus unlinked.
    - **Property 10: Habit count limit per group** — Tracked habits per member per group is between 1 and 6. Exceeding 6 is rejected.
    - **Property 11: Only habit owner can link** — If habit's `userId` does not equal the user's id, linking is rejected.
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

  - [x] 2.12 Implement group feed and progress methods
    - `createGroupActivity(groupId, userId, type, habitData)`: Create activity document, reject if group is ended
    - `getGroupFeed(groupId, limitCount)`: Query activities ordered by timestamp descending, default limit 20
    - `addGroupReaction(activityId, userId, reactionType)`: Store reaction using existing reaction pattern (heart, flame, medal)
    - `getGroupProgress(groupId)`: Compute each member's tracked habits with today's completion status and current streak
    - `getGroupCompletionPercentage(groupId)`: Use `calculateCompletionPercentage` with progress data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.13 Write property tests for feed filtering and pagination (Properties 13, 14)
    - **Property 13: Group feed filtering** — Group feed contains only activities where `activity.groupId` equals the given groupId and `activity.userId` is in the group's `memberIds`.
    - **Property 14: Group feed pagination** — Requesting feed with limit 20 returns at most 20 activities, ordered by timestamp descending.
    - **Validates: Requirements 6.1, 6.4**

  - [x] 2.14 Implement real-time subscription methods
    - `subscribeToUserGroups(userId, callback)`: `onSnapshot` on groups where `memberIds` array-contains userId
    - `subscribeToGroupInvitations(userId, callback)`: `onSnapshot` on invitations where `toUserId` equals userId and status is 'pending'
    - `subscribeToGroupFeed(groupId, callback)`: `onSnapshot` on activities for a group, ordered by timestamp descending
    - `subscribeToGroupProgress(groupId, callback)`: `onSnapshot` on tracked habits + completions for real-time progress
    - _Requirements: 5.4, 9.2_

  - [x] 2.15 Implement group notification methods
    - Add notification helpers for: daily reminder (incomplete tracked habits by configurable time), celebration (all members completed), new member joined
    - Respect user's existing social notification settings from `SocialSettings.notifyOnFriendActivity`
    - Enforce max 3 notifications per group per day rate limit
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 2.16 Write property tests for notification rules (Properties 21, 22)
    - **Property 21: Notification settings respected** — For any user with social notifications disabled, no group notifications are sent.
    - **Property 22: Notification rate limiting** — For any group on any day, total group notifications do not exceed 3.
    - **Validates: Requirements 10.4, 10.5**

- [x] 3. Checkpoint — Ensure service layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement group hooks
  - [x] 4.1 Create `useGroups` hook (`src/hooks/useGroups.ts`)
    - Set up real-time subscriptions for user's groups and pending invitations via `onSnapshot`
    - Follow `useFriends` pattern: `useEffect` for subscription setup/teardown, `useCallback` for actions
    - Expose: `groups`, `pendingInvitations`, `pendingInvitationCount`, `isLoadingGroups`, `isCreating`, `isProcessingInvitation`, `error`
    - Expose actions: `createGroup`, `acceptInvitation`, `declineInvitation`, `refreshGroups`
    - _Requirements: 9.2, 9.4, 1.4, 3.2, 3.3_

  - [x] 4.2 Create `useGroupDetail` hook (`src/hooks/useGroupDetail.ts`)
    - Accept `groupId` parameter, set up real-time subscriptions for group data, progress, feed, and tracked habits
    - Compute `completionPercentage` from progress data using `calculateCompletionPercentage`
    - Compute `isAdmin` from current user's role in group members
    - Expose: `group`, `progress`, `feed`, `trackedHabits`, `completionPercentage`, `isAdmin`, `isLoading`, `isLinking`, `error`
    - Expose actions: `linkHabits`, `unlinkHabit`, `inviteMember`, `removeMember`, `leaveGroup`, `endGroup`, `updateGroup`, `addReaction`
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 6.1, 7.1, 7.2, 8.1_

- [x] 5. Implement UI components
  - [x] 5.1 Create `GroupsTab` component (`src/components/social/GroupsTab.tsx`)
    - Display pending group invitations at the top of the tab (user decision from design)
    - Display list of active groups as cards below invitations
    - Show empty state when no groups and no pending invitations with prompt to create a group
    - Include floating "Create Group" button
    - Use `useGroups` hook for data
    - Follow 8pt grid spacing, Montserrat fonts, design system colors from `theme.ts`
    - _Requirements: 9.1, 9.2, 9.5_

  - [x] 5.2 Create `GroupCard` component (`src/components/social/GroupCard.tsx`)
    - Display group name, member count, and today's completion percentage
    - Use teal (#4A90A4) for completion indicator
    - Card follows standard card recipe: `borderRadius: 16`, `padding: 16`, `Shadows.sm`
    - `onPress` navigates to `GroupDetail` screen
    - _Requirements: 9.2, 9.3_

  - [ ]* 5.3 Write property test for group card display (Property 19)
    - **Property 19: Groups list shows required information** — For any active group rendered in the Groups tab, the output contains group name, member count, and today's completion percentage.
    - **Validates: Requirements 9.2**

  - [x] 5.4 Create `GroupInvitationCard` component (`src/components/social/GroupInvitationCard.tsx`)
    - Display group name, description, admin name, and current member count
    - Include Accept and Decline action buttons (min 48px touch targets)
    - Accept button uses purple accent (`#B771E5`), Decline uses secondary style
    - Minimum 16px gap between action buttons
    - _Requirements: 3.1_

  - [ ]* 5.5 Write property test for invitation display (Property 18)
    - **Property 18: Invitation display contains required fields** — For any `GroupInvitation` rendered, the output contains group name, group description, admin name, and current member count.
    - **Validates: Requirements 3.1**

  - [x] 5.6 Create `GroupCreateForm` component (`src/components/social/GroupCreateForm.tsx`)
    - Modal form with fields: group name, description, category picker (reuse existing category system), optional end date picker
    - Real-time validation feedback using `validateGroupName`, `validateGroupDescription`, `validateEndDate`
    - Error states in red (#FF4444), success in teal (#4A90A4)
    - Submit button (min 56px height, purple accent) calls `useGroups.createGroup`
    - Labels above inputs, required fields marked with *
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [x] 5.7 Create `GroupDetailScreen` (`src/screens/GroupDetailScreen.tsx`)
    - Stack-navigated screen with group name in header
    - Two internal tabs: "Progress" and "Feed"
    - Progress tab shows `GroupProgressCard` for each member + group completion summary
    - Feed tab shows `GroupFeedCard` list with pagination (20 items per page)
    - Include action buttons: Link Habits, Invite Members (admin only), Settings gear icon
    - Use `useGroupDetail` hook for all data and actions
    - _Requirements: 2.1, 4.1, 5.1, 5.2, 5.3, 5.5, 6.1, 6.4_

  - [x] 5.8 Create `GroupProgressCard` component (`src/components/social/GroupProgressCard.tsx`)
    - Display member name and their tracked habits as completion dots/indicators
    - Completed habits use teal (#4A90A4), incomplete use gray (#E8E8E8)
    - Show current streak count per habit
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 5.9 Create `GroupFeedCard` component (`src/components/social/GroupFeedCard.tsx`)
    - Display activity cards for habit completions, streak milestones, member joined/left events
    - Reuse existing reaction UI pattern (heart, flame, medal) from the main activity feed
    - `onReaction` calls `addReaction` from `useGroupDetail`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 5.10 Create `LinkHabitsModal` component (`src/components/social/LinkHabitsModal.tsx`)
    - Modal showing user's habits with checkboxes for selection
    - Show already-linked habits as checked/disabled
    - Enforce 1–6 habit limit with visual feedback
    - Confirm button calls `linkHabits` from `useGroupDetail`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.11 Create `InviteMembersModal` component (`src/components/social/InviteMembersModal.tsx`)
    - Modal showing admin's friends who are not already group members
    - Use `getGroupInvitableFriends` to filter friend list
    - Tap on a friend sends invitation via `inviteMember` from `useGroupDetail`
    - Show "group is full" message if at 10-member limit
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 5.12 Create `GroupSettingsModal` component (`src/components/social/GroupSettingsModal.tsx`)
    - Admin view: edit group name/description/end date, remove members, end group button
    - Member view: leave group button with confirmation dialog
    - End group and leave group require confirmation (Alert.alert)
    - Destructive actions (end group, remove member) use red (#FF4444) styling
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.4_

- [x] 6. Checkpoint — Ensure UI components render without errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integrate Groups tab into Social screen and navigation
  - [x] 7.1 Extend `SocialScreen.tsx` with Groups tab
    - Add `'groups'` to `TabType` union: `type TabType = 'feed' | 'friends' | 'groups'`
    - Add Groups tab button alongside Feed and Friends tabs
    - Display badge on Groups tab showing `pendingInvitationCount` when > 0 (use existing `Colors.accent1` purple badge style)
    - Render `GroupsTab` component when groups tab is selected
    - _Requirements: 9.1, 9.4_

  - [ ]* 7.2 Write property test for invitation badge count (Property 20)
    - **Property 20: Invitation badge count** — For any number N of pending invitations (N ≥ 0), the badge displays N when N > 0 and is hidden when N = 0.
    - **Validates: Requirements 9.4**

  - [x] 7.3 Add `GroupDetail` screen to `AppNavigator.tsx`
    - Add `GroupDetail` screen to the main stack navigator with `headerShown: true` and `headerTitle: ''`
    - Import `GroupDetailScreen` component
    - _Requirements: 9.3_

- [x] 8. Wire group activity creation into habit completion flow
  - [x] 8.1 Extend habit completion to post group activities
    - When a user completes a habit that is tracked in a group, call `groupService.createGroupActivity` with type `'habit_completed'`
    - When a streak milestone is reached on a tracked habit, post `'streak_milestone'` activity
    - Integrate into existing `completeHabit` flow in `useHabitsWithSocial` or via the group service subscription
    - _Requirements: 5.4, 6.2_

  - [x] 8.2 Handle group end date expiration
    - Add logic to check and auto-end groups that have passed their `endDate`
    - Can be checked on group load or via a periodic check in `useGroups`
    - _Requirements: 7.4_

  - [x] 8.3 Implement 30-day data retention for ended groups
    - Ended groups remain queryable for 30 days (filter by `endedAt` date)
    - After 30 days, groups are excluded from queries (archival can be handled server-side later)
    - _Requirements: 7.6_

- [x] 9. Checkpoint — Ensure full integration works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Add Firestore indexes and security rules
  - [x] 10.1 Add required Firestore composite indexes
    - `groups`: `memberIds` (Array) + `status` (Ascending) + `updatedAt` (Descending)
    - `groupInvitations`: `toUserId` (Ascending) + `status` (Ascending) + `createdAt` (Descending)
    - `trackedHabits`: `groupId` (Ascending) + `userId` (Ascending)
    - `groupActivities`: `groupId` (Ascending) + `timestamp` (Descending)
    - Add index definitions to `firebase/firestore.indexes.json`
    - _Requirements: 5.4, 6.4, 9.2_

  - [x] 10.2 Add Firestore security rules for group collections
    - `groups`: Members can read, admin can write. Users can only join via invitation acceptance.
    - `groupInvitations`: Sender (admin) can create, recipient can update status, both can read.
    - `trackedHabits`: Owner can create/delete their own entries, group members can read.
    - `groupActivities`: Group members can read, system/members can create, no direct deletes.
    - Add rules to `firebase/firestore.rules`
    - _Requirements: 4.5, 7.2_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The implementation follows existing patterns: class-based services, useCallback/useEffect hooks, design system from theme.ts
- All UI components use the 8pt grid spacing system, Montserrat fonts, and the existing color palette
- Group invitations appear at the top of the Groups tab (not in Friend Requests), per design decision

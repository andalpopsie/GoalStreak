# Implementation Plan: Report and Block

## Overview

This plan implements report + block moderation across every social surface in Goalfer, following the "modify, don't multiply" rule. Pure logic (moderation types, the `ModerationFilter` module, and the block/teardown/report transition functions) is built and property-tested first so the filter-everywhere invariant is locked down before any UI wiring. Service extensions to `friendService` come next, then the `useModeration` hook, then integration of the filter into each social read, then UI actions on existing components plus the two new UI artifacts (`BlockedUsersScreen`, `ReportReasonSheet`), then the EULA gate, then Firestore security rules, and finally emulator integration tests and a full-suite checkpoint.

Property-based tests use fast-check + Jest (min 100 iterations), each tagged `Feature: report-and-block, Property N: ...`. Test sub-tasks are marked optional with `*`; core implementation tasks are not.

## Tasks

- [x] 1. Set up moderation types and test tooling
  - [x] 1.1 Add moderation types to `src/types/social.ts`
    - Add `Block`, `Report`, `ReportContentType`, `ReportReason`, `ReportStatus`, and `ModerationState` interfaces/types exactly as defined in the design's Components and Interfaces section
    - Keep additive — do not alter existing social types
    - _Requirements: 1.4, 4.5_

  - [x] 1.2 Install and configure fast-check for property-based tests
    - Add `fast-check` as a dev dependency (pinned version) via the project's package manager
    - Confirm it resolves under the existing Jest config (`config/jest.config.js`); no watch mode
    - _Requirements: (tooling for Properties 1-11)_

- [x] 2. Implement the pure ModerationFilter module
  - [x] 2.1 Create `src/services/moderationFilter.ts` with `isHidden` and all list filters
    - Implement `isHidden(state, authorId, contentId?)`: true when `authorId ∈ blockedUserIds` OR (`contentId` provided AND `contentId ∈ reportedContentIds`)
    - Implement pure `filterActivities`, `filterGroupActivities`, `filterMessages`, `filterSearchResults`, `filterFriendRequests`, `filterMembers` as `list.filter(item => !isHidden(...))`
    - No Firestore, no auth, no time access — pure functions only
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 5.1, 5.2_

  - [x] 2.2 Implement `filterReactions` in `src/services/moderationFilter.ts`
    - Return a new `Reactions` map omitting keys belonging to blocked users so downstream `getReactionCounts` yields blocked-free counts
    - _Requirements: 2.6_

  - [x]* 2.3 Write property test for filter-everywhere (bidirectional exclusion, exact)
    - **Property 1: Filter-everywhere (bidirectional exclusion, exact)** — filtered collection contains exactly items whose author is not in the bidirectional block set; generate the block set from unordered user pairs so both directions are exercised
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 3.6**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 1: ...`

  - [x]* 2.4 Write property test for reactions excluding blocked authors
    - **Property 2: Reactions exclude blocked authors** — resulting map has no blocked-user keys and counts equal counts over non-blocked reactions only
    - **Validates: Requirements 2.6**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 2: ...`

  - [x]* 2.5 Write property test for reported-content exclusion
    - **Property 3: Reported content is excluded from the reporter's view** — no item whose `contentId` is in the reported set survives; adding a newly reported id removes exactly that item next filter
    - **Validates: Requirements 5.1, 5.2**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 3: ...`

  - [x]* 2.6 Write property test for report auto-hide scoping
    - **Property 4: Report auto-hide is scoped to the reporting user** — a state containing the id excludes it; a different user's state without that id (and no block) retains it
    - **Validates: Requirements 5.3**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 4: ...`

  - [x]* 2.7 Write property test for no false exclusions
    - **Property 5: No false exclusions** — every item whose author is not blocked and whose `contentId` is not reported survives filtering
    - **Validates: Requirements 3.6**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 5: ...`

- [x] 3. Implement pure block/teardown/report transition functions
  - [x] 3.1 Add pure block-set transition helpers
    - Implement pure `block(set, A, B)` and `unblock(set, A, B)` transitions over an in-memory blocks dataset (idempotent add, exact-record removal) that `friendService` will reuse; keep them free of Firestore
    - _Requirements: 1.5, 3.3_

  - [x] 3.2 Add pure teardown-selection and Block_List helpers
    - Implement `selectTeardownRecords(records, A, B)` returning exactly the directional records (friendships / friend requests) linking A and B in either direction, and `selectOutgoingBlocks(blocks, u)` returning exactly records where `blockerId == u`
    - _Requirements: 1.8, 1.9, 3.2_

  - [x] 3.3 Add pure report-construction helper
    - Implement `buildReport(inputs)` mapping `reporterId`, `reportedUserId`, `contentType`, `contentId`, `reason`, setting `status: 'pending'` and a populated timestamp; when `contentType === 'user'`, `contentId` equals `reportedUserId`
    - _Requirements: 4.5, 4.9_

  - [x]* 3.4 Write property test for block idempotency
    - **Property 6: Block is idempotent** — applying `block(A, B)` twice equals applying once; set grows by at most one record
    - **Validates: Requirements 1.5**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 6: ...`

  - [x]* 3.5 Write property test for block/unblock round trip
    - **Property 7: Block then unblock is an identity round trip** — for a set without (A→B), `block` then `unblock` yields the original set; `unblock(A, B)` removes exactly the `blockerId==A && blockedUserId==B` record
    - **Validates: Requirements 3.3**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 7: ...`

  - [x]* 3.6 Write property test for Block_List selection
    - **Property 8: Block_List is exactly the user's outgoing blocks** — `selectOutgoingBlocks(u)` returns exactly `blockerId == u` records, none where `u` is only blocked and none from other blockers
    - **Validates: Requirements 3.2**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 8: ...`

  - [x]* 3.7 Write property test for teardown selection
    - **Property 9: Teardown selects exactly the records between the two users** — selected-for-deletion set equals exactly records linking A and B in either direction; no third-party record selected
    - **Validates: Requirements 1.8, 1.9**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 9: ...`

  - [x]* 3.8 Write property test for report construction
    - **Property 10: Report construction maps all fields** — constructed record carries input fields, `status: 'pending'`, populated `timestamp`; `contentType 'user'` ⇒ `contentId == reportedUserId`
    - **Validates: Requirements 4.5, 4.9**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 10: ...`

- [x] 4. Checkpoint - pure moderation logic verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend friendService with block operations
  - [x] 5.1 Implement `blockUser` with atomic batch teardown
    - In `src/services/friendService.ts`, implement `blockUser(blockerId, blockedUserId)`: single `writeBatch` that creates the `blocks` doc `{ blockerId, blockedUserId, createdAt: serverTimestamp() }`, deletes both friendship docs and any pending `friendRequests` in either direction (reuse `selectTeardownRecords` shape); idempotent pre-check so a repeat block leaves the list unchanged and reports success; rethrow on commit failure so nothing persists
    - _Requirements: 1.4, 1.5, 1.7, 1.8, 1.9_

  - [x] 5.2 Implement `unblockUser`, `getBlockedUsers`, and `isBlocked`
    - `unblockUser(blockerId, blockedUserId)` deletes the caller's own block doc (`blockerId == uid`); `getBlockedUsers(userId)` queries `where('blockerId','==',uid)` (reuse `selectOutgoingBlocks`); `isBlocked(userAId, userBId)` checks either-direction existence
    - _Requirements: 3.2, 3.3_

  - [x] 5.3 Implement `subscribeBlockSet` (bidirectional, live)
    - Attach `onSnapshot` listeners to `where('blockerId','==',uid)` and `where('blockedUserId','==',uid)`, union results into a single `Set<string>` and invoke the callback; retain last-known set on transient errors (mirror `subscribeFriends`/`subscribeToActivityFeed` error handling); return an unsubscribe function
    - _Requirements: 2.7, 2.8, 3.2_

  - [ ]* 5.4 Write unit tests for blockUser idempotency and error handling
    - Test idempotent repeat block (no second write, success), and that a failed commit leaves state unchanged and rethrows
    - _Requirements: 1.5, 1.7_

- [x] 6. Extend friendService with report operations
  - [x] 6.1 Implement `reportContent` and `reportUser` wrapper
    - `reportContent({ reporterId, reportedUserId, contentType, contentId, reason })` creates an immutable `reports` doc with `status: 'pending'` and `timestamp: serverTimestamp()`; repeatable with no uniqueness check; `reportUser(reporterId, reportedUserId, reason)` calls `reportContent` with `contentType: 'user'`, `contentId: reportedUserId`
    - _Requirements: 4.5, 4.8, 4.9_

  - [x] 6.2 Implement `getReportedContentIds` and `subscribeReportedContent`
    - Query/subscribe `where('reporterId','==',uid)`, expose the reported `contentId`s as a live `Set<string>`; retain last-known set on transient errors; return an unsubscribe function
    - _Requirements: 5.1, 5.2_

  - [ ]* 6.3 Write unit tests for report creation
    - Test `status: 'pending'` default, `user` contentType sets `contentId == reportedUserId`, repeated report resolves without error
    - _Requirements: 4.5, 4.8, 4.9_

- [x] 7. Implement the useModeration hook
  - [x] 7.1 Create `src/hooks/useModeration.ts`
    - Subscribe to `subscribeBlockSet` and `subscribeReportedContent` on mount, merge into one `ModerationState`, expose `{ state, ready, blockUser, unblockUser, reportContent }`; set `ready` only after the first block-set snapshot (fail-closed); apply optimistic local add on `blockUser`; clean up subscriptions on unmount
    - _Requirements: 2.7, 2.8, 5.1, 5.2_

  - [ ]* 7.2 Write unit tests for useModeration ready/fail-closed behavior
    - Test `ready` is false until first snapshot and true after; optimistic add reflected in `state`; unsubscribe on unmount
    - _Requirements: 2.7, 2.8_

- [x] 8. Integrate the filter into every social read surface
  - [x] 8.1 Filter the friend activity feed and reactions
    - In `ActivityFeedTab.tsx`, consume `useModeration` and pass results through `ModerationFilter.filterActivities` and `filterReactions` after each read/subscription callback; gate render on `ready`
    - _Requirements: 2.1, 2.6, 2.8, 5.1, 5.2_

  - [x] 8.2 Filter the group activity feed
    - In `GroupsTab.tsx` (group feed read path), pass group activities through `ModerationFilter.filterGroupActivities`; gate render on `ready`
    - _Requirements: 2.2, 2.8, 5.1, 5.2_

  - [x] 8.3 Filter group chat messages
    - In `GroupChatTab.tsx`, pass messages through `ModerationFilter.filterMessages`; gate render on `ready`
    - _Requirements: 2.3, 2.8, 5.1, 5.2_

  - [x] 8.4 Filter friend search results and friend requests
    - In `AddFriendModal.tsx` apply `filterSearchResults`; in `FriendsTab.tsx` apply `filterFriendRequests` to incoming and outgoing lists
    - _Requirements: 2.4, 2.5, 2.8_

  - [ ]* 8.5 Write unit tests for feed/search/request filtering integration
    - Assert blocked-authored items and reported content are absent from rendered results across the surfaces, and non-blocked content is retained (R3.6)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.6_

- [x] 9. Checkpoint - filtering wired into all surfaces
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Add block/report UI actions to existing components
  - [x] 10.1 Add block + report actions to ProfileScreen
    - In `ProfileScreen.tsx`, add an overflow (`⋯`) menu for other users' profiles with "Block user" (confirm dialog → `blockUser`) and "Report user" (opens `ReportReasonSheet`, `contentType: 'user'`); use theme tokens, destructive uses `Colors.error`, touch targets ≥ 48px; link to `BlockedUsersScreen`
    - _Requirements: 1.1, 4.1_

  - [x] 10.2 Add report action to ActivityCard
    - In `ActivityCard.tsx`, add `onReport`/`onBlock` via `⋯`/long-press targeting `contentType: 'activity'`
    - _Requirements: 4.2_

  - [x] 10.3 Add report action to GroupFeedCard
    - In `GroupFeedCard.tsx`, add `⋯` action targeting `contentType: 'group_activity'`
    - _Requirements: 4.3_

  - [x] 10.4 Add block + report actions to GroupChatTab messages
    - In `GroupChatTab.tsx`, long-press a message bubble (author other than self) → block author / report `contentType: 'group_message'`
    - _Requirements: 1.3, 4.4_

  - [x] 10.5 Add block action to the group member list (self-excluded)
    - In `GroupProgressCard.tsx`, add a per-member `⋯` block action for every member except the current user
    - _Requirements: 1.2_

  - [ ]* 10.6 Write property test for block action self-exclusion
    - **Property 11: Block action self-exclusion** — the set of members offered a block action equals the full member set minus the current user
    - **Validates: Requirements 1.2**
    - fast-check, min 100 iterations, tag `Feature: report-and-block, Property 11: ...`

  - [ ]* 10.7 Write example tests for action presence and contentType targeting
    - RNTL: report action present with correct `contentType` on `ProfileScreen`, `ActivityCard`, `GroupFeedCard`, `GroupChatTab`; block action present on profile, member list (not self), chat messages
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4_

- [x] 11. Build the ReportReasonSheet and confirmation/error feedback
  - [x] 11.1 Create `src/components/social/ReportReasonSheet.tsx`
    - ActionSheet-style modal reason picker over the `ReportReason` enum + confirm; on confirm calls `reportContent`; success shows "Thanks for reporting. We'll review this." and (for content types) removes the item from the reporter's view; failure shows "Couldn't submit report. Please try again." with no auto-hide; theme tokens throughout
    - _Requirements: 4.5, 4.6, 4.7, 5.1_

  - [x] 11.2 Wire block confirmation and error feedback
    - Block confirm dialog ("Block {name}? You'll stop seeing each other.") → success "You blocked {name}"; failure "Couldn't block user. Please try again." with no state change; destructive actions separated from confirm buttons per UX standards
    - _Requirements: 1.6, 1.7_

  - [ ]* 11.3 Write example tests for feedback flows
    - RNTL: confirmation shown on block/report success; error shown on failure; repeated report resolves without error
    - _Requirements: 1.6, 1.7, 4.6, 4.7, 4.8_

- [x] 12. Build the BlockedUsersScreen (manage blocked list)
  - [x] 12.1 Create `src/screens/BlockedUsersScreen.tsx`
    - List the current user's Block_List from `getBlockedUsers`/`useModeration`; per-row unblock button with confirm dialog → `unblockUser`; on success remove the row + confirmation; on failure retain the row + error; empty state; standard list recipe (`paddingVertical: 16`, `paddingHorizontal: 24`, `minHeight: 56`, `borderBottomColor: '#E8E8E8'`); linked from `ProfileScreen`/Settings and registered in navigation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 12.2 Write example tests for BlockedUsersScreen
    - RNTL: renders each Block_List entry; unblock removes a row on success and shows confirmation; failure retains the row and shows error
    - _Requirements: 3.1, 3.4, 3.5_

- [x] 13. Implement the EULA zero-tolerance gate
  - [x] 13.1 Add the zero-tolerance clause to the terms document
    - Add zero-tolerance-for-objectionable-content-and-abusive-behavior clause to `app-store-assets/metadata/terms-of-service.md` (existing terms doc served at the in-app terms link)
    - _Requirements: 7.1, 7.3_

  - [x] 13.2 Add the acceptance checkbox gate to SignUpScreen
    - In `SignUpScreen.tsx`, add a required acceptance checkbox ("I agree to the Terms of Service, including zero tolerance for objectionable content and abusive behavior."); disable "Create Account" and guard `handleSignUp` until checked; ensure the existing terms link opens the terms content
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 13.3 Persist EULA acceptance in useAuth.signUp
    - In `useAuth.signUp`, on successful signup write `eulaAcceptedAt: serverTimestamp()` and `eulaVersion: '1.0'` on the `users` doc
    - _Requirements: 7.2_

  - [ ]* 13.4 Write example tests for the EULA gate
    - RNTL: acceptance control present; "Create Account" blocked until accepted; terms clause text present; terms link opens
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 14. Add and test Firestore security rules for blocks and reports
  - [x] 14.1 Add blocks and reports rules to firestore.rules
    - In `firebase/firestore.rules`, add the `blocks` match block (read if `blockerId == uid || blockedUserId == uid`; create if `request.resource.data.blockerId == uid`; delete if `resource.data.blockerId == uid`; `update: if false`) and the `reports` match block (read own where `reporterId == uid`; create if `request.resource.data.reporterId == uid`; `update, delete: if false`)
    - Add a deploy note: `firebase deploy --only firestore:rules` from `GoalStreakApp/firebase/`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x]* 14.2 Write security rules tests with @firebase/rules-unit-testing
    - `blocks`: create/delete allowed only when `blockerId == uid`; read allowed for both blocker and blocked party; unrelated third party denied read and delete; update always denied
    - `reports`: create allowed only when `reporterId == uid`; unauthenticated create denied; reporter reads own report, others cannot; update and delete always denied
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [x] 15. Write emulator integration tests for service writes
  - [x]* 15.1 Integration test for blockUser teardown
    - Against the Firebase emulator: `blockUser` writes the block doc with correct fields and, in the same batch, removes both friendship docs and pending requests between the pair while leaving third-party relationships intact
    - _Requirements: 1.4, 1.8, 1.9_

  - [x]* 15.2 Integration test for reportContent persistence
    - Against the emulator: `reportContent` persists a record with `status: 'pending'` and a server timestamp
    - _Requirements: 4.5_

- [x] 16. Final checkpoint - full suite green
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for a faster MVP, but they cover the design's Correctness Properties (1-11), UI presence/feedback, security rules, and emulator integration.
- Each property test uses fast-check with a minimum of 100 iterations and is tagged `Feature: report-and-block, Property N: ...`.
- Pure logic (types, `ModerationFilter`, transition functions) and its property tests are built before any UI wiring so the filter-everywhere invariant is verified early.
- All new UI uses `theme.ts` tokens, 8pt-grid spacing, and ≥ 48px touch targets per the UI/UX standards; destructive actions require confirmation and are separated from confirm buttons.
- No new composite indexes are required (all block/report reads are single-field equality queries); `firestore.indexes.json` is unchanged.
- The security-rules change requires a deploy: `firebase deploy --only firestore:rules` from `GoalStreakApp/firebase/`.
- Emulator tests (rules 14.2, integration 15.1/15.2) run under a separate node config (`config/jest.emulator.config.js`) via `npm run test:emulator` from `GoalStreakApp/`. They require a JRE (Java 11+) on `PATH` for the Firestore emulator, and are excluded from the default `npm test` (RN/jsdom) run. Result: 2 suites, 20 assertions passing against the emulator.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "13.1", "14.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "2.7", "3.4", "3.5", "3.6", "3.7", "3.8", "14.2"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "6.1", "6.2"] },
    { "id": 4, "tasks": ["5.4", "6.3", "7.1", "15.1", "15.2"] },
    { "id": 5, "tasks": ["7.2", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 6, "tasks": ["8.5", "10.2", "10.3", "10.4", "10.5", "11.1"] },
    { "id": 7, "tasks": ["10.1", "10.6", "11.2", "12.1", "13.2", "13.3"] },
    { "id": 8, "tasks": ["10.7", "11.3", "12.2", "13.4"] }
  ]
}
```

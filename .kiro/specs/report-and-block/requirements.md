# Requirements Document

## Introduction

Goalfer is a React Native + Expo (SDK 54) + Firebase (Firestore) iOS habit-tracking app with user-generated content (UGC) and social features: a friends system with an activity feed, accountability groups with a group activity feed and group chat, and user profiles. The app currently has no moderation tooling, which blocks App Store submission under Apple App Review Guideline 1.2. Guideline 1.2 requires apps with UGC or messaging to provide a mechanism for users to block abusive users, a mechanism to report objectionable content, and an agreement (EULA) where users accept that there is no tolerance for objectionable content or abusive behavior.

This feature adds report and block moderation across every existing social surface. The central correctness guarantee is the "filter everywhere" invariant: once two users are in a block relationship, neither party sees the other's content, presence, or interactions in any feed, list, chat, or search. The feature also adds user/content reporting that persists to a Firestore `reports` collection, an unblock/manage-blocked-list capability, and an updated EULA surfaced to users. Implementation must follow the "modify, don't multiply" rule — extending `friendService`, `groupService`, and existing components rather than creating parallel files — and must use the shared design system from `src/constants/theme.ts`.

## Glossary

- **Blocker**: An authenticated user who initiates a block against another user.
- **Blocked_User**: A user who is the target of a block initiated by a Blocker.
- **Block_Relationship**: A directional block record stored in the `blocks` collection with fields `blockerId`, `blockedUserId`, and `createdAt`. Two users are "in a block relationship" when a block record exists in either direction between them.
- **Block_List**: The set of `blocks` records where the current user is the `blockerId`; the collection of users a given user has blocked.
- **Reporter**: An authenticated user who submits a report about another user or a piece of content.
- **Reported_User**: The user who is the subject of a report (the content author, or the profile owner).
- **Report_Record**: A document in the `reports` collection with fields `reporterId`, `reportedUserId`, `contentType`, `contentId`, `reason`, `timestamp`, and `status`.
- **Content_Type**: The category of the reported item. Allowed values: `user`, `activity`, `group_activity`, `group_message`.
- **Social_Surface**: Any feature area that displays other users or their content: the friend activity feed (`activities`), the group activity feed (`groupActivities`), group chat (`groups/{groupId}/messages`), friend search results, friend requests, and the group member list.
- **Block_Service**: The service layer responsible for block/unblock operations and block-relationship lookups (implemented by extending `friendService`).
- **Report_Service**: The service layer responsible for creating and retrieving report records (implemented by extending `friendService`/`groupService`).
- **EULA**: The end-user license agreement / terms of use, including the zero-tolerance clause for objectionable content and abusive behavior.
- **Goalfer_App**: The Goalfer client application, encompassing its screens, services, and Firestore security rules.

## Requirements

### Requirement 1: Block a User

**User Story:** As a user, I want to block another user from their profile, the group member list, or their chat messages, so that I stop seeing that user and stop interacting with them.

#### Acceptance Criteria

1. WHERE a user profile is displayed, THE Goalfer_App SHALL present a block action for the profile owner.
2. WHERE the group member list is displayed, THE Goalfer_App SHALL present a block action for each member other than the current user.
3. WHERE a group chat message is displayed, THE Goalfer_App SHALL present a block action for the message author other than the current user.
4. WHEN a Blocker confirms a block against a Blocked_User, THE Block_Service SHALL create a Block_Relationship record containing `blockerId` equal to the Blocker identifier, `blockedUserId` equal to the Blocked_User identifier, and `createdAt` equal to the server timestamp.
5. WHEN a Blocker confirms a block against a user with whom a Block_Relationship already exists in the same direction, THE Block_Service SHALL leave the Block_List unchanged and report success.
6. WHEN a block operation completes, THE Goalfer_App SHALL display a confirmation message to the Blocker.
7. IF the block operation fails to persist, THEN THE Goalfer_App SHALL display an error message to the Blocker AND SHALL leave the Block_List unchanged.
8. WHEN a Blocker confirms a block against a Blocked_User with whom the Blocker has an existing friend relationship, THE Block_Service SHALL remove the friend relationship records between the two users.
9. WHEN a Blocker confirms a block against a Blocked_User with whom a pending friend request exists in either direction, THE Block_Service SHALL remove the pending friend request records between the two users.

### Requirement 2: Filter Blocked Users Everywhere (Bidirectional)

**User Story:** As a user, I want a blocked user and I to be hidden from each other everywhere, so that neither of us sees the other's content or interactions after a block.

#### Acceptance Criteria

1. WHILE a Block_Relationship exists between two users, THE Goalfer_App SHALL exclude activities authored by either user from the other user's friend activity feed.
2. WHILE a Block_Relationship exists between two users, THE Goalfer_App SHALL exclude group activities authored by either user from the other user's group activity feed.
3. WHILE a Block_Relationship exists between two users, THE Goalfer_App SHALL exclude group chat messages authored by either user from the other user's view of group chat.
4. WHILE a Block_Relationship exists between two users, THE Goalfer_App SHALL exclude each user from the other user's friend search results.
5. WHILE a Block_Relationship exists between two users, THE Goalfer_App SHALL exclude friend requests originating from either user from the other user's incoming and outgoing friend request lists.
6. WHILE a Block_Relationship exists between two users, THE Goalfer_App SHALL exclude reactions authored by either user from the reaction counts and reaction indicators the other user sees.
7. WHILE a Block_Relationship exists between two users, THE Goalfer_App SHALL apply the exclusions in acceptance criteria 1 through 6 regardless of which user was the Blocker (bidirectional effect).
8. FOR ALL Social_Surface results returned to a user, THE Goalfer_App SHALL exclude every item authored by any user with whom the requesting user is in a Block_Relationship (the filter-everywhere invariant).

### Requirement 3: Unblock a User and Manage the Blocked List

**User Story:** As a user, I want to view and manage the users I have blocked, so that I can unblock someone if I choose.

#### Acceptance Criteria

1. WHERE the blocked-list management view is displayed, THE Goalfer_App SHALL list each user in the current user's Block_List.
2. WHEN a user opens the blocked-list management view, THE Block_Service SHALL return the set of `blocks` records where the current user is the `blockerId`.
3. WHEN a user confirms an unblock action for a Blocked_User, THE Block_Service SHALL remove the Block_Relationship record where the current user is the `blockerId` and the target is the `blockedUserId`.
4. WHEN an unblock operation completes, THE Goalfer_App SHALL remove the unblocked user from the displayed Block_List AND SHALL display a confirmation message.
5. IF an unblock operation fails to persist, THEN THE Goalfer_App SHALL display an error message AND SHALL retain the user in the displayed Block_List.
6. WHILE no Block_Relationship exists between two users, THE Goalfer_App SHALL include each user's content in the other user's Social_Surface results according to existing visibility rules.

### Requirement 4: Report a User or Content

**User Story:** As a user, I want to report a user or a specific piece of content, so that objectionable content and abusive behavior can be reviewed.

#### Acceptance Criteria

1. WHERE a user profile is displayed, THE Goalfer_App SHALL present a report action that targets the profile owner with Content_Type `user`.
2. WHERE an activity item is displayed, THE Goalfer_App SHALL present a report action that targets the activity with Content_Type `activity`.
3. WHERE a group activity item is displayed, THE Goalfer_App SHALL present a report action that targets the group activity with Content_Type `group_activity`.
4. WHERE a group chat message is displayed, THE Goalfer_App SHALL present a report action that targets the message with Content_Type `group_message`.
5. WHEN a Reporter submits a report, THE Report_Service SHALL create a Report_Record containing `reporterId` equal to the Reporter identifier, `reportedUserId` equal to the Reported_User identifier, `contentType` equal to the selected Content_Type, `contentId` equal to the reported item identifier, `reason` equal to the Reporter-provided reason, `timestamp` equal to the server timestamp, and `status` equal to `pending`.
6. WHEN a report is successfully persisted, THE Goalfer_App SHALL display a confirmation message to the Reporter.
7. IF a report fails to persist, THEN THE Goalfer_App SHALL display an error message to the Reporter.
8. WHEN a Reporter submits a report for a content item the Reporter has already reported, THE Report_Service SHALL persist the report without error (repeated reporting is tolerated).
9. WHEN a Reporter submits a report for a `user` Content_Type, THE Goalfer_App SHALL set `contentId` equal to the Reported_User identifier.

### Requirement 5: Auto-Hide Reported Content from the Reporter's View

**User Story:** As a user, I want content I reported to disappear from my own view, so that I do not have to keep seeing objectionable content while it is reviewed.

#### Acceptance Criteria

1. WHEN a Reporter successfully reports an `activity`, `group_activity`, or `group_message` item, THE Goalfer_App SHALL exclude that item from the Reporter's subsequent Social_Surface results.
2. WHILE a Report_Record authored by the current user exists for a content item, THE Goalfer_App SHALL exclude that content item from the current user's Social_Surface results.
3. THE Goalfer_App SHALL apply the exclusion in acceptance criterion 1 only to the Reporter's view AND SHALL leave the content visible to other users who are not in a Block_Relationship with the author.

### Requirement 6: Firestore Security Rules for Reports and Blocks

**User Story:** As the app operator, I want security rules that let users manage only their own reports and blocks, so that moderation data is protected and Apple 1.2 requirements are backed by enforced access control.

#### Acceptance Criteria

1. WHEN a user creates a Report_Record, THE Goalfer_App SHALL permit the write only where the record `reporterId` equals the authenticated user identifier.
2. IF an unauthenticated request attempts to create a Report_Record, THEN THE Goalfer_App SHALL deny the write.
3. WHEN a user creates a Block_Relationship record, THE Goalfer_App SHALL permit the write only where the record `blockerId` equals the authenticated user identifier.
4. WHEN a user reads a Block_Relationship record, THE Goalfer_App SHALL permit the read where the authenticated user identifier equals either the `blockerId` or the `blockedUserId` of the record.
5. WHEN a user deletes a Block_Relationship record, THE Goalfer_App SHALL permit the delete only where the `blockerId` equals the authenticated user identifier.
6. IF a user attempts to read a Block_Relationship record where the authenticated user identifier equals neither the `blockerId` nor the `blockedUserId`, THEN THE Goalfer_App SHALL deny the read.
7. IF a user attempts to delete a Block_Relationship record where the `blockerId` does not equal the authenticated user identifier, THEN THE Goalfer_App SHALL deny the delete.
8. IF a user attempts to update a Block_Relationship record, THEN THE Goalfer_App SHALL deny the update.
9. IF a user attempts to update or delete a Report_Record, THEN THE Goalfer_App SHALL deny the operation.

#### Privacy Note (minimal-exposure design)

Allowing the Blocked_User to read a Block_Relationship record (acceptance criterion 4) is required by the bidirectional filter-everywhere invariant in Requirement 2: the blocked party's client must be able to learn that a block exists in order to hide the Blocker. To keep this exposure minimal:

- A Block_Relationship record stores only the two user identifiers (`blockerId`, `blockedUserId`) and a timestamp (`createdAt`). It carries NO reason or free-text field; reasons exist only on Report_Records, which are readable solely by their Reporter.
- A block is never surfaced in the Blocked_User's user interface. Filtering is a silent hide: no notification, badge, or message informs the Blocked_User that a block occurred.
- User identifiers stored in Block_Relationship and Report_Record documents are opaque Firebase UIDs, not names, emails, or other personally identifying values.

### Requirement 7: EULA with Zero-Tolerance Clause

**User Story:** As the app operator, I want an updated EULA stating zero tolerance for objectionable content and abusive behavior surfaced to users, so that the app satisfies the agreement requirement of Apple Guideline 1.2.

#### Acceptance Criteria

1. THE Goalfer_App SHALL include EULA content stating that there is zero tolerance for objectionable content and abusive behavior.
2. WHEN a new user completes signup, THE Goalfer_App SHALL present the EULA content to the user for acceptance.
3. WHEN a user requests the terms from within the app, THE Goalfer_App SHALL display the EULA content.
4. IF a new user does not accept the EULA during signup, THEN THE Goalfer_App SHALL prevent completion of account creation.

## Future Enhancements (out of scope for this spec)

The following items are intentionally deferred as post-launch fast-follows. They are NOT part of this feature and are documented here only to record known follow-up work:

- **Server-side moderation filtering via Cloud Functions.** Migrate block/report filtering from the client to Cloud Functions so that content authored by a user in a Block_Relationship is stripped before it reaches the other party's client. This would eliminate the client-side exposure of Block_Relationship records to the Blocked_User entirely (removing the need for acceptance criterion 4 of Requirement 6), at the cost of introducing server-side infrastructure that the current client-only Firebase app does not use.
- **Admin review and auto-actioning of reports.** Add moderator tooling to review Report_Records and take automated or manual action (for example, transitioning `status` beyond `pending`, suspending accounts, or removing content). This spec only persists reports with `status` `pending`; no review workflow is included.

These enhancements are a post-launch fast-follow and are not required to satisfy Apple App Review Guideline 1.2 for this release.

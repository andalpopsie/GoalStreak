# Requirements Document

## Introduction

Accountability Groups is a social feature for the Goalfer app that allows users to form small groups around shared goals — study groups, running groups, wellness circles, etc. Group members can monitor each other's habit progress, encourage one another, and hold each other accountable. Groups can have a fixed end date (e.g., a 30-day challenge) or run indefinitely until the group admin ends them. This feature lives within the existing Social tab alongside the friends system and activity feed.

## Glossary

- **Group**: A named accountability group containing 2–10 members who track shared habits together
- **Group_Admin**: The user who created the Group and has permissions to manage it (invite/remove members, edit settings, end the Group)
- **Group_Member**: A user who has accepted an invitation to join a Group
- **Group_Invitation**: A request sent by the Group_Admin to a friend, asking them to join a Group
- **Group_Feed**: A filtered activity feed showing only habit completions and milestones from Group_Members for habits tracked within that Group
- **Tracked_Habit**: A habit that a Group_Member has linked to a Group for accountability tracking
- **Group_Service**: The service layer responsible for all Group CRUD operations, invitations, and feed management (extends the existing friendService pattern)
- **Social_Screen**: The existing Social tab screen that contains the Feed and Friends tabs
- **Firestore**: The Firebase Cloud Firestore database used for all persistent data storage
- **Group_Progress**: An aggregated view showing each Group_Member's completion status for their Tracked_Habits over a given period

## Requirements

### Requirement 1: Create Accountability Group

**User Story:** As a user, I want to create an accountability group with a name, description, and optional end date, so that I can organize a focused accountability circle around shared goals.

#### Acceptance Criteria

1. WHEN a user taps the create group button, THE Social_Screen SHALL display a group creation form with fields for group name, description, category, and optional end date
2. THE Group_Service SHALL require a group name between 3 and 50 characters
3. THE Group_Service SHALL require a group description of at most 200 characters
4. WHEN a user submits a valid group creation form, THE Group_Service SHALL create a new Group document in Firestore with the creator set as Group_Admin
5. WHEN no end date is provided, THE Group_Service SHALL create the Group with an indefinite duration
6. WHEN an end date is provided, THE Group_Service SHALL validate that the end date is at least 1 day in the future
7. THE Group_Service SHALL limit each user to a maximum of 5 active Groups (as admin or member combined)
8. IF a user attempts to create a Group while already at the 5-group limit, THEN THE Group_Service SHALL return a descriptive error message indicating the limit has been reached

### Requirement 2: Invite Members to Group

**User Story:** As a group admin, I want to invite my existing friends to join my accountability group, so that we can track habits together.

#### Acceptance Criteria

1. WHEN a Group_Admin opens the group detail screen, THE Social_Screen SHALL display an invite button that shows a list of the admin's friends who are not already members of that Group
2. WHEN a Group_Admin selects a friend to invite, THE Group_Service SHALL create a Group_Invitation document in Firestore
3. THE Group_Service SHALL limit each Group to a maximum of 10 members (including the Group_Admin)
4. IF a Group_Admin attempts to invite a user when the Group already has 10 members, THEN THE Group_Service SHALL return a descriptive error indicating the group is full
5. THE Group_Service SHALL prevent duplicate invitations to the same user for the same Group
6. WHEN a Group_Invitation is created, THE Group_Service SHALL generate a notification for the invited user

### Requirement 3: Respond to Group Invitation

**User Story:** As a user, I want to accept or decline group invitations, so that I can choose which accountability groups to join.

#### Acceptance Criteria

1. WHEN a user has pending Group_Invitations, THE Social_Screen SHALL display the invitations with the group name, description, admin name, and member count
2. WHEN a user accepts a Group_Invitation, THE Group_Service SHALL add the user as a Group_Member and update the Group document in Firestore
3. WHEN a user declines a Group_Invitation, THE Group_Service SHALL mark the invitation as declined and remove it from the pending list
4. IF a user accepts a Group_Invitation when the Group already has 10 members, THEN THE Group_Service SHALL return a descriptive error indicating the group is full and mark the invitation as expired
5. IF a user accepts a Group_Invitation when the user is already at the 5-group limit, THEN THE Group_Service SHALL return a descriptive error indicating the user's group limit has been reached

### Requirement 4: Link Habits to Group

**User Story:** As a group member, I want to link one or more of my existing habits to the group, so that my progress on those habits is visible to other group members.

#### Acceptance Criteria

1. WHEN a Group_Member opens the group detail screen, THE Social_Screen SHALL display an option to link existing habits to the Group
2. WHEN a Group_Member selects habits to link, THE Group_Service SHALL create Tracked_Habit associations between the selected habits and the Group in Firestore
3. THE Group_Service SHALL allow each Group_Member to link between 1 and 6 habits to a single Group
4. WHEN a Group_Member unlinks a habit from a Group, THE Group_Service SHALL remove the Tracked_Habit association and stop sharing that habit's progress with the Group
5. THE Group_Service SHALL only allow linking habits owned by the Group_Member

### Requirement 5: View Group Progress

**User Story:** As a group member, I want to see the habit completion progress of all group members, so that I can stay motivated and hold others accountable.

#### Acceptance Criteria

1. WHEN a Group_Member opens the group detail screen, THE Social_Screen SHALL display a Group_Progress view showing each member's Tracked_Habits and their completion status for the current day
2. THE Social_Screen SHALL display each Group_Member's current streak count for each Tracked_Habit
3. THE Social_Screen SHALL display a group-level completion summary showing the percentage of Tracked_Habits completed today across all members
4. WHEN a Group_Member completes a Tracked_Habit, THE Group_Service SHALL update the Group_Feed in real time for all other Group_Members
5. THE Social_Screen SHALL visually distinguish completed habits from incomplete habits using the existing teal (#4A90A4) success color and the design system's visual hierarchy

### Requirement 6: Group Activity Feed

**User Story:** As a group member, I want to see a dedicated activity feed for my group, so that I can follow group-specific progress without noise from the main feed.

#### Acceptance Criteria

1. WHEN a Group_Member opens the group detail screen, THE Social_Screen SHALL display a Group_Feed tab showing only activities from Group_Members related to their Tracked_Habits
2. THE Group_Feed SHALL display habit completions, streak milestones, and group join events
3. WHEN a Group_Member reacts to a Group_Feed item, THE Group_Service SHALL store the reaction using the existing reaction system (heart, flame, medal)
4. THE Group_Feed SHALL load activities in pages of 20 items, consistent with the existing activity feed pagination

### Requirement 7: Manage Group as Admin

**User Story:** As a group admin, I want to manage my group by removing members, editing group details, and ending the group, so that I can maintain a healthy accountability environment.

#### Acceptance Criteria

1. WHEN a Group_Admin opens the group settings, THE Social_Screen SHALL display options to edit the group name, description, and end date
2. WHEN a Group_Admin removes a Group_Member, THE Group_Service SHALL remove the member's Tracked_Habit associations and remove the member from the Group document in Firestore
3. WHEN a Group_Admin ends a Group, THE Group_Service SHALL mark the Group as ended and prevent new activity from being posted to the Group_Feed
4. WHEN a Group reaches its end date, THE Group_Service SHALL automatically mark the Group as ended
5. IF the Group_Admin leaves or is the only remaining member, THEN THE Group_Service SHALL mark the Group as ended
6. THE Group_Service SHALL retain ended Group data for 30 days so members can view historical progress before the data is archived

### Requirement 8: Leave Group as Member

**User Story:** As a group member, I want to leave a group at any time, so that I can manage my accountability commitments.

#### Acceptance Criteria

1. WHEN a Group_Member opens the group settings, THE Social_Screen SHALL display a leave group option
2. WHEN a Group_Member confirms leaving a Group, THE Group_Service SHALL remove the member and their Tracked_Habit associations from the Group
3. WHEN a Group_Member leaves a Group, THE Group_Service SHALL post a system event to the Group_Feed indicating the member has left
4. THE Social_Screen SHALL require confirmation before processing a leave group action

### Requirement 9: Display Groups in Social Tab

**User Story:** As a user, I want to see my accountability groups in the Social tab, so that I can quickly access them alongside my friends and activity feed.

#### Acceptance Criteria

1. THE Social_Screen SHALL display a "Groups" tab alongside the existing "Feed" and "Friends" tabs
2. WHEN a user opens the Groups tab, THE Social_Screen SHALL display a list of the user's active Groups with group name, member count, and today's group completion percentage
3. WHEN a user taps on a Group in the list, THE Social_Screen SHALL navigate to the group detail screen
4. WHEN a user has pending Group_Invitations, THE Social_Screen SHALL display a badge on the Groups tab indicating the number of pending invitations
5. WHEN a user has no Groups and no pending invitations, THE Social_Screen SHALL display an empty state with a prompt to create a group or wait for invitations

### Requirement 10: Group Notifications

**User Story:** As a group member, I want to receive notifications about group activity, so that I stay engaged and accountable.

#### Acceptance Criteria

1. WHEN a Group_Member has not completed any Tracked_Habits by a configurable reminder time, THE Group_Service SHALL send a gentle reminder notification referencing the Group name
2. WHEN all Group_Members complete their Tracked_Habits for the day, THE Group_Service SHALL send a celebration notification to all members
3. WHEN a new member joins a Group, THE Group_Service SHALL notify all existing Group_Members
4. THE Group_Service SHALL respect the user's existing notification settings and not send group notifications if the user has disabled social notifications
5. THE Group_Service SHALL limit group-related notifications to a maximum of 3 per Group per day to avoid notification fatigue

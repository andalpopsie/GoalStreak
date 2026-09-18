# Requirements Document

## Introduction

The Founding Member program rewards the first 100 people who create a Goalfer app account after the official launch timestamp. It spans two sub-projects: the React Native app (`GoalStreakApp`) and the Next.js landing page (`goalfer-landing`).

Eligibility is triggered by app account creation across all sign-up methods (email/password, Apple Sign-In, Google Sign-In). Membership is capped at exactly 100 and is claimed atomically via a Firebase Cloud Function so that no two accounts can receive the same founding number and the 100th slot cannot be double-granted. This introduces the project's first Cloud Function (Blaze plan confirmed).

Each founding member receives two perks: (1) one year of Goalfer Pro, delivered as a RevenueCat promotional entitlement so the app's existing entitlement-based gating (RevenueCat as the single source of truth for `isPro`) works unchanged, and (2) a permanent founding badge and number that is decoupled from the Pro subscription and persists forever, including after the one-year Pro perk lapses. The app celebrates the moment at signup and displays the badge on the member's profile and in the social feed. The landing page shows a live "X of 100 founding spots left" scarcity counter that switches to a sold-out state when all spots are claimed.

## Glossary

- **Founding_Function**: The Firebase Cloud Function that triggers on Firebase Auth account creation, evaluates eligibility, atomically claims a founding slot, grants the Pro perk, and writes the founding record.
- **Founding_Member**: A user who has been assigned a permanent founding number between 1 and 100 inclusive.
- **Founding_Number**: A permanent integer identifier. 0 indicates a non-founding account; 1–100 inclusive indicates a Founding_Member, assigned in claim order.
- **Launch_Timestamp (T0)**: A configured UTC timestamp stored in Firestore config that marks the start of the eligibility window. Only accounts created at or after T0 are eligible.
- **Founding_Counter**: The Firestore document `counters/foundingMembers` holding the `claimed` count (0–100) of assigned founding slots.
- **Founding_Cap**: The fixed maximum of 100 founding slots.
- **Pro_Perk**: One year of Goalfer Pro access delivered via a RevenueCat promotional entitlement using the `pro` entitlement identifier.
- **RevenueCat_API**: The RevenueCat REST API, called server-side from the Founding_Function using the RevenueCat secret key.
- **Founding_Badge**: The permanent visual badge and number shown on a Founding_Member's profile and social feed entries, independent of Pro status.
- **User_Profile**: The Firestore document `userProfiles/{uid}` storing user profile data, including the founding member fields.
- **Founding_Record**: The `foundingMember` object stored on the User_Profile: `{ number, grantedAt, proExpiresAt }`, plus a boolean `foundingMember` flag.
- **isPro**: The boolean derived by the app from RevenueCat's active entitlements; the single source of truth for Pro feature gating.
- **Habit_Service**: `habitService`, which enforces the tier-specific habit limit and throws `HabitLimitError` when the limit is reached.
- **Landing_Counter**: The scarcity indicator on the landing page that reads the Founding_Counter and displays remaining spots or a sold-out state.
- **Celebration_Screen**: The onboarding moment shown to a new Founding_Member immediately after signup announcing their Founding_Number.

## Requirements

### Requirement 1: Eligibility on Account Creation

**User Story:** As a new user signing up after launch, I want my account creation to be evaluated for founding membership regardless of how I sign up, so that the program is fair across all authentication methods.

#### Acceptance Criteria

1. WHEN a Firebase Auth account is created, THE Founding_Function SHALL evaluate the account for founding membership eligibility within 60 seconds of the account-creation event.
2. WHEN accounts are created via email/password, Apple Sign-In, and Google Sign-In with the same account creation timestamp and the same Founding_Counter `claimed` value, THE Founding_Function SHALL produce an identical, observable eligibility outcome across all three authentication methods.
3. IF the account creation timestamp is strictly earlier than the Launch_Timestamp, THEN THE Founding_Function SHALL NOT assign a Founding_Number and SHALL record no Founding_Record.
4. WHEN the account creation timestamp is at or after the Launch_Timestamp (where a timestamp exactly equal to the Launch_Timestamp is eligible) AND the Founding_Counter `claimed` value is less than the Founding_Cap, THE Founding_Function SHALL proceed to claim a founding slot.
5. IF the Founding_Counter `claimed` value equals the Founding_Cap, THEN THE Founding_Function SHALL leave the account as a non-founding user with a Founding_Number of 0, no Founding_Record, and the `foundingMember` flag set to false or omitted.
6. IF the Founding_Counter cannot be read during evaluation, THEN THE Founding_Function SHALL leave the account as a non-founding user with no Founding_Number, SHALL leave the Founding_Counter `claimed` value unchanged, and SHALL record an error.

### Requirement 2: Launch Timestamp Configuration

**User Story:** As the product owner, I want the eligibility clock to start at a configured launch timestamp, so that pre-launch demo and test accounts are excluded and the start time is transparent.

#### Acceptance Criteria

1. WHEN the Founding_Function begins evaluating an account's founding eligibility, THE Founding_Function SHALL read the Launch_Timestamp from Firestore configuration as an ISO 8601 timestamp in UTC.
2. IF the Launch_Timestamp configuration value is absent or cannot be parsed as an ISO 8601 UTC timestamp, THEN THE Founding_Function SHALL treat all accounts as ineligible and SHALL leave the Founding_Counter `claimed` value unchanged.
3. IF the Launch_Timestamp configuration value is absent or cannot be parsed as an ISO 8601 UTC timestamp, THEN THE Founding_Function SHALL record a configuration error indicating that the Launch_Timestamp is missing or invalid.
4. THE Founding_Function SHALL compare the account creation timestamp against the Launch_Timestamp in UTC.
5. WHEN an account is created at or after the Launch_Timestamp, where a creation timestamp exactly equal to the Launch_Timestamp is eligible, THE Founding_Function SHALL treat the account as eligible for founding evaluation.
6. WHEN an account is created before the Launch_Timestamp in UTC, THE Founding_Function SHALL leave the Founding_Counter `claimed` value unchanged.

### Requirement 3: Atomic Founding Slot Claim

**User Story:** As the product owner, I want founding slots claimed atomically, so that exactly 100 unique numbers are issued even under simultaneous signups.

#### Acceptance Criteria

1. WHEN claiming a founding slot AND the Founding_Counter `claimed` value is less than 100, THE Founding_Function SHALL execute the read of the Founding_Counter, the assignment of the Founding_Number, and the increment of the `claimed` value within a single Firestore transaction.
2. THE Founding_Function SHALL assign Founding_Numbers as consecutive integers from 1 to 100 inclusive, where the assigned number equals the pre-increment `claimed` value plus 1.
3. THE Founding_Function SHALL assign each Founding_Number to exactly one account.
4. IF two account-creation events attempt to claim the final available slot concurrently, THEN THE Founding_Function SHALL grant the slot to exactly one account and SHALL leave the other account as a non-founding user.
5. WHILE the Founding_Counter `claimed` value equals 100, THE Founding_Function SHALL leave the account as a non-founding user with a Founding_Number of 0 and SHALL return a response indicating no founding slots remain.
6. THE Founding_Counter `claimed` value SHALL remain between 0 and 100 inclusive at all times.
7. IF the Firestore transaction fails due to write contention, THEN THE Founding_Function SHALL retry the transaction up to 5 attempts, SHALL preserve the Founding_Counter `claimed` value, and SHALL return a failure response if still unresolved after the final attempt.

### Requirement 4: Pro Perk Delivery

**User Story:** As a founding member, I want one year of Goalfer Pro applied automatically, so that I receive Pro features without a purchase.

#### Acceptance Criteria

1. WHEN a Founding_Number is assigned to an account, THE Founding_Function SHALL request a promotional grant of the `pro` entitlement for that account from the RevenueCat_API with a duration of one year.
2. THE Founding_Function SHALL call the RevenueCat_API using the RevenueCat secret key from server-side configuration only.
3. THE Founding_Function SHALL record the Pro perk expiry as `proExpiresAt` in the Founding_Record, set to one year after the grant time, so that the one-year Pro grant expires one year after the grant time.
4. WHILE the `pro` entitlement is active, WHEN the app queries RevenueCat's active entitlements, THE app SHALL derive `isPro` as true.
5. WHILE the `pro` entitlement is active, THE Habit_Service SHALL apply the Pro habit limit of 15 via `getHabitLimit(true)`.

### Requirement 5: Pro Grant Failure Handling and Reconciliation

**User Story:** As a founding member, I want my Pro perk to be delivered reliably, so that I am never assigned a number but left without the Pro benefit.

#### Acceptance Criteria

1. IF the RevenueCat_API grant request does not succeed within 10 seconds after a Founding_Number is assigned, THEN THE Founding_Function SHALL retain the assigned Founding_Number and SHALL mark the Founding_Record Pro grant as pending.
2. IF the RevenueCat_API grant request fails, THEN THE Founding_Function SHALL retry the grant up to a maximum of 5 attempts using exponential backoff starting at 1 second, doubling each attempt, capped at 30 seconds.
3. WHERE the Pro grant remains pending after the retry attempts, THE Founding_Function SHALL record the pending state and the last-attempt timestamp so a reconciliation process can complete the grant later.
4. WHEN a reconciliation run scheduled at an interval not exceeding 24 hours finds a Founding_Record with a pending Pro grant, THE reconciliation process SHALL re-request the promotional entitlement from the RevenueCat_API and, on success, SHALL set the grant status to granted and `proExpiresAt` to one year after success.
5. IF a reconciliation re-request fails, THEN THE reconciliation process SHALL keep the Founding_Record pending, SHALL retain the Founding_Number, and SHALL retry on the next scheduled run.
6. THE Founding_Function SHALL NOT release or reassign a Founding_Number due to a Pro grant failure.
7. IF a user explicitly cancels or requests cancellation of founding membership while the Pro grant is pending, THEN THE Founding_Function SHALL NOT release or reassign that user's Founding_Number.

### Requirement 6: Founding Record Data Model

**User Story:** As a developer, I want a well-defined founding data model, so that the app and landing page can read consistent founding state.

#### Acceptance Criteria

1. WHEN a founding slot is claimed, THE Founding_Function SHALL write a `foundingMember` object to the User_Profile containing `number`, `grantedAt`, and `proExpiresAt`.
2. WHEN a founding slot is claimed, THE Founding_Function SHALL set a boolean `foundingMember` flag to true on the User_Profile.
3. THE Founding_Function SHALL set `grantedAt` to the time the Founding_Number was assigned.
4. THE Founding_Function SHALL maintain the Founding_Counter document `counters/foundingMembers` with a `claimed` integer field.
5. WHERE an account is not a Founding_Member, THE User_Profile SHALL carry the boolean `foundingMember` flag as false or omit the flag.
6. IF the `foundingMember` object or flag write operation to the User_Profile fails after a Founding_Number is assigned, THEN THE Founding_Function SHALL retain the assigned Founding_Number, SHALL leave the Founding_Counter `claimed` value unchanged, and SHALL record an error.
7. IF a Founding_Number is assigned but the User_Profile write fails, THEN THE Founding_Function SHALL permanently reserve that Founding_Number for that account and SHALL NOT make that Founding_Number available for reassignment.

### Requirement 7: Permanent Decoupled Founding Badge

**User Story:** As a founding member, I want my founding badge and number to be permanent, so that I keep recognition even after my Pro year ends.

#### Acceptance Criteria

1. THE Founding_Badge SHALL display the Founding_Member's Founding_Number.
2. WHILE a user is a Founding_Member, THE app SHALL display the Founding_Badge on that user's profile.
3. WHEN the Pro perk expires, THE app SHALL continue to display the Founding_Badge and Founding_Number.
4. THE app SHALL determine Founding_Badge visibility from the `foundingMember` flag independently of `isPro`.
5. THE Founding_Number SHALL remain unchanged for the lifetime of the account.
6. THE app SHALL display the Founding_Badge and the Founding_Number independently, where each is shown based on its own availability and neither requires the other to be present.

### Requirement 8: Founding Badge in Social Feed

**User Story:** As a user browsing the social feed, I want to see who the founding members are, so that founding status is visible and creates interest in the program.

#### Acceptance Criteria

1. WHERE an activity feed entry belongs to a Founding_Member, THE app SHALL display the Founding_Badge alongside that entry.
2. THE app SHALL display the Founding_Number on the Founding_Badge shown in the social feed.
3. WHILE viewing another user who is a Founding_Member, THE app SHALL display that user's Founding_Badge.
4. THE app SHALL show the Founding_Badge in the social feed based on the `foundingMember` flag independently of `isPro`.
5. IF a Founding_Member's Founding_Number is unavailable or fails to load, THEN THE app SHALL display the Founding_Badge without the Founding_Number.

### Requirement 9: Onboarding Celebration

**User Story:** As a new founding member, I want a celebration moment right after signup, so that I immediately understand I received a founding spot.

#### Acceptance Criteria

1. WHEN a newly created account has been assigned a Founding_Number, THE app SHALL present the Celebration_Screen immediately after signup completes.
2. THE Celebration_Screen SHALL display the assigned Founding_Number.
3. WHERE a newly created account was not assigned a Founding_Number, THE app SHALL NOT present the Celebration_Screen.
4. WHEN the Founding_Number has not yet been assigned at the moment onboarding completes, THE app SHALL present the Celebration_Screen once the Founding_Record becomes available for that account.
5. WHEN the user dismisses the Celebration_Screen, or when the Celebration_Screen is exited by an alternative means including an automatic timeout or the user navigating away from the Celebration_Screen, THE app SHALL proceed to the normal post-signup screen.

### Requirement 10: Landing Page Scarcity Counter

**User Story:** As a visitor on the landing page, I want to see how many founding spots remain, so that I feel encouraged to sign up before they run out.

#### Acceptance Criteria

1. THE Landing_Counter SHALL read the Founding_Counter `claimed` value from Firestore.
2. WHILE the Founding_Counter `claimed` value is less than the Founding_Cap, THE Landing_Counter SHALL display the number of remaining spots computed as the Founding_Cap minus the `claimed` value.
3. WHEN the Founding_Counter `claimed` value changes, THE Landing_Counter SHALL update the displayed remaining spots.
4. IF the Founding_Counter cannot be read, THEN THE Landing_Counter SHALL hide the scarcity indicator and SHALL leave the download and waitlist actions available.
5. THE Landing_Counter SHALL read the Founding_Counter through read-only public access without exposing the RevenueCat secret key.
6. WHEN the Founding_Counter `claimed` value equals the Founding_Cap, THE Landing_Counter SHALL continue to display the scarcity indicator showing zero remaining spots rather than hiding the indicator.

### Requirement 11: Landing Page Sold-Out State

**User Story:** As a visitor arriving after all spots are gone, I want to see a clear sold-out message, so that I have accurate expectations while still being able to download the app.

#### Acceptance Criteria

1. WHILE the Founding_Counter `claimed` value equals the Founding_Cap, THE Landing_Counter SHALL display a sold-out state showing zero remaining spots and sold-out messaging indicating founding spots are gone.
2. WHEN the Founding_Counter `claimed` value reaches the Founding_Cap while a visitor is viewing the page, THE Landing_Counter SHALL switch from the remaining-spots display to the sold-out state.
3. WHILE the Landing_Counter shows the sold-out state, THE landing page SHALL continue to present the App Store download action and the waitlist form.
4. WHERE the Founding_Cap is 0, THE Landing_Counter SHALL display the sold-out state.

### Requirement 12: Pro Perk Expiry Behavior

**User Story:** As a founding member whose Pro year has ended, I want my existing habits preserved, so that expiry only limits new habit creation, not my current data.

#### Acceptance Criteria

1. WHEN the `pro` entitlement expires, THE app SHALL derive `isPro` as false from RevenueCat's active entitlements.
2. WHILE `isPro` is false, THE Habit_Service SHALL apply the free habit limit of 6 via `getHabitLimit(false)`.
3. IF a user attempts to create a habit that would exceed the applicable limit, THEN THE Habit_Service SHALL throw `HabitLimitError` and SHALL NOT create the habit.
4. WHEN the Pro perk expires, THE app SHALL retain all of the user's existing habits.
5. WHEN the Pro perk expires, THE app SHALL continue to display the Founding_Badge and the Founding_Number, where the Founding_Badge and the Founding_Number are displayed independently based on each one's own availability and independently of Pro status.

### Requirement 13: Account Deletion and Re-Signup

**User Story:** As the product owner, I want founding numbers tied to identity, so that a deleted account cannot free up a slot or let someone mint a new founding number.

#### Acceptance Criteria

1. WHEN a Founding_Member's account is deleted, THE Founding_Function SHALL NOT decrement the Founding_Counter `claimed` value.
2. WHEN an account is created that does not qualify for a new slot because the Founding_Cap has been reached, THE Founding_Function SHALL NOT assign a new Founding_Number.
3. IF a new account is created after the Founding_Cap is reached, THEN THE Founding_Function SHALL leave that account as a non-founding user regardless of prior deleted accounts.
4. THE Founding_Function SHALL treat each new Firebase Auth account as a distinct identity for eligibility evaluation.

### Requirement 14: Non-iOS and RevenueCat-Unavailable Platforms

**User Story:** As a founding member on a platform where RevenueCat is unavailable, I want my founding status to still be recognized, so that the permanent badge works even when the Pro perk cannot be applied on that platform.

#### Acceptance Criteria

1. WHERE RevenueCat is unavailable on the current platform, THE app SHALL derive `isPro` as false.
2. WHILE `isPro` is false on a platform without RevenueCat, THE Habit_Service SHALL apply the free habit limit of 6.
3. WHERE a user is a Founding_Member, THE app SHALL display the Founding_Badge and Founding_Number regardless of platform, AND THE app SHALL display the Founding_Number even when the Founding_Badge cannot be displayed or the user's founding status is momentarily unclear.
4. THE Founding_Function SHALL assign the Founding_Number and grant the RevenueCat promotional entitlement server-side independently of the sign-up client platform.

### Requirement 15: Fairness and Transparency

**User Story:** As a prospective member, I want the rules of the program to be clear and consistently applied, so that I trust the founding program.

#### Acceptance Criteria

1. THE Founding_Function SHALL count only accounts created at or after the Launch_Timestamp toward the Founding_Cap.
2. THE Founding_Function SHALL grant no more than the Founding_Cap of founding memberships.
3. THE Founding_Function SHALL assign Founding_Numbers in the order that founding slots are successfully claimed.
4. THE Landing_Counter SHALL present the remaining-spots and sold-out states from the same Founding_Counter value used by the Founding_Function.

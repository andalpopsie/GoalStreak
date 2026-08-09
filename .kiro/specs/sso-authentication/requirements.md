# Requirements Document

## Introduction

This feature adds Single Sign-On (SSO) to the Goalfer app (React Native + Expo 54, Firebase JS SDK auth) alongside the existing email/password authentication. Users will be able to authenticate with "Continue with Apple" and "Continue with Google". Apple and Google ship together because Apple App Store Guideline 4.8 requires that adding any third-party login makes Sign in with Apple mandatory and at least as prominent. The scope is iOS-first; Android is deferred.

Because SSO changes how accounts are created and deleted, this feature must also address three existing code seams that current single-path email/password logic breaks:

1. **User provisioning** — currently only runs inside email `signUp()`, so first-time SSO users would authenticate with no Firestore records created.
2. **EULA acceptance gate** — currently lives on the SignUp screen and blocks account creation; SSO bypasses it, which would violate Apple Guideline 1.2 (zero-tolerance clause).
3. **Account deletion re-authentication** — currently password-only, which breaks Apple Guideline 5.1.1(v) in-app deletion for SSO users who have no password.

Account linking is delivered in two phases: Phase 1 provides full Apple + Google sign-in with a friendly collision message; Phase 2 adds seamless in-flow credential linking and a Settings connect/disconnect option.

**Release constraint:** This feature must not be included in the current App Store build (build 21, "Waiting for Review"). It becomes build 22 only after the current review resolves, because submitting a new build cancels the in-progress review.

The net-new dependency introduced by this feature is `expo-apple-authentication`; Google reuses the already-installed `expo-auth-session` and `expo-crypto`.

## Glossary

- **SSO_System**: The Single Sign-On subsystem that orchestrates Apple and Google authentication flows and integrates them with Firebase Auth.
- **Auth_Screen**: The combined sign-in / sign-up screen presenting email/password, Continue with Apple, and Continue with Google options plus the consent control.
- **Apple_Provider**: The Apple authentication flow using `expo-apple-authentication` to obtain an identity token and nonce, exchanged for a Firebase credential via `OAuthProvider('apple.com')`.
- **Google_Provider**: The Google authentication flow using `expo-auth-session/providers/google` to obtain an ID token, exchanged for a Firebase credential via `GoogleAuthProvider`.
- **Provisioning_Service**: The shared `provisionNewUser()` routine that creates all first-time-user records (users/{uid} document, userProfiles document, username reservation, EULA fields, onboarding flag, timestamps).
- **Consent_Control**: The Terms of Service and Privacy Policy acceptance checkbox on the Auth_Screen that gates the SSO buttons.
- **Deletion_Service**: The account deletion subsystem (`accountDeletionService`) responsible for re-authentication and full data cleanup.
- **New_User**: A user authenticating for the first time, detected via `getAdditionalUserInfo(result).isNewUser` with a Firestore users/{uid} document-existence check as fallback.
- **Provider_Id**: The identifier of the authentication provider associated with a user, read from `user.providerData[0].providerId` (`apple.com`, `google.com`, or `password`).
- **EULA_Fields**: The Firestore fields `eulaAcceptedAt` (timestamp) and `eulaVersion` (string) recording Terms of Service acceptance.
- **Private_Relay_Email**: An Apple-provided proxied email address of the form `<token>@privaterelay.appleid.com`.
- **Account_Collision**: The Firebase error condition `auth/account-exists-with-different-credential`, raised when an SSO credential's email already belongs to an account created with a different provider.
- **EULA_Version**: The current Terms of Service version string persisted at acceptance time (current value `1.0`).

## Requirements

### Requirement 1: Present SSO options on the authentication screen

**User Story:** As a new or returning user, I want to sign in with Apple or Google from the authentication screen, so that I can access Goalfer without creating a separate email/password.

#### Acceptance Criteria

1. WHEN the Auth_Screen finishes loading, THE Auth_Screen SHALL render a "Continue with Apple" control and a "Continue with Google" control together with the existing email/password controls, with each control exposing an accessible label identifying its provider.
2. WHERE the platform is iOS, THE Auth_Screen SHALL render the "Continue with Apple" control with a visible touch-target height and width each greater than or equal to those of the "Continue with Google" control, and positioned at the same vertical position as or above the "Continue with Google" control.
3. WHEN the Auth_Screen finishes loading, THE Auth_Screen SHALL render both SSO controls in an unselected state, with neither control shown as focused, highlighted, or otherwise preselected.
4. WHERE the platform is Android, THE Auth_Screen SHALL render neither the Apple nor the Google SSO control, while continuing to render the email/password controls.
5. IF an SSO provider fails to initialize or its availability cannot be confirmed on iOS, THEN THE Auth_Screen SHALL omit that provider's control from display, retain all remaining available controls, and continue to allow email/password sign-in.

### Requirement 2: Consent gate before SSO authentication

**User Story:** As a user, I want to accept the Terms of Service and Privacy Policy before signing in with a provider, so that acceptance is recorded before any account exists.

#### Acceptance Criteria

1. WHILE the Consent_Control is unchecked, THE Auth_Screen SHALL keep the "Continue with Apple" and "Continue with Google" controls in a disabled, non-interactive state that visually indicates they cannot be activated.
2. WHEN the Consent_Control is checked, THE Auth_Screen SHALL enable the "Continue with Apple" and "Continue with Google" controls within 500 milliseconds.
3. THE Consent_Control SHALL present a link to the Terms of Service and a link to the Privacy Policy.
4. WHEN a user activates the Terms of Service link or the Privacy Policy link, THE Auth_Screen SHALL display the corresponding document.
5. IF a user taps the "Continue with Apple" or "Continue with Google" control WHILE the Consent_Control is unchecked, THEN THE Auth_Screen SHALL display a dismissible prompt indicating that the Terms of Service and Privacy Policy must be accepted before continuing, and SHALL NOT initiate SSO authentication.
6. WHEN a New_User completes SSO authentication after checking the Consent_Control, THE Provisioning_Service SHALL persist the EULA_Fields with `eulaAcceptedAt` set to the server timestamp and `eulaVersion` set to the EULA_Version.
7. IF SSO authentication fails or is cancelled after the Consent_Control is checked, THEN THE Provisioning_Service SHALL NOT create an account and SHALL NOT persist any EULA_Fields.

### Requirement 3: Apple authentication

**User Story:** As a user, I want to authenticate with my Apple ID, so that I can sign in securely using my Apple account.

#### Acceptance Criteria

1. WHEN a user activates the "Continue with Apple" control, THE Apple_Provider SHALL request an identity token from Apple using a generated nonce hashed with SHA-256.
2. WHEN Apple returns an identity token and nonce within 30 seconds, THE Apple_Provider SHALL exchange the token for a Firebase credential using `OAuthProvider('apple.com')` with the raw nonce and sign the user in via `signInWithCredential`.
3. WHEN Apple returns the user's full name and email on first authorization, THE Apple_Provider SHALL persist the full name and email for use during account provisioning.
4. WHEN Apple omits the full name and email on a subsequent authorization, THE Apple_Provider SHALL complete sign-in using the full name and email captured during the first authorization without prompting for or re-requesting that data.
5. IF the user cancels the Apple authorization sheet, THEN THE SSO_System SHALL return the Auth_Screen to its idle state, in which the "Continue with Apple" control is enabled and no error is displayed, within 1 second.
6. IF the Apple authentication request fails due to a network error, THEN THE SSO_System SHALL display a message indicating that a network error occurred and that the user should try again, and SHALL return the Auth_Screen to its idle state without signing the user in.
7. IF the identity token exchange or sign-in fails for a reason other than user cancellation or network error, including an invalid or expired token or no response from Apple within 30 seconds, THEN THE SSO_System SHALL display a message indicating that authentication failed and that the user should try again, and SHALL return the Auth_Screen to its idle state without signing the user in.

### Requirement 4: Google authentication

**User Story:** As a user, I want to authenticate with my Google account, so that I can sign in securely using my Google account.

#### Acceptance Criteria

1. WHEN a user activates the "Continue with Google" control, THE Google_Provider SHALL initiate the Google authentication flow using `expo-auth-session/providers/google` to obtain an ID token, and SHALL disable the "Continue with Google" control while the flow is in progress.
2. WHEN Google returns an ID token, THE Google_Provider SHALL exchange the ID token for a Firebase credential using `GoogleAuthProvider.credential`.
3. WHEN the Google Firebase credential is obtained, THE Google_Provider SHALL sign the user in via `signInWithCredential`.
4. WHEN Google sign-in succeeds, THE SSO_System SHALL establish the user session and navigate away from the Auth_Screen within 3 seconds.
5. IF the user cancels the Google authentication flow, THEN THE SSO_System SHALL return the Auth_Screen to its idle state, re-enable the "Continue with Google" control, and SHALL NOT establish a session, without displaying an error.
6. IF the Google authentication request fails due to a network error, THEN THE SSO_System SHALL display a message indicating that a network error occurred and that the user should try again, return the Auth_Screen to its idle state, re-enable the control, and SHALL NOT establish a session.
7. IF no ID token is returned within 60 seconds, THEN THE SSO_System SHALL abort the flow, display a message indicating that the request timed out and the user should try again, and return the Auth_Screen to its idle state.
8. IF the token exchange or sign-in fails for a reason other than user cancellation or network error, THEN THE SSO_System SHALL display a message indicating that authentication failed and that the user should try again, and return the Auth_Screen to its idle state without establishing a session.

### Requirement 5: Shared new-user provisioning

**User Story:** As a first-time SSO user, I want my account records created automatically, so that social features, usernames, and onboarding work the same as for email sign-up.

#### Acceptance Criteria

1. THE Provisioning_Service SHALL be a single shared routine invoked by both email sign-up and first-time SSO authentication.
2. WHEN a user authenticates, THE SSO_System SHALL determine New_User status using `getAdditionalUserInfo`.
3. IF `getAdditionalUserInfo` is unavailable or does not indicate New_User status, THEN THE SSO_System SHALL determine New_User status using a Firestore users/{uid} document-existence check.
4. WHEN the Provisioning_Service provisions a New_User, THE Provisioning_Service SHALL create a users/{uid} document containing a generated username, `hasCompletedOnboarding` set to false, `createdAt`, `updatedAt`, and the EULA_Fields.
5. WHEN the generated username is already reserved, THE Provisioning_Service SHALL generate an alternative username and retry reservation up to a maximum of 5 attempts.
6. WHEN the Provisioning_Service provisions a New_User, THE Provisioning_Service SHALL reserve the generated username in the usernames collection.
7. WHEN the Provisioning_Service provisions a New_User, THE Provisioning_Service SHALL create a userProfiles document via the friend service.
8. WHERE the provider supplies a display name, THE Provisioning_Service SHALL persist the display name on the New_User records.
9. WHERE the provider does not supply a display name, THE Provisioning_Service SHALL use the generated username as the display name on the New_User records.
10. WHERE the provider supplies a photo URL, THE Provisioning_Service SHALL persist the photo URL as the New_User profile picture.
11. IF provisioning fails before all New_User records are created, THEN THE Provisioning_Service SHALL not leave a partial set of records and SHALL allow provisioning to be retried on the next authentication.
12. WHEN an existing user authenticates via SSO, THE SSO_System SHALL sign the user in without creating duplicate provisioning records.

### Requirement 6: SSO-aware account deletion

**User Story:** As an SSO user, I want to delete my account from within the app, so that I retain the in-app deletion required by Apple Guideline 5.1.1(v) even though I have no password.

#### Acceptance Criteria

1. WHEN a user requests account deletion, THE Deletion_Service SHALL select the re-authentication method based on the Provider_Id read from the user's primary provider (the first entry in the provider data).
2. WHERE the Provider_Id is `apple.com`, THE Deletion_Service SHALL re-run the Apple authentication flow to obtain a fresh credential and SHALL call `reauthenticateWithCredential` before deleting the user.
3. WHERE the Provider_Id is `google.com`, THE Deletion_Service SHALL re-run the Google authentication flow to obtain a fresh credential and SHALL call `reauthenticateWithCredential` before deleting the user.
4. WHERE the Provider_Id is `password`, THE Deletion_Service SHALL re-authenticate using the email and password credential.
5. WHEN re-authentication succeeds, THE Deletion_Service SHALL delete all existing user data — including Firestore user-owned documents, per-user documents, friend relationship data, and group invitations, the reserved username, the Storage profile photo, and the local AsyncStorage caches — and SHALL delete the Firebase Auth user only after the associated data has been deleted.
6. IF the user cancels the re-authentication flow during deletion or it does not complete within 120 seconds, THEN THE Deletion_Service SHALL abort the deletion and retain all user data.
7. IF the Provider_Id is absent or is not a supported provider, THEN THE Deletion_Service SHALL abort the deletion, retain all user data, and display an error.
8. IF re-authentication fails due to an invalid or expired credential, a requires-recent-login condition, or a network failure, THEN THE Deletion_Service SHALL abort the deletion, retain all user data, and display a message indicating that the user should try again.
9. IF deletion fails after re-authentication but before all data is removed, THEN THE Deletion_Service SHALL display an error, preserve the data not yet deleted, and allow the user to retry the deletion.

### Requirement 7: Account collision handling (Phase 1)

**User Story:** As a user who already has an email/password account, I want a clear message when I try to sign in with a provider using the same email, so that I do not lose data or create a duplicate identity.

#### Acceptance Criteria

1. IF SSO authentication raises an Account_Collision, THEN THE SSO_System SHALL display a message that names the existing sign-in method associated with the email and instructs the user to sign in with that method and then link Apple or Google from Settings.
2. WHEN an Account_Collision occurs, THE SSO_System SHALL leave the existing account and all of its stored data unchanged.
3. WHEN an Account_Collision occurs, THE SSO_System SHALL abort the current sign-in attempt without creating a new user identity and without signing the user in.
4. WHEN an Account_Collision occurs, THE SSO_System SHALL return the user to the sign-in screen with the collision message remaining visible until the user dismisses it or initiates another sign-in action.
5. IF the lookup of the existing sign-in method for the email fails or returns no method, THEN THE SSO_System SHALL display a message indicating that the user should sign in with their existing account, and SHALL leave the existing account and its data unchanged.

### Requirement 8: Account linking (Phase 2)

**User Story:** As a user, I want to connect Apple or Google to my existing account, so that I can sign in with multiple providers.

#### Acceptance Criteria

1. WHEN a signed-in user selects "Connect Apple" or "Connect Google", THE SSO_System SHALL link the returned provider credential to the currently authenticated user via `linkWithCredential`, and upon success SHALL display a confirmation indicating the provider is connected and SHALL make that provider available for future sign-in to the same account.
2. WHILE the user's most recent successful authentication is older than 5 minutes, WHEN the user attempts to link a provider, THE SSO_System SHALL prompt the user to re-authenticate and SHALL call `linkWithCredential` only after re-authentication succeeds.
3. WHEN the profile settings screen is displayed, THE SSO_System SHALL present a "Connect Apple" option and a "Connect Google" option, each indicating whether that provider is currently connected or not connected.
4. WHERE a linked provider returns a Private_Relay_Email (an address of the form `<token>@privaterelay.appleid.com`), THE SSO_System SHALL rely on the linked credential rather than the email for identity association and SHALL NOT treat email equality as evidence that two accounts are the same identity.
5. IF the provider credential being linked is already associated with a different existing account, THEN THE SSO_System SHALL reject the link operation, SHALL leave the current user's account and existing linked providers unchanged, and SHALL display an error indicating the provider is already linked to another account.
6. WHEN a signed-in user requests to disconnect a linked provider AND at least one other sign-in provider remains linked to the account, THE SSO_System SHALL unlink the selected provider credential and SHALL display confirmation that the provider is disconnected.
7. IF a signed-in user requests to disconnect the only remaining linked sign-in provider, THEN THE SSO_System SHALL reject the request, SHALL keep the provider linked, and SHALL display an error indicating that at least one sign-in provider must remain connected.

### Requirement 9: Configuration prerequisites

**User Story:** As a developer, I want the required provider configuration captured, so that the SSO flows function in production.

#### Acceptance Criteria

1. WHEN the SSO_System initializes, THE SSO_System SHALL read the iOS and web OAuth client identifiers from the environment configuration.
2. IF a required OAuth client identifier is absent or empty when the SSO_System initializes, THEN THE SSO_System SHALL prevent the affected SSO flow from starting and produce an error indication identifying which identifier is missing.
3. THE SSO_System SHALL source the OAuth client identifiers and the Apple sign-in key from environment configuration provided as EAS secrets, without those values being committed to source control.
4. THE Apple_Provider SHALL declare the `com.apple.developer.applesignin` entitlement via an Expo config plugin.
5. THE SSO_System SHALL require the Apple and Google providers to be enabled in the Firebase Console, including a configured Apple Services ID and Apple sign-in key.
6. IF an SSO sign-in attempt is made for a provider that is not enabled in the Firebase Console, THEN THE SSO_System SHALL reject the attempt and produce an error indication that the provider is unavailable.

### Requirement 10: Release gating

**User Story:** As the release owner, I want this feature excluded from the in-review build, so that submitting it does not cancel the current App Store review.

#### Acceptance Criteria

1. WHILE App Store build 21 remains in "Waiting for Review" status, THE SSO_System SHALL be excluded from every build submitted to App Store review.
2. WHEN the App Store review of build 21 reaches a terminal outcome (approved, rejected, or developer-withdrawn), THE SSO_System SHALL become eligible for inclusion in the next submitted build.
3. THE SSO_System SHALL be assigned to App Store build number 22 or higher for its first submission to App Store review.
4. WHILE App Store build 21 remains in "Waiting for Review" status, THE SSO_System SHALL remain available for development and testing on a feature branch without being included in any App Store submission.
5. IF a build submission that includes THE SSO_System is attempted WHILE App Store build 21 remains in "Waiting for Review" status, THEN THE SSO_System SHALL be excluded from that submission and an indication SHALL be presented stating that including it would cancel the current review.

### Requirement 11: Analytics parity

**User Story:** As a product owner, I want SSO authentication events tracked consistently with existing auth events, so that I can measure adoption.

#### Acceptance Criteria

1. WHEN a user completes SSO sign-in, THE SSO_System SHALL emit an authentication analytics event using the same event name and event properties as the existing email authentication event, including a provider property set to the Provider_Id.
2. WHEN a New_User is provisioned via SSO, THE SSO_System SHALL emit an account-creation analytics event using the same event name and event properties as the existing email sign-up event, including a provider property set to the Provider_Id.
3. IF emitting an SSO analytics event fails, THEN THE SSO_System SHALL NOT block or surface an error in the authentication or provisioning flow.

# Requirements Document

## Introduction

Goalfer Pro is the app's first monetization feature: a paid subscription tier delivered through RevenueCat (iOS only) that raises the per-user habit limit from 6 to 15 and unlocks Pro-tier features. The entire MVP is scoped around converting the existing silent habit-limit wall into a paywall moment. When a free user attempts to create a 7th habit, a paywall modal offers two purchase options (monthly $3.99 / annual $23.99). Upon successful purchase, the user becomes a Pro_User, the limit is raised to 15, and the in-progress habit creation is retried automatically.

Pro status is owned by RevenueCat (the source of truth for entitlements) and mirrored to Firestore for server-side reference. RevenueCat is initialized after authentication so entitlement checks are available before any habit-creation flow runs.

This MVP intentionally does NOT implement streak freeze logic, analytics gating, theme customization, or a subscription management screen. Those features are listed in the paywall copy only.

## Glossary

- **Goalfer_Pro**: The paid subscription tier offered by the app
- **Free_User**: A user whose RevenueCat entitlements do not contain an active "pro" entitlement
- **Pro_User**: A user whose RevenueCat entitlements contain an active "pro" entitlement
- **Subscription_Service**: The singleton service at `src/services/subscriptionService.ts` that wraps `react-native-purchases` and exposes a clean API to hooks
- **Use_Subscription_Hook**: The hook at `src/hooks/useSubscription.ts` that exposes Pro state and purchase actions to components
- **Pro_Paywall_Modal**: The modal component at `src/components/common/ProPaywallModal.tsx` that presents purchase options and benefits
- **Habit_Service**: The existing service at `src/services/habitService.ts` that enforces the habit creation limit
- **Create_Habit_Screen**: The existing screen `CreateHabitScreen.tsx` that calls into Habit_Service to create habits
- **Auth_Initialization**: The login/signup completion path in `AuthContext` or `initializationService.ts` where post-login services are configured
- **RevenueCat**: The third-party SDK (`react-native-purchases`) that handles entitlement checks, receipt validation, and restore purchases
- **Pro_Entitlement**: The RevenueCat entitlement identifier `"pro"` used to gate Pro features
- **Default_Offering**: The RevenueCat offering identifier `"default"` containing the monthly and annual products
- **Free_Habit_Limit**: The maximum number of habits a Free_User can have, set to 6
- **Pro_Habit_Limit**: The maximum number of habits a Pro_User can have, set to 15
- **Habit_Limit_Error_Code**: The specific error code `HABIT_LIMIT_REACHED` returned by Habit_Service when a user attempts to create a habit beyond their tier limit
- **Firestore**: The Firebase Cloud Firestore database used for persistent storage
- **User_Document**: The Firestore document at `users/{uid}` for the authenticated user

## Requirements

### Requirement 1: Initialize RevenueCat on Login

**User Story:** As a user, I want my Pro status to be available immediately after I sign in, so that habit creation flows can correctly enforce the right limit on first attempt.

#### Acceptance Criteria

1. WHEN Auth_Initialization completes for a signed-in user, THE Subscription_Service SHALL be initialized with the user's `userId` before any habit creation request is allowed
2. WHEN Subscription_Service.initialize is called, THE Subscription_Service SHALL configure RevenueCat with the API key from `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and identify the user with the provided `userId`
3. IF RevenueCat initialization fails due to a missing API key, THEN THE Subscription_Service SHALL log a descriptive error and treat the user as a Free_User
4. IF RevenueCat initialization fails due to no network connectivity, THEN THE Subscription_Service SHALL treat the user as a Free_User and allow a retry on the next call to `getProStatus`

### Requirement 2: Determine Pro Status From RevenueCat

**User Story:** As a user, I want my Pro status to reflect the entitlement actually held in my App Store account, so that I cannot lose access to Pro features by clearing app data and so that another device sees the same status.

#### Acceptance Criteria

1. WHEN Subscription_Service.getProStatus is called, THE Subscription_Service SHALL read the active entitlements from RevenueCat and return `true` only when the Pro_Entitlement is present and active
2. THE Subscription_Service SHALL NOT read Pro status from Firestore for the purpose of feature gating
3. IF the call to RevenueCat fails due to no network connectivity, THEN THE Subscription_Service SHALL return `false` and propagate a descriptive error to the caller

### Requirement 3: Enforce Tier-Based Habit Creation Limit

**User Story:** As a free user, I want to be limited to 6 habits, and as a Pro user I want to have 15, so that the subscription unlocks tangible value.

#### Acceptance Criteria

1. WHEN a Free_User attempts to create a habit and already has 6 habits, THE Habit_Service SHALL reject the request and return Habit_Limit_Error_Code
2. WHEN a Pro_User attempts to create a habit and already has 15 habits, THE Habit_Service SHALL reject the request and return Habit_Limit_Error_Code
3. WHEN a Free_User attempts to create a habit and has fewer than 6 habits, THE Habit_Service SHALL create the habit
4. WHEN a Pro_User attempts to create a habit and has fewer than 15 habits, THE Habit_Service SHALL create the habit
5. THE Habit_Service SHALL determine the applicable limit by reading Pro status from Subscription_Service before counting the user's existing habits
6. THE `LIMITS` constant in `src/constants/limits.ts` SHALL expose `MAX_HABITS_FREE = 6`, `MAX_HABITS_PRO = 15`, and `MAX_HABITS = 6` (for backwards compatibility, equal to `MAX_HABITS_FREE`)

### Requirement 4: Trigger Paywall on Limit Reached

**User Story:** As a free user trying to add a 7th habit, I want to see a paywall offering Pro instead of a silent failure, so that I have a clear path forward.

#### Acceptance Criteria

1. WHEN Create_Habit_Screen receives Habit_Limit_Error_Code from Habit_Service, THE Create_Habit_Screen SHALL set local state `showPaywall` to `true` and render Pro_Paywall_Modal over the screen
2. WHEN Create_Habit_Screen receives any error code other than Habit_Limit_Error_Code, THE Create_Habit_Screen SHALL display the existing error handling and SHALL NOT render Pro_Paywall_Modal
3. WHEN the user dismisses Pro_Paywall_Modal via the close button, THE Create_Habit_Screen SHALL set `showPaywall` to `false` and SHALL keep the user on Create_Habit_Screen with the form contents preserved
4. WHEN Pro_Paywall_Modal reports a successful purchase via `onSuccess`, THE Create_Habit_Screen SHALL set `showPaywall` to `false` and SHALL retry the habit creation request that originally produced Habit_Limit_Error_Code

### Requirement 5: Display Paywall Content

**User Story:** As a user viewing the paywall, I want to clearly see what Pro includes and how much it costs, so that I can decide whether to subscribe.

#### Acceptance Criteria

1. WHILE Pro_Paywall_Modal is visible, THE Pro_Paywall_Modal SHALL display the heading "Goalfer Pro" using `Typography.h1` and `Colors.primaryText`
2. WHILE Pro_Paywall_Modal is visible, THE Pro_Paywall_Modal SHALL display two purchase options side by side: a Monthly option labeled "$3.99 / month" and an Annual option labeled "$23.99 / year" with a "Save 50%" badge
3. THE Pro_Paywall_Modal SHALL visually highlight the Annual option using `Colors.accent1` (`#B771E5`) as the selected/recommended state
4. WHILE Pro_Paywall_Modal is visible, THE Pro_Paywall_Modal SHALL display the following benefits as a list with checkmark icons: "Up to 15 habits", "Streak freeze (2 per month)", "Full analytics & insights", "Up to 5 accountability groups", "Custom themes & icons"
5. WHILE Pro_Paywall_Modal is visible, THE Pro_Paywall_Modal SHALL display a "Restore purchases" text link at the bottom of the modal
6. WHILE Pro_Paywall_Modal is visible, THE Pro_Paywall_Modal SHALL display a close button (X icon) in the top-right corner with a touch target of at least 48px
7. THE Pro_Paywall_Modal SHALL use values imported from `src/constants/theme.ts` (Colors, Typography, Spacing, Shadows) for all styling and SHALL NOT hardcode color, font, or spacing values
8. THE Pro_Paywall_Modal SHALL render its purchase option cards with `borderRadius: 16`, `padding: 16`, and `Shadows.sm`

### Requirement 6: Purchase Pro Subscription

**User Story:** As a user, I want to purchase Pro by tapping a price option, so that the limit is raised and the modal closes.

#### Acceptance Criteria

1. WHEN the user taps a purchase option in Pro_Paywall_Modal, THE Use_Subscription_Hook SHALL call Subscription_Service.purchasePro with the selected product identifier
2. WHEN Subscription_Service.purchasePro is called, THE Subscription_Service SHALL fetch the Default_Offering from RevenueCat and present the platform purchase sheet for the selected product
3. WHEN a purchase completes successfully, THE Subscription_Service SHALL return `{ success: true }` and the active entitlements SHALL contain the Pro_Entitlement
4. WHEN a purchase completes successfully, THE Use_Subscription_Hook SHALL re-check Pro status via Subscription_Service.getProStatus and update its `isPro` value to `true`
5. WHEN a purchase completes successfully, THE Pro_Paywall_Modal SHALL invoke its `onSuccess` callback and SHALL dismiss the modal
6. WHILE a purchase is in progress, THE Pro_Paywall_Modal SHALL display a loading state and SHALL disable both purchase option buttons

### Requirement 7: Handle Purchase Errors

**User Story:** As a user, when a purchase fails, I want to see a clear inline message and remain on the paywall, so that I can try again or dismiss it.

#### Acceptance Criteria

1. IF the user cancels the platform purchase sheet, THEN THE Subscription_Service SHALL return `{ success: false, error: "PURCHASE_CANCELLED" }` and the Pro_Paywall_Modal SHALL remain visible without displaying an error message
2. IF the purchase fails due to no network connectivity, THEN THE Subscription_Service SHALL return `{ success: false, error: "NO_NETWORK" }` and the Pro_Paywall_Modal SHALL display the inline message "No internet connection. Please try again."
3. IF RevenueCat reports the user already has the Pro_Entitlement at the time of purchase, THEN THE Subscription_Service SHALL return `{ success: true }` without initiating a new purchase and the Pro_Paywall_Modal SHALL invoke its `onSuccess` callback
4. IF the purchase fails for any other reason, THEN THE Subscription_Service SHALL return `{ success: false, error: <descriptive_code> }` and the Pro_Paywall_Modal SHALL display an inline error message containing the descriptive text
5. THE Pro_Paywall_Modal SHALL NOT crash, navigate away, or unmount when a purchase error occurs

### Requirement 8: Restore Purchases

**User Story:** As a user who previously subscribed on another device, I want to restore my Pro entitlement, so that I do not have to pay again.

#### Acceptance Criteria

1. WHEN the user taps the "Restore purchases" link, THE Use_Subscription_Hook SHALL call Subscription_Service.restorePurchases
2. WHEN Subscription_Service.restorePurchases is called, THE Subscription_Service SHALL invoke RevenueCat's restore flow and return `true` only when the resulting active entitlements contain the Pro_Entitlement
3. WHEN restorePurchases returns `true`, THE Use_Subscription_Hook SHALL update its `isPro` value to `true` and the Pro_Paywall_Modal SHALL invoke its `onSuccess` callback
4. WHEN restorePurchases returns `false`, THE Pro_Paywall_Modal SHALL display the inline message "No previous purchases found."
5. IF restorePurchases fails due to no network connectivity, THEN THE Pro_Paywall_Modal SHALL display the inline message "No internet connection. Please try again."

### Requirement 9: Persist Pro Status to Firestore

**User Story:** As a developer, I want a server-side record of which users are Pro, so that backend logic and analytics can reference Pro status without calling RevenueCat.

#### Acceptance Criteria

1. WHEN a purchase completes successfully, THE Subscription_Service SHALL write `{ isPro: true, proSince: <Firestore_Timestamp> }` to the User_Document
2. WHEN restorePurchases returns `true`, THE Subscription_Service SHALL write `{ isPro: true, proSince: <Firestore_Timestamp> }` to the User_Document
3. THE Subscription_Service SHALL set `proSince` to the current server timestamp at the moment the write is performed and SHALL NOT overwrite an existing `proSince` value if one is already present on the User_Document
4. IF the Firestore write fails, THEN THE Subscription_Service SHALL log a descriptive error and SHALL still return success to the caller, because RevenueCat remains the source of truth for entitlement

### Requirement 10: Use_Subscription_Hook API

**User Story:** As a component developer, I want a single hook that exposes Pro state and purchase actions, so that I do not call the service directly from UI.

#### Acceptance Criteria

1. THE Use_Subscription_Hook SHALL expose a value `isPro` of type `boolean` reflecting the latest Pro status read from Subscription_Service
2. THE Use_Subscription_Hook SHALL expose a value `isLoading` of type `boolean` that is `true` while Pro status is being read or while a purchase or restore call is in progress
3. THE Use_Subscription_Hook SHALL expose a function `purchase` that accepts a product identifier and returns a Promise that resolves after the purchase attempt completes
4. THE Use_Subscription_Hook SHALL expose a function `restore` that returns a Promise that resolves after the restore attempt completes
5. WHEN the Use_Subscription_Hook mounts, THE Use_Subscription_Hook SHALL call Subscription_Service.getProStatus once and update `isPro` with the result
6. WHEN a purchase or restore call completes, THE Use_Subscription_Hook SHALL call Subscription_Service.getProStatus and update `isPro` with the result

### Requirement 11: iOS-Only Scope

**User Story:** As the developer, I want the implementation to remain iOS-only for the launch, so that I do not delay shipping by configuring Google Play Billing.

#### Acceptance Criteria

1. THE implementation SHALL configure RevenueCat using only the `EXPO_PUBLIC_REVENUECAT_IOS_KEY` environment variable
2. THE implementation SHALL NOT add Google Play Billing configuration, Android product identifiers, or Android-specific RevenueCat keys
3. WHERE the app runs on a non-iOS platform, THE Subscription_Service SHALL treat the user as a Free_User and SHALL NOT attempt to call RevenueCat purchase or restore APIs

# Implementation Plan: SSO Authentication

## Overview

Add "Continue with Apple" and "Continue with Google" to the Goalfer auth screen (iOS-first), built entirely on the Firebase JS SDK credential pattern already in `src/services/firebase.ts`. Apple and Google ship together to satisfy App Store Guideline 4.8.

Beyond the sign-in call itself, the work resolves the three single-path seams the design identifies: provisioning (extract a shared `provisionNewUser` from email `signUp`), the EULA consent gate (a consent-before-auth control on the auth screen), and account-deletion re-auth (provider-aware `reauthenticateForDeletion`). Work follows the design's layering — provider adapters (`ssoService`) separated from orchestration (`useAuth`), provisioning, deletion, and UI — so deletion re-auth reuses the same credential adapters as sign-in.

Language: **TypeScript** (React Native + Expo 54), matching the existing codebase and the design's component signatures. Property tests use **fast-check** (already a devDependency) with **Jest** (`jest-expo`), a minimum of **100 iterations**, one property per test, tagged `// Feature: sso-authentication, Property {n}: {text}`. External boundaries (Apple/Google SDKs, Firebase credential/session calls, Firestore) are mocked so iterations stay cheap.

**Release gate (R10):** all work happens on a feature branch **excluded from the build-21 App Store submission**. The first build that includes SSO is build ≥ 22, cut only after build 21 reaches a terminal review outcome. No task below submits a build for review. Firebase Console provider enablement, EAS secret provisioning, and the Apple Developer Services ID/key are **infra prerequisites** (not executable coding tasks); tasks that depend on them note the dependency inline.

Tasks are grouped under **Phase 1 — Core SSO** (tasks 1–11) and **Phase 2 — Account linking** (tasks 12–15), matching the design's phase delineation so the release gate is respected.

## Tasks

### Phase 1 — Core SSO (ships first, build ≥ 22)

- [x] 1. Configuration foundation: env block, config plugin, dependency
  - [x] 1.1 Add the `sso` config block to `src/config/environment.ts`
    - Expose `appleClientId`, `googleIosClientId`, `googleWebClientId` sourced from `EXPO_PUBLIC_*` env vars (EAS secrets); commit no secret values
    - Infra prerequisite (not coded here): the matching EAS secrets must exist and the Apple + Google providers must be enabled in the Firebase Console with a Services ID and sign-in key
    - _Requirements: 9.1, 9.3, 9.5_

  - [x] 1.2 Create the Apple sign-in config plugin and wire it into the build
    - Create `plugins/withAppleSignIn.js` mirroring `plugins/withFullAppIcons.js`, adding the `com.apple.developer.applesignin` entitlement via `withEntitlementsPlist`
    - Register `./plugins/withAppleSignIn` in the `app.json` `plugins` array
    - Add `expo-apple-authentication` via `npx expo install` (Google reuses installed `expo-auth-session` / `expo-crypto`)
    - _Requirements: 9.4_

  - [x]* 1.3 Write example test for config-plugin entitlement output
    - Apply `withAppleSignIn` to a config object and assert the `com.apple.developer.applesignin` entitlement is emitted
    - _Requirements: 9.4_

- [x] 2. SSO provider adapters and error mapping (`src/services/ssoService.ts`)
  - [x] 2.1 Define types, config guard, and error classifier
    - Create `SsoProviderId`, `SsoProfile`, `SsoCredentialResult`, `SsoErrorKind`, and the `SsoError` class
    - Implement `assertSsoConfig(provider)` throwing `SsoError('missing-config')` naming the missing identifier when a required client id is absent/empty
    - Implement `mapAuthError(error, email?)` mapping known SDK/Firebase codes to exactly one `SsoErrorKind` (cancel→`cancelled`, network→`network`, no-token timeout→`timeout`, `account-exists-with-different-credential`→`collision` with `existingMethod` via `fetchSignInMethodsForEmail`, `operation-not-allowed`→`unavailable`, else→`generic`)
    - _Requirements: 3.5, 3.6, 3.7, 4.5, 4.6, 4.7, 4.8, 6.8, 9.2, 9.6_

  - [x] 2.2 Write property test for error classification
    - **Property 1: Error classification is total and correct**
    - **Validates: Requirements 3.5, 3.6, 3.7, 4.5, 4.6, 4.7, 4.8, 6.8, 9.6**
    - Target module: `ssoService.mapAuthError`

  - [x] 2.3 Write property test for missing-configuration blocking
    - **Property 14: Missing configuration blocks the affected flow**
    - **Validates: Requirements 9.2**
    - Target module: `ssoService.assertSsoConfig`

  - [x] 2.4 Implement the Apple credential adapter
    - Implement `isAppleAvailable()` (iOS + service available) and `getAppleCredential()`: generate a raw nonce, pass `sha256(rawNonce)` (via `expo-crypto`) to `AppleAuthentication.signInAsync`, build the credential with `OAuthProvider('apple.com').credential({ idToken, rawNonce })`, capture first-authorization `fullName`/`email` into `profile`, and classify failures through `mapAuthError`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 1.2, 1.5_

  - [x] 2.5 Write example tests for the Apple nonce contract and profile capture
    - Assert the hashed nonce is sent to Apple and the raw nonce to Firebase (R3.1), and that first-authorization name/email are captured while subsequent null profiles complete sign-in (R3.3, R3.4)
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 2.6 Implement the Google credential converter
    - Implement `getGoogleCredential(idToken)` returning a `GoogleAuthProvider.credential`-based `SsoCredentialResult` with provider profile (photoURL) captured; the `useAuthRequest` hook that obtains the id token lives in the hook layer (task 5)
    - _Requirements: 4.2_

  - [x] 2.7 Write example test for Google credential construction
    - Assert `getGoogleCredential` builds a valid credential from an id token
    - _Requirements: 4.2_

- [x] 3. Shared new-user provisioning (`src/services/userProvisioningService.ts`)
  - [x] 3.1 Implement `isNewUser` detection with fixed precedence
    - Return the `getAdditionalUserInfo` new-user flag when defined; otherwise fall back to the negation of `users/{uid}` document existence
    - _Requirements: 5.2, 5.3_

  - [x] 3.2 Write property test for new-user detection precedence
    - **Property 6: New-user detection follows a fixed precedence**
    - **Validates: Requirements 5.2, 5.3**
    - Target module: `userProvisioningService.isNewUser`

  - [x] 3.3 Implement idempotent `provisionNewUser`
    - Generate a username with bounded collision retry (≤ 5 attempts), reserve it in `usernames`, write `users/{uid}` (`username`, `displayName` with generated-username fallback, optional `profilePicture`, `hasCompletedOnboarding: false`, `createdAt`, `updatedAt`, `eulaAcceptedAt: serverTimestamp()`, `eulaVersion`), and create `userProfiles/{uid}` via `friendService.createUserProfile`
    - Make it idempotent/retry-safe: no duplicate records, return `created: false` for an already-provisioned user, and throw on partial failure so records complete on the next authentication
    - _Requirements: 2.6, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12_

  - [x]* 3.4 Write property test for the provisioned record set
    - **Property 3: A provisioned new user has a complete, well-formed record set**
    - **Validates: Requirements 2.6, 5.4, 5.6, 5.7, 5.8, 5.9, 5.10**
    - Target module: `userProvisioningService.provisionNewUser` (mocked Firestore)

  - [x] 3.5 Write property test for bounded username collision retry
    - **Property 4: Username collision retry is bounded and correct**
    - **Validates: Requirements 5.5**
    - Target module: `userProvisioningService.provisionNewUser` (mocked Firestore + `usernameUtils`)

  - [x]* 3.6 Write property test for provisioning idempotency
    - **Property 5: Provisioning is idempotent and retry-safe**
    - **Validates: Requirements 5.11, 5.12**
    - Target module: `userProvisioningService.provisionNewUser` (mocked Firestore)

  - [x] 3.7 Refactor email `signUp()` to call `provisionNewUser`
    - Extract the record-creation body currently inside `signUp()` in `src/hooks/useAuth.tsx` and route it through `provisionNewUser` so email and SSO share one provisioning path; preserve existing email-signup behavior
    - _Requirements: 5.1_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. useAuth SSO sign-in orchestration (`src/hooks/useAuth.tsx`)
  - [x] 5.1 Implement `signInWithApple` / `signInWithGoogle` and availability
    - Follow the flow: `assertSsoConfig` → obtain credential → `signInWithCredential` → `isNewUser` → `provisionNewUser` when new; host the Google `useAuthRequest` hook here (or a small `useGoogleAuth` helper) feeding `getGoogleCredential`
    - Expose `ssoAvailability: { apple, google }` for button omission; handle `SsoError` kinds: `cancelled`→silent idle reset, `network`/`timeout`/`generic`→mapped message + idle reset, `collision`→delegate to collision handling (task 7); ensure failed/cancelled auth performs no writes and leaves state unauthenticated
    - _Requirements: 3.2, 3.4, 3.5, 3.6, 3.7, 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 2.7, 5.2_

  - [x] 5.2 Write property test for no-side-effect failures
    - **Property 2: Failed or cancelled authentication has no side effects**
    - **Validates: Requirements 2.7, 7.2, 7.3**
    - Target module: `useAuth` SSO failure paths (mocked Firestore + credential calls)

- [x] 6. Consent gate and provider buttons UI (iOS-only)
  - [x] 6.1 Implement `ConsentControl` (`src/components/auth/ConsentControl.tsx`)
    - Reuse the existing `SignUpScreen` checkbox + ToS/Privacy link markup (`accessibilityRole="checkbox"`, links via `linkingUtils`); emit `checked: boolean` upward and open the correct document on link activation
    - Follow theme tokens (8pt grid, palette from `theme.ts`)
    - _Requirements: 2.3, 2.4_

  - [x] 6.2 Implement `ProviderButtons` (`src/components/auth/ProviderButtons.tsx`)
    - Render only when `Platform.OS === 'ios'`; omit any unavailable provider; render Apple with height/width ≥ Google and at or above Google; both start unselected; accessible provider labels; disabled + visually distinct while consent unchecked; tapping while disabled fires `onBlockedPress` without starting auth
    - Use theme touch-target sizes (≥ 56px primary), 8pt spacing, palette from `theme.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.5_

  - [x] 6.3 Write property test for provider rendering
    - **Property 12: Only available providers render, email/password always renders**
    - **Validates: Requirements 1.5**
    - Target module: `ProviderButtons` / Auth_Screen via `@testing-library/react-native`

  - [x] 6.4 Write property test for consent-gated buttons
    - **Property 13: SSO buttons are enabled exactly when consent is accepted**
    - **Validates: Requirements 2.1, 2.2**
    - Target module: `ProviderButtons` / Auth_Screen via `@testing-library/react-native`

  - [x] 6.5 Wire consent + buttons into the auth screen
    - Bind `ProviderButtons` disabled state to `ConsentControl`, enable within 500 ms of checking, route `onApple`/`onGoogle` to `useAuth`, and keep email/password controls regardless of SSO availability
    - _Requirements: 2.1, 2.2, 2.5, 1.4, 1.5_

  - [x] 6.6 Write example test for tap-while-disabled behavior
    - Assert tapping a disabled SSO button shows the dismissible prompt and does not start auth
    - _Requirements: 2.5_

- [x] 7. Account collision handling (Phase 1)
  - [x] 7.1 Implement collision messaging and abort behavior
    - On `SsoError('collision')`, display a message naming the existing sign-in method and instructing the user to sign in then link from Settings; keep it visible until dismissed or a new sign-in action; on lookup failure/empty, show the generic "sign in with your existing account" message; ensure no identity is created, the user is not signed in, and existing data is unchanged
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.2 Write example tests for collision messaging
    - Assert message content and persistence (R7.1, R7.4) and the lookup-failure fallback (R7.5)
    - _Requirements: 7.1, 7.4, 7.5_

- [x] 8. SSO-aware account deletion (`src/services/accountDeletionService.ts`)
  - [x] 8.1 Implement provider-aware re-authentication
    - Implement `reauthenticateForDeletion(password?, getIdTokenForGoogle?)` branching on `auth.currentUser.providerData[0].providerId`: `password`→`EmailAuthProvider` (unchanged), `apple.com`→`getAppleCredential` + `reauthenticateWithCredential`, `google.com`→`getGoogleCredential` + `reauthenticateWithCredential`; throw `SsoError('unavailable')` for absent/unsupported provider; abort with data retained on cancel or > 120 s
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 6.8_

  - [x] 8.2 Write property test for re-auth strategy selection
    - **Property 7: Deletion selects the re-auth strategy from the primary provider id**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.7**
    - Target module: `accountDeletionService.reauthenticateForDeletion`

  - [x] 8.3 Implement delete-ordering, retry safety, and the `deleteAccount()` signature change
    - Have `reauthenticateAndDeleteAccount` delegate to `reauthenticateForDeletion` then run the unchanged cleanup, deleting the Firebase Auth user only after all data cleanup completes; on mid-cleanup failure, surface an error, preserve not-yet-deleted data, and keep deletion re-runnable
    - Change `deleteAccount(password)` → `deleteAccount()` in `useAuth`, keep password collection only for the email branch, and update all callers
    - _Requirements: 6.5, 6.9_

  - [x] 8.4 Write property test for delete ordering
    - **Property 8: The Firebase Auth user is deleted only after all data cleanup**
    - **Validates: Requirements 6.5**
    - Target module: `accountDeletionService` (spy on ordering; assert `deleteUser` called last)

- [x] 9. Analytics parity for SSO (`src/hooks/useAuth.tsx`)
  - [x] 9.1 Emit SSO auth and account-creation events
    - Emit the existing email auth event name/properties on SSO sign-in and the existing sign-up event on new-user provisioning, each with a `provider` property set to the `Provider_Id`; wrap emission so failures are caught and never block or surface in the auth/provisioning flow
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 9.2 Write example tests for analytics parity
    - Assert event names + `provider` property (R11.1, R11.2) and analytics-failure swallowing (R11.3)
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 10. Phase 1 integration and release-gate verification
  - [x] 10.1 Write integration tests against the Firestore emulator
    - Using the `npm run test:emulator` harness: end-to-end Apple and Google sign-in provisioning a new user, end-to-end SSO-user deletion with re-auth, and the provider-not-enabled path
    - _Requirements: 9.6, 5.1, 6.5_

  - [x] 10.2 Write smoke checks for configuration and secrets
    - Assert `config.sso` reads from `EXPO_PUBLIC_*` and that no secret values are committed; document (infra prerequisite) that Firebase Console has Apple + Google enabled with Services ID + key and EAS secrets are configured
    - _Requirements: 9.3, 9.5_

  - [x] 10.3 Add a release-gate build guard
    - Add a CI/build assertion script that fails a submission including the SSO module unless `app.json` build number is ≥ 22, so SSO is excluded from the build-21 submission and surfaces a clear message if attempted; keep all SSO work on the feature branch
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Checkpoint - Ensure Phase 1 tests pass
  - Run `npx tsc --noEmit` and the full Jest suite; resolve regressions from the `provisionNewUser` extraction, `deleteAccount()` signature change, and auth-screen changes. Ensure all tests pass, ask the user if questions arise.

### Phase 2 — Account linking

- [x] 12. Private-relay email helper
  - [x] 12.1 Implement `isPrivateRelayEmail` and identity guard
    - Implement `isPrivateRelayEmail(email)` detecting `<token>@privaterelay.appleid.com`; ensure no identity-association logic treats email equality involving such an address as same-identity evidence
    - _Requirements: 8.4_

  - [x] 12.2 Write property test for private-relay identity handling
    - **Property 11: Private-relay emails are never used as identity**
    - **Validates: Requirements 8.4**
    - Target module: `isPrivateRelayEmail` / identity-association helper

- [x] 13. `linkProvider` / `unlinkProvider` in `useAuth` (`src/hooks/useAuth.tsx`)
  - [x] 13.1 Implement linking and unlinking
    - Implement `linkProvider(provider)` via `linkWithCredential` with stale-login (> 5 min) re-auth before retry, confirmation on success, and rejection with unchanged state on `credential-already-in-use`; implement `unlinkProvider(provider)` guarded so the last remaining sign-in provider cannot be removed; expose `connectedProviders`
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7_

  - [x] 13.2 Write property test for the last-provider guard
    - **Property 10: At least one sign-in provider always remains linked**
    - **Validates: Requirements 8.6, 8.7**
    - Target module: `useAuth.unlinkProvider` / last-provider guard helper

  - [x] 13.3 Write example tests for linking flows
    - Assert link happy path (R8.1), stale-login re-auth (R8.2), and `credential-already-in-use` rejection (R8.5)
    - _Requirements: 8.1, 8.2, 8.5_

- [x] 14. Settings connect/disconnect surface
  - [x] 14.1 Implement the Settings connect/disconnect UI
    - Present "Connect Apple" and "Connect Google" in profile settings, each showing connected vs not-connected from the linked-provider set, wired to `linkProvider` / `unlinkProvider` with confirmation and last-provider-guard errors; follow theme tokens (8pt grid, ≥ 56px touch targets, palette from `theme.ts`)
    - _Requirements: 8.3, 8.1, 8.6, 8.7_

  - [x] 14.2 Write property test for connection state display
    - **Property 9: Connection state reflects linked-provider membership**
    - **Validates: Requirements 8.3**
    - Target module: Settings connect option via `@testing-library/react-native`

- [x] 15. Final checkpoint - Ensure all tests pass
  - Run `npx tsc --noEmit` and the full Jest suite. Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (tests) and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references the specific requirements it implements and the design components it builds. All 11 requirements are covered across tasks 1–15.
- Property tests P1–P14 from the design's Correctness Properties each have their own sub-task, annotated with the property number and the requirements it validates, placed close to the implementation it exercises. They use `fast-check` + `jest-expo`, min 100 iterations, one property per test, tagged `// Feature: sso-authentication, Property {n}: {text}`, with external boundaries mocked.
- Property → module mapping (from the design's Testing Strategy): P1–P2 → `ssoService.mapAuthError` / `useAuth` failure paths; P3–P6 → `userProvisioningService`; P7–P8 → `accountDeletionService`; P9–P11 → pure helpers; P12–P13 → `ProviderButtons` / Auth_Screen; P14 → `assertSsoConfig`.
- Firebase JS SDK only — every credential is produced with `OAuthProvider` / `GoogleAuthProvider` and consumed by `signInWithCredential` / `reauthenticateWithCredential` / `linkWithCredential`. No React Native Firebase.
- iOS-first: SSO controls render only on iOS; Android keeps email/password unchanged.
- Modify, don't multiply: extend `useAuth`, `accountDeletionService`, and `environment.ts`; new files are limited to genuinely new responsibilities (`ssoService`, `userProvisioningService`, the two auth components, the config plugin, the private-relay helper).
- Release gate (R10): all work stays on a feature branch excluded from the build-21 submission; the first SSO build is build ≥ 22, enforced by the guard in task 10.3. Firebase Console enablement, EAS secrets, and the Apple Developer Services ID/key are infra prerequisites, noted inline where tasks depend on them, not executed as coding tasks.
- Phase 1 (tasks 1–11) delivers full Apple + Google sign-in with collision handling and SSO-aware deletion; Phase 2 (tasks 12–15) adds in-flow linking and the Settings surface.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3"] },
    { "id": 3, "tasks": ["2.5", "2.6", "3.4", "3.5", "3.6", "3.7"] },
    { "id": 4, "tasks": ["2.7", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1", "6.2", "7.1", "8.1"] },
    { "id": 6, "tasks": ["6.3", "6.4", "6.5", "7.2", "8.2", "8.3"] },
    { "id": 7, "tasks": ["6.6", "8.4", "9.1"] },
    { "id": 8, "tasks": ["9.2", "10.1", "10.2", "10.3"] },
    { "id": 9, "tasks": ["12.1"] },
    { "id": 10, "tasks": ["12.2", "13.1"] },
    { "id": 11, "tasks": ["13.2", "13.3", "14.1"] },
    { "id": 12, "tasks": ["14.2"] }
  ]
}
```

---

**This workflow is complete once tasks.md is created.** To begin execution, open `tasks.md` and click "Start task" next to any task item.

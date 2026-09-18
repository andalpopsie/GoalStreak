# Implementation Plan: Founding Members

## Overview

Implement the Founding Member program across three deployable units: (1) a Firebase Cloud Function (`GoalStreakApp/functions/`) that evaluates eligibility, atomically claims slots, and grants RevenueCat Pro on signup; (2) React Native app components for the badge, celebration screen, and profile/feed integration; and (3) a live scarcity counter on the `goalfer-landing` Next.js page. Tasks follow a dependency order from shared types → server logic → app UI → landing page → integration tests → final PR.

## Progress Tracker

_Last updated by Spec Task Tracker. Counts exclude optional `*` test sub-tasks (9.1, 16.1, 22.1)._

- **Completed (6/29 ≈ 21%):** 1, 2, 3, 4, 6, 21 — shared types, Firestore rule guards, functions bootstrap, landing Firebase SDK.
- **Next up (unblocked, foundational):** Task 9 (`eligibility.ts`) — pure, no-I/O, gates the entire server pipeline.
- **Milestones:** M1 Foundation (types + rules + bootstrap) ✅ mostly done · M2 Server logic ⏳ blocked on task 9 · M3 App UI ⏳ · M4 Landing ⏳ (SDK done, counter pending) · M5 Tests/PR ⏳.

- [x] 1. Add founding types to `src/types/index.ts`
  - Add the `ProGrantStatus`, `FoundingRecord`, and `FoundingProfileFields` interfaces to the app type definitions so every downstream file can import from the canonical location.
  - Add the following exports:
    ```typescript
    export type ProGrantStatus = 'pending' | 'granted';

    export interface FoundingRecord {
      number: number;                  // 1..100
      grantedAt: Date;
      proExpiresAt: Date | null;
      proGrantStatus: ProGrantStatus;
      lastAttemptAt?: Date | null;
    }

    export interface FoundingProfileFields {
      foundingMember: boolean;         // false for non-members
      foundingNumber: number;          // 0 = non-member sentinel, 1..100 = member
      foundingRecord?: FoundingRecord; // present only for members
    }
    ```
  - _Requirements: R6, R7.5_

- [x] 2. Extend the `User` / `UserProfile` type with founding fields
  - Find where the in-app user/profile shape is declared (likely `src/types/index.ts`) and add the `FoundingProfileFields` fields as optional so existing code compiles without change.
  - _Requirements: R6.1, R6.2_

- [x] 3. Guard founding fields on `userProfiles` against client writes
  - Update `GoalStreakApp/firebase/firestore.rules` so the owner write rule on `/userProfiles/{userId}` rejects any update that touches `foundingMember`, `foundingNumber`, or `foundingRecord`. The Admin SDK (Cloud Function) bypasses rules so server writes remain unrestricted.
  - Apply the following change:
    ```javascript
    match /userProfiles/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId)
        && !request.resource.data.diff(resource.data).affectedKeys()
              .hasAny(['foundingMember', 'foundingNumber', 'foundingRecord']);
    }
    ```
  - _Requirements: R6.6, R6.7_

- [x] 4. Add public read / no-client-write rules for counter and config
  - Add two new collection rules to `GoalStreakApp/firebase/firestore.rules`: `counters/foundingMembers` (public read, no client write) and `config/foundingMembers` (authenticated read, no client write).
  - Apply the following change:
    ```javascript
    match /counters/{docId} {
      allow read: if true;        // public — landing page reads this unauthenticated
      allow write: if false;      // Admin SDK only
    }
    match /config/{docId} {
      allow read: if isAuthenticated();
      allow write: if false;      // Admin SDK only
    }
    ```
  - _Requirements: R10.1, R10.5, R4.2_

- [x] 5. Deploy updated Firestore rules
  - Run `firebase deploy --only firestore:rules` from `GoalStreakApp/firebase/` against the development project and verify the rules deploy without errors.
  - _Requirements: R6.6, R6.7, R10.1, R10.5_

- [x] 6. Initialise `GoalStreakApp/functions/` project
  - Create the first Cloud Functions codebase in the repo with the following files:
    - `GoalStreakApp/functions/package.json` — dependencies: `firebase-functions`, `firebase-admin`, TypeScript dev dependencies
    - `GoalStreakApp/functions/tsconfig.json` — targeting Node 20
    - `GoalStreakApp/functions/src/index.ts` — barrel that exports `onUserCreated` and `reconcilePendingGrants`
    - `GoalStreakApp/functions/src/founding/types.ts` — mirror of the shared founding types (Firestore Timestamp variants for server use)
    - `GoalStreakApp/functions/src/config.ts` — constants: `FOUNDING_CAP = 100`, entitlement id `'pro'`, collection paths
    - `GoalStreakApp/functions/.gitignore` — ignore `lib/` and `node_modules/`
  - _Requirements: design §1 (Cloud Functions bootstrap)_

- [x] 7. Add `functions` block to `GoalStreakApp/firebase/firebase.json`
  - Wire the new functions directory into the Firebase project config with Node 20 runtime.
  - Add to `firebase.json`:
    ```json
    "functions": {
      "source": "../functions",
      "runtime": "nodejs20"
    }
    ```
  - _Requirements: design §1_

- [x] 8. Add `functions` emulator to `firebase.json`
  - Add a `functions` entry to the `emulators` block so integration tests can run the `onUserCreated` function locally.
  - Add to `firebase.json` emulators block:
    ```json
    "functions": { "port": 5001 }
    ```
  - _Requirements: design §1_

- [x] 9. Implement `eligibility.ts` — pure T0 evaluation
  - Create `GoalStreakApp/functions/src/founding/eligibility.ts` with the pure, I/O-free eligibility helpers.
  - Export the following:
    ```typescript
    // Parses an ISO 8601 UTC string; returns null if absent/invalid (R2.2)
    function parseLaunchTimestamp(raw: unknown): number | null;

    type EligibilityInput = {
      accountCreatedAtUtcMs: number;
      launchTimestampUtcMs: number | null;
      claimed: number;
      cap: number;
    };
    type EligibilityOutcome =
      | { kind: 'eligible' }
      | { kind: 'before-launch' }
      | { kind: 'sold-out' }
      | { kind: 'config-invalid' };

    function evaluateEligibility(input: EligibilityInput): EligibilityOutcome;

    // Returns claimed + 1 (R3.2)
    function assignNumberFrom(claimed: number): number;
    ```
  - Key rule: timestamp at exactly T0 is eligible (inclusive lower bound, R1.4, R2.5).
  - _Requirements: R1.3, R1.4, R2.2–R2.6, R3.2, R15.1_

  - [x] 9.1 Unit tests for `eligibility.ts`
    - Create `GoalStreakApp/functions/src/founding/__tests__/eligibility.test.ts`.
    - Cover:
      - `before-launch` when `createdAt < T0`
      - `eligible` when `createdAt === T0` (inclusive boundary, R2.5)
      - `eligible` when `createdAt > T0` and `claimed < cap`
      - `sold-out` when `claimed >= cap` (R3.5)
      - `config-invalid` when `launchTimestampUtcMs` is null (R2.2)
      - `parseLaunchTimestamp`: valid ISO 8601 UTC parses correctly, null returns null, garbage returns null
      - `assignNumberFrom`: returns `claimed + 1` for values 0..99
    - **Property 4: T0 boundary is inclusive and exclusive-below** — an account with `creationTime == T0` is eligible; `creationTime < T0` is never assigned a number.
    - **Validates: Requirements R1.3, R1.4, R2.5**
    - _Requirements: R1.3, R1.4, R2.2, R2.5, R3.2, R3.5_

- [x] 10. Implement `revenuecat.ts` — RevenueCat REST client
  - Create `GoalStreakApp/functions/src/founding/revenuecat.ts`.
  - Behaviour:
    - Calls RevenueCat's promotional-entitlement grant endpoint with the `pro` entitlement, duration 1 year, using `REVENUECAT_SECRET_KEY` from the Functions secret (server-side only, never logged, R4.2)
    - Timeout: 10 s per attempt (R5.1)
    - Retries: exponential backoff starting at 1 s, doubling, capped at 30 s, max 5 attempts (R5.2)
    - Returns `{ status: 'granted'; proExpiresAt: Date }` on success or `{ status: 'pending' }` after exhausting retries (R5.3)
  - _Requirements: R4.1–R4.3, R5.1–R5.3_

- [x] 11. Implement `claim.ts` — atomic Firestore transaction
  - Create `GoalStreakApp/functions/src/founding/claim.ts`.
  - Behaviour:
    - Runs a single Firestore transaction over `counters/foundingMembers` and `userProfiles/{uid}` (R3.1)
    - Reads `claimed`; if `>= FOUNDING_CAP` returns `{ soldOut: true }` (R3.5)
    - Otherwise assigns `number = claimed + 1`, increments counter, and writes the `FoundingRecord` with `proGrantStatus: 'pending'` (R3.2, R6.1–R6.4)
    - Retries on contention up to 5 times; returns failure if still unresolved (R3.7)
    - Idempotent: if a `foundingRecord` already exists for the uid it returns the existing number without claiming a second slot
  - Signature:
    ```typescript
    async function claimFoundingSlot(
      db: Firestore,
      uid: string,
      cap: number,
    ): Promise<{ number: number } | { soldOut: true } | { failed: true }>;
    ```
  - _Requirements: R3.1–R3.7, R6.1–R6.7, R13.1_

- [x] 12. Implement `onUserCreated` — the Founding_Function
  - Create `GoalStreakApp/functions/src/founding/onCreate.ts` and export it from `src/index.ts`.
  - Flow:
    1. Read `config/foundingMembers.launchTimestamp` (R2.1); on missing/invalid → record config error, write `foundingMember: false` to profile, stop (R2.2, R2.3)
    2. Parse `user.metadata.creationTime` as UTC ms and call `evaluateEligibility` (R1.1–R1.6)
    3. On `before-launch` or `sold-out` → write `foundingMember: false, foundingNumber: 0` to `userProfiles/{uid}`, stop (R1.3, R1.5, R3.5)
    4. On `eligible` → call `claimFoundingSlot()`
    5. On successful claim → call `grantProEntitlement()`; update `proGrantStatus` and `proExpiresAt` (R4.1, R4.3); on grant failure leave `pending` (R5.1–R5.3)
    6. Function must be idempotent per uid (R3.3 — no double claim on re-invoke)
    7. Bind `REVENUECAT_SECRET_KEY` secret via `runWith({ secrets: [...] })`
  - _Requirements: R1, R2, R3, R4, R5, R6, R13.1, R15_

- [x] 13. Implement `reconcilePendingGrants` — scheduled function
  - Create `GoalStreakApp/functions/src/founding/reconcile.ts` and export it from `src/index.ts`.
  - Behaviour:
    - Scheduled `every 6 hours` (within the ≤ 24h requirement, R5.4)
    - Queries `userProfiles` where `foundingRecord.proGrantStatus == 'pending'`
    - For each: re-calls `grantProEntitlement()`; on success updates `proGrantStatus: 'granted'` and `proExpiresAt` (R5.4)
    - On failure: leaves `pending`, retries on next run (R5.5)
    - Never decrements the counter or releases/reassigns a number (R5.6)
  - _Requirements: R5.4, R5.5, R5.6_

- [x] 14. Deploy functions to development project and smoke test
  - Run `firebase deploy --only functions` against the development project.
  - Verify: create a test account after T0 → `userProfiles` doc gains `foundingMember: true` and a `foundingRecord` within 60 seconds.
  - _Requirements: R1.1_

- [x] 15. Implement `useFoundingMember` hook
  - Create `GoalStreakApp/src/hooks/useFoundingMember.ts`.
  - Behaviour:
    - Subscribes to `userProfiles/{uid}` via `onSnapshot`
    - Derives `isFoundingMember` from the `foundingMember` boolean flag
    - Exposes `foundingNumber` (null if absent) and `loading` state
    - Independent of `useSubscription` / `isPro` — reads only founding fields (R7.4, R8.4, R14.1)
  - Signature:
    ```typescript
    interface FoundingMemberState {
      isFoundingMember: boolean;
      foundingNumber: number | null;
      loading: boolean;
    }
    function useFoundingMember(uid: string): FoundingMemberState;
    ```
  - _Requirements: R7.3, R7.4, R8.4, R12.5, R14.1–R14.3_

- [x] 16. Implement `FoundingBadge` component
  - Create `GoalStreakApp/src/components/common/FoundingBadge.tsx` and export it from `src/components/common/index.ts`.
  - Props:
    ```typescript
    interface FoundingBadgeProps {
      foundingNumber: number | null; // null → badge renders without the number (R8.5)
      variant?: 'profile' | 'feed';  // 'profile' = full label; 'feed' = compact
    }
    ```
  - Design rules (all from `theme.ts`, no one-off values):
    - Uses purple accent `Colors.accent1` (`#B771E5`) — the CTA/highlight colour
    - 8pt-grid spacing throughout
    - `variant='profile'`: full-size badge with "Founding Member #42" text, `fontSize: Typography.subheading (20)`, `fontWeight: '700'`
    - `variant='feed'`: compact pill badge with "#42", `fontSize: Typography.caption (14)`
    - Badge and number render independently: if `foundingNumber` is null, show the badge without the number string (R7.6, R8.5, R14.3)
    - Visibility driven by callers from the `foundingMember` flag, not `isPro`
    - Minimum touch target 48px if tappable (design rule)
  - _Requirements: R7.1, R7.2, R7.3, R7.4, R7.6, R8.1–R8.5, R12.5, R14.3_

  - [x] 16.1 Unit tests for `FoundingBadge`
    - Create `GoalStreakApp/src/components/common/__tests__/FoundingBadge.test.tsx`.
    - Cover:
      - Renders with `foundingNumber` present (number shown in output)
      - Renders with `foundingNumber = null` (badge renders, number text absent, R8.5)
      - `variant='profile'` renders larger label; `variant='feed'` renders compact
      - Does NOT check `isPro` — badge renders regardless of Pro state (R7.4, R8.4)
    - **Property 6: Badge visibility is independent of Pro** — for all founding accounts, the badge renders based solely on `foundingMember`/`foundingNumber`, regardless of `isPro`.
    - **Validates: Requirements R7.3, R7.4, R8.4, R12.5, R14.3**
    - _Requirements: R7.4, R8.4, R8.5_

- [x] 17. Implement `FoundingCelebrationScreen`
  - Create `GoalStreakApp/src/screens/FoundingCelebrationScreen.tsx`.
  - Behaviour:
    - Accepts `foundingNumber: number` as a navigation param (R9.2)
    - Displays a congratulations message with the founding number prominently
    - Auto-dismisses after 8 seconds or on user tap; both paths route to the normal post-signup screen (R9.5)
    - Uses `useFoundingMember` to await the record if not yet available when onboarding completes (R9.4)
    - The screen is only ever pushed when `foundingMember === true` (R9.1, R9.3)
    - Styling: `Colors.accent1` (`#B771E5`) hero, Montserrat font throughout, 8pt-grid spacing, large number display at `Typography.heading` (24) or custom large size
  - _Requirements: R9.1–R9.5_

- [x] 18. Wire `FoundingBadge` into `ProfileScreen`
  - Update `GoalStreakApp/src/screens/ProfileScreen.tsx`:
    - Call `useFoundingMember(uid)` at the top of the screen
    - Render `<FoundingBadge variant="profile" foundingNumber={foundingNumber} />` below the avatar/username section when `isFoundingMember === true`
    - Badge visibility depends only on `isFoundingMember`, not `isPro` (R7.4)
  - _Requirements: R7.1, R7.2, R7.3, R7.4_

- [x] 19. Wire `FoundingBadge` into social feed activity cards
  - Update `GoalStreakApp/src/components/social/ActivityCard.tsx` (and/or `ActivityFeedTab.tsx` where profiles are loaded):
    - Pass `foundingMember` flag and `foundingNumber` through from the activity's author profile data (already loaded per the design — no extra per-row fetch)
    - Render `<FoundingBadge variant="feed" foundingNumber={...} />` alongside the author name when the author `foundingMember === true`
  - _Requirements: R8.1, R8.2, R8.3, R8.4_

- [x] 20. Wire `FoundingCelebrationScreen` into the post-signup flow
  - Update `GoalStreakApp/src/navigation/AppNavigator.tsx` and `GoalStreakApp/src/hooks/useOnboarding.tsx`:
    - Add `FoundingCelebrationScreen` to the navigation stack
    - After signup completes, call `useFoundingMember` and subscribe via `onSnapshot` with a bounded wait
    - Push `FoundingCelebrationScreen` when `foundingMember === true` resolves, before the first normal onboarding step (R9.1, R9.4)
    - If `foundingMember` resolves `false` (or after a 15 s timeout with no founding record), skip the celebration screen and proceed normally (R9.3)
    - Use AsyncStorage to ensure the celebration shows at most once per account
  - _Requirements: R9.1–R9.5_

- [x] 21. Add Firebase Web SDK to `goalfer-landing`
  - Install the Firebase JS SDK and configure a read-only Firebase client in `goalfer-landing/lib/firebase.ts` using the public `NEXT_PUBLIC_FIREBASE_*` env vars (already in the landing page's env or to be added).
  - _Requirements: R10.1, R10.5_

- [x] 22. Implement `FoundingCounter` component
  - Create `goalfer-landing/components/founding-counter.tsx`.
  - Behaviour:
    - Subscribes to `counters/foundingMembers` via `onSnapshot` (live updates, R10.3)
    - Derives view state from `computeCounterView(claimed, cap=100)`:
      - `claimed < 100` → show "**{100 − claimed} of 100** founding spots left" (R10.2)
      - `claimed === 100` (or `cap === 0`) → show sold-out state: zero remaining + "Founding spots are gone" messaging (R10.6, R11.1, R11.4)
      - read failure → hide the indicator; download + waitlist CTAs remain (R10.4)
    - Transitions live: if the counter hits 100 while the visitor is on the page, it switches to sold-out without a reload (R11.2)
    - Download action and waitlist form remain visible in all states (R11.3)
    - The RevenueCat secret is never referenced here (R10.5)
  - Pure helper:
    ```typescript
    type CounterStatus = 'loading' | 'available' | 'sold-out' | 'hidden';
    interface FoundingCounterView {
      status: CounterStatus;
      remaining: number; // cap - claimed, clamped >= 0
    }
    function computeCounterView(
      claimed: number | null,
      cap: number,
    ): FoundingCounterView;
    ```
  - _Requirements: R10.1–R10.6, R11.1–R11.4_

  - [x] 22.1 Unit tests for `computeCounterView`
    - Create `goalfer-landing/__tests__/foundingCounter.test.ts`.
    - Cover:
      - `claimed = 0` → `available`, remaining 100
      - `claimed = 50` → `available`, remaining 50
      - `claimed = 99` → `available`, remaining 1
      - `claimed = 100` → `sold-out`, remaining 0 (R10.6, R11.1)
      - `claimed = null` (read failure) → `hidden` (R10.4)
      - `cap = 0` → `sold-out` (R11.4)
    - **Property 8: Landing counter reflects the authoritative counter** — remaining/sold-out state is derived from the same `claimed` value the function maintains; shows `cap − claimed` when below cap and sold-out at cap or when `cap == 0`.
    - **Validates: Requirements R10.2, R11.1, R11.4, R15.4**
    - _Requirements: R10.2, R10.4, R10.6, R11.1, R11.4_

- [x] 23. Integrate `FoundingCounter` into the landing page hero
  - Update `goalfer-landing/app/page.tsx` to render `<FoundingCounter />` in the hero section, below the App Store badge CTA and above the email form.
  - _Requirements: R10.1–R10.6, R11.1–R11.4_

- [x] 24. Emulator integration test: `onUserCreated` happy path
  - Add `GoalStreakApp/functions/src/founding/__tests__/onUserCreated.emulator.test.ts`.
  - Cover:
    - Eligible signup after T0 with `claimed < 100` → `foundingMember: true`, `foundingRecord.number` equals pre-existing `claimed + 1`
    - Pre-T0 signup → `foundingMember: false`, counter unchanged
    - 101st signup → `foundingMember: false`, `claimed` stays at 100 (R3.5, R13.3)
    - Idempotency: re-invoking `onCreate` for the same uid does not claim again
  - _Requirements: R1, R2, R3, R13_

- [x] 25. Emulator concurrency test: last-slot race
  - Add a concurrency test that fires N simultaneous `onCreate` events when `claimed = 99`:
    - Assert exactly one account receives `foundingNumber: 100`
    - Assert `counters/foundingMembers.claimed` ends at exactly 100
    - Assert no two accounts share a founding number (R3.3, R3.4, R3.6)
  - **Property 1: Cap is never exceeded** — for all sequences of signups, `claimed` ∈ [0, 100] at all times and no more than 100 accounts have `foundingMember == true`.
  - **Property 2: Numbers are unique and contiguous** — no two accounts share a `foundingNumber` in 1..100 and the k-th successful claim receives number k.
  - **Property 3: Counter is monotonic non-decreasing** — no operation ever decreases `claimed`.
  - **Validates: Requirements R3.3, R3.4, R3.6, R15.2, R15.3**
  - _Requirements: R3.3, R3.4, R3.6, R15.2, R15.3_

- [x] 26. Emulator test: reconciler flips pending to granted
  - Seed a `userProfiles` doc with `proGrantStatus: 'pending'`, mock RevenueCat to succeed on the second attempt, run `reconcilePendingGrants`, and assert the doc transitions to `proGrantStatus: 'granted'` with a valid `proExpiresAt`.
  - **Property 7: Pro grant eventually completes or stays pending** — every assigned number has `proGrantStatus` in {pending, granted}; a pending grant is retried until granted.
  - **Validates: Requirements R5.3, R5.4**
  - _Requirements: R5.4, R5.5_

- [x] 27. Add composite Firestore index for reconciler query
  - Add an index to `GoalStreakApp/firebase/firestore.indexes.json` for the reconciler's query: `userProfiles` collection, field `foundingRecord.proGrantStatus` (ascending).
  - Deploy: `firebase deploy --only firestore:indexes`
  - _Requirements: R5.4_

- [x] 28. Type-check, lint, and format
  - From `GoalStreakApp/`, run:
    ```bash
    npx tsc --noEmit
    npm run lint
    npm run format:check
    ```
  - Fix any errors before opening the PR.
  - _Requirements: all_

- [x] 29. Open PR for `feature/founding-members`
  - Open a PR against `main` with the full template from `git-workflow-sop.md`.
  - PR title: `feat(founding): founding member program — Cloud Function, app badge, landing counter`
  - Include in the body:
    - Summary of the three deployable units
    - Verification: type-check passing, unit tests passing, emulator tests passing
    - Screenshots: `FoundingCelebrationScreen`, `FoundingBadge` on profile and feed, landing counter with remaining spots and sold-out states
    - Risk: Cloud Function is additive (no existing code deleted); Firestore rule change is backwards-compatible (existing non-founding writes are unaffected)
    - ADR: note that `docs/adr/0005-founding-cloud-function.md` should be created to record the Cloud Function–over–client-transaction decision (design §7.1)
  - _Requirements: all_

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP.
- Each task references specific requirements for traceability back to `requirements.md`.
- Property tests reference named correctness properties from `design.md` (Properties 1–9).
- The Cloud Functions project (`GoalStreakApp/functions/`) is the first server-side code in this repo — it requires a Blaze plan (already confirmed).
- `REVENUECAT_SECRET_KEY` must be provisioned via `firebase functions:secrets:set REVENUECAT_SECRET_KEY` before deploying functions.
- `config/foundingMembers.launchTimestamp` must be written to Firestore before going live; the function treats a missing config as "all ineligible".
- The existing `subscriptionService` / `useSubscription` / `getHabitLimit` stack is **unchanged** — founding Pro is delivered as a RevenueCat promotional entitlement so `isPro` continues to be the single source of truth.
- Founding badge visibility is always driven by the `foundingMember` flag, never by `isPro`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3", "4", "6", "21"] },
    { "id": 1, "tasks": ["5", "7", "8", "15"] },
    { "id": 2, "tasks": ["9", "27"] },
    { "id": 3, "tasks": ["9.1", "10", "11"] },
    { "id": 4, "tasks": ["12", "13", "16"] },
    { "id": 5, "tasks": ["14", "16.1", "17", "22"] },
    { "id": 6, "tasks": ["18", "19", "20", "22.1", "23"] },
    { "id": 7, "tasks": ["24", "25", "26"] },
    { "id": 8, "tasks": ["28"] },
    { "id": 9, "tasks": ["29"] }
  ]
}
```

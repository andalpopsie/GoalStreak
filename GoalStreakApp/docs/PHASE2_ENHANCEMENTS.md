# Phase 2 Enhancements — Working Document

**Status**: Living document — updated as issues are identified  
**Last Updated**: Sep 13, 2026  
**Purpose**: Track critical architecture, code, and design improvements for post-launch

---

## 🔴 Critical (Fix Before Scaling)

### 1. Friend System — Deterministic Document IDs
**Area**: `friendService.ts` → `acceptFriendRequest()`  
**Problem**: Friend docs use auto-generated IDs. Two concurrent accepts can both pass the existence check and create duplicates (this already happened in production).  
**Best Practice**: Use compound IDs like `{userId}_{friendId}` so Firestore enforces uniqueness at the database level. A `setDoc()` with a deterministic ID is idempotent — duplicates become impossible.  
**Fix**:
```typescript
// Instead of: doc(this.friendsCollection)
// Use: doc(this.friendsCollection, `${request.fromUserId}_${request.toUserId}`)
```
**Impact**: Data integrity, prevents duplicate friend entries  
**Effort**: Low (1-2 hours)

### 2. Friend System — Denormalized Names Go Stale
**Area**: `friends` collection in Firestore  
**Problem**: Friend docs store `friendName` and `friendEmail` directly. If a user changes their display name, all their friends see the old name.  
**Best Practice**: Store only `userId` and `friendId`. Resolve names at read time, or use a Cloud Function to fan out name updates to all friend docs when a profile changes.  
**Impact**: Data consistency, user experience  
**Effort**: Medium (4-6 hours)

### 3. Firestore Security Rules — Friend Collection
**Area**: `firebase/firestore.rules`  
**Problem**: Current rules may not enforce that `userId` field matches `request.auth.uid` on friend document writes. A malicious client could write arbitrary friend records.  
**Best Practice**: Validate `request.resource.data.userId == request.auth.uid` on create.  
**Impact**: Security  
**Effort**: Low (1 hour)

### 4. User Blocking & Reporting
**Area**: Social features  
**Problem**: No ability to block or report users. Apple reviewers check for this in social apps and may reject without it.  
**Best Practice**: Add `blockedUsers` subcollection per user. Filter blocked users from friend suggestions, activity feed, and search results. Add a report flow that sends to a moderation queue.  
**Impact**: App Store compliance, user safety  
**Effort**: Medium (6-8 hours)

---

## 🟡 Important (Address for Growth)

### 5. Activity Feed — Fan-Out on Write
**Area**: `friendService.ts` → activity feed queries  
**Problem**: Feed is built by querying activities at read time with friend ID filters. This gets slow as user/friend counts grow.  
**Best Practice**: When a user completes a habit, write an activity doc into each friend's personal feed subcollection (`users/{userId}/feed/{activityId}`). Reads become a simple collection query with no joins.  
**Impact**: Performance at scale (1000+ users)  
**Effort**: High (8-12 hours)

### 6. Password Strength — Existing User Migration
**Area**: Authentication  
**Problem**: New signups now require strong passwords (8+ chars, uppercase, number, special char). Existing users may have weak 6-char passwords.  
**Options**:  
- Soft nudge banner after login for accounts created before April 2026  
- Password reset email campaign to all existing users  
- Forced password update on next login  
**Impact**: Security  
**Effort**: Low-Medium (2-4 hours)

### 7. Firebase Config — Environment Variables
**Area**: `src/services/firebase.ts`  
**Problem**: Firebase config values are in `.env` files which is fine for Expo, but the API key is visible in the client bundle. This is expected for Firebase but should be paired with proper security rules and App Check.  
**Best Practice**: Enable Firebase App Check to ensure only your app can call your Firebase backend.  
**Impact**: Security hardening  
**Effort**: Medium (4-6 hours)

### 8. Automated Testing
**Area**: Entire codebase  
**Problem**: No automated test suite running. Test files exist in `__tests__/` but aren't part of CI.  
**Best Practice**: Unit tests for services, integration tests for critical flows (auth, habit completion, friend requests), snapshot tests for key screens.  
**Impact**: Reliability, regression prevention  
**Effort**: High (ongoing)

---

## 🟢 Nice to Have (Future Optimization)

### 9. Offline Data Sync Improvements
**Area**: Firestore persistence  
**Problem**: Basic offline support exists via Firestore's built-in persistence, but conflict resolution for habit completions done offline isn't explicitly handled.  
**Best Practice**: Add optimistic UI updates with rollback on sync failure. Show sync status indicator.  
**Impact**: UX in poor network conditions  
**Effort**: Medium (4-6 hours)

### 10. Performance Monitoring
**Area**: App-wide  
**Problem**: `performanceMonitoringService.ts` was removed (dead code). No active performance tracking.  
**Best Practice**: Integrate Firebase Performance Monitoring for screen load times, network request latency, and custom traces for critical flows.  
**Impact**: Observability  
**Effort**: Medium (4-6 hours)

### 11. Crash Reporting
**Area**: App-wide  
**Problem**: `crashlyticsService.ts` exists but Crashlytics may not be fully configured in production builds.  
**Best Practice**: Verify Crashlytics is receiving crash reports. Add breadcrumbs for key user actions to aid debugging.  
**Impact**: Debugging production issues  
**Effort**: Low (2 hours)

### 12. Internationalization (i18n)
**Area**: All screens  
**Problem**: All strings are hardcoded in English.  
**Best Practice**: Extract strings to a localization file. Use `react-native-localize` + `i18next` for multi-language support.  
**Impact**: Market expansion  
**Effort**: High (ongoing)

---

## 🌱 Phase 2 Feature: Habit Growth Gamification

### Overview
Each habit has a virtual plant that grows with the user's streak. Completing habits consistently makes the plant grow; breaking a streak causes it to wilt. The dashboard becomes a "garden" over time, creating emotional attachment and loss aversion.

### Growth Stages
| Streak | Stage | Icon | Visual |
|--------|-------|------|--------|
| 0 days | Wilted | 🥀 | Gray/faded, drooping |
| 1-2 days | Seed | 🌰 | Small seed in soil |
| 3-6 days | Sprout | 🌱 | Green sprout emerging |
| 7-13 days | Sapling | 🌿 | Small plant with leaves |
| 14-29 days | Tree | 🌳 | Full tree |
| 30-59 days | Flowering | 🌸 | Tree with flowers |
| 60-99 days | Fruit | 🍎 | Tree bearing fruit |
| 100+ days | Golden | 🏆 | Golden/legendary tree |

### Where It Shows
1. **Habit Card** — small growth icon badge on each habit circle (replaces or supplements the streak flame)
2. **Garden View** — new section in Analytics showing all habits as plants in a grid, visual overview of your "garden health"
3. **Completion Celebration** — when a habit levels up to a new stage, show a celebration animation ("Your Morning Run grew into a sapling! 🌿")
4. **Profile** — "Garden Score" stat showing overall garden health percentage
5. **Social** — friends can see your garden in your profile (optional)

### Wilt Mechanic
- Missing 1 day: plant drops one stage (tree → sapling)
- Missing 3+ days: plant wilts to seed
- Resuming: plant grows back from current streak

### Technical Approach
- No new Firestore data needed — growth stage is derived from existing `streak.currentStreak`
- Pure UI feature: `getGrowthStage(streakCount)` utility function
- Garden view: new component reading from existing `useHabits` hook
- Stage transition celebrations: extend existing `useMilestones` hook
- Estimated effort: 8-12 hours

### Inspiration
- **Forest App** — plant trees by staying focused
- **Duolingo** — streak freeze and heart system
- **Habitica** — RPG character health tied to habits
- **Finch** — virtual pet that grows with self-care habits

---

## 📋 Discovery Log

Items added as they're found during development sessions:

| Date | Item | Source | Added As |
|------|------|--------|----------|
| Apr 23, 2026 | Duplicate friend docs from race condition | Firestore data audit | #1 Critical |
| Apr 23, 2026 | Stale friend names after profile update | Code review | #2 Critical |
| Apr 23, 2026 | Missing security rule validation | Code review | #3 Critical |
| Apr 23, 2026 | No block/report feature | Best practice review | #4 Critical |
| Apr 23, 2026 | Query-based activity feed | Architecture review | #5 Important |
| Apr 23, 2026 | Weak passwords on existing accounts | Password policy update | #6 Important |
| Apr 23, 2026 | No Firebase App Check | Security review | #7 Important |
| Apr 23, 2026 | No automated tests in CI | Codebase health review | #8 Important |
| Apr 23, 2026 | Removed performanceMonitoringService | Cleanup session | #10 Nice to Have |
| Apr 23, 2026 | FriendsTab suggestion cards use fixed width (152px) — won't adapt on iPad/larger screens | FriendsTab.tsx UI redesign | Nice to Have |
| Apr 23, 2026 | ProfileScreen Edit Profile modal doesn't actually save — `handleSaveProfile` closes modal without calling `updateUserProfile` | ProfileScreen.tsx | Important |
| Apr 23, 2026 | Notification settings stored only in AsyncStorage (local) — lost on device change, not synced to Firestore | ProfileScreen.tsx | Important |
| Apr 23, 2026 | Copyright year hardcoded as "© 2024" — should be dynamic | ProfileScreen.tsx footer | Nice to Have |
| Apr 23, 2026 | Email change in Edit Profile not implemented — requires Firebase re-auth + email verification flow | ProfileScreen.tsx | Important |
| Apr 23, 2026 | Profile name update doesn't fan out to friend docs (friendName stays stale) — ties into #2 denormalized names | ProfileScreen.tsx handleSaveProfile | Critical |
| Apr 23, 2026 | dailyReminder and streakAlerts toggles are UI-only — no service wired to schedule/cancel these notifications | ProfileScreen.tsx notifications modal | Important |
| Apr 25, 2026 | App name "GoalStreak" hardcoded across 50+ files — no single constant. Rebrand to "Goalfer" requires manual find-replace everywhere. Should extract to a config constant. | Codebase-wide | Important |
| Apr 28, 2026 | Habit Growth Gamification — virtual plant that grows with streak (seed → sprout → tree → golden). Garden view, wilt mechanic, stage celebrations. See detailed spec above. | Feature concept | Phase 2 Feature |
| Sep 12, 2026 ✅ | `useFoundingMember` two-`useEffect` `isMountedRef` pattern confirmed intentional — matches `useSubscription` and `useModeration` exactly. The separate mount-effect is the project-wide convention for long-running async guards (StoreKit sheets, Firestore listeners). No change needed. | `src/hooks/useFoundingMember.ts` | ~~Low~~ Closed |
| Sep 12, 2026 | `FoundingRecord` type declared at bottom of `src/types/index.ts` but forward-referenced by `User` on line 17. Compiles correctly but hurts readability. Move founding types above `User`, or import from a `types/founding.ts`. | `src/types/index.ts` | Low |
| Sep 12, 2026 ✅ | ~~Cloud Functions project has no test runner configured.~~ **Resolved (Task 9.1)**: Jest + ts-jest installed; `test` script added; 29 unit tests passing. Still need `@firebase/rules-unit-testing` for emulator tests (Tasks 24-26). | `GoalStreakApp/functions/package.json` | ~~Important~~ Done |
| Jan 2025 | No `.firebaserc` in `GoalStreakApp/firebase/` — deploys must use `--project` flag manually, risking accidental production deploys. Create `.firebaserc` with `development` → `goalstreak-app` and `production` → `goalstreak-app2` aliases. See FIREBASE_GUIDE.md. | `GoalStreakApp/firebase/` deploy (Task 5) | Medium |
| Jan 2026 | `eligibility.ts` UTC-only enforcement rejects bare dates and non-UTC offsets — any future T0 config value without an explicit `Z` or `+00:00` suffix will silently treat all accounts as ineligible. Operator docs should call this out when setting `config/foundingMembers.launchTimestamp`. | `functions/src/founding/eligibility.ts` `parseLaunchTimestamp` | Low |
| Jan 2026 | `functions/package.json` installs `ts-jest ^29` alongside `jest ^30`. The major-version mismatch is currently masked by ts-jest's forward-compat shims but may break on a minor update. Pin `jest` to `^29` or upgrade `ts-jest` to `^30` when it reaches stable. | `GoalStreakApp/functions/package.json` devDependencies | Low |
| Jan 2026 | `revenuecat.ts` uses a fixed 1-year duration (`365 * 24 * 60 * 60 * 1_000` ms). Leap years and daylight-saving transitions are not accounted for. RevenueCat ignores the exact ms and grants the stated duration server-side, but `proExpiresAt` in Firestore could drift by up to 1 day vs. the actual RevenueCat expiry. Consider using a date-math library or `Date` arithmetic with `setFullYear` instead of a ms constant. | `functions/src/founding/revenuecat.ts` `ONE_YEAR_MS` | Low |
| Jan 2026 | `grantProEntitlement` treats all HTTP 4xx (except 429) as permanent failures and immediately returns `pending`. RevenueCat returns 404 when the subscriber does not yet exist in their system (first-time user, no prior purchase). A 404 on the promotional grant would silently mark the Pro perk as pending rather than retrying — worth verifying this edge case against the RevenueCat sandbox. | `functions/src/founding/revenuecat.ts` `isRetryable` | Medium |
| Jan 2026 | `claimFoundingSlot` swallows all errors in its outer retry loop — even non-retryable errors (PERMISSION_DENIED, INVALID_ARGUMENT) are retried 5 times before returning `{ failed: true }`. This adds 50+100+200+400ms of latency for permanent failures and obscures the root cause. Distinguish contention errors (ABORTED, 10 = ABORTED gRPC code) from permanent errors and fast-fail on the latter. | `functions/src/founding/claim.ts` outer catch block | Medium |
| Jan 2026 | `claimFoundingSlot` returns `{ failed: true }` for both network timeouts and Firestore contention. The caller (`onUserCreated`) cannot distinguish "slot not claimed, safe to retry" from "unknown state, number may already be reserved". Add a `reason` discriminant (`'contention' \| 'unknown'`) so the Cloud Function can log the distinction and handle them differently. | `functions/src/founding/claim.ts` return type | Low |
| Jan 2026 | The `claimFoundingSlot` outer retry loop adds its own backoff (50ms..400ms) on top of Firestore's internal transaction retry. For the last-slot race under heavy load, this double-retry could hold a Cloud Function invocation open for an extra ~750ms. The outer loop exists to handle SDK-exhausted-retries — confirm this case actually occurs in practice before keeping the added latency. | `functions/src/founding/claim.ts` sleep() backoff | Low |
| Jan 2026 | `onUserCreated` reads `counters/foundingMembers` optimistically before calling `evaluateEligibility`, then `claimFoundingSlot` re-reads it inside the transaction. For `before-launch` accounts (the common pre-launch case) this is a wasted Firestore read every invocation. Splitting eligibility into two phases — T0 check first, counter read only if T0 passes — would eliminate this read for the majority of pre-launch signups. | `functions/src/founding/onCreate.ts` `handleUserCreated` | Low |
| Jan 2026 | `onUserCreated` does not short-circuit when `claimFoundingSlot` returns an existing `{ number }` (idempotent re-invoke path) and `foundingRecord.proGrantStatus` is already `'granted'`. On re-invocation the function will call RevenueCat again unnecessarily. Add an early-return guard: if the profile already has `proGrantStatus === 'granted'`, skip the grant call entirely. | `functions/src/founding/onCreate.ts` idempotency path | Low |
| Jan 2026 | `reconcile.ts` processes all pending grants with `Promise.allSettled` — no concurrency limit. If there are ever many pending grants (e.g. a RevenueCat outage leaves 50+ pending), the function issues 50+ simultaneous HTTP calls. The scheduled function has a 9-minute timeout on Cloud Functions v1, so this is unlikely to be a hard blocker, but adding a concurrency cap (e.g. batches of 10) would prevent hitting RevenueCat rate limits. | `functions/src/founding/reconcile.ts` `reconcile()` | Low |
| Jan 2026 ✅ | **Resolved (Task 27)**: Firestore's automatic single-field index covers the reconciler's `where('foundingRecord.proGrantStatus', '==', 'pending')` query — no composite index entry is required. Verified by attempting a deploy; Firestore rejected with `400: this index is not necessary`. The reconciler query works against the live collection without any `firestore.indexes.json` changes. | `functions/src/founding/reconcile.ts`, `GoalStreakApp/firebase/firestore.indexes.json` | ~~Medium~~ Done |
| Jan 2026 ✅ | **Resolved (Task 14)**: Root-level `firebase.json` and `.firebaserc` created at `GoalStreakApp/` so `firebase deploy --only functions` works from the true project root. `firebase/firebase.json` stripped of the functions block to avoid deploy-path confusion. Both files committed on `feature/founding-members`. | `GoalStreakApp/firebase.json`, `.firebaserc` | ~~Medium~~ Done |
| Jan 2026 | `onUserCreated` smoke test: `proGrantStatus` landed as `pending` because `REVENUECAT_SECRET_KEY` was set to an Apple App Store shared secret instead of the RevenueCat REST API key (`sk_...`). Requires re-provisioning: `firebase functions:secrets:set REVENUECAT_SECRET_KEY` with the `sk_...` key from RevenueCat → Project Settings → API Keys → Secret keys, then redeploy. Reconciler will auto-resolve existing pending grants once the correct key is set. | `functions/src/founding/revenuecat.ts` — secret provisioning | Medium |
| Sep 12, 2026 | `FoundingBadge`: `paddingVertical: 4` in `feedBadge` is a hardcoded off-grid value. Should derive from `Spacing.unit / 2` so it stays tied to the design system. Also, `profileNumber` style is identical to `profileText` and redundant — the nested `<Text>` inherits parent styles in RN. Minor cleanup before tasks 18/19 consume this component in profile and feed. | `src/components/common/FoundingBadge.tsx` | Low |
| Jan 2026 | `FoundingCelebrationScreen`: auto-dismiss timer (`setTimeout`) is not cancelled if the component unmounts before 8s due to a navigation replace from a concurrent event (e.g. deep link). The cleanup `return` in the `useEffect` only clears `dismissTimerRef`, but `navigation.replace` inside `dismiss` would still fire. Guard with the existing `didDismissRef` — already present — but verify Task 20's wiring never double-pushes this screen, since `navigation.replace` on an already-replaced screen throws in React Navigation. | `src/screens/FoundingCelebrationScreen.tsx` timer/navigation | Low |

| Jan 2026 | `ProfileScreen` dual-role uid resolution (`foundingUid = isOwnProfile ? user.id : targetUserId`) is correct but undocumented. If a third profile-view entry point is added later without passing `userId` as a param, `isOwnProfile` will silently default to `true` and the badge will show the current user's founding status rather than the viewed profile's. Worth adding a comment to the `isOwnProfile` derivation reminding callers that the screen requires `userId` in route params for the other-user path. | `src/screens/ProfileScreen.tsx` `isOwnProfile` logic | Low |

| Jan 2026 | `FoundingCounter` (landing page): loading and hidden states both return `null`, so there is no skeleton/placeholder element during the Firestore round-trip. On slow connections the counter area collapses and the surrounding layout shifts when the pill appears. Consider a fixed-height invisible placeholder (`min-h-[40px]`) so the hero layout is stable while loading. | `goalfer-landing/components/founding-counter.tsx` loading state | Low |
| Jan 2026 | `FoundingCounter` (landing page): the urgency threshold (≤10 spots) and `FOUNDING_CAP` (100) are magic numbers inlined in the component. If the cap ever changes (unlikely but possible), both values must be updated in sync. Extract `URGENCY_THRESHOLD` as a named constant alongside `FOUNDING_CAP` for clarity. | `goalfer-landing/components/founding-counter.tsx` | Low |
| Jan 2026 | `SocialActivity` type carries `foundingMember` and `foundingNumber` as optional fields, but the service layer that writes `activities/{activityId}` docs (completionService / activityService) does not yet populate them. Badge will always be absent at runtime until the write path is updated to snapshot these fields from `userProfiles/{uid}` at activity-creation time. | `src/types/social.ts`, `src/services/completionService.ts` | Medium |
| Jan 2026 | `ActivityCard` and `ActivityFeedTab` both maintain independent inline social-feed card UI (same card, two implementations). Task 19 added badge logic to both independently, doubling the maintenance surface. Medium-term, consolidate on `ActivityCard` as the single card component and have `ActivityFeedTab` render `<ActivityCard />` rows. | `src/components/social/ActivityCard.tsx`, `ActivityFeedTab.tsx` | Medium |
| Jan 2026 | `ActivityCard` renders `FoundingBadge` in a dedicated `authorRow` View above `activityHeader`, visually detaching the badge from the author name (which lives inside the activity sentence string). `ActivityFeedTab` correctly places the badge inline with the author name in `userInfo`. Align `ActivityCard` to use the same inline placement. | `src/components/social/ActivityCard.tsx` `authorRow` | Low |
| Jan 2026 | `useFoundingCelebrationGate` (in `useOnboarding.tsx`) returns `checking: true` as its initial state even when `enabled` is `false`. The caller guards correctly with `(foundingGateEnabled && foundingChecking)` so no incorrect loading state is shown, but the semantic mismatch ("I am checking" when the hook hasn't started) could confuse a future caller who doesn't read the guard pattern. Consider initialising `checking` to `!enabled` so disabled instances start resolved. | `src/hooks/useOnboarding.tsx` `useFoundingCelebrationGate` | Low |
| Jan 2026 | `goalfer-landing` now has a Vitest test suite (vitest.config.ts + `__tests__/`) separate from the Functions Jest suite. The `vitest.config.ts` `@/` alias resolves to the landing root. If the landing page ever adds React component tests (e.g. testing `FoundingCounter` with a Firestore mock), the config will need `environment: 'jsdom'` and `@testing-library/react`. No action needed now; flag for the first component-level test. | `goalfer-landing/vitest.config.ts` | Low |
| Jan 2026 | Emulator integration test (`onUserCreated.emulator.test.ts`) sets `process.env.FIRESTORE_EMULATOR_HOST` before import statements to route firebase-admin to the emulator. Works with ts-jest/CommonJS (imports compile to synchronous `require()` calls). If the functions project migrates to ESM (`"module": "NodeNext"`), static imports are hoisted and this pattern silently breaks — emulator host won't be set before `initializeApp()`. Mitigation: add a Jest `globalSetup` file. | `functions/src/founding/__tests__/onUserCreated.emulator.test.ts` env ordering | Low |
| Jan 2026 ✅ | **Resolved (Task 24)**: Emulator integration tests added for `onUserCreated` covering happy path, pre-T0, sold-out at 100, and idempotency. `handleUserCreated` exported `@internal` for direct testing without the Functions emulator. `jest.setTimeout(30_000)` added for emulator cold-start tolerance. | `functions/src/founding/__tests__/onUserCreated.emulator.test.ts` | Done |
| Jan 2026 | Emulator test helpers (`clearCollection`, `seedConfig`, `seedCounter`, `readClaimed`, `readProfile`, `makeUser`) are copied verbatim across `onUserCreated.emulator.test.ts` and `concurrency.emulator.test.ts`. A change to any helper (e.g. collection name, profile schema) must be applied twice. Extract into `functions/src/founding/__tests__/testHelpers.ts` and import from both suites to consolidate. | `functions/src/founding/__tests__/` | Low |
| Jan 2026 | Concurrency test Suite 2 (`N=5, claimed=0`) asserts numbers form a contiguous set `{1..5}` — a stronger claim than Property 2 (unique numbers) requires. Contiguity is an emulator-serialisation detail, not a correctness guarantee. The assertion is harmless now but will produce confusing failures if the emulator ever re-orders things. Loosen to: unique, each in [1,100], count equals N. | `functions/src/founding/__tests__/concurrency.emulator.test.ts` Suite 2 | Low |
| Sep 13, 2026 ✅ | **Resolved (Task 26)**: Reconciler emulator test added — `reconcileHandler` exported for direct testability; 5 test cases cover grant success, persistent failure (stays pending + updates `lastAttemptAt`), no-op on empty collection, partial batch (2/3 succeed), and Property 7 (every `foundingRecord.proGrantStatus` ∈ {pending, granted}). `reconcile.ts` internal `reconcile()` renamed to `export reconcileHandler()` — no behaviour change. | `functions/src/founding/reconcile.ts`, `__tests__/reconcile.emulator.test.ts` | Done |
| Sep 13, 2026 | Emulator test helpers are now triplicated: `clearCollection` and `readProfile` exist in `onUserCreated.emulator.test.ts`, `concurrency.emulator.test.ts`, and `reconcile.emulator.test.ts`. The earlier Jan 2026 entry flagged the first two; the reconcile suite makes the duplication worse. Extract shared helpers into `functions/src/founding/__tests__/testHelpers.ts` before adding a fourth emulator suite. | `functions/src/founding/__tests__/` (all three emulator suites) | Low |
| Sep 13, 2026 | `ActivityCard` places `FoundingBadge` in a separate `authorRow` View above the activity text, visually detaching the badge from the author name. `ActivityFeedTab` correctly places it inline with the author name. Align `ActivityCard` to use inline placement matching `ActivityFeedTab`'s pattern for consistency. | `src/components/social/ActivityCard.tsx` `authorRow` | Low |
| Sep 13, 2026 | `SocialActivity` type carries `foundingMember` and `foundingNumber` as optional fields, but `completionService` / `activityService` do not yet write them when creating `activities/{activityId}` docs. The badge will always be absent at runtime until the write path snapshots these fields from `userProfiles/{uid}` at activity-creation time. | `src/types/social.ts`, `src/services/completionService.ts` | Medium |
| Sep 13, 2026 | `ActivityCard` and `ActivityFeedTab` duplicate social-feed card UI — badge logic was added independently to both in Task 19. Consolidate on `ActivityCard` as the single card component and have `ActivityFeedTab` render `<ActivityCard />` rows to halve the maintenance surface. | `src/components/social/ActivityCard.tsx`, `ActivityFeedTab.tsx` | Medium |
| Sep 13, 2026 | `onUserCreated` does not short-circuit when the idempotency path returns an existing `{ number }` with `proGrantStatus === 'granted'`. On Cloud Function re-invocation the function calls RevenueCat again unnecessarily. Add an early-return guard after `claimFoundingSlot` returns: if profile already shows `granted`, skip the grant call. | `functions/src/founding/onCreate.ts` idempotency path | Low |
| Sep 13, 2026 | `reconcile.ts` processes all pending grants with unbounded `Promise.allSettled`. During a RevenueCat outage, all grants land as pending at once. If 50+ pending docs accumulate, the reconciler issues 50+ simultaneous HTTP calls and may hit RevenueCat rate limits. Add a concurrency cap (e.g. batches of 10) before a real launch with meaningful traffic. | `functions/src/founding/reconcile.ts` `reconcileHandler` | Low |
| Sep 13, 2026 | `FoundingCounter` (landing): loading and hidden both return `null`, causing a layout shift when the counter pill appears on slow connections. Add a fixed-height invisible placeholder (e.g. `min-h-[40px]`) so the hero layout is stable during the Firestore round-trip. | `goalfer-landing/components/founding-counter.tsx` loading state | Low |
| Sep 13, 2026 | `userProfiles` Firestore rule used `resource.data.diff()` on create — throws `Null value error` since resource is null for new docs. Fixed by splitting `allow write` into `allow create` (no guard) and `allow update, delete` (guard). Pattern to watch: any future rule using `resource.data` must guard against the create path. | `GoalStreakApp/firebase/firestore.rules` | Low |
| Sep 13, 2026 | `getGroupInvitableFriends` now makes two sequential Firestore reads (friends + pending invitations) on every modal open. Acceptable at current scale; at high friend counts consider combining into a single query or caching the pending-invited set. | `src/services/groupService.ts` | Low |
| Sep 13, 2026 | Cloud Functions deployment leaves old container images in Artifact Registry (us-central1). No cleanup policy set — small monthly cost accumulates over time. Fix: set a cleanup policy in Google Cloud Console → Artifact Registry → goalstreak-app2 → Edit repository → Cleanup policies (keep last N versions). | `GoalStreakApp/functions/` deploy | Low |
| Sep 13, 2026 | Landing page CSP required `unsafe-eval` for Firebase JS SDK (Firestore uses eval internally). Added to `next.config.mjs`. Future Firebase SDK versions may drop this requirement — revisit when upgrading firebase JS SDK. Also: `unsafe-inline` in `script-src` is broader than ideal; consider nonce-based CSP when Next.js supports it cleanly. | `goalfer-landing/next.config.mjs` | Low |
| Sep 25, 2026 | `updateUserProfile` in `useAuth.tsx` wrote only to `users/{uid}` — display name changes via Edit Profile were invisible in the activity feed, friend lists, and friend requests. Now also syncs `name`+`username` to `userProfiles/{uid}`. | `src/hooks/useAuth.tsx` | ~~Important~~ **FIXED** — PR #77 |
*This document is updated continuously. Check the Discovery Log for the latest additions.*

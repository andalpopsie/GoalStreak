# Phase 2 Enhancements — Working Document

**Status**: Living document — updated as issues are identified  
**Last Updated**: April 23, 2026  
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

---

*This document is updated continuously. Check the Discovery Log for the latest additions.*

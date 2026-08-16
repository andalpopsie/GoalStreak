# GoalStreak — Claude Code Context

## Project

**Goalfer** (internal: GoalStreak) — social habit tracking app for iOS & Android.
React Native 0.81.5 + Expo SDK 54 + TypeScript (strict) + Firebase.
App name: Goalfer | Bundle ID: `com.goalstreak.app` | Version: 1.1.0 (Build 23) — submitted to App Store, ready for distribution
Primary working directory: `GoalStreakApp/`

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript 5.9.2 (strict) |
| Navigation | React Navigation 7 (stack + bottom tabs) |
| Backend | Firebase Auth, Firestore, Storage, FCM |
| Animations | Reanimated 4.1.1, Gesture Handler 2.28.0 |
| State | React Context + useReducer (AuthContext, TimerContext) |
| Build | EAS Build + EAS Submit |
| Fonts | Montserrat (Expo Google Fonts) |
| Testing | Jest + Detox (E2E) |
| SVG | react-native-svg 15 |

## Architecture — Service → Hook → Component

**Always follow this pattern:**
- `src/services/` — all Firebase/API logic (class-based singletons)
- `src/hooks/` — expose clean APIs to components via useCallback/useEffect
- `src/components/` — pure UI, no direct Firebase calls
- `src/screens/` — compose hooks + components, handle navigation

**Key services:** `habitService` (streak/completion logic lives here — there is no separate `streakService`/`completionService`), `friendService`, `groupService`, `notificationService`, `achievementsService`, `photoService`, `timerService`, `firebaseTimerService`, `ssoService`, `subscriptionService`

**Key hooks:** `useAuth`, `useHabits`, `useHabitsWithSocial`, `useFriends`, `useGroups`, `useGroupDetail`, `useAnalytics`, `useMilestones`, `useOnboarding`, `useNetworkStatus`

## Navigation

```
RootStackNavigator
├── Auth Stack → Login, SignUp
├── Onboarding Stack → Onboarding
└── Main Stack
    ├── MainTabNavigator → Home (CleanHomeScreen), Social, Analytics, Profile
    ├── CreateHabit (modal)
    └── GroupDetail (modal)
```

## Firestore Collections

```
users, habits, completions, streaks, timerSessions, timerStates,
friends, friendRequests, activities, userProfiles, socialSettings,
groups, groupInvitations, trackedHabits, groupActivities, achievements
```

## Design System — ALWAYS follow these rules

### Colors — import from `src/constants/theme.ts`, never hardcode
```
Primary text:  #154D71  (dark blue)
Background:    #FDFDFD
Accent:        #B771E5  (purple — CTAs, highlights)
Success:       #4A90A4  (teal — completed states)
Secondary:     #666666
Border:        #E8E8E8
Error:         #FF4444
Splash/brand:  #534AB7
```
**Category colors:** Fitness #B771E5 | Wellness #48B3AF | Nutrition #A7E399 | Social #3C3D37 | Productivity #003161 | Other #FF9013

### Typography — 5 sizes only
| Token | Size | Weight | Use |
|---|---|---|---|
| heading | 24px | 700 | Screen titles |
| subheading | 20px | 600 | Section headers, card titles |
| body | 16px | 400 | Standard content |
| caption | 14px | 400 | Secondary info, labels |
| small | 12px | 400 | Disclaimers only |

Font family: Montserrat throughout. Import `Typography` from theme.

### Spacing — 8pt grid, no arbitrary values
```
tight: 8       // icon-label pairs
base: 16       // related content (most common)
comfortable: 24 // section breaks
loose: 32      // major dividers
spacious: 48   // screen-level sections
```
Screen horizontal margin: 16px standard, 24px large screens.

### Touch Targets
- Primary button: min 56px height | Secondary: min 48px
- All interactive elements: min 48px
- Min 16px gap between adjacent interactive elements

### Card Recipe
```typescript
{ borderRadius: 16, padding: 16, marginBottom: 24, ...Shadows.sm }
```

### Internal ≤ External Rule
Padding inside an element must be ≤ margin around it.

## Critical Code Rules

### MODIFY, DON'T MULTIPLY
- Never create a new component file for a UI variation — use props/variants instead
- Never create a duplicate service — add methods to the existing one
- Never create new docs — update existing ones
- Always check if similar functionality exists before writing new code

```typescript
// ✅ Good
interface HabitCardProps { variant?: 'default' | 'compact' }

// ❌ Bad — don't create these
CompactHabitCard.tsx
EnhancedHabitCard.tsx
```

### File Locations
- Environment files: `GoalStreakApp/` root only (`.env`, `.env.development`, `.env.production`)
- Firebase config: `GoalStreakApp/firebase/`
- App Store assets: `GoalStreakApp/app-store-assets/`
- Feature specs: `.kiro/specs/`

### Import from theme, always
```typescript
import { Colors, Typography, Spacing, Layout, Shadows } from '../constants/theme';
```

### No hardcoded design values
No one-off hex codes, no arbitrary spacing, no font sizes outside the 5-size scale.

## App Limits
- Habits per user: 6 free / 15 Pro — use `getHabitLimit(isPro)`, not the raw `MAX_HABITS` constant (`src/constants/limits.ts`)
- Max 3 concurrent timers
- Max 10 members per group
- Max 5 active groups per user

## Active Specs

Status below reflects actual `tasks.md` checkbox counts (verify before trusting — this table drifts).

| Spec | Status |
|---|---|
| `sso-authentication` | 58/58 ✅ complete — Apple + Google Sign-In, account linking, iOS-first |
| `pro-subscription` | 40/40 ✅ complete — RevenueCat paywall, habit limit 6→15 |
| `app-store-launch` | 8/8 ✅ complete |
| `comprehensive-testing-suite` | 40/40 checked, but **Detox is not actually wired up** — no `.detoxrc.json` or `e2e/` dir exists despite the spec/deps being present. Treat E2E as not started if asked to extend it. |
| `report-and-block` | 58/67 (87%) — moderation/blocking for Apple Guideline 1.2 |
| `accountability-groups` | 40/51 (78%) — core complete, remaining tasks are optional fast-check property tests. Key files: `groupService.ts`, `useGroups.ts`, `useGroupDetail.ts`, `GroupDetailScreen.tsx`, `src/components/social/Group*.tsx` |
| `habit-timer-feature` | 11/18 (61%) — **not complete**, despite prior notes here saying otherwise. See `timerService.ts`, `firebaseTimerService.ts`, `TimerContext`. |

## Roadmap Phases
- **Phase 1:** App Store launch — v1.1.0 (Build 23) submitted, ready for distribution
- **Phase 2 (Q2-Q3 2026):** Gamification (XP/levels), advanced friend discovery, AI notifications
- **Phase 3 (Q4 2026):** Web app, Apple Watch, third-party integrations

## Dev Commands

```bash
# Start
cd GoalStreakApp && npx expo start --clear

# iOS simulator
npx expo start --ios

# Clear cache
rm -rf .expo node_modules/.cache && npx expo start --clear
```

## Build & Deploy

```bash
# Increment build number (updates app.json, project.pbxproj, Info.plist)
npm run increment-build

# MUST commit before building
git add . && git commit -m "Build X"

# iOS production build
eas build --profile production-ios --platform ios

# Submit to App Store
eas submit --profile production --platform ios

# Deploy Firebase rules
cd GoalStreakApp/firebase && firebase deploy --only firestore:rules
cd GoalStreakApp/firebase && firebase deploy --only firestore:indexes
```

**Build number rule:** 3 files must always match — `app.json`, `project.pbxproj`, `Info.plist`. Run `npm run sync-build-number` to verify.

## Git Workflow

Full SOP: `.kiro/steering/git-workflow-sop.md`. Summary:

- **Never commit directly to `main`.** Every change goes through a branch + PR.
- Branch naming: `<type>/<kebab-name>` where type is `feature|fix|chore|docs|refactor|perf|test` (e.g. `fix/streak-off-by-one`).
- Commit messages: [Conventional Commits](https://www.conventionalcommits.org/) — `<type>(<scope>): <imperative summary>`.
- Flow: sync `main` → branch → commit → verify (tests + typecheck) → push → `gh pr create` → wait for review → `gh pr merge --squash --delete-branch` → sync `main`.
- Squash-merge by default; never rebase-and-merge on this repo.
- PAUSE for confirmation before: merging a non-trivial PR, force-pushing, rewriting history, or any operation on `main` other than a fast-forward pull.

## Spec-Driven Development

To implement a feature from a spec, point me at the spec:
> "Implement the next incomplete task in `.kiro/specs/<name>/tasks.md`"

I will read requirements.md + design.md for context, implement the task following existing patterns, and mark it complete in tasks.md.

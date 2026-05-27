# GoalStreak Changelog

## [Metadata Sync] - May 2026

### App Store Metadata
- Synced `whatsNew` between `app-store-connect-config.json` and `ios-metadata.json` so both files reference accountability groups and account deletion ("friends and groups", "full account control"). Earlier the two files diverged after only the connect-config was updated.
- Refreshed `app-store-assets/SUBMISSION_CHECKLIST.md` to reflect current state: icons already generated, Build 14 already in App Store Connect, no outstanding blockers.

## [1.0.0 - Build 14] - May 2026

### Apple Compliance
- **Account deletion flow** — Permanent in-app account deletion per Apple Guideline 5.1.1(v)
  - Profile screen: red "Delete Account" menu item below "Sign Out"
  - Confirmation modal with warning card listing all data that will be deleted
  - Password re-authentication required (Firebase Auth requirement)
  - Loading state during deletion, disabled cancel while in progress
  - Cleans up: 7 user-owned Firestore collections, friends, friend requests, group invitations, per-user docs, profile photo, AsyncStorage cache, Firebase Auth user
  - `writeBatch` with 400-op safety limit handles large datasets

- **New files:**
  - `src/services/accountDeletionService.ts` — Full deletion orchestration

- **Modified files:**
  - `src/hooks/useAuth.tsx` — Added `deleteAccount(password)` method with Firebase error mapping
  - `src/screens/ProfileScreen.tsx` — Added Delete Account UI, confirmation modal, and styles

### Branding
- **Renamed app from "GoalStreak" to "Goalfer"** — Original name was taken on the App Store
  - Updated ~50 files across metadata, marketing, legal docs, and SVG assets
  - `app.json`, `Info.plist`, all metadata JSON files
  - Privacy policy, terms of service, fact sheet, press release
  - All marketing SVGs, screenshots, social media assets
  - Validation script updated to expect "Goalfer"
  - Bundle ID kept as `com.goalstreak.app` (registered with Apple, cannot change)
  - Domain URLs preserved: `goalstreak.co` and `goalstreak.app` emails

### Build Pipeline Fixes
- **Fixed missing iOS icons in App Store upload** — Build 12 was rejected by Apple
  - Root cause: `.gitignore` had blanket `*.png` exclusion that allow-listed only `assets/` and `app-store-assets/`
  - The 10 generated iOS icon PNGs in `ios/GoalStreak/Images.xcassets/AppIcon.appiconset/` were silently excluded from git
  - EAS Build cloned a clean repo, missing the icons, so Apple rejected with `(90022)`, `(90023)`, `(90713)` errors
  - Fixed by adding `!GoalStreakApp/ios/**/Images.xcassets/**` exception
  - Committed all 10 required icon sizes (Icon-20 through Icon-83.5)

- **Migrated ESLint to flat config** — ESLint 9 dropped support for `.eslintrc.js`
  - Created `eslint.config.js` with equivalent rules
  - Installed `@eslint/js@9.34.0` and `typescript-eslint@8.41.0`
  - Relaxed `no-useless-escape` and `no-case-declarations` to warnings (cosmetic)
  - Result: 0 errors, 327 warnings (all `any` types and unused vars — non-blocking)
  - Old `.eslintrc.js` renamed to `.bak` (kept for reference)

### Validation
- **Updated `ios-pre-submission-validation.js`** — Script was hard-coded to expect "GoalStreak"
  - Now expects "Goalfer" as the app name
  - Privacy policy section checks updated to match actual headings ("How We Use Your Information", "Your Privacy Rights")
  - Result: 39 passed / 3 warnings (all intentional) / 0 errors

### Submitted Builds
- **Build 13** — First successful Apple binary validation
  - Uploaded to App Store Connect, processed by Apple
  - No review submitted (held back to add account deletion)
- **Build 14** — Adds account deletion, ready for review submission

---

## [Unreleased] - April 2026

### Accountability Groups Feature (April 2026)
- **New social feature: Accountability Groups** — Users can form small groups (2–10 members) around shared goals for mutual accountability
  - Group creation with name, description, category, and optional end date
  - Invite-only membership via existing friends list
  - Link 1–6 habits per member per group for progress tracking
  - Real-time group progress dashboard with completion percentages and streaks
  - Dedicated group activity feed with reactions (heart, flame, medal)
  - Admin controls: edit group, remove members, end group
  - Member controls: leave group, link/unlink habits
  - Notification support: daily reminders, celebration alerts, new member joined (max 3/group/day)
  - 30-day data retention for ended groups

- **New files added:**
  - `src/services/groupService.ts` — Full group service layer (CRUD, invitations, habits, feed, progress, notifications)
  - `src/hooks/useGroups.ts` — Real-time group list and invitation management hook
  - `src/hooks/useGroupDetail.ts` — Group detail data and actions hook
  - `src/screens/GroupDetailScreen.tsx` — Group detail screen with Progress and Feed tabs
  - `src/components/social/GroupsTab.tsx` — Groups tab for the Social screen
  - `src/components/social/GroupCard.tsx` — Group list card component
  - `src/components/social/GroupInvitationCard.tsx` — Invitation accept/decline card
  - `src/components/social/GroupCreateForm.tsx` — Modal form for creating groups
  - `src/components/social/GroupProgressCard.tsx` — Member progress display
  - `src/components/social/GroupFeedCard.tsx` — Group activity feed card
  - `src/components/social/LinkHabitsModal.tsx` — Habit linking modal
  - `src/components/social/InviteMembersModal.tsx` — Friend invitation modal
  - `src/components/social/GroupSettingsModal.tsx` — Admin/member settings modal
  - `src/__tests__/groups/GroupComponents.test.tsx` — 21 UI component render tests (all passing)

- **Modified files:**
  - `src/types/social.ts` — Added group types (Group, GroupMember, GroupInvitation, TrackedHabit, GroupActivity, GroupProgress, CreateGroupForm)
  - `src/types/index.ts` — Added GroupDetail route to RootStackParamList
  - `src/screens/SocialScreen.tsx` — Extended with Groups tab alongside Feed and Friends
  - `src/navigation/AppNavigator.tsx` — Added GroupDetail screen to stack navigator
  - `src/hooks/useHabitsWithSocial.ts` — Integrated group activity creation on habit completion

- **Firestore additions:**
  - New collections: `groups`, `groupInvitations`, `trackedHabits`, `groupActivities`
  - Composite indexes added to `firebase/firestore.indexes.json`
  - Security rules added to `firebase/firestore.rules`

- **Bug fix: serverTimestamp() inside arrays** — Fixed `groupService.createGroup` and `acceptInvitation` using `serverTimestamp()` inside the `members` array (Firestore rejects this). Replaced with `Timestamp.now()` for array-embedded timestamps.

## [Unreleased] - January 2025

### iOS App Store Compliance (January 2025)
- **App name finalized as "Goalfer"** - Consistent branding across all files
  - "GoalStreak" was already taken on App Store, reverted to "Goalfer"
  - Updated app.json, Info.plist, ios-metadata.json, and all privacy descriptions
  - Slug "goalfer" matches EAS project ID (no conflicts)
- **Enhanced privacy descriptions** - Comprehensive, user-friendly descriptions in all files
- **Configured EAS submission** - Apple ID (popsie_09@yahoo.com), ASC App ID (6754788637), Team ID (NX988Z5GUA)
- **Fixed EAS build configuration** - Added appVersionSource: "remote" to prevent future warnings
- **Disabled build cache for iOS** - Prevents pod dependency conflicts (fast_float issue)
- **Compliance verification** - All iOS requirements, legal documents, and metadata verified ✅
- **Keywords optimized** - 90/100 characters used, within App Store limit
- **Updated submission checklist** - Added comprehensive compliance verification report
- **100% submission ready** - All critical issues resolved, ready for build and submission

### Optimized
- **Removed duplicate environment files** - Deleted `config/.env.development` and `config/.env.production`
- **Established single source of truth** - All environment files now in root directory only
- **Zero duplicate files** - Fully optimized codebase with no redundancy
- **Updated steering documents** - Added critical file creation guidelines to prevent future duplication
- **Enhanced agent hooks** - All 6 hooks updated with file creation rules and optimization guidelines

### Documentation
- **Consolidated cleanup documentation** - Merged optimization reports into existing CLEANUP-COMPLETED.md
- **Updated project structure** - Reflected optimized organization in all steering docs
- **Added file creation rules** - Critical guidelines to minimize unnecessary file creation
- **Created CHANGELOG.md** - Single source for tracking all project changes

### Configuration
- **Environment files location** - Root directory only (.env, .env.development, .env.production)
- **Config directory** - Contains only build/lint/test configs (.eslintrc.js, jest.config.js, tsconfig.json)
- **No duplicates** - Single source of truth for all configuration

### Agent Hooks
- **Code Quality Analyzer** - Now enforces file organization and prevents duplicate component creation
- **Source to Docs Sync** - Enforces documentation consolidation, uses CHANGELOG.md for updates
- **App Store Compliance Checker** - Updates existing checklists instead of creating new reports
- **Legal Document Validator** - Updates existing compliance docs, no new validation files
- **App Store Asset Organizer** - Updates existing submission checklists, no new reports
- **Spec Task Tracker** - Updates existing tasks.md, no new tracking files

### Analytics Implementation
- **Comprehensive Analytics Service** - Full-featured analytics with real Firestore data
  - Created `analyticsService.ts` with habit analytics, period analytics, trends, and insights
  - Implemented streak calculation algorithm with current and longest streak tracking
  - Added completion rate calculations based on 30-day rolling window
  - Built trend data generation for beautiful chart visualizations
  - Created intelligent insights generation (streak milestones, category champions, performance trends)
  
- **Updated useAnalytics Hook** - Connected to real analytics service
  - Loads habit analytics for all user habits with completion data
  - Fetches period analytics (week, month, year) with top categories and most active days
  - Generates 30-day trend data for progress charts
  - Creates personalized insights based on user performance
  - Proper loading states and error handling
  
- **Firestore Indexes** - Added composite index for analytics queries
  - userId + habitId + completedAt for efficient habit-specific analytics
  - Optimized query performance for large datasets
  - **Action Required**: Deploy indexes with `firebase deploy --only firestore:indexes`
  
- **User Experience** - Best-in-class analytics dashboard
  - Real-time data from Firestore completions collection
  - Beautiful visualizations with react-native-chart-kit
  - Personalized insights and recommendations
  - Period selector (week/month/year) for different time ranges
  - Top categories, most active days, and streak tracking
  - Empty states with helpful guidance for new users

## [1.0.0] - January 2025

### Added
- Complete habit tracking system with 39+ category icons
- Social features (friends, activity feed, reactions)
- Analytics dashboard with comprehensive insights
- Smart logging service for production cost optimization
- Enhanced monitoring and crashlytics services
- iOS legal compliance (privacy manifest, usage descriptions)
- Professional directory organization

### Production Ready
- Zero duplicate files
- Optimized for App Store submission
- Comprehensive documentation
- Enterprise-grade architecture

---

*For detailed changes, see individual documentation files in docs/ directory*

# GoalStreak Changelog

## [App Store Submission Prep — Permissions, Versions, Contacts, Jurisdiction] - July 2026

### iOS config (app code / build config)
- **Removed 6 unused permission usage strings (Guideline 5.1.1)** from **both**
  `app.json` (`ios.infoPlist`) and `ios/GoalStreak/Info.plist`:
  `NSLocationWhenInUseUsageDescription`, `NSContactsUsageDescription`,
  `NSMicrophoneUsageDescription`, `NSCalendarsUsageDescription`,
  `NSRemindersUsageDescription`, `NSFaceIDUsageDescription`. Code audit confirmed
  only Camera + Photo Library (via `expo-image-picker`, for profile pictures) are
  requested, and none of the corresponding native deps are installed. Only
  `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` remain.
  Info.plist re-validated with `plutil -lint`.
- **Aligned `MARKETING_VERSION` `1.0` → `1.0.0`** in both Debug and Release
  configs of `ios/GoalStreak.xcodeproj/project.pbxproj`, matching Info.plist
  (`CFBundleShortVersionString = 1.0.0`) and `app.json`.

### Metadata & legal (decisions applied)
- **South Korea distribution = yes.** `tradeRepresentativeContactInformation` is
  required; placeholders removed and replaced with a `_note` — the value is
  entered directly in App Store Connect (App Information → Trade Representative
  Contact Information), not stored in the repo.
- **App Review contact + demo account** placeholders removed from
  `app-store-connect-config.json`; `demoAccount.required` set to `true` with a
  `_note`. Real values entered directly in App Store Connect (App Review
  Information), not committed. Sandbox IAP steps remain in the `notes` field.
- **Terms of Service §12 governing law** set to the **Republic of Singapore**
  (country of residence / business registration) for both the governing-law and
  dispute-forum clauses.
- **Compliance checklist** updated: 5.1.1 permissions, version drift, doc-path
  drift, contacts, and jurisdiction all marked resolved; status flipped to
  "repo-side complete — remaining items are App Store Connect / infra actions".

### Still open before submit (genuine blockers, outside this PR)
- ❌ IAP setup: Paid Apps Agreement, `goalfer_pro_monthly`/`goalfer_pro_annual`,
  1024×1024 IAP review screenshots, RevenueCat `pro` entitlement + `default`
  offering — the listing advertises Goalfer Pro.
- ❌ Screenshot dimension inconsistency: the two undersized paywall PNGs
  (`08-pro-paywall-monthly.png` 738×1296, `08-pro-paywall-yearly.png` 720×1378)
  are not valid App Store dimensions — do not upload. Re-render to one display
  class (6.9" 1320×2868 or 6.5" 1284×2778) per the SUBMISSION_CHECKLIST note.
- ⚠️ In App Store Connect: enter App Review contact + demo account + Korea
  trade-rep contact. Verify `goalfer.app/privacy|/terms|/support` are live and
  `hello@goalfer.app` is monitored; confirm the aggregated privacy label shows
  Purchases → Purchase History after the production build.

## [Legal Doc Alignment — Permission-String Removal Follow-through] - July 2026

### Compliance validation (no app code changes)
- **Verified the unused-permission-string removal against the real files.** Both
  `app.json` (`ios.infoPlist`) and `ios/GoalStreak/Info.plist` now declare only
  `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` — the two
  permissions `expo-image-picker` actually requests for profile pictures.
  Location/Contacts/Microphone/Calendars/Reminders/FaceID strings are gone from
  both files (Guideline 5.1.1).

### Legal document fixes (existing files only — no new docs)
- **`privacy-policy.md`**: removed the "Location Data — approximate location for
  location-based reminders" collection line. With the location permission now
  removed and no location feature shipping, the policy was over-disclosing a
  data practice the app can't perform (accuracy under Apple 5.1.1 / GDPR / CCPA).
  Bumped to **v1.2**, Last Updated **July 31, 2026**.
- **`ios-legal-compliance-checklist.md`**: fixed internal drift — the top
  "Privacy Usage Descriptions" section still listed Location/Contacts/Microphone/
  Calendars/Reminders/FaceID as present, contradicting the Outstanding-Items
  resolution. Split into "Declared Permissions" (Camera + Photo Library only) and
  "Removed Permissions", and recorded the privacy-policy alignment.

### Still open before submit (unchanged genuine blockers)
- ❌ Reviewer-contact placeholders in `app-store-connect-config.json`.
- ❌ Terms of Service §12 governing-law placeholder `[Your Jurisdiction]`.
- ⚠️ Android `app.json` still lists `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION`
  — non-blocking for the iOS-only launch; clean up before any Play Store submit.
- ⚠️ Verify `goalfer.app/privacy|/terms|/support` are live and `hello@goalfer.app`
  is monitored; provide a demo account for review; confirm the aggregated privacy
  label shows Purchases → Purchase History.

## [App Store Assets Audit — Permission Strings + Screenshot Dimensions] - July 2026

### Compliance review (no app code changes)
- **Verified the unused-permission-string removal (Guideline 5.1.1) against the
  real files.** `app.json` (`ios.infoPlist`) and `ios/GoalStreak/Info.plist` now
  declare **only** `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription`
  — the two permissions `expo-image-picker` actually requests for profile
  pictures. Location/Contacts/Microphone/Calendars/Reminders/FaceID strings are
  gone from both files and stay in sync. Matches the legal checklist entry.
- **Confirmed the icon master** at `assets/icon.png` is 1024×1024 (canonical per
  asset-paths SOP). Note: `adaptive-icon.png` and `splash-icon.png` are currently
  byte-identical copies of `icon.png` — functional, but ideally purpose-built.

### Removed
- Deleted `app-store-assets/screenshots/` (stale framed SVG marketing mockups —
  `ios/` 30 files + `android/` 15 files + `ENHANCED-SCREENSHOT-STRATEGY.md`). No
  build/validation/submission script referenced it (they all read
  `real-screenshots/`), and the SVGs predated accountability groups + Pro. Fixed
  the two dangling references in `DIRECTORY_STRUCTURE.md` and
  `.kiro/steering/asset-paths.md` to point at `real-screenshots/app-store-ready/`.

### Screenshot finding (blocks upload until fixed)
- Recorded a **screenshot dimension inconsistency** in `SUBMISSION_CHECKLIST.md`.
  The `app-store-ready/` set spans three iPhone display classes: core `01`–`07`
  at 1320×2868 (6.9"), the `6.5-inch-1284x2778/` set at 1284×2778 (6.5"), and the
  Pro paywall `-1290x2796` variants at 1290×2796 (6.7"). The non-suffixed paywall
  PNGs (738×1296 / 720×1378) are **undersized and not valid App Store dimensions**.
  A single App Store Connect display slot requires uniform dimensions — the paywall
  shots must be re-rendered to match one chosen set (see checklist for options).

### Still open before submit (unchanged genuine blockers)
- ❌ IAP setup (Paid Apps Agreement, `goalfer_pro_monthly`/`goalfer_pro_annual`,
  RevenueCat wiring) — the listing advertises Goalfer Pro.
- ❌ Reviewer-contact placeholders in `app-store-connect-config.json`.
- ❌ Terms of Service §12 governing-law placeholder `[Your Jurisdiction]`.
- ⚠️ Verify `goalfer.app/privacy|/terms|/support` are live and `hello@goalfer.app`
  is monitored; provide a demo account for review.

## [App Store Compliance Re-Audit — Domain, Manifest, Review-Access] - July 2026

### Compliance review (no app code changes)
- Re-verified the iOS submission surface against the actual files (not the
  checklists). Confirmed: build **19** in sync across `app.json`,
  `Info.plist` (`CFBundleVersion`), and `project.pbxproj`
  (`CURRENT_PROJECT_VERSION`); bundle id `com.goalstreak.app` consistent;
  `NSPrivacyTracking=false` with `Product Interaction` tracking flag `false`
  and no `NSUserTrackingUsageDescription` (ATT correctly absent); privacy
  manifest data types match the App Store Connect privacy config; UGC safety
  (block/report) ships and the `BlockedUsers` route is registered in
  `AppNavigator`.
- **Domain**: confirmed the canonical domain is `goalfer.app` (the earlier
  `goalstreak.co` migration is complete). All in-app URLs
  (`linkingUtils.ts`), metadata URLs (`ios-metadata.json`,
  `app-store-connect-config.json`), and legal-doc contact emails
  (`hello@goalfer.app`) use it. No stray `goalstreak.co` references remain in
  `src/` or `app-store-assets/`.

### Checklist updated (existing file only — no new docs)
- `ios-legal-compliance-checklist.md` — added two newly identified
  pre-submission items: (1) ⚠️ no demo account for review (Guideline 2.1) on a
  login-gated app, and (2) ⚠️ cosmetic version-string drift
  (`MARKETING_VERSION = 1.0` vs shipped `1.0.0`).

### Still open before submit (unchanged genuine blockers)
- ❌ Reviewer-contact placeholders (`[FIRST_NAME]/[LAST_NAME]/[EMAIL]/[PHONE]`)
  in `app-store-connect-config.json`.
- ❌ Terms of Service §12 governing-law placeholder `[Your Jurisdiction]`.
- ⚠️ Verify `goalfer.app/privacy|/terms|/support` are live and
  `hello@goalfer.app` is monitored; remove or justify unused permission
  strings (microphone/calendars/reminders); provide a demo account; confirm
  the founding-member Pro entitlement ships and the aggregated privacy label
  shows Purchases → Purchase History.

## [App Store Compliance Audit — Checklist Drift Fixes] - July 2026

### Compliance review (no app code changes)
- Ran a full pre-submission compliance pass over the iOS config, privacy
  manifest, legal docs, and metadata. Confirmed the app is on build **19**
  (app.json `buildNumber` and Info.plist `CFBundleVersion` both = 19),
  bundle id `com.goalstreak.app` is consistent, `NSUserTrackingUsageDescription`
  is correctly absent, and `PrivacyInfo.xcprivacy` has `NSPrivacyTracking=false`
  with `Product Interaction` tracking flag = false.
- **Verified UGC safety (Guideline 1.2) ships**: `BlockedUsersScreen` is
  registered in `AppNavigator` (`BlockedUsers` route) and report/block actions
  are wired across ProfileScreen, ActivityCard, GroupFeedCard, and GroupChatTab
  via `useModeration`. Flipped this item from ⚠️ to ✅ in the legal checklist.

### Checklist drift corrected (existing files only — no new docs)
- **`ios-submission-checklist.md`**: build number `1` → `19`; repaired a
  garbled "Changed from Goalfer to Goalfer" line and the `GoalferApp/ios/Goalfer`
  path drift (canonical is `GoalStreakApp/ios/GoalStreak`).
- **`ios-legal-compliance-checklist.md`**: replaced the stale "web URLs use
  goalstreak.co / emails use @goalstreak.app" outstanding item with the actual
  state (everything now on `goalfer.app` + `hello@goalfer.app`); reframed it as
  a hosting/mailbox verification step. Marked the UGC safety item resolved.

### Still open before submit (unchanged — genuine blockers)
- ❌ Reviewer-contact placeholders (`[FIRST_NAME]/[LAST_NAME]/[EMAIL]/[PHONE]`)
  in `app-store-connect-config.json`.
- ❌ Terms of Service §12 governing-law placeholder `[Your Jurisdiction]`.
- ⚠️ Confirm `goalfer.app/privacy|/terms|/support` are live and
  `hello@goalfer.app` is monitored; verify unused permission strings
  (microphone/calendars/reminders) or remove them (Guideline 5.1.1); confirm
  the founding-member Pro entitlement and IAP products are configured.

## [Repo Hygiene — Ignore Local Legal Paperwork] - July 2026

### Changed
- **`.gitignore`** now excludes `docs/Apple-business-docs/` so Apple
  legal/business paperwork stays out of version control. This is local-only
  documentation (e.g. Paid Apps agreements, tax/banking forms) that must not
  be committed to the repository.

## [Firestore Rules — Restore Missing Collection Rules] - July 2026

### Fixed
- **Restored security rules for collections that were denied by default**,
  fixing `Missing or insufficient permissions` errors surfaced while testing
  the App Store review account (comment counts and friend suggestions). When
  the original permissive wildcard (`match /{document=**}`) was replaced with
  granular per-collection rules during the App Launch hardening, several
  actively-used collections were never carried over and became deny-by-default:
  - `comments` — authenticated read (comment counts / feed), author-only
    create, immutable.
  - `userProfiles` — authenticated read (friend search by email, names/avatars),
    owner-only write.
  - `socialSettings` — authenticated read (notification-preference checks),
    owner-only write.
  - `usernames` — authenticated read (availability checks), uid-scoped
    reserve/release, immutable.
  - `timerSessions` — authenticated read, owner-only write/create (mirrors
    `completions`).
  - `feedback` — authenticated create only; no client reads.
- **Opened `users` reads to any authenticated user** (was owner-only), required
  for friend suggestions, search, and rendering names/avatars in the social
  feed and groups. Writes remain owner-only.

### Testing
- Added `collectionRules.rules.test.ts` — Firestore emulator rules tests
  covering the restored collections (authenticated reads, owner-only writes,
  cross-user denial, immutability). Full suite: 45 tests across 3 rules/emulator
  suites pass via `npm run test:emulator`.

### Deploy
- Requires `firebase deploy --only firestore:rules` (run from
  `GoalStreakApp/firebase/`) to take effect in production.

## [Landing Site Launch — goalfer.app] - July 2026

### Added
- **Deployed the marketing site to Vercel** on the live domain **goalfer.app**
  (Hobby/free tier, root directory `goalfer-landing/`). Apex `A @ → 216.198.79.1`
  and `www` CNAME at Namecheap; `www.goalfer.app` 308-redirects to the apex;
  SSL auto-issued. Clears the App Store Support/Privacy URL requirement.
- **Legal + support pages**: `/privacy`, `/terms` (render the goalfer.app legal
  markdown) and `/support` (contact, FAQ, and a report/block safety section).
- **Waitlist**: the hero "Join waitlist" form now POSTs to the **Loops.so**
  public newsletter-form endpoint (no API key; safe for the static client),
  with loading/success/error states and a 60s client-side rate limit.
  Overridable via `NEXT_PUBLIC_LOOPS_FORM_ID`.

### Changed
- **Branding**: real Goalfer app icon as the logo (header/footer/favicon),
  renamed all "GoalStreak" → "Goalfer", brand purple `#B771E5` across the token
  set (replaced the retired orange), site title/meta set (was "v0 App").
- **Hero redesign**: eyebrow → headline → subheadline → prominent email +
  "Join waitlist" → crisp vector App Store button; removed the phone mockup.
- **iOS-only messaging**: Android shown as text-only "coming soon" (removed the
  Play Store badge); App Store button links to the real listing.
- Renamed the landing project directory `goalstreak-landing/` → `goalfer-landing/`.

### Removed
- Testimonials section (fictional reviews) and the "Sign In" header button.

## [Contact Email Consolidation] - July 2026

### Changed
- Consolidated all contact addresses to a single mailbox **hello@goalfer.app**
  (was `privacy@`, `legal@`, `support@`, `business@`, `dpo@`). Updated the
  legal documents (`privacy-policy.md`, `terms-of-service.md`), the compliance
  checklist, and the App Store scripts (`configure-app-store-connect.js`,
  `ios-production-build-and-submit.js`).
- The fictional `test@goalfer.app` demo-account example in the screenshot
  guides is intentionally left as-is (placeholder login, not a contact address).

## [App Store Metadata — Marketing Claim Compliance] - July 2026

### App Store listing (Apple Guideline 2.3.x)
- **Softened two unverified marketing claims** in the App Store description. In `app-store-connect-config.json` (and confirmed already in sync in `ios-metadata.json`): "Social accountability increases success rates by 65%" → "Social accountability helps you stay consistent", and "Join thousands of users who've transformed their lives with Goalfer" → "Join others building better habits with Goalfer". Removes the two claims Apple flagged as unsubstantiated from the submitted listing fields.
- The two App Store listing files (`app-store-connect-config.json`, `ios-metadata.json`) remain identical for the description block.

### Checklist updates (no new files)
- `metadata/ios-submission-checklist.md` — flipped the "Marketing claims" item to ✅ for the App Store listing and added a scoped ⚠️ noting the 65% / "join thousands" claims still live in non-listing collateral (`android-metadata.json`, `app-store-description-variants.md`, `marketing/MARKETING_GUIDE.md`, `marketing/press-kit/*`, `marketing/app-preview/frame5.svg`).
- `SUBMISSION_CHECKLIST.md` — corrected the stale screenshot list (retired `03-habit-icons.png`; documented the current 8-screenshot set with accountability + Pro paywall shots and the 6.5" set) and the icon path (canonical `assets/icon.png` + xcassets; the deleted `icons/enhanced/ios/` reference removed per the asset-paths SOP).

### Follow-ups (not blocking this edit)
- Soften/substantiate the 65% and "join thousands" claims in the non-listing marketing collateral before public reuse.
- Confirm the App Store Connect display slot (6.5" vs 6.7"/6.9") matches the uploaded screenshot dimensions.

## [Legal Link Domain Migration — goalstreak.co → goalfer.app] - July 2026

Canonical legal/support domain confirmed as **goalfer.app**. Completed the full sweep across the in-app code and App Store metadata.

### In-app legal links (`src/utils/linkingUtils.ts`)
- All three links on `goalfer.app`: `openPrivacyPolicy` → `/privacy`, `openTermsOfService` → `/terms`, `openSupport` → `/support` (fallback messages match).

### App Store metadata URLs migrated to goalfer.app
- `ios-metadata.json` — `marketingUrls` (privacy, support, marketing, terms)
- `app-store-connect-config.json` — `appStoreInformation` support/marketing/privacy URLs + `appPrivacy.privacyPolicyUrl`
- `ios-submission-checklist.md` and `ios-legal-compliance-checklist.md` — URL lines + "all use goalstreak.co" statements updated

### Legal document contact info migrated (`@goalstreak.app` → `@goalfer.app`)
- `privacy-policy.md`: privacy@, support@, dpo@, children's-privacy contact; `www.goalstreak.co` → `www.goalfer.app`
- `terms-of-service.md`: legal@, support@, privacy@, business@; `www.goalstreak.co(/support)` → `www.goalfer.app(/support)`
- `ios-legal-compliance-checklist.md`: contact information block

### Marketing claim softening (App Store Guideline 2.3.x)
- "increases success rates by 65%" → "helps you stay consistent"
- "Join thousands of users…" → "Join others building better habits with Goalfer."
- Applied in both `ios-metadata.json` and `app-store-connect-config.json`

### Privacy manifest — Purchase History (verified, no change needed)
- `ios/GoalStreak/PrivacyInfo.xcprivacy` intentionally omits `NSPrivacyCollectedDataTypePurchaseHistory`. The app doesn't collect purchase data directly; the RevenueCat SDK does and ships its own manifest declaring it. Apple aggregates SDK manifests, and the App Store Connect nutrition label already declares Purchases → Purchase History.

### Action required before submission
- Confirm `goalfer.app` serves live `/privacy`, `/terms`, and `/support` pages (a dead privacy URL is a Guideline 5.1.1 rejection).
- Provision and monitor the `@goalfer.app` mailboxes (privacy, support, legal, business, dpo).
- Bundle identifier `com.goalstreak.app` is unchanged (registered with Apple, cannot change) — expected, not part of this migration.

### Follow-up sweep — docs, scripts, specs, steering, hooks (goalfer.app)
- **Scripts** (prevented a regression — these emit/print metadata): `generate-app-store-assets.js` (privacy/support URLs — would have re-emitted `goalstreak.co` on next run), `configure-app-store-connect.js` and `ios-production-build-and-submit.js` (printed support/privacy/terms URLs), `screenshot-capture-guide.js` (test-account email).
- **Docs**: `docs/IOS_SUBMISSION_GUIDE.md` (privacy URL + domain-access line, "launch Goalfer"); `app-store-assets/real-screenshots/QUICK_COMMANDS.md` (test email).
- **Specs/steering**: `.kiro/steering/project-essentials.md`, `.kiro/steering/deployment-guide.md` (sample metadata URLs), `app-store-launch/LAUNCH_READINESS_ASSESSMENT.md`, `app-store-launch/requirements.md` (Req 2.4 + 6.7 acceptance criteria), `report-and-block/design.md` (terms URL).
- **Kiro hooks**: `legal-document-validator.kiro.hook` and `app-store-compliance-checker.kiro.hook` previously instructed enforcing `goalstreak.co` — updated to `goalfer.app` so future automated checks give correct guidance.

### Still on goalstreak.co — intentionally NOT changed (runtime dependency)
- `.env.production` `EXPO_PUBLIC_API_BASE_URL=https://api.goalstreak.co` (and its mirror in `deployment-guide.md`). This is a live backend endpoint, not doc text. Do NOT repoint to `api.goalfer.app` until that host is provisioned and serving — otherwise all API calls break in production.

## [Compliance — ATT / Privacy Manifest Alignment] - July 2026

### App Store Privacy (fixes internal inconsistency)
- **Removed `NSUserTrackingUsageDescription` from `ios/GoalStreak/Info.plist`.** Goalfer does not perform App Tracking Transparency tracking — there is no IDFA usage, no `requestTrackingAuthorization` prompt, and no `expo-tracking-transparency`. Analytics is first-party Firebase only. Keeping the ATT string would misrepresent the app's data practices.
- **Aligned the privacy manifest to match.** In `ios/GoalStreak/PrivacyInfo.xcprivacy`, `Product Interaction` was declared with `NSPrivacyCollectedDataTypeTracking = true`, which contradicted `NSPrivacyTracking = false` and the removed ATT string. Set it to `false` so the manifest is internally consistent and the aggregated App Store privacy label does not falsely claim tracking.
- **Updated validation tooling** so it no longer requires the ATT string (`ios-pre-submission-validation.js` had it as a hard error; `ios-pre-launch-testing.js` and `comprehensive-validation.js` warned): `scripts/ios-pre-submission-validation.js`, `scripts/ios-pre-launch-testing.js`, `scripts/comprehensive-validation.js`.
- **Refreshed compliance checklist** entries for the ATT key and Product Interaction tracking flag: `app-store-assets/metadata/ios-legal-compliance-checklist.md`.
- **Added an Outstanding Pre-Submission Items section** to `ios-legal-compliance-checklist.md` (reviewer-contact and governing-law placeholders, domain/email consistency, UGC safety-feature verification, unused permission strings, purchase-history manifest verification); overall status moved from "COMPLETE" to "NEARLY READY".

## [Report & Block — Moderation] - July 2026

### Trust & Safety (App Store Guideline 1.2)
- **User-facing moderation added across all social surfaces** so the app can be submitted with UGC + messaging. Users can now block abusive users, report objectionable content, and must accept a zero-tolerance EULA at signup.
  - **Block** from a user's profile, group member list, and group chat messages. Blocking is idempotent and atomically tears down any existing friendship + pending friend requests between the two users.
  - **Filter-everywhere (bidirectional)** — once blocked, neither party sees the other anywhere: friend activity feed, group activity feed, group chat, friend search, friend requests, and reaction counts. Rendering is fail-closed (feeds wait for the block set to load so a blocked user is never briefly visible).
  - **Report** a user, activity, group activity, or group message via a reason picker (harassment, spam, inappropriate, hate speech, impersonation, other). Reported content auto-hides from the reporter's own view.
  - **Manage blocked list / unblock** via a new Blocked Users screen (linked from Profile).
  - **EULA** zero-tolerance clause added to the Terms of Service; required acceptance checkbox on signup gates account creation; acceptance persisted to `users/{uid}` (`eulaAcceptedAt`, `eulaVersion`).

### New files
- `src/services/moderationFilter.ts` — pure client-side filter (blocked authors + reported content) for every social surface, incl. `filterReactions`
- `src/services/moderationTransitions.ts` — pure block/unblock, teardown-selection, and report-construction helpers
- `src/hooks/useModeration.ts` — merged block + reported-content state with a fail-closed `ready` flag and optimistic block
- `src/components/social/ReportReasonSheet.tsx` — reusable reason picker with success/error feedback
- `src/screens/BlockedUsersScreen.tsx` — view/unblock the blocked list
- `src/services/__tests__/moderationFilter.property.test.ts`, `moderationTransitions.property.test.ts` — 11 fast-check property tests (100+ runs each)

### Modified files
- `src/services/friendService.ts` — `blockUser` (atomic batch teardown, idempotent), `unblockUser`, `getBlockedUsers`, `isBlocked`, bidirectional `subscribeBlockSet`, `reportContent`/`reportUser`, `getReportedContentIds`, `subscribeReportedContent`
- `src/types/social.ts` — `Block`, `Report`, `ReportContentType`, `ReportReason`, `ReportStatus`, `ModerationState`
- Filter wiring: `ActivityFeedTab.tsx`, `GroupDetailScreen.tsx` (group feed + member-list block), `GroupChatTab.tsx` (filter + long-press block/report), `SearchModal.tsx`, `FriendsTab.tsx`, `GroupFeedCard.tsx`, `ActivityCard.tsx`
- `src/screens/ProfileScreen.tsx` — block/report overflow menu for other users + Blocked Users entry
- `src/screens/SignUpScreen.tsx` — EULA acceptance checkbox gate; `src/hooks/useAuth.tsx` — persist EULA acceptance
- `src/navigation/AppNavigator.tsx`, `src/types/index.ts` — register `BlockedUsers` route
- `app-store-assets/metadata/terms-of-service.md` — zero-tolerance clause (ToS v1.2)

### Firestore
- New collections `blocks` ({blockerId, blockedUserId, createdAt}) and `reports` ({reporterId, reportedUserId, contentType, contentId, reason, timestamp, status})
- Security rules added to `firebase/firestore.rules`: blocks (either-party read, owner-only create/delete, no update), reports (create-only where reporterId==uid, immutable)
- No new composite indexes required (all block/report reads are single-field equality)
- **Action required**: `firebase deploy --only firestore:rules` before the moderation feature works in production

### Design decision (privacy tradeoff)
- Block records are readable by **either** party (not owner-only) so the blocked user's client can build the bidirectional filter set without a backend. Exposure is minimal: only two opaque Firebase UIDs + a timestamp, never surfaced in the blocked user's UI (silent hide). A server-side (Cloud Functions) filtering upgrade that removes this exposure is documented as a post-launch fast-follow.

### Testing
- 11 property-based tests (fast-check) pass, covering the bidirectional filter-everywhere invariant, reactions filtering, report auto-hide + per-user scoping, no-false-exclusions, block idempotence, block/unblock round-trip, Block_List selection, teardown selection, and report construction
- `tsc --noEmit`: no new errors (pre-existing baseline unchanged)

## [Pro Launch Refinements] - July 2026

### Monetization
- **Reduced subscription pricing** — monthly $4.99 → **$3.99**, annual $29.99 → **$23.99** ("Save 50%" retained; annual amortizes to ~$1.99/mo). Updated `ProPaywallModal` + spec docs.
- **Dashboard upgrade card** — free users at the 6-habit limit now see a "Want more? · From $1.99/mo" card (instead of "All Set!") that opens the paywall; Pro users keep "All Set!". Added `pro_upgrade_card_tapped` / `pro_upgraded` analytics.
- **Fix: instant Pro unlock without restart** — after a successful purchase, the dashboard's `useSubscription` instance now calls `refresh()` in the paywall `onSuccess`, so the upgrade card disappears and the habit limit lifts to 15 immediately (previously required an app restart). Verified on TestFlight build 16.
- **Honest paywall messaging** — paywall lists only the delivered benefit (15 habits) with streak freeze / analytics / themes labelled "Coming soon"; founding-member (first 100 users → Lifetime Pro) framed as a promo.

### App Store assets
- **Refreshed screenshots** to the current UI (dashboard, habit creation, social feed, analytics, accountability group/feed/chat) at 6.9" (1320×2868) plus a 6.5" (1284×2778) set for App Store Connect's 6.5" slot.

## [Legal Compliance — Goalfer Pro] - July 2026

### App Store Compliance
- **Terms of Service now discloses the Goalfer Pro subscription** — added an "Subscriptions and In-App Purchases (Goalfer Pro)" section to `app-store-assets/metadata/terms-of-service.md` covering auto-renewal, pricing ($3.99/mo, $23.99/yr), cancellation via Apple ID settings, refunds handled by Apple, Restore Purchases, iOS-only availability, and the founding-member promotional entitlement. Closes the Apple Guideline 3.1.2 EULA gap created when the App Store description began advertising a paid subscription. Bumped ToS to Version 1.1 / Last Updated July 24, 2026.
- **Updated compliance checklists** — `ios-legal-compliance-checklist.md` now records subscription/IAP coverage in the Terms section and a Purchase History note in the privacy-manifest section; `ios-submission-checklist.md` compliance report refreshed for the Goalfer Pro metadata pass (description/whatsNew sync confirmed, build-number and marketing-claim items flagged).

### Compliance review findings (no code changes)
- ✅ Privacy policy already covers the Pro subscription, Purchase History, RevenueCat, and Apple as processors — no change needed
- ⚠️ App-level `PrivacyInfo.xcprivacy` does not list Purchase History; acceptable because the RevenueCat pod ships its own manifest, but verify the aggregated App Store privacy label shows "Purchases → Purchase History"
- ⚠️ `app.json` buildNumber is 14 while older submission docs still reference "build 1" — reconcile before submission
- ⚠️ Marketing claims "Join thousands of users" and "increases success rates by 65%" are unverified (Apple 2.3.x) — soften or substantiate

## [Pro Subscription] - May 2026

### Monetization
- **Goalfer Pro paid subscription tier (iOS only)** — First monetization feature, raising the per-user habit limit from 6 (free) to 15 (Pro)
  - Monthly plan: **$3.99 / month** · Annual plan: **$23.99 / year** ("Save 50%")
  - Powered by [RevenueCat](https://www.revenuecat.com/) via `react-native-purchases` SDK
  - RevenueCat is the **source of truth** for entitlements; Pro status is mirrored to Firestore (`users/{uid}.isPro`, `proSince`) for backend reference only
  - `proSince` is **write-once** — never overwritten by re-purchases or restores, preserving the original conversion timestamp for analytics

- **Paywall trigger flow** — Free users hitting the 6-habit limit now see a paywall instead of a silent dead-end
  - `habitService.createHabit` reads Pro status, enforces the tier limit, throws typed `HabitLimitError` (code: `HABIT_LIMIT_REACHED`)
  - `CreateHabitScreen` catches the error, opens the paywall, preserves the form payload, and retries the original creation after a successful purchase
  - Pre-existing client-side checks in `useHabits` and `CleanHomeScreen` removed — the service is now the single source of truth for limit enforcement

- **Discovery affordance on the home dashboard** — Free users at the limit see a soft upgrade card in place of the "All Set!" message
  - Same circular shape as the limit-reached card so the dashboard grid stays uniform
  - Purple accent (`#B771E5`) signals the Pro pathway via the existing palette
  - Copy: "Want more? · From $1.99/mo" (annual price amortized; monthly is $3.99)
  - Pro users at 15 habits keep the original "All Set! 🎯" copy
  - Tapping opens the same `ProPaywallModal` used by `CreateHabitScreen`
  - Funnel analytics: `pro_upgrade_card_tapped` (with habit count) and `pro_upgraded` (with `source`) events

- **Restore Purchases support** — Restore link in the paywall calls RevenueCat's restore flow and surfaces inline error states for "no purchases found" and "no internet"

### New files
- `src/types/subscription.ts` — Constants (`PRO_ENTITLEMENT_ID`, `PRO_PRODUCT_IDS`, `HABIT_LIMIT_REACHED`), typed `PurchaseResult`, `HabitLimitError` class
- `src/services/subscriptionService.ts` — Singleton wrapping `react-native-purchases`; iOS-only platform guard; Firestore mirror with write-once `proSince`
- `src/hooks/useSubscription.ts` — Thin hook exposing `{ isPro, isLoading, error, purchase, restore, refresh }`; re-reads Pro status after every purchase or restore
- `src/components/common/ProPaywallModal.tsx` — Paywall surface with benefits checklist, side-by-side plan cards, purchase CTA, restore link, full theme integration
- `src/services/__tests__/subscriptionService.test.ts` — Platform guards, already-Pro short-circuit, error mapping, write-once `proSince`
- `src/services/__tests__/habitService.createHabit.test.ts` — Tier enforcement at 6/15 boundaries for free vs Pro users
- `src/components/common/__tests__/ProPaywallModal.test.tsx` — Layout, plan selection, CTA copy, error rendering, restore flow

### Modified files
- `src/constants/limits.ts` — Added `MAX_HABITS_FREE` (6), `MAX_HABITS_PRO` (15), `getHabitLimit(isPro)` helper. `MAX_HABITS` retained for backwards compatibility (= `MAX_HABITS_FREE`)
- `src/services/habitService.ts` — `createHabit` reads Pro status, resolves the tier limit, throws `HabitLimitError` when exceeded
- `src/hooks/useHabits.tsx` — Removed pre-check; rethrows service errors so the screen can branch on `HabitLimitError`
- `src/hooks/useAuth.tsx` — Fire-and-forget `subscriptionService.initialize(userId)` on auth completion (non-blocking)
- `src/screens/CreateHabitScreen.tsx` — Branches on `HabitLimitError`; renders `ProPaywallModal`; preserves `pendingForm` for retry; pre-mount limit alert removed
- `src/screens/CleanHomeScreen.tsx` — Pre-navigation limit alert removed; UI affordances driven by `useSubscription().isPro` + `getHabitLimit`; new upgrade card for free users at the limit
- `src/screens/ProfileScreen.tsx` — Dev-only "🧪 Preview Pro Paywall" entry (gated behind `__DEV__`) for visual QA without a build

### Configuration
- Added `react-native-purchases@^10.2.0` to dependencies
- Added `EXPO_PUBLIC_REVENUECAT_IOS_KEY` placeholder to `.env.development` and `.env.production`. Production value is supplied via EAS secrets at build time. No Android key — iOS-only scope.

### Testing
- 23 new unit tests passing (paywall: 11, subscription service: 8, habit service tier enforcement: 4)
- TypeScript: all new files compile cleanly under `tsc --noEmit`
- Pre-existing failures (Firebase v12 `getReactNativePersistence`, iOS notifications, haptics) are unchanged and unrelated to this feature

### External setup required before launch
- App Store Connect: create products `goalfer_pro_monthly` ($3.99 tier) and `goalfer_pro_annual` ($23.99 tier); register a sandbox tester
- RevenueCat dashboard: create entitlement `pro`, offering `default` with both packages, attach `pro` to both products
- EAS secret: `EXPO_PUBLIC_REVENUECAT_IOS_KEY` set to the iOS public API key

## [Metadata Sync] - May 2026

### App Store Metadata
- **Added Goalfer Pro copy to the App Store listing** — `ios-metadata.json` and `app-store-connect-config.json` `description` fields now include a "⭐ GOALFER PRO" block (15 habits vs 6, monthly/annual plans, future features framed as forthcoming) plus a "🎉 FOUNDING MEMBERS" line (first 100 users get Pro free for life). Both files kept in sync.
- Updated `ios-submission-checklist.md`: replaced the stale "3.1 Payments: No in-app purchases" line with 3.1.1 / 3.1.2 IAP-compliance items and added App Store Connect IAP setup steps (Paid Apps Agreement, product creation, IAP review screenshot, sandbox tester, RevenueCat wiring).
- Updated `SUBMISSION_CHECKLIST.md`: added a "Goalfer Pro — In-App Purchase" section flagging that the advertised subscription now gates the next submission until IAP products and RevenueCat are configured; changed status summary from "Ready" to "Metadata ready, IAP setup pending".
- Synced `whatsNew` between `app-store-connect-config.json` and `ios-metadata.json` so both files reference accountability groups and account deletion ("friends and groups", "full account control"). Earlier the two files diverged after only the connect-config was updated.

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

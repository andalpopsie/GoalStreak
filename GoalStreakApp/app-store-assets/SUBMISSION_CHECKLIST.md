# Goalfer App Store Submission Checklist

## Pre-Submission Validation Results

**Validation Date**: May 2026 (Build 14 submitted; metadata refreshed for accountability groups + account deletion)
**Submission Readiness**: 100% — Build 14 in App Store Connect awaiting review submission
**Total Critical Errors**: 0
**Total Warnings**: 0
**Overall Status**: ✅ READY


### ✅ Icons Generated
- ✅ Canonical 1024×1024 master: `GoalStreakApp/assets/icon.png` (referenced by app.json / EAS; see asset-paths SOP)
- ✅ App icon committed to `ios/GoalStreak/Images.xcassets/AppIcon.appiconset/` (10 sizes — fixed in Build 13), generated via `npm run sync-app-icon`
- ℹ️ Note: the old `app-store-assets/icons/enhanced/ios/` copies were deleted per the asset-paths SOP. Do not recreate them — the xcassets set + `assets/icon.png` are the single source of truth.

### ✅ Assets Complete and Ready
- ✅ iOS Screenshots ready in `real-screenshots/app-store-ready/` (PNG). Current set reflects the shipped UI including accountability groups and the Pro paywall:
  - 01-dashboard.png
  - 02-habit-creation.png
  - 03-social-feed.png
  - 04-analytics.png
  - 05-accountability-group.png
  - 06-accountability-feed.png
  - 07-accountability-chat-feature.png
  - 08-pro-paywall-monthly.png / 08-pro-paywall-yearly.png (+ 1290x2796 variants)
  - A 6.5" (1284x2778) set is also present in `app-store-ready/6.5-inch-1284x2778/`
  - ⚠️ The former `03-habit-icons.png` screenshot has been retired; update any docs/captions that still reference it
  - ⚠️ Confirm the target display slot in App Store Connect (6.5" vs 6.7"/6.9") matches the dimensions of the files you upload
- ✅ Metadata: Complete and comprehensive
- ✅ Marketing Materials: All assets prepared
- ✅ Legal Documents: Privacy policy and terms ready
- ✅ Documentation: Comprehensive guides and checklists

### ⚠️ Optional Optimizations
- Keywords currently 89/100 chars. Consider adding "accountability" or "groups" on the next submission to align with the updated `whatsNew` text. Both `ios-metadata.json` and `app-store-connect-config.json` must be updated together.

### 💳 Goalfer Pro — In-App Purchase (NEW, blocks next submission)
The `description`, `promotionalText`, and `whatsNew` in `ios-metadata.json` and `app-store-connect-config.json` now advertise **Goalfer Pro** (15 habits vs 6) and a founding-members promo. Because the app now offers an auto-renewable subscription, the following must be complete before the next "Submit for Review":
- [ ] Paid Apps Agreement active in App Store Connect
- [ ] IAP products created & submitted **with the build**: `goalfer_pro_monthly` ($3.99), `goalfer_pro_annual` ($23.99)
- [ ] 1024×1024 review screenshot attached to each IAP (use `assets/icon.png`)
- [ ] Sandbox tester created; reviewer notes already document the paywall path (6→7 habits)
- [ ] App Privacy updated to include **Purchases → Purchase History** (already reflected in `app-store-connect-config.json`)
- [ ] RevenueCat `pro` entitlement + `default` offering wired; `EXPO_PUBLIC_REVENUECAT_IOS_KEY` set via EAS secret
- ⚠️ Metadata claims must match shipped functionality: advertise only the 15-habit benefit; keep unshipped Pro features labelled "Coming soon" (guideline 2.3.1 / 3.1.2)

### ✅ Android Assets (Deferred for iOS-Only Launch)
- Android icons: Available but not required for iOS launch
- Android screenshots: Available but not required for iOS launch
- Google Play metadata: Complete but deferred


## iOS App Store Submission Checklist

### Required Assets
- [x] App screenshots - **✅ READY** (app-store-ready/) — see the current 8-screenshot set listed above (dashboard, habit creation, social feed, analytics, 3× accountability, Pro paywall). The retired `03-habit-icons.png` is no longer part of the set.
- [x] App icons (generation script ready) - **✅ SCRIPT READY** (5 min execution)
  - [x] Source icon: 500x500 PNG ✅
  - [x] Generation script: generate-icons.sh ✅
  - [ ] Execute script to generate 6 sizes (1024, 180, 120, 167, 152, 76)
  - [ ] Verify generated PNG files
- [x] App Store metadata complete - **✅ READY** (minor keyword trim optional)

### App Store Connect Setup
- [ ] Apple Developer account active
- [ ] App identifier created (com.goalstreak.app)
- [ ] Provisioning profiles configured
- [ ] App Store Connect app record created
- [ ] Test users added for review

### Build Requirements
- [ ] Production build created with EAS Build
- [ ] Build uploaded to App Store Connect
- [ ] Build processed successfully
- [ ] TestFlight testing completed
- [ ] All required device sizes tested

### Metadata Configuration
- [ ] App name: "Goalfer"
- [ ] Subtitle: "Social Habit Tracking"
- [ ] Category: Health & Fitness
- [ ] Age rating: 4+
- [ ] Keywords optimized for discovery
- [ ] Description compelling and complete
- [ ] Privacy policy URL added
- [ ] Support URL added

### Legal & Compliance
- [ ] Privacy policy accessible and complete
- [ ] Terms of service linked in app
- [ ] App Transport Security (ATS) enabled
- [ ] Required usage descriptions in Info.plist
- [ ] Export compliance declaration

## Google Play Store Submission Checklist

### Required Assets
- [ ] App screenshots (5 key screens) - **5/5 found**
- [ ] App icons (all required densities) - **0/6 found**
- [ ] Feature graphic (1024x500) - **✅**
- [ ] Play Store metadata complete - **✅**

### Google Play Console Setup
- [ ] Google Play Developer account active
- [ ] App created in Play Console
- [ ] App signing key configured
- [ ] Release track set up (Internal/Alpha/Beta/Production)

### Build Requirements
- [ ] Production AAB created with EAS Build
- [ ] AAB uploaded to Play Console
- [ ] Build processed successfully
- [ ] Internal testing completed
- [ ] All required device configurations tested

### Store Listing Configuration
- [ ] App title: "Goalfer - Social Habit Tracker"
- [ ] Short description (under 80 characters)
- [ ] Full description compelling and complete
- [ ] Category: Health & Fitness
- [ ] Content rating: Everyone
- [ ] Target audience and content settings
- [ ] Privacy policy URL added

### Legal & Compliance
- [ ] Privacy policy accessible and complete
- [ ] Terms of service available
- [ ] Data safety form completed
- [ ] Target SDK version compliance (API 33+)
- [ ] Required permissions justified

## Marketing & Launch Preparation

### Marketing Materials
- [ ] App preview video frames created - **✅**
- [ ] Social media assets prepared - **✅**
- [ ] Press kit materials ready - **✅**

### Launch Strategy
- [ ] Launch date scheduled
- [ ] Social media posts scheduled
- [ ] Press release prepared and contacts identified
- [ ] Influencer outreach planned
- [ ] User feedback collection system ready

### Monitoring Setup
- [ ] Firebase Analytics configured
- [ ] Firebase Crashlytics enabled
- [ ] App store review monitoring set up
- [ ] Customer support system ready
- [ ] Performance monitoring dashboard created

## Post-Submission Tasks

### Immediate (0-24 hours)
- [ ] Monitor submission status
- [ ] Respond to any review feedback quickly
- [ ] Check for crashes or critical issues
- [ ] Monitor initial user reviews

### Short-term (1-7 days)
- [ ] Execute launch marketing plan
- [ ] Monitor app store rankings
- [ ] Analyze user feedback and reviews
- [ ] Track download and conversion metrics
- [ ] Respond to user reviews

### Long-term (1-4 weeks)
- [ ] Analyze user engagement data
- [ ] Plan first update based on feedback
- [ ] Optimize app store listings based on performance
- [ ] Scale marketing efforts based on results

## Emergency Contacts & Resources

### Technical Issues
- **EAS Build Support**: [Expo documentation]
- **Firebase Support**: [Firebase console]
- **App Store Connect**: [Apple developer support]
- **Google Play Console**: [Google Play support]

### Marketing & PR
- **Social Media Manager**: [Contact]
- **Press Contact**: [Contact]
- **Customer Support**: [Contact]

---

**Status Summary**: ⚠️ Metadata ready, but IAP setup now gates submission — the listing advertises Goalfer Pro, so App Store Connect IAP products, the Paid Apps Agreement, and RevenueCat wiring must be complete before "Submit for Review".

Last refreshed: 2026-07-26 (softened unverified marketing claims in the App Store listing fields; corrected stale screenshot list and icon path to match the shipped asset set)

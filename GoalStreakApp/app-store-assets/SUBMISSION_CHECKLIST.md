# Goalfer App Store Submission Checklist

## Pre-Submission Validation Results

**Validation Date**: May 2026 (Build 14 submitted; metadata refreshed for accountability groups + account deletion)
**Submission Readiness**: 100% — Build 14 in App Store Connect awaiting review submission
**Total Critical Errors**: 0
**Total Warnings**: 0
**Overall Status**: ✅ READY


### ✅ Icons Generated
- ✅ All 6 required iOS PNGs present in `icons/enhanced/ios/`
  - AppIcon-AppStore.png (1024×1024)
  - AppIcon-60@3x.png (180×180), AppIcon-60@2x.png (120×120)
  - AppIcon-83.5@2x.png (167×167), AppIcon-76@2x.png (152×152), AppIcon-76.png (76×76)
- ✅ App icon committed to `ios/GoalStreak/Images.xcassets/AppIcon.appiconset/` (10 sizes — fixed in Build 13)

### ✅ Assets Complete and Ready
- ✅ iOS Screenshots: 5/5 ready (1290x2796 PNG, iPhone 6.7")
  - 01-dashboard.png (475KB)
  - 02-habit-creation.png (219KB)
  - 03-habit-icons.png (180KB)
  - 04-social-feed.png (495KB)
  - 05-analytics.png (361KB)
- ✅ Metadata: Complete and comprehensive
- ✅ Marketing Materials: All assets prepared
- ✅ Legal Documents: Privacy policy and terms ready
- ✅ Documentation: Comprehensive guides and checklists

### ⚠️ Optional Optimizations
- Keywords currently 89/100 chars. Consider adding "accountability" or "groups" on the next submission to align with the updated `whatsNew` text. Both `ios-metadata.json` and `app-store-connect-config.json` must be updated together.

### ✅ Android Assets (Deferred for iOS-Only Launch)
- Android icons: Available but not required for iOS launch
- Android screenshots: Available but not required for iOS launch
- Google Play metadata: Complete but deferred


## iOS App Store Submission Checklist

### Required Assets
- [x] App screenshots (5 key screens) - **✅ 5/5 READY** (app-store-ready/)
  - [x] 01-dashboard.png (1290x2796, 475KB)
  - [x] 02-habit-creation.png (1290x2796, 219KB)
  - [x] 03-habit-icons.png (1290x2796, 180KB)
  - [x] 04-social-feed.png (1290x2796, 495KB)
  - [x] 05-analytics.png (1290x2796, 361KB)
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

**Status Summary**: ✅ Ready — Build 14 uploaded, awaiting "Submit for Review" in App Store Connect.

Last refreshed: 2026-05-27 (post accountability-groups + account-deletion metadata sync)

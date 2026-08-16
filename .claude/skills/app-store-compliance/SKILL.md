---
name: app-store-compliance
description: Review app config, legal docs, and store metadata for App Store submission compliance (privacy descriptions, privacy manifest, metadata consistency, technical compliance). Use before a submission or after changing app.json, legal docs, or store metadata. Ported from the Kiro "App Store Compliance Checker" hook.
---

Check the following against current App Store requirements:

1. **iOS requirements**
   - Privacy usage descriptions in `app.json`/`Info.plist` are comprehensive and user-friendly
   - `GoalStreakApp/ios/GoalStreak/PrivacyInfo.xcprivacy` is complete and accurate for data types actually collected
   - Every requested permission has a clear justification string
   - Bundle identifier (`com.goalstreak.app`) and version/build number are consistent across `app.json`, `project.pbxproj`, `Info.plist` (see `npm run sync-build-number`)

2. **Legal documents** (`GoalStreakApp/app-store-assets/metadata/privacy-policy.md`, `terms-of-service.md`)
   - Privacy policy covers all actual data collection practices (Firebase Auth, Firestore, Storage, FCM, RevenueCat, analytics)
   - Terms of service is comprehensive and legally sound
   - All URLs point to a consistent live domain
   - Contact info is current

3. **Metadata consistency** (`app-store-assets/metadata/ios-metadata.json`, `android-metadata.json`, description/keyword files)
   - App descriptions consistent across all metadata files
   - Keywords within character limits
   - Age rating matches actual content/features (check `ios-age-rating-classification.md`)
   - All referenced URLs are valid

4. **Technical compliance**
   - Deep-link/external-link utilities handle errors gracefully
   - Legal document links from within the app resolve correctly
   - Privacy controls in-app match what the privacy policy discloses

**Hard rule:** don't create a new compliance report file — update `app-store-assets/metadata/ios-submission-checklist.md` or `ios-legal-compliance-checklist.md` in place, and log changes in the changelog (`npm run changelog`) if warranted.

Report: ✅ compliant items, ⚠️ needs attention, ❌ critical blockers, and concrete next steps.

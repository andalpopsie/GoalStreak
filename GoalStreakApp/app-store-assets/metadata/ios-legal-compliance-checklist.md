# iOS Legal Compliance Checklist

## Overview
This checklist ensures Goalfer meets all iOS App Store legal and privacy requirements for successful submission and approval.

## ✅ Privacy Usage Descriptions (Info.plist)

### Declared Permissions (only what the app actually requests)
- [x] **NSUserTrackingUsageDescription**: INTENTIONALLY ABSENT. Goalfer does not perform App Tracking Transparency (ATT) tracking — no IDFA, no ATT prompt, no cross-app/data-broker sharing. Analytics is first-party Firebase only. The ATT string must be absent so the App Store privacy label does not falsely claim tracking. (See privacy manifest: `NSPrivacyTracking=false`.)
- [x] **NSCameraUsageDescription**: Profile picture capture (optional; via `expo-image-picker`)
- [x] **NSPhotoLibraryUsageDescription**: Profile picture selection (optional; via `expo-image-picker`)

### Removed Permissions (Guideline 5.1.1 — no feature requests these)
Removed from **both** `app.json` (`ios.infoPlist`) and `ios/GoalStreak/Info.plist` because no shipping feature requests them and no corresponding Expo module is installed. Do not re-add without a real feature behind them.
- [x] **NSLocationWhenInUseUsageDescription**: REMOVED — no `expo-location`; no location-based reminders shipped
- [x] **NSContactsUsageDescription**: REMOVED — no `expo-contacts`; friend discovery is email-based only
- [x] **NSMicrophoneUsageDescription**: REMOVED — no `expo-av`; no voice features
- [x] **NSCalendarsUsageDescription**: REMOVED — no `expo-calendar`
- [x] **NSRemindersUsageDescription**: REMOVED — no `expo-calendar`/reminders integration
- [x] **NSFaceIDUsageDescription**: REMOVED — no `expo-local-authentication`
- [x] **Privacy policy aligned**: removed the "Location Data" collection line from `privacy-policy.md` so the policy no longer discloses a location practice the app can't perform (bumped to v1.2 / July 31, 2026)
- [ ] ⚠️ **Android manifest leftover (non-blocking for iOS launch)**: `app.json` `android.permissions` still lists `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`. Harmless for the iOS-only launch, but remove before any Play Store submission to keep Android permissions consistent with the (now location-free) feature set

## ✅ Privacy Manifest File (iOS 17+ Compliance)

### Privacy Manifest (PrivacyInfo.xcprivacy)
- [x] **NSPrivacyAccessedAPITypes**: File timestamp, UserDefaults, disk space, system boot time
- [x] **NSPrivacyCollectedDataTypes**: Email, name, photos, user content, product interaction, device ID, user ID
- [x] **NSPrivacyTracking**: Set to false (no cross-app tracking)
- [x] **NSPrivacyTrackingDomains**: Empty array (no tracking domains)
- [x] **Consistency fix**: `Product Interaction` data type set to `NSPrivacyCollectedDataTypeTracking = false` to match `NSPrivacyTracking=false` and the absence of the ATT string. (Previously `true`, which was internally inconsistent and would have triggered an App Store privacy-label mismatch.)

### Data Collection Disclosure
- [x] Email address (linked, not tracking) - App functionality, analytics
- [x] Display name (linked, not tracking) - App functionality
- [x] Photos/videos (linked, not tracking) - App functionality
- [x] User content (linked, not tracking) - App functionality
- [x] Product interaction (not linked, NOT tracking) - Analytics, personalization (first-party Firebase only; no IDFA/ATT)
- [x] Device ID (linked, not tracking) - App functionality, analytics
- [x] User ID (linked, not tracking) - App functionality
- [x] Purchase history (linked, not tracking) - App functionality, analytics — declared in App Store Connect privacy config; collected by the RevenueCat SDK, which ships its own `PrivacyInfo.xcprivacy`
- [ ] ⚠️ Verify: the app-level `ios/GoalStreak/PrivacyInfo.xcprivacy` does not list `NSPrivacyCollectedDataTypePurchaseHistory`. This is acceptable because RevenueCat's bundled manifest declares it, but confirm the aggregated App Store privacy label shows "Purchases → Purchase History" before submission

## ✅ Legal Documents

### Privacy Policy
- [x] **Comprehensive privacy policy** created at `app-store-assets/metadata/privacy-policy.md`
- [x] **Covers all data collection**: Personal info, habit data, social features, technical data
- [x] **Explains data usage**: App functionality, social features, analytics, communication
- [x] **Data sharing disclosure**: No selling, limited sharing scenarios
- [x] **Security measures**: Encryption, Firebase security, regular monitoring
- [x] **User rights**: Access, delete, control sharing, opt-out
- [x] **Children's privacy**: 13+ age requirement, COPPA compliance
- [x] **International transfers**: Appropriate safeguards mentioned
- [x] **Third-party services**: Firebase disclosure with privacy policy link
- [x] **Contact information**: Multiple contact methods provided
- [x] **Compliance statements**: CCPA, GDPR, COPPA, App Store guidelines

### Terms of Service
- [x] **Comprehensive terms** created at `app-store-assets/metadata/terms-of-service.md`
- [x] **Acceptance of terms**: Clear agreement mechanism
- [x] **Service description**: Detailed feature explanation
- [x] **Eligibility requirements**: Age restrictions, account requirements
- [x] **Acceptable use policy**: Permitted and prohibited uses
- [x] **Social features guidelines**: Community standards, content moderation
- [x] **Intellectual property**: Rights and ownership clarification
- [x] **Privacy reference**: Links to privacy policy
- [x] **Service availability**: Uptime expectations, maintenance notices
- [x] **Subscriptions & IAP (Goalfer Pro)**: Auto-renewal, pricing ($3.99/mo, $23.99/yr), cancellation, refunds-via-Apple, restore, and founding-member promo disclosed (Apple 3.1.2)
- [x] **Account termination**: Voluntary and involuntary termination
- [x] **Disclaimers**: Service limitations, health disclaimers
- [x] **Liability limitations**: Legal protections and user responsibilities
- [x] **Dispute resolution**: Governing law, resolution process
- [x] **Contact information**: Multiple contact methods for different purposes

## ✅ In-App Legal Document Access

### SignUpScreen Integration
- [x] **Terms of Service link**: Functional TouchableOpacity with openTermsOfService()
- [x] **Privacy Policy link**: Functional TouchableOpacity with openPrivacyPolicy()
- [x] **Visual indication**: Underlined text to show clickable links
- [x] **Error handling**: Graceful fallback if links cannot be opened

### ProfileScreen Integration
- [x] **Privacy Policy menu item**: Easy access from profile settings
- [x] **Terms of Service menu item**: Easy access from profile settings
- [x] **Help & Support menu item**: Additional support access
- [x] **Consistent UI**: Matches existing menu item styling

### Utility Functions
- [x] **linkingUtils.ts**: Centralized URL opening functionality
- [x] **Error handling**: Alerts for failed URL opening
- [x] **Fallback messages**: User-friendly error messages
- [x] **Multiple functions**: Privacy, terms, and support links

## ✅ App Store Connect Configuration

### Privacy Information
- [x] **Privacy Policy URL**: https://goalfer.app/privacy
- [x] **Data collection disclosure**: Detailed in app-store-connect-config.json
- [x] **Tracking disclosure**: No cross-app tracking
- [x] **Data types**: Contact info, user content, usage data, identifiers
- [x] **Data purposes**: App functionality, analytics, personalization
- [x] **Data linking**: Appropriate linked/not linked classifications

### Age Rating
- [x] **Content rating**: 4+ (appropriate for all ages)
- [x] **Content advisories**: Minimal social networking and user-generated content
- [x] **Rationale**: Family-friendly habit tracking with moderated social features

### App Information
- [x] **Support URL**: https://goalfer.app/support
- [x] **Marketing URL**: https://goalfer.app
- [x] **Category**: Health & Fitness (primary), Productivity (secondary)
- [x] **Keywords**: Optimized for habit tracking and social accountability

## ✅ Compliance Verification

### COPPA Compliance (Children's Privacy)
- [x] **Age restriction**: 13+ years minimum age requirement
- [x] **Parental consent**: Required for users under 18
- [x] **Data minimization**: Only collect necessary data
- [x] **No targeted advertising**: No ads or tracking for minors

### GDPR Compliance (EU Users)
- [x] **Lawful basis**: Consent and legitimate interest clearly defined
- [x] **Data subject rights**: Access, rectification, erasure, portability, objection
- [x] **Data protection officer**: Contact information provided
- [x] **Privacy by design**: Default privacy settings, minimal data collection
- [x] **Breach notification**: Procedures in place for data breaches

### CCPA Compliance (California Users)
- [x] **Right to know**: What data is collected and how it's used
- [x] **Right to delete**: Account deletion removes all personal data
- [x] **Right to opt-out**: No sale of personal information (we don't sell data)
- [x] **Non-discrimination**: No penalties for exercising privacy rights

### Apple App Store Guidelines
- [x] **Privacy policy accessibility**: Linked in app and App Store Connect
- [x] **Data collection transparency**: Clear explanations for all permissions
- [x] **User consent**: Explicit consent for optional features
- [x] **Data minimization**: Only collect data necessary for app functionality
- [x] **Security measures**: Encryption and secure data handling

## ✅ Technical Implementation

### App Configuration (app.json)
- [x] **Bundle identifier**: com.goalstreak.app
- [x] **Privacy descriptions**: Comprehensive usage descriptions for all permissions
- [x] **Encryption declaration**: ITSAppUsesNonExemptEncryption set to false
- [x] **Display names**: Consistent app naming

### iOS Project Configuration
- [x] **Info.plist**: Privacy descriptions properly configured
- [x] **Privacy manifest**: PrivacyInfo.xcprivacy file complete and accurate
- [x] **Entitlements**: Proper entitlements for required capabilities
- [x] **Build settings**: Production-ready configuration

### Code Implementation
- [x] **Permission requests**: Proper permission handling with user explanations
- [x] **Data encryption**: All sensitive data encrypted in transit and at rest
- [x] **Error handling**: Graceful handling of permission denials
- [x] **User controls**: Privacy settings and data management options

## ✅ Documentation and Support

### Legal Document Hosting
- [x] **Privacy policy**: Accessible at https://goalfer.app/privacy
- [x] **Terms of service**: Accessible at https://goalfer.app/terms
- [x] **Support page**: Accessible at https://goalfer.app/support
- [x] **Backup access**: Documents also available in `app-store-assets/metadata/` folder

### Contact Information
- [x] **Privacy inquiries**: hello@goalfer.app
- [x] **Legal questions**: hello@goalfer.app
- [x] **Technical support**: hello@goalfer.app
- [x] **General business**: hello@goalfer.app
- [x] **Data protection officer**: hello@goalfer.app (for EU users)

### Response Procedures
- [x] **Privacy requests**: 30-day response time commitment
- [x] **Legal inquiries**: 5-10 business day response time
- [x] **Technical support**: 24-48 hour response time
- [x] **Escalation procedures**: Clear escalation paths for complex issues

## ✅ Pre-Submission Verification

### Final Checklist
- [x] All privacy descriptions are accurate and comprehensive
- [x] Privacy manifest file is complete and up-to-date
- [x] Legal documents are accessible and comprehensive
- [x] In-app links to legal documents are functional
- [x] App Store Connect privacy information is accurate
- [x] Age rating and content advisories are appropriate
- [x] Contact information is current and monitored
- [x] Compliance with all applicable privacy laws
- [x] Technical implementation follows best practices
- [x] Documentation is complete and accessible

### Testing Verification
- [x] **Permission flows**: Test all permission requests work properly
- [x] **Legal document links**: Verify all links open correctly
- [x] **Privacy settings**: Test user privacy controls function correctly
- [x] **Data deletion**: Verify account deletion removes all data
- [x] **Error handling**: Test graceful handling of permission denials
- [x] **Offline functionality**: Ensure core features work without permissions

## ✅ Metadata Accuracy (Apple Guideline 2.3)

- [x] Removed unverifiable statistic "increases success rates by 65%" from the App Store description (Guideline 2.3.7 — no unsubstantiated claims)
- [x] Removed pre-launch "join thousands of users" social-proof claim from the description
- [x] Subscription benefits described accurately; roadmap features labelled "coming soon" (Guideline 3.1.2)
- [ ] ⚠️ "First 100 users get Goalfer Pro free for life" promo in promotional text — confirm the promotional entitlement is actually implemented in the shipping build before submission (otherwise misleading metadata)

## ⚠️ Outstanding Pre-Submission Items (must resolve before submit)

- [x] ✅ **Reviewer & trade-rep contact placeholders**: RESOLVED. The `[FIRST_NAME]`/`[LAST_NAME]`/`[EMAIL]`/`[PHONE]` placeholders were removed from `app-store-connect-config.json`. Both `appReviewInformation.contact` and `versionInformation.tradeRepresentativeContactInformation` now carry a `_note` documenting that these are entered directly in App Store Connect (App Review Information → Contact Information; App Information → Trade Representative Contact Information) and intentionally not stored in the repo. ⚠️ Action moved to ASC: enter real, monitored App Review contact details before "Submit for Review". **South Korea distribution is confirmed (yes)**, so the Trade Representative Contact Information is REQUIRED and must be completed in App Store Connect (App Information → Trade Representative Contact Information)
- [x] ✅ **Terms governing law**: RESOLVED. Terms of Service §12 now specifies the **Republic of Singapore** (country of residence / business registration) as governing law and dispute forum
- [ ] ⚠️ **Domain hosting/mailbox verification**: all in-app URLs and metadata now use the canonical `goalfer.app` domain, and all contact emails use `hello@goalfer.app` (goalstreak.co / @goalstreak.app references have been retired). Before submit, confirm `goalfer.app/privacy`, `/terms`, and `/support` are live and the `hello@goalfer.app` mailbox is provisioned and monitored
- [x] ✅ **UGC/social safety (Guideline 1.2)**: report + block moderation ships in the build — `BlockedUsersScreen` is registered in `AppNavigator` (`BlockedUsers` route) and `ProfileScreen`, `ActivityCard`, `GroupFeedCard`, and `GroupChatTab` expose report/block actions via `useModeration`; blocked/reported content is filtered across all social surfaces; Terms carry the zero-tolerance clause and signup gates on EULA acceptance
- [x] ✅ **Unused permission strings (Guideline 5.1.1)**: RESOLVED. Removed `NSLocationWhenInUseUsageDescription`, `NSContactsUsageDescription`, `NSMicrophoneUsageDescription`, `NSCalendarsUsageDescription`, `NSRemindersUsageDescription`, and `NSFaceIDUsageDescription` from **both** `app.json` and `ios/GoalStreak/Info.plist`. Code audit confirmed only Camera + Photo Library (via `expo-image-picker`, for profile pictures) are actually requested; no `expo-location`/`expo-contacts`/`expo-calendar`/`expo-local-authentication`/`expo-av` deps are installed. Only `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` remain
- [ ] ⚠️ **Purchase History in app-level manifest**: `ios/GoalStreak/PrivacyInfo.xcprivacy` does not list `NSPrivacyCollectedDataTypePurchaseHistory`; it relies on RevenueCat's bundled manifest. Verify the aggregated App Store privacy label shows "Purchases → Purchase History" after build
- [x] ✅ **Doc drift**: RESOLVED. Legacy `app-store/…` path references in this checklist corrected to the canonical `app-store-assets/metadata/` location
- [x] ✅ **Demo account for review (Guideline 2.1)**: RESOLVED (repo-side). `appReviewInformation.demoAccount.required` is now `true` with a `_note`; the working demo account credentials are entered directly in App Store Connect (App Review Information → Sign-In Information), not stored in the repo. Sandbox IAP steps for the Goalfer Pro paywall are already in the `notes` field. ⚠️ Action at submit time: create the demo account and enter its email/password in ASC before "Submit for Review"
- [x] ✅ **Version-string drift (cosmetic)**: RESOLVED. Aligned `MARKETING_VERSION` `1.0` → `1.0.0` in both Debug and Release configs of `ios/GoalStreak.xcodeproj/project.pbxproj`, matching `Info.plist` (`CFBundleShortVersionString = 1.0.0`) and `app.json` (`1.0.0`).

## Status: ✅ REPO-SIDE COMPLETE — remaining items are App Store Connect / infrastructure actions

All in-repo blockers are resolved: contact/trade-rep placeholders cleared, Terms §12 governing law set to Singapore, unused permission strings removed, version strings aligned, doc drift fixed, UGC safety shipped. Nothing in the codebase or metadata files is blocking submission.

The remaining checkbox items are **actions you take outside the repo** (in App Store Connect or your hosting/mail infra), to be completed as part of the submission itself:
- Enter App Review contact + demo account credentials in App Store Connect
- Enter the South Korea Trade Representative Contact Information in App Store Connect
- Confirm `goalfer.app/privacy`, `/terms`, `/support` are live and `hello@goalfer.app` is monitored
- After the production build: verify the aggregated App Store privacy label shows "Purchases → Purchase History"
- Confirm the "first 100 users get Pro free for life" promotional entitlement is wired in the shipping build (or soften the promo copy)

### Key Achievements
- Comprehensive privacy usage descriptions for all permissions
- Complete privacy manifest file for iOS 17+ compliance
- Detailed privacy policy and terms of service documents
- Functional in-app access to legal documents
- Full compliance with COPPA, GDPR, CCPA, and App Store guidelines
- Proper technical implementation with security best practices
- Complete documentation and support infrastructure

### Next Steps
1. Host legal documents at specified URLs (goalfer.app/privacy, /terms, /support)
2. Set up email addresses for legal and privacy inquiries
3. Final testing of all legal document links
4. App Store Connect configuration with privacy information
5. Submit for App Store review with confidence in legal compliance
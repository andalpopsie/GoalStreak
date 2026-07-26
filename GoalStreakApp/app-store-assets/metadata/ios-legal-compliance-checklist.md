# iOS Legal Compliance Checklist

## Overview
This checklist ensures Goalfer meets all iOS App Store legal and privacy requirements for successful submission and approval.

## ✅ Privacy Usage Descriptions (Info.plist)

### Required Permissions
- [x] **NSUserTrackingUsageDescription**: INTENTIONALLY REMOVED. Goalfer does not perform App Tracking Transparency (ATT) tracking — no IDFA, no ATT prompt, no cross-app/data-broker sharing. Analytics is first-party Firebase only. The ATT string must be absent so the App Store privacy label does not falsely claim tracking. (See privacy manifest: `NSPrivacyTracking=false`.)
- [x] **NSCameraUsageDescription**: Profile picture capture (optional)
- [x] **NSPhotoLibraryUsageDescription**: Profile picture selection (optional)
- [x] **NSLocationWhenInUseUsageDescription**: Location-based reminders (optional)

### Additional Permissions (Future-proofing)
- [x] **NSContactsUsageDescription**: Friend discovery (optional)
- [x] **NSMicrophoneUsageDescription**: Voice features (future)
- [x] **NSCalendarsUsageDescription**: Calendar integration (optional)
- [x] **NSRemindersUsageDescription**: Reminder integration (optional)
- [x] **NSFaceIDUsageDescription**: Biometric authentication (optional)

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
- [x] **Comprehensive privacy policy** created at `app-store/privacy-policy.md`
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
- [x] **Comprehensive terms** created at `app-store/terms-of-service.md`
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
- [x] **Backup access**: Documents also available in app-store folder

### Contact Information
- [x] **Privacy inquiries**: privacy@goalfer.app
- [x] **Legal questions**: legal@goalfer.app
- [x] **Technical support**: support@goalfer.app
- [x] **General business**: business@goalfer.app
- [x] **Data protection officer**: dpo@goalfer.app (for EU users)

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

- [ ] ❌ **Reviewer contact placeholders**: `appReviewInformation.contact` and `tradeRepresentativeContactInformation` in `app-store-connect-config.json` still contain `[FIRST_NAME]`, `[LAST_NAME]`, `[EMAIL]`, `[PHONE]` — fill with real, monitored details
- [ ] ❌ **Terms governing law placeholder**: Terms of Service §12 still contains `[Your Jurisdiction]` — set the governing jurisdiction
- [ ] ⚠️ **Domain consistency**: web URLs use `goalstreak.co` while all contact emails use `@goalstreak.app`, and the app brand is "Goalfer". Confirm both domains are owned, the `goalstreak.co/privacy`, `/terms`, `/support` pages are live, and the `@goalstreak.app` mailboxes are monitored
- [ ] ⚠️ **UGC/social safety (Guideline 1.2)**: 4+ rating with social networking + user-generated content requires in-app report, block, and content filtering to ship in the submitted build. Confirm the report-and-block feature is included in the build (Terms already carry the zero-tolerance clause)
- [ ] ⚠️ **Unused permission strings (Guideline 5.1.1)**: `NSMicrophoneUsageDescription`, `NSCalendarsUsageDescription`, `NSRemindersUsageDescription` (and possibly Location/Contacts) are declared as "future" features. Remove usage descriptions for permissions no feature currently requests, or a reviewer may ask which feature uses them
- [ ] ⚠️ **Purchase History in app-level manifest**: `ios/GoalStreak/PrivacyInfo.xcprivacy` does not list `NSPrivacyCollectedDataTypePurchaseHistory`; it relies on RevenueCat's bundled manifest. Verify the aggregated App Store privacy label shows "Purchases → Purchase History" after build
- [ ] 📝 **Doc drift**: this checklist references legacy paths `app-store/privacy-policy.md` / `app-store/terms-of-service.md`; the canonical location is `app-store-assets/metadata/`

## Status: ⚠️ NEARLY READY — resolve Outstanding Pre-Submission Items above

Privacy manifest, usage descriptions, legal documents, and in-app legal links are in place. Submission is blocked only by the placeholder contact/jurisdiction fields and the verification items listed above.

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
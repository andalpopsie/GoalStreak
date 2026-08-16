---
name: legal-docs-check
description: Validate privacy-policy.md, terms-of-service.md, and the iOS legal compliance checklist for completeness, cross-document consistency, and GDPR/CCPA/COPPA compliance. Use after editing any legal document under app-store-assets/metadata/. Ported from the Kiro "Legal Document Validator" hook.
---

Files in scope: `GoalStreakApp/app-store-assets/metadata/privacy-policy.md`, `terms-of-service.md`, `ios-legal-compliance-checklist.md`.

1. **Privacy policy**
   - All data collection practices disclosed (Firebase Auth, Firestore, Storage, FCM, RevenueCat/subscriptions, analytics, crash reporting)
   - User rights (access, delete, export) clearly stated — note `accountDeletionService.ts` exists, so deletion flow claims should match actual behavior
   - Third-party services properly disclosed
   - Privacy-inquiry contact info present and current
   - GDPR / CCPA / COPPA requirements addressed

2. **Terms of service**
   - All current app features and limitations covered (habits, groups, social/friends, Pro subscription, timers)
   - User responsibilities and prohibited uses clear
   - Liability limitations and dispute resolution present
   - IP rights protected, termination procedure fair and legal

3. **Cross-document consistency**
   - Privacy policy and terms reference each other correctly
   - Domain/URLs consistent across both documents (check for stale domains — the app has used more than one over its history)
   - Contact info matches across documents
   - Effective dates / version numbers consistent

4. **Regulatory specifics**
   - COPPA: 13+ age requirement stated
   - GDPR: EU user rights covered
   - CCPA: California privacy rights covered
   - Matches Apple's App Store legal requirements

5. **Technical integration**
   - In-app links to these documents resolve correctly
   - Linking utility handles failed loads gracefully
   - In-app privacy controls actually match what's disclosed

**Hard rule:** don't create a new validation-report file — update `ios-legal-compliance-checklist.md` in place.

Report: ✅ compliant sections, ⚠️ needs improvement, ❌ critical issues, 🔗 link validation results, 📋 recommendation for legal review (note: this is not a substitute for actual legal counsel on anything flagged critical).

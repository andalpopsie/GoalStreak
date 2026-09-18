---
inclusion: manual
description: "Monitors changes to app configuration, legal documents, and metadata files. When changes are detected, automatically checks for App Store compliance issues and ensures all requirements are met for successful submission."
---

App Store related files have been modified. Please perform a comprehensive compliance check focusing on:

1. **iOS Requirements**:
   - Verify all privacy usage descriptions are comprehensive and user-friendly
   - Check that privacy manifest file (PrivacyInfo.xcprivacy) is complete and accurate
   - Ensure all required permissions have proper justifications
   - Validate bundle identifier and version consistency

2. **Legal Documents**:
   - Verify privacy policy covers all data collection practices
   - Check terms of service are comprehensive and legally sound
   - Ensure all URLs use the correct goalstreak.co domain
   - Validate contact information is current and monitored

3. **Metadata Consistency**:
   - Check app descriptions are consistent across all files
   - Verify keywords are optimized and within character limits
   - Ensure age rating matches content and features
   - Validate all URLs are accessible and functional

4. **Technical Compliance**:
   - Verify linking utilities handle errors gracefully
   - Check that legal document links are functional
   - Ensure privacy controls are properly implemented
   - Validate data collection matches privacy disclosures

**CRITICAL - Documentation Rules**:
- ❌ DO NOT create new compliance report files
- ✅ DO update existing compliance checklists in app-store-assets/metadata/
- ✅ DO use CHANGELOG.md for tracking compliance improvements

Provide a compliance report with:
- ✅ Items that are compliant
- ⚠️ Items that need attention
- ❌ Critical issues that must be fixed
- 📋 Recommended next steps for submission readiness
- 📝 Which existing files should be updated (never create new ones)

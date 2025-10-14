# iOS Submission Guide

## 🎯 Complete Sequence for GoalStreak iOS Launch

This guide consolidates all iOS submission information including setup, testing, and App Store Connect configuration. Follow these steps in **exact order** to successfully submit GoalStreak to the iOS App Store.

> **Note**: This guide consolidates information from multiple iOS-related documents for a single comprehensive reference.

---

## Phase 1: Prerequisites & Setup (30 minutes)

### Step 1: Verify Your Apple Developer Account
**Before starting, ensure you have:**
- ✅ Active Apple Developer Program membership ($99/year)
- ✅ Access to Apple Developer Portal (developer.apple.com)
- ✅ Your Apple ID email and password
- ✅ Your Apple Developer Team ID

**To find your Team ID:**
1. Go to https://developer.apple.com
2. Sign in with your Apple ID
3. Go to "Account" → "Membership"
4. Copy your Team ID (10 characters, like "ABCD123456")

### Step 2: Configure EAS Credentials
```bash
cd GoalStreakApp
npm run ios:setup-credentials
```

**This will prompt you for:**
- Apple ID (your developer account email)
- Apple Team ID (from step 1)
- App Store Connect App ID (leave blank for now - we'll get this in step 4)

### Step 3: Initial Validation
```bash
npm run ios:validate
```

**Expected result:** Should show only 1 error (App Store Connect App ID not configured)

---

## Phase 2: App Store Connect Setup (20 minutes)

### Step 4: Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click "My Apps" → "+" → "New App"
4. Fill in the form:
   - **Platform:** iOS
   - **Name:** GoalStreak
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select "com.goalstreak.app" (should be available)
   - **SKU:** goalstreak-ios-app

5. Click "Create"

### Step 5: Get App Store Connect App ID
1. In your newly created app, go to "App Information"
2. Find "Apple ID" (10-digit number like "1234567890")
3. Copy this number

### Step 6: Update EAS Configuration
1. Open `GoalStreakApp/eas.json`
2. Find the line with `"ascAppId": "[APP_STORE_CONNECT_APP_ID]"`
3. Replace `[APP_STORE_CONNECT_APP_ID]` with your actual App ID
4. Save the file

### Step 7: Final Validation
```bash
npm run ios:validate
```

**Expected result:** Should show "Ready for iOS App Store Submission!" with 0 errors

---

## Phase 3: Generate Configuration Guides (5 minutes)

### Step 8: Generate App Store Connect Guides
```bash
npm run ios:configure-app-store
```

**This creates:**
- `app-store-connect-setup-guide.md` - Complete setup instructions
- `ios-screenshot-upload-guide.md` - Screenshot requirements
- `ios-submission-timeline.md` - Timeline and checklist

---

## Phase 4: Build and Submit (45-90 minutes)

### Step 9: Execute Production Build and Submission
```bash
npm run ios:build-and-submit
```

**This automated process will:**
1. ✅ Run final validation checks
2. ✅ Create iOS production build via EAS (20-45 minutes)
3. ✅ Upload build to App Store Connect (5-15 minutes)
4. ✅ Submit for Apple review
5. ✅ Generate monitoring checklist

**⏱️ Expected Duration:** 30-60 minutes for build + 5-15 minutes for upload

**💡 Pro Tip:** Keep the terminal open and monitor progress. You'll see real-time updates.

---

## Phase 5: App Store Connect Configuration (30 minutes)

### Step 10: Complete App Store Listing
While your build is processing, complete your App Store Connect listing:

1. **Go to App Store Connect** → Your App → "App Store" tab

2. **App Information:**
   - Name: GoalStreak
   - Subtitle: Social Habit Tracking
   - Category: Health & Fitness, Productivity

3. **Version Information:**
   - Version: 1.0.0
   - Copyright: © 2025 GoalStreak. All rights reserved.

4. **App Store Listing:**
   - Copy description from `app-store-assets/metadata/ios-metadata.json`
   - Copy keywords from the same file
   - Set promotional text: "🎯 Build lasting habits with friends! Track streaks, share progress, and achieve goals together with social accountability."

5. **Screenshots:**
   - Upload screenshots from `app-store-assets/real-screenshots/ios/`
   - Required sizes: iPhone 6.7", 6.5", 6.1", 5.5" and iPad Pro 12.9", 11"

6. **App Review Information:**
   - Contact info: Your details
   - Demo account: Not required
   - Notes: "GoalStreak is a social habit tracking app. All features work without special accounts. Test by creating habits, tracking progress, and adding friends via email."

7. **Age Rating:**
   - 4+ (appropriate for all ages)
   - Social Networking: Infrequent/Mild
   - User Generated Content: Infrequent/Mild
   - All other categories: None

8. **App Privacy:**
   - Privacy Policy URL: https://goalstreak.co/privacy
   - Configure data types as specified in the metadata

### Step 11: Select Build and Submit
1. Once your build appears in App Store Connect (after processing):
   - Go to "Build" section
   - Select your uploaded build
   - Click "Save"

2. **Final Review:**
   - Review all information
   - Ensure screenshots are uploaded
   - Verify all URLs work

3. **Submit for Review:**
   - Click "Submit for Review"
   - Confirm submission

---

## Phase 6: Monitor and Launch (1-7 days)

### Step 12: Monitor Review Status
**Check daily:**
- App Store Connect for status updates
- Email for Apple communications
- Crash reports and analytics

**Review Timeline:**
- **Day 1:** "Waiting for Review"
- **Days 1-7:** "In Review" 
- **Day 7:** "Approved" or "Rejected"

### Step 13: Handle Review Outcome

**If Approved ✅:**
1. Choose release option (automatic or manual)
2. Activate marketing campaigns
3. Monitor initial downloads and reviews
4. Respond to user feedback

**If Rejected ❌:**
1. Review rejection reasons carefully
2. Make required changes
3. Resubmit updated version
4. Return to review queue

---

## 🚨 Troubleshooting Common Issues

### Build Failures
```bash
# Check EAS build logs
eas build:list --limit=5

# View detailed build logs in EAS dashboard
```

### Credential Issues
```bash
# Re-run credential setup
npm run ios:setup-credentials

# Verify Apple Developer account access
```

### Submission Failures
- Check App Store Connect for error messages
- Verify all required fields are completed
- Ensure screenshots are uploaded for all device sizes

---

## 📞 Support Resources

### Apple Resources
- **App Store Connect:** https://appstoreconnect.apple.com
- **Developer Portal:** https://developer.apple.com
- **Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Support:** https://developer.apple.com/contact/

### EAS Resources
- **Build Dashboard:** https://expo.dev
- **Documentation:** https://docs.expo.dev/build/introduction/
- **Status Page:** https://status.expo.dev

---

## ✅ Success Checklist

Before starting, ensure you have:
- [ ] Active Apple Developer Program membership
- [ ] Apple ID and Team ID ready
- [ ] Stable internet connection (builds are large)
- [ ] 2-3 hours of available time
- [ ] Access to goalstreak.co domain (for privacy policy)

**🎉 You're ready to launch GoalStreak on the iOS App Store!**

---

## 📊 Expected Timeline Summary

| Phase | Duration | Activity |
|-------|----------|----------|
| Setup | 30 min | Credentials and validation |
| App Store Connect | 20 min | Create app and configure |
| Build & Submit | 45-90 min | Automated build and upload |
| App Store Config | 30 min | Complete listing |
| Apple Review | 1-7 days | Apple's review process |
| **Total** | **2-3 hours + review time** | **Complete process** |

**Start to finish:** 2-3 hours of active work + 1-7 days for Apple review.
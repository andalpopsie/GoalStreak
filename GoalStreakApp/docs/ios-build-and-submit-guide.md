# iOS Production Build and App Store Submission Guide

## Prerequisites Setup

Before running the production build, you need to configure your Apple Developer credentials.

### Step 1: Configure EAS Credentials

Run the credential setup script:
```bash
npm run ios:setup-credentials
```

This will prompt you for:
- **Apple ID**: Your Apple Developer account email
- **Apple Team ID**: Found in Apple Developer Portal > Account > Membership
- **App Store Connect App ID**: Generated when you create the app in App Store Connect

### Step 2: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click "My Apps" > "+" > "New App"
4. Fill in:
   - **Platform**: iOS
   - **Name**: GoalStreak
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.goalstreak.app
   - **SKU**: goalstreak-ios-app
5. Click "Create"
6. Copy the App Store Connect App ID (10-digit number) from App Information

### Step 3: Update EAS Configuration

If you didn't enter the App Store Connect App ID during setup, update it manually:
1. Edit `eas.json`
2. Replace `[APP_STORE_CONNECT_APP_ID]` with your actual App ID
3. Save the file

## Production Build Process

### Step 1: Final Validation
```bash
npm run ios:validate
```

Ensure all critical issues are resolved before proceeding.

### Step 2: Generate App Store Connect Configuration
```bash
npm run ios:configure-app-store
```

This creates detailed guides for App Store Connect setup.

### Step 3: Build and Submit
```bash
npm run ios:build-and-submit
```

This will:
1. Run pre-build validation
2. Create iOS production build via EAS
3. Submit to App Store Connect
4. Set up monitoring checklist

## Alternative: Manual Process

If the automated script fails, you can run each step manually:

### Manual Build
```bash
npm run build:production:ios
```

### Manual Submission
```bash
npm run submit:ios
```

## App Store Connect Configuration

After the build is uploaded, complete your App Store Connect listing:

### Required Information
- **App Name**: GoalStreak
- **Subtitle**: Social Habit Tracking
- **Description**: Use the optimized description from `app-store-assets/metadata/ios-metadata.json`
- **Keywords**: Use the keywords from the metadata file
- **Screenshots**: Upload from `app-store-assets/real-screenshots/ios/`
- **App Icon**: Will be included in the build
- **Privacy Policy URL**: https://goalstreak.co/privacy
- **Support URL**: https://goalstreak.co/support

### Age Rating
- **Rating**: 4+
- **Content Advisories**: All set to "None" except:
  - Social Networking: Infrequent/Mild
  - User Generated Content: Infrequent/Mild

### App Review Information
- Provide contact information for Apple reviewers
- No demo account required
- Include testing notes from the metadata

## Monitoring Submission

### Review Process
1. **Submission**: App enters Apple's review queue
2. **In Review**: Apple tests your app (1-7 days typically)
3. **Approved/Rejected**: You'll receive email notification

### Key Actions
- Check App Store Connect daily for status updates
- Respond quickly to any Apple reviewer feedback
- Monitor crash reports and performance metrics
- Prepare marketing materials for launch

## Troubleshooting

### Common Issues
- **Build Failures**: Check EAS Build dashboard for detailed logs
- **Credential Issues**: Verify Apple Developer account access
- **Metadata Rejection**: Ensure screenshots match app functionality
- **Privacy Issues**: Verify privacy policy is comprehensive and accessible

### Resources
- **EAS Build Dashboard**: https://expo.dev
- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer Portal**: https://developer.apple.com
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/

## Success Metrics

### Target Goals
- **Approval Time**: Within 7 days of submission
- **Initial Downloads**: 100+ in first week
- **User Rating**: Maintain 4.5+ stars
- **Crash Rate**: <1% crash-free sessions

### Post-Launch
- Monitor user reviews and feedback
- Track App Store search performance
- Plan first update based on user feedback
- Prepare Android launch based on iOS learnings

---

**Ready to proceed?** Run `npm run ios:validate` to check your setup, then `npm run ios:build-and-submit` to start the process!
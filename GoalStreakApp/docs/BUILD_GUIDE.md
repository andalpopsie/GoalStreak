# GoalStreak Build Guide

## Overview
This guide covers the production build configuration for GoalStreak, including environment setup, EAS Build configuration, and app store submission preparation.

## Environment Configuration

### Environment Files
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

### Required Environment Variables
```bash
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_DEBUG_MODE=false
```

## EAS Build Configuration

### Build Profiles
- `development` - Development builds with debug enabled
- `preview` - Staging builds for internal testing
- `production` - Production builds for app store submission
- `production-ios` - iOS-specific production builds
- `production-android` - Android-specific production builds

### Build Commands
```bash
# Development build
npm run build:development

# Preview/staging build
npm run build:preview

# Production builds
npm run build:production          # Both platforms
npm run build:production:ios      # iOS only
npm run build:production:android  # Android only
```

## Pre-Build Validation

### Validation Script
Run the validation script before building:
```bash
npm run validate:build
```

This validates:
- Environment files exist and contain required variables
- app.json has all required fields
- eas.json has proper build profiles
- Required assets are present

### Manual Validation Checklist
- [ ] All environment variables configured
- [ ] Firebase project configured for production
- [ ] App icons and splash screens ready
- [ ] Bundle identifiers match app store registrations
- [ ] Version numbers updated
- [ ] Privacy policy and terms of service accessible

## App Store Configuration

### iOS App Store
- Bundle Identifier: `com.goalstreak.app`
- App Store Connect setup required
- Provisioning profiles and certificates needed
- Privacy usage descriptions included

### Google Play Store
- Package Name: `com.goalstreak.app`
- Google Play Console setup required
- Service account key for automated submission
- Required permissions declared

## Build Process

### Step 1: Pre-Build Setup
```bash
# Install dependencies
npm install

# Validate configuration
npm run validate:build

# Run tests
npm run test:ci

# Type check
npm run type-check

# Lint code
npm run lint
```

### Step 2: Build for Production
```bash
# Build for both platforms
npm run build:production

# Or build individually
npm run build:production:ios
npm run build:production:android
```

### Step 3: Submit to App Stores
```bash
# Submit to both stores
npm run submit:production

# Or submit individually
npm run submit:ios
npm run submit:android
```

## Environment-Specific Features

### Production Environment
- Analytics enabled
- Debug mode disabled
- Error reporting enabled
- Performance monitoring active
- Optimized bundle size

### Development Environment
- Analytics disabled
- Debug mode enabled
- Detailed error logging
- Hot reloading enabled
- Development tools available

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use EAS Secrets for sensitive data in CI/CD
- Validate all environment variables before build

### Firebase Security
- Production Firebase project with proper security rules
- API keys restricted to specific domains/apps
- User data properly protected

### App Store Security
- Code signing certificates properly configured
- App Transport Security (ATS) enabled for iOS
- Proper permissions requested and justified

## Troubleshooting

### Common Build Issues
1. **Missing Environment Variables**
   - Run `npm run validate:build` to identify missing variables
   - Check `.env.production` file exists and is complete

2. **Firebase Configuration Errors**
   - Verify Firebase project settings
   - Check API keys and project IDs match

3. **Asset Issues**
   - Ensure all required assets are present in `assets/` folder
   - Verify icon sizes and formats are correct

4. **EAS Build Failures**
   - Check EAS Build logs for specific errors
   - Verify build profiles in `eas.json` are correct
   - Ensure dependencies are properly installed

### Build Validation Failures
If validation fails, check:
- Environment files exist and contain all required variables
- app.json has proper bundle identifiers and metadata
- eas.json has all required build profiles
- All required assets are present

## Monitoring and Analytics

### Production Monitoring
- Firebase Crashlytics for crash reporting
- Firebase Analytics for user behavior
- Performance monitoring enabled
- Error tracking and alerting

### Build Metrics
- Build time and success rate
- Bundle size optimization
- Performance benchmarks
- User adoption metrics

## Next Steps After Build

1. **App Store Submission**
   - Upload builds to App Store Connect / Google Play Console
   - Configure store listings with metadata and screenshots
   - Submit for review

2. **Post-Launch Monitoring**
   - Monitor crash reports and user feedback
   - Track key performance indicators
   - Plan updates and improvements

3. **Continuous Deployment**
   - Set up automated builds for future releases
   - Implement proper versioning strategy
   - Configure release management workflow

## Support and Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Firebase Configuration Guide](https://firebase.google.com/docs/web/setup)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Console Guide](https://support.google.com/googleplay/android-developer/)

For additional support, refer to the project documentation or contact the development team.
---
inclusion: on-demand
---

# GoalStreak Deployment Guide

## Environment Configuration

### File Locations (Root Directory ONLY)
```
GoalStreakApp/
├── .env                 # Main environment
├── .env.development     # Development
└── .env.production      # Production
```

### Environment Variables
```bash
# .env.production
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=goalstreak-app2.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=goalstreak-app2
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=goalstreak-app2.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=233571046472
EXPO_PUBLIC_FIREBASE_APP_ID=1:233571046472:web:...
EXPO_PUBLIC_API_BASE_URL=https://api.goalstreak.co
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_DEBUG_MODE=false
```

## Build Process

### Pre-Build Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Firebase projects set up
- [ ] Version numbers updated
- [ ] App Store assets prepared

### Build Commands
```bash
# Development
eas build --profile development --platform all

# Production iOS
eas build --profile production-ios --platform ios

# Production Android
eas build --profile production-android --platform android
```

### Build Number Management
```bash
# Check sync
npm run sync-build-number

# Auto-increment (updates 3 files)
npm run increment-build

# MUST commit before building
git add . && git commit -m "Build X"

# Then build
npm run build:production:ios
```

## Firebase Deployment

### Projects Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Set up projects
firebase use goalstreak-dev --alias development
firebase use goalstreak-app2 --alias production
```

### Security Rules
```javascript
// firestore.rules - Essential rules only
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - own data only
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Habits - own habits only
    match /habits/{habitId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Friends - bidirectional access
    match /friends/{friendId} {
      allow read: if request.auth.uid == resource.data.userId 
        || request.auth.uid == resource.data.friendId;
      allow write: if request.auth.uid == resource.data.userId;
    }
    
    // Activities - friends can read shared
    match /activities/{activityId} {
      allow read: if request.auth.uid == resource.data.userId
        || resource.data.visibility == 'public';
      allow write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### Deploy Rules
```bash
# Deploy to production
firebase use production
firebase deploy --only firestore:rules,storage
```

## iOS App Store Submission

### Required Assets
```
Assets/
├── icon.png (1024x1024)
├── splash.png (1242x2688)
└── screenshots/
    ├── iphone-6.5/ (1284x2778)
    └── ipad-12.9/ (2048x2732)
```

### App Store Metadata
```typescript
{
  name: "GoalStreak",
  subtitle: "Social Habit Tracking",
  description: "Build lasting habits with friends...",
  keywords: "habits,goals,productivity,tracking,streaks",
  category: "Health & Fitness",
  contentRating: "4+",
  privacyPolicyUrl: "https://goalfer.app/privacy",
  supportUrl: "https://goalfer.app/support"
}
```

### Submission Process
```bash
# Build for iOS
eas build --profile production-ios --platform ios

# Submit to App Store
eas submit --profile production --platform ios
```

## Android Play Store Submission

### Submission Process
```bash
# Build for Android
eas build --profile production-android --platform android

# Submit to Play Store
eas submit --profile production --platform android
```

## Monitoring & Analytics

### Crash Reporting
```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// Initialize
crashlytics().setCrashlyticsCollectionEnabled(true);

// Log errors
crashlytics().recordError(error);
```

### Performance Monitoring
```typescript
import perf from '@react-native-firebase/perf';

const trace = perf().newTrace('screen_load');
await trace.start();
// ... operation
await trace.stop();
```

### Analytics
```typescript
import analytics from '@react-native-firebase/analytics';

// Track events
await analytics().logEvent('habit_completed', {
  habit_id: habitId,
  category: category
});

// Track screens
await analytics().logScreenView({
  screen_name: screenName
});
```

## Rollback Strategy

### Emergency Rollback
1. **Immediate**: Disable features via remote config
2. **App Store**: Remove version, promote previous
3. **Firebase**: Revert security rules if needed

### Version Management
```typescript
// Semantic versioning: MAJOR.MINOR.PATCH (BUILD)
// Example: 1.2.3 (45)
{
  major: 1,    // Breaking changes
  minor: 0,    // New features
  patch: 0,    // Bug fixes
  build: 1     // Auto-increment
}
```

## Post-Deployment Checklist

### Immediate (0-24 hours)
- [ ] Monitor crash reports
- [ ] Check app store status
- [ ] Verify analytics tracking
- [ ] Monitor user feedback
- [ ] Check Firebase usage
- [ ] Verify features working

### Short-term (1-7 days)
- [ ] Analyze user adoption
- [ ] Review crash-free rates
- [ ] Monitor social features
- [ ] Check completion rates
- [ ] Review app store ratings

### Long-term (1-4 weeks)
- [ ] Analyze engagement trends
- [ ] Review feature usage
- [ ] Plan next iteration
- [ ] Optimize performance
- [ ] Plan growth strategies

## Common Issues

### Build Failures
```bash
# Clear EAS cache
eas build:clear-cache

# Clear local cache
rm -rf .expo node_modules/.cache
npm install
```

### Environment Issues
```bash
# Verify environment
echo $EXPO_PUBLIC_ENVIRONMENT

# Check Firebase config
cat .env.production | grep FIREBASE
```

### Version Sync Issues
```bash
# Check sync
npm run sync-build-number

# Force sync
npm run increment-build
git add . && git commit -m "Sync build numbers"
```

---

**Remember**: Always commit before building. Build numbers must match across 3 files.

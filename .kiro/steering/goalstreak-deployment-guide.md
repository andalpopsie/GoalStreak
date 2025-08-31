# GoalStreak Deployment Guide

## Deployment Overview
Comprehensive deployment strategy for GoalStreak, covering development, staging, and production environments. This guide ensures smooth, secure, and reliable app store releases.

## Environment Configuration

### Development Environment
```typescript
// .env.development
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDev_API_Key_Here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=goalstreak-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=goalstreak-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=goalstreak-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:dev_app_id
EXPO_PUBLIC_API_BASE_URL=https://api-dev.goalstreak.com
EXPO_PUBLIC_ANALYTICS_ENABLED=false
EXPO_PUBLIC_DEBUG_MODE=true
```

### Staging Environment
```typescript
// .env.staging
EXPO_PUBLIC_ENVIRONMENT=staging
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyStaging_API_Key_Here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=goalstreak-staging.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=goalstreak-staging
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=goalstreak-staging.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=987654321
EXPO_PUBLIC_FIREBASE_APP_ID=1:987654321:web:staging_app_id
EXPO_PUBLIC_API_BASE_URL=https://api-staging.goalstreak.com
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_DEBUG_MODE=false
```

### Production Environment
```typescript
// .env.production
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyProd_API_Key_Here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=goalstreak-app2.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=goalstreak-app2
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=goalstreak-app2.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=233571046472
EXPO_PUBLIC_FIREBASE_APP_ID=1:233571046472:web:020727b78eec425fd0347d
EXPO_PUBLIC_API_BASE_URL=https://api.goalstreak.com
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_DEBUG_MODE=false
```

## EAS Build Configuration

### EAS Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "ENVIRONMENT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "ENVIRONMENT": "staging"
      }
    },
    "production": {
      "env": {
        "ENVIRONMENT": "production"
      }
    },
    "production-ios": {
      "extends": "production",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production-android": {
      "extends": "production",
      "android": {
        "resourceClass": "medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### App Configuration (app.json)
```json
{
  "expo": {
    "name": "GoalStreak",
    "slug": "goalstreak",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#4ECDC4"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.goalstreak.app",
      "buildNumber": "1",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "NSUserTrackingUsageDescription": "This app uses analytics to improve your experience and provide personalized insights.",
        "NSCameraUsageDescription": "Camera access is used for profile pictures (optional).",
        "NSPhotoLibraryUsageDescription": "Photo library access is used for profile pictures (optional)."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4ECDC4"
      },
      "package": "com.goalstreak.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/your-eas-project-id"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

## Build Process

### Pre-Build Checklist
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code coverage meets threshold (80%+)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Environment variables configured
- [ ] Firebase projects set up correctly
- [ ] App Store assets prepared
- [ ] Version numbers updated

### Build Commands
```bash
# Development build
eas build --profile development --platform all

# Staging build
eas build --profile preview --platform all

# Production builds
eas build --profile production-ios --platform ios
eas build --profile production-android --platform android

# Build for both platforms
eas build --profile production --platform all
```

### Build Optimization
```typescript
// metro.config.js - Bundle optimization
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable tree shaking
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimize bundle size
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: true,
    quote_keys: true,
    wrap_iife: true,
  },
  sourceMap: {
    includeSources: false,
  },
  toplevel: false,
  compress: {
    reduce_funcs: false,
  },
};

module.exports = config;
```

## Firebase Deployment

### Firebase Projects Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase projects
firebase projects:list

# Set up development project
firebase use goalstreak-dev --alias development

# Set up staging project  
firebase use goalstreak-staging --alias staging

# Set up production project
firebase use goalstreak-app2 --alias production
```

### Firestore Security Rules Deployment
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Habits - users can only access their own habits
    match /habits/{habitId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Completions - users can only access their own completions
    match /completions/{completionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Streaks - users can only access their own streaks
    match /streaks/{streakId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Friends - bidirectional access for friendship management
    match /friends/{friendId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.friendId == request.auth.uid);
      allow write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Friend requests - users can read requests sent to them or by them
    match /friendRequests/{requestId} {
      allow read: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
      allow write: if request.auth != null && 
        resource.data.fromUserId == request.auth.uid;
    }
    
    // Activities - friends can read shared activities
    match /activities/{activityId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.visibility == 'public' ||
         (resource.data.visibility == 'friends' && 
          exists(/databases/$(database)/documents/friends/$(request.auth.uid + '_' + resource.data.userId))));
      allow write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // User profiles - public read, own write
    match /userProfiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Social settings - users can only access their own settings
    match /socialSettings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Storage Rules
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile pictures
    match /users/{userId}/profile/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024 // 5MB limit
        && request.resource.contentType.matches('image/.*');
    }
    
    // App assets (public read)
    match /assets/{allPaths=**} {
      allow read: if true;
      allow write: if false; // Only admin can write assets
    }
  }
}
```

### Deploy Firebase Configuration
```bash
# Deploy to development
firebase use development
firebase deploy --only firestore:rules,storage

# Deploy to staging
firebase use staging
firebase deploy --only firestore:rules,storage

# Deploy to production
firebase use production
firebase deploy --only firestore:rules,storage
```

## App Store Deployment

### iOS App Store Preparation

#### Required Assets
```
Assets/
├── icon.png (1024x1024)
├── adaptive-icon.png (1024x1024)
├── splash.png (1242x2688)
├── favicon.png (32x32)
└── screenshots/
    ├── iphone-6.5/
    │   ├── screenshot-1.png (1284x2778)
    │   ├── screenshot-2.png (1284x2778)
    │   └── screenshot-3.png (1284x2778)
    ├── iphone-5.5/
    │   ├── screenshot-1.png (1242x2208)
    │   └── screenshot-2.png (1242x2208)
    └── ipad-12.9/
        ├── screenshot-1.png (2048x2732)
        └── screenshot-2.png (2048x2732)
```

#### App Store Connect Configuration
```typescript
// App Store metadata
const appStoreMetadata = {
  name: "GoalStreak",
  subtitle: "Social Habit Tracking",
  description: `Build lasting habits with friends using streak tracking, social accountability, and powerful analytics. Your social habit companion for achieving goals together.

KEY FEATURES:
• Track daily habits with beautiful circular progress indicators
• Build streaks and celebrate milestones
• Connect with friends for accountability and motivation
• Share progress and react to friends' achievements
• Comprehensive analytics and insights
• 39+ habit categories with custom icons
• Offline support with real-time sync

SOCIAL ACCOUNTABILITY:
• Add friends by email invitation
• Real-time activity feed with habit completions
• Emoji reactions (❤️, 🔥, 🏅) to encourage friends
• Privacy controls for habit sharing
• Friend request management

ANALYTICS & INSIGHTS:
• Progress charts and trend analysis
• Streak statistics and personal records
• Weekly and monthly summaries
• Achievement tracking and milestones

Perfect for building healthy routines in fitness, wellness, productivity, and personal growth. Join thousands of users achieving their goals together!`,
  keywords: "habits,goals,productivity,tracking,streaks,motivation,social,friends,accountability,wellness,fitness,mindfulness",
  category: "Health & Fitness",
  contentRating: "4+",
  privacyPolicyUrl: "https://goalstreak.com/privacy",
  supportUrl: "https://goalstreak.com/support"
};
```

#### iOS Submission Process
```bash
# Build for iOS App Store
eas build --profile production-ios --platform ios

# Submit to App Store Connect
eas submit --profile production --platform ios

# Or manual submission
# 1. Download .ipa from EAS Build
# 2. Upload via Xcode or Application Loader
# 3. Configure metadata in App Store Connect
# 4. Submit for review
```

### Android Play Store Preparation

#### Play Store Metadata
```typescript
const playStoreMetadata = {
  title: "GoalStreak - Social Habit Tracker",
  shortDescription: "Build lasting habits with friends. Track streaks, share progress, and achieve goals together.",
  fullDescription: `🎯 BUILD LASTING HABITS WITH FRIENDS

GoalStreak is the social habit tracking app that helps you build lasting routines through accountability, motivation, and community support.

✨ KEY FEATURES:
• Beautiful habit tracking with circular progress indicators
• Streak counting and milestone celebrations
• 39+ habit categories with custom icons
• Comprehensive analytics and insights
• Offline support with real-time sync

👥 SOCIAL ACCOUNTABILITY:
• Connect with friends for mutual motivation
• Real-time activity feed with habit completions
• Emoji reactions to encourage friends
• Privacy controls for habit sharing
• Friend request management system

📊 ANALYTICS & INSIGHTS:
• Progress charts and trend analysis
• Streak statistics and personal records
• Weekly and monthly progress summaries
• Achievement tracking and milestones

🏆 PERFECT FOR:
• Fitness and workout routines
• Wellness and mindfulness practices
• Productivity and learning goals
• Creative and personal projects
• Daily self-care habits

Join thousands of users who are achieving their goals together with GoalStreak!

🔒 PRIVACY FIRST:
• Your data is secure and encrypted
• Granular privacy controls
• No ads or data selling
• GDPR compliant

Download GoalStreak today and start building the habits that will transform your life!`,
  category: "Health & Fitness",
  contentRating: "Everyone",
  tags: ["habits", "goals", "productivity", "social", "wellness"]
};
```

#### Android Submission Process
```bash
# Build for Google Play Store
eas build --profile production-android --platform android

# Submit to Google Play Console
eas submit --profile production --platform android

# Or manual submission
# 1. Download .aab from EAS Build
# 2. Upload to Google Play Console
# 3. Configure store listing
# 4. Submit for review
```

## Continuous Deployment Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to App Stores

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run lint
      - run: npm run type-check

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Setup Expo CLI
        run: npm install -g @expo/cli
      
      - name: Setup EAS CLI
        run: npm install -g eas-cli
      
      - name: Login to Expo
        run: eas login
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build for iOS
        run: eas build --profile production-ios --platform ios --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build for Android
        run: eas build --profile production-android --platform android --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Submit to App Stores
        run: |
          eas submit --profile production --platform ios --non-interactive
          eas submit --profile production --platform android --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          EXPO_APPLE_ID: ${{ secrets.EXPO_APPLE_ID }}
          EXPO_APPLE_PASSWORD: ${{ secrets.EXPO_APPLE_PASSWORD }}
```

## Monitoring & Analytics

### Production Monitoring Setup
```typescript
// monitoring/crashlytics.ts
import crashlytics from '@react-native-firebase/crashlytics';

export const initializeCrashlytics = () => {
  if (__DEV__) {
    crashlytics().setCrashlyticsCollectionEnabled(false);
    return;
  }
  
  crashlytics().setCrashlyticsCollectionEnabled(true);
  
  // Set user identifier for crash reports
  crashlytics().setUserId('user-id');
  
  // Log non-fatal errors
  crashlytics().recordError(new Error('Non-fatal error'));
};

// Custom crash logging
export const logError = (error: Error, context?: string) => {
  console.error('Error:', error, 'Context:', context);
  
  if (!__DEV__) {
    crashlytics().recordError(error);
    if (context) {
      crashlytics().log(context);
    }
  }
};
```

### Performance Monitoring
```typescript
// monitoring/performance.ts
import perf from '@react-native-firebase/perf';

export const trackScreenTransition = async (screenName: string) => {
  const trace = perf().newTrace(`screen_${screenName}`);
  await trace.start();
  
  return {
    stop: () => trace.stop()
  };
};

export const trackHabitCompletion = async () => {
  const trace = perf().newTrace('habit_completion');
  await trace.start();
  
  return {
    stop: () => trace.stop()
  };
};
```

### Analytics Setup
```typescript
// monitoring/analytics.ts
import analytics from '@react-native-firebase/analytics';

export const trackEvent = async (eventName: string, parameters?: object) => {
  if (!__DEV__) {
    await analytics().logEvent(eventName, parameters);
  }
};

export const trackScreenView = async (screenName: string) => {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenName
  });
};

export const setUserProperties = async (properties: object) => {
  await analytics().setUserProperties(properties);
};
```

## Rollback Strategy

### Emergency Rollback Process
1. **Immediate Actions**:
   - Disable problematic features via remote config
   - Revert to previous stable build
   - Communicate with users via in-app messaging

2. **App Store Rollback**:
   - iOS: Remove current version from sale, promote previous version
   - Android: Halt rollout, promote previous version

3. **Firebase Rollback**:
   - Revert Firestore security rules if needed
   - Restore database from backup if necessary
   - Update Firebase configuration

### Version Management
```typescript
// Version control strategy
const versionConfig = {
  major: 1,    // Breaking changes
  minor: 0,    // New features
  patch: 0,    // Bug fixes
  build: 1     // Build number (auto-increment)
};

// Semantic versioning: MAJOR.MINOR.PATCH (BUILD)
// Example: 1.2.3 (45)
```

## Post-Deployment Checklist

### Immediate Post-Launch (0-24 hours)
- [ ] Monitor crash reports and error rates
- [ ] Check app store review status
- [ ] Verify analytics and tracking
- [ ] Monitor user feedback and reviews
- [ ] Check Firebase usage and costs
- [ ] Verify all features working correctly
- [ ] Monitor performance metrics

### Short-term Monitoring (1-7 days)
- [ ] Analyze user adoption and retention
- [ ] Review crash-free session rates
- [ ] Monitor social feature usage
- [ ] Check habit completion rates
- [ ] Analyze user feedback patterns
- [ ] Review app store ratings and reviews

### Long-term Monitoring (1-4 weeks)
- [ ] Analyze user engagement trends
- [ ] Review feature usage analytics
- [ ] Plan next iteration based on feedback
- [ ] Optimize based on performance data
- [ ] Plan marketing and growth strategies

Remember: Deployment is not the end, but the beginning of the product lifecycle. Continuous monitoring and improvement are essential for long-term success.
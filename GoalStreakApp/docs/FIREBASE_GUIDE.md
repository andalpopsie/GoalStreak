# GoalStreak Firebase Configuration & Troubleshooting Guide

## 🎯 Overview

This guide covers Firebase configuration, index management, and common troubleshooting for the GoalStreak app. It consolidates information from multiple Firebase-related fixes and optimizations.

## 🔧 Firebase Configuration

### Environment Setup
Firebase configuration is loaded from environment variables in the root directory:

```bash
# .env.production (root directory)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=goalstreak-app2.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=goalstreak-app2
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=goalstreak-app2.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=233571046472
EXPO_PUBLIC_FIREBASE_APP_ID=1:233571046472:web:020727b78eec425fd0347d
```

### Configuration Loading
The app uses a resilient configuration loading system with fallbacks:

```typescript
// Enhanced config with multiple fallback sources
const firebaseConfig = {
  apiKey: config.firebase.apiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: config.firebase.authDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  // ... other config values with fallbacks
};
```

## 🗂️ Firestore Indexes

### Current Index Configuration
All required indexes have been deployed to production. The following composite indexes are active:

#### **Habits Collection**
```json
{
  "collectionGroup": "habits",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

#### **Completions Collection**
```json
{
  "collectionGroup": "completions",
  "queryScope": "COLLECTION", 
  "fields": [
    { "fieldPath": "habitId", "order": "ASCENDING" },
    { "fieldPath": "completedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "completions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "completedAt", "order": "DESCENDING" }
  ]
}
```

#### **Social Features Indexes**
```json
{
  "collectionGroup": "friends",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "friendRequests",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "toUserId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "friendRequests",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "fromUserId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

#### **Activities Collection**
```json
{
  "collectionGroup": "activities",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "activities",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "visibility", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

#### **Timer States Collection**
```json
{
  "collectionGroup": "timerStates",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "lastUpdate", "order": "ASCENDING" }
  ]
}
```

## 🔧 Index Management

### Project Structure & `.firebaserc`

The repo has **two** Firebase config files with different responsibilities:

| File | Purpose |
|---|---|
| `GoalStreakApp/firebase.json` | **Root-level** — used for `firebase deploy` (functions + rules + indexes + emulators). Source of truth for full deploys. |
| `GoalStreakApp/firebase/firebase.json` | **Rules/indexes only** — used when deploying just Firestore rules or indexes from the `firebase/` subdirectory. Does NOT contain a functions block. |

`GoalStreakApp/.firebaserc` pins the default alias:
```json
{
  "projects": {
    "default": "goalstreak-app2"
  }
}
```

Use `firebase use <alias>` before deploying if you need to switch projects.

### Deploying Rules
```bash
# From GoalStreakApp/ (root) — deploys rules to the default project
firebase deploy --only firestore:rules

# Or explicitly target development
firebase deploy --only firestore:rules --project goalstreak-app
```

### Deploying Functions
```bash
# From GoalStreakApp/ (root — must have firebase.json with functions source)
cd GoalStreakApp
npm run build --prefix functions   # compile TypeScript
firebase deploy --only functions

# Provision the RevenueCat secret before first deploy (one-time)
firebase functions:secrets:set REVENUECAT_SECRET_KEY
# Paste the sk_... key from RevenueCat → Project Settings → API Keys → Secret keys

# After provisioning or rotating the secret, redeploy to pick up the new version
firebase deploy --only functions
```

### Deploying Indexes
```bash
# Install Firebase CLI locally
npm install firebase-tools --save-dev

# Verify project connection
npx firebase projects:list

# Deploy indexes from firebase/ directory
npx firebase deploy --only firestore:indexes
```

### Index Best Practices
1. **Query-First Design**: Design indexes based on actual query patterns
2. **Field Order Matching**: Ensure index fields match query field order exactly
3. **Regular Monitoring**: Monitor Firebase console for index warnings
4. **Deployment Testing**: Test indexes in development before production

### Consistent Query Patterns
```typescript
// ✅ Good: Query pattern matches index
query(
  collection,
  where('userId', '==', userId),     // Index field 1
  where('status', '==', 'accepted'), // Index field 2
  orderBy('createdAt', 'desc')       // Index field 3
)

// ❌ Bad: Query pattern doesn't match index order
query(
  collection,
  where('status', '==', 'accepted'), // Wrong order
  where('userId', '==', userId),     // Wrong order
  orderBy('createdAt', 'desc')
)
```

## 🛡️ Security Rules

### Firestore Security Rules
```javascript
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
    
    // Friends - bidirectional access for friendship management
    match /friends/{friendId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.friendId == request.auth.uid);
      allow write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
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
  }
}
```

> **Note**: The rules above are a simplified overview. The authoritative rules live in . Always read that file for the full picture — the doc snapshot can drift.

### Founding Member Collections (added Jan 2025)
Two server-authoritative collections were added as part of the Founding Member program. Clients cannot write to either; only the Admin SDK (Cloud Functions) can.

| Collection | Read | Write | Purpose |
|---|---|---|---|
| `counters/foundingMembers` | Public (unauthenticated) | Admin SDK only | Scarcity counter for landing page |
| `config/foundingMembers` | Authenticated users | Admin SDK only | Operator config (T0 launch timestamp, cap) |

The `userProfiles/{uid}` write rule was also updated to block client writes to `foundingMember`, `foundingNumber`, and `foundingRecord` — these fields are set exclusively by the Cloud Function via the Admin SDK.

### Cloud Functions (added Jan 2025)

The Founding Member program introduced the repository's first Cloud Functions project at `GoalStreakApp/functions/`. Two functions are exported:

| Function | Trigger | Purpose |
|---|---|---|
| `onUserCreated` | `auth.user().onCreate` | Evaluates eligibility, atomically claims a founding slot, grants RevenueCat Pro |
| `reconcilePendingGrants` | `pubsub.schedule(every 6 hours)` | Retries any Pro grants that failed during `onUserCreated` |

**Atomic claim logic** (`functions/src/founding/claim.ts`): A single Firestore transaction reads `counters/foundingMembers.claimed`, assigns `number = claimed + 1`, increments the counter, and writes the `foundingRecord` to `userProfiles/{uid}` — all in one transaction so concurrent last-slot races are handled by Firestore's optimistic locking. The counter is monotonically non-decreasing; it is never decremented (not on deletion, not on grant failure).

**Secrets**: `REVENUECAT_SECRET_KEY` is stored in Firebase Secret Manager and bound only to the two functions above. It is never in the app bundle or landing page.

**Required index** (Task 27): `userProfiles` collection, field `foundingRecord.proGrantStatus ASC` — needed by the reconciler query.

## 🚨 Common Issues & Solutions

### Issue 1: Environment Configuration Loading
**Problem**: App crashes with "Missing required environment variables"
**Solution**: Enhanced configuration loading with fallbacks (see Configuration Loading section)

### Issue 2: Firebase Index Warnings
**Problem**: "The query requires an index" warnings in development
**Solution**: Deploy proper composite indexes matching query patterns exactly

### Issue 3: Social Features Not Working
**Problem**: Friends list, activity feed, or friend requests failing
**Solution**: Ensure all social feature indexes are deployed with correct field ordering

### Issue 4: Timer Cleanup Errors
**Problem**: Timer state cleanup operations failing
**Solution**: Deploy timerStates composite index (userId + lastUpdate)

## 📊 Performance Optimization

### Query Performance
- **Before Indexes**: O(n) collection scans (very slow)
- **After Indexes**: O(log n) indexed queries (optimal)
- **Cost Efficiency**: Minimal read operations with efficient indexes

### Monitoring
- **Firebase Console**: Regular checks for new index requirements
- **Performance Metrics**: Track query performance and costs
- **Index Health**: Monitor index usage and effectiveness

## 🔍 Troubleshooting Checklist

### Configuration Issues
- [ ] Environment variables are set in root directory
- [ ] Firebase project ID matches environment
- [ ] All required Firebase services are enabled
- [ ] API keys have proper permissions

### Index Issues
- [ ] All required indexes are deployed
- [ ] Index field order matches query patterns
- [ ] No unused indexes consuming resources
- [ ] Firebase console shows no index warnings

### Security Issues
- [ ] Security rules are deployed
- [ ] User authentication is working
- [ ] Data access permissions are correct
- [ ] No unauthorized data access

### Performance Issues
- [ ] Queries use proper indexes
- [ ] No full collection scans
- [ ] Firestore usage is within limits
- [ ] Real-time listeners are properly managed

---

**Status**: ✅ All Firebase services optimized and production-ready
**Last Updated**: January 2026 (Cloud Functions live — Tasks 11–14 complete; root-level firebase.json + .firebaserc added; deploy structure documented)
**Next Review**: Monitor performance metrics post-launch
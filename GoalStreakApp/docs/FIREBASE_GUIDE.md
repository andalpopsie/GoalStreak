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
**Last Updated**: January 2025
**Next Review**: Monitor performance metrics post-launch
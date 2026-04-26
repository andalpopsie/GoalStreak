# Firebase Power

Connect your AI assistant to Firebase services for real-time database operations, authentication management, storage access, and more.

## Overview

This power integrates the **Official Google Firebase MCP Server** with Kiro, enabling AI-assisted Firebase development. It uses your Firebase CLI credentials to interact with your Firebase projects directly.

## Keywords

firebase, firestore, database, auth, authentication, storage, cloud-functions, fcm, messaging, crashlytics, remote-config, realtime-database, nosql

## Prerequisites

Before using this power, ensure you have:

1. **Firebase CLI installed**: `npm install -g firebase-tools`
2. **Logged into Firebase**: `firebase login`
3. **A Firebase project**: Either existing or create one via the MCP

## Capabilities

### Firestore Database
- Query and retrieve documents
- Delete documents
- List collections
- Filter with complex queries

### Authentication
- Get user information by UID or email
- Update user accounts (enable/disable)
- Set custom claims
- Configure SMS region policies

### Cloud Storage
- Get download URLs for files

### Cloud Functions
- Retrieve function logs

### Remote Config
- Get and update configuration templates
- Rollback to previous versions

### Crashlytics
- View crash reports and issues
- Add/delete notes on issues
- List crash events with stack traces

### Cloud Messaging (FCM)
- Send messages to tokens or topics

### Realtime Database
- Get and set data at paths

### Project Management
- List and create projects
- Register apps (iOS, Android, Web)
- Get SDK configuration
- Validate security rules

## GoalStreak Project Context

This power is configured for the GoalStreak habit tracking app with the following Firestore collections:

```
users/{userId}           - User accounts
userProfiles/{userId}    - Extended profile data
habits/{habitId}         - Habit definitions
completions/{completionId} - Completion records
streaks/{habitId}        - Streak data
friends/{friendshipId}   - Friend relationships
friendRequests/{requestId} - Pending requests
activities/{activityId}  - Social activity feed
socialSettings/{userId}  - Privacy settings
timerSessions/{sessionId} - Timer data
timerStates/{stateId}    - Cross-device sync
```

## Common Tasks

### Query User's Habits
"List all documents in the habits collection where userId equals [user-id]"

### Check Firestore Security Rules
"Validate my Firestore security rules for syntax errors"

### Get User Authentication Info
"Get the Firebase Auth user with email user@example.com"

### View Crashlytics Issues
"Show me the top crashlytics issues for my app"

### Deploy Configuration
"Help me deploy my Firebase resources"

## Tips

- Use `firebase login` in terminal if authentication expires
- The MCP uses your CLI credentials - no service account needed
- For production data, always test queries on development first
- Security rules validation helps catch issues before deployment

---
inclusion: on-demand
---

# GoalStreak Directory Structure

## Project Organization

```
GoalStreak/
├── GoalStreakApp/                        # Main React Native application
│   ├── src/                             # Source code
│   │   ├── components/                  # Reusable UI components
│   │   ├── screens/                     # Screen components
│   │   ├── services/                    # Firebase & API services
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── utils/                       # Utility functions
│   │   ├── types/                       # TypeScript definitions
│   │   ├── constants/                   # Theme, limits, configs
│   │   └── navigation/                  # Navigation configuration
│   ├── assets/                          # App assets (icons, images)
│   ├── ios/                             # iOS native code
│   ├── android/                         # Android native code
│   ├── scripts/                         # Build and utility scripts
│   ├── firebase/                        # Firebase configuration
│   │   ├── firebase.json                # Firebase project config (emulators, rules paths)
│   │   ├── firestore.rules              # Firestore security rules
│   │   ├── firestore.indexes.json       # Firestore composite indexes
│   │   └── storage.rules                # Firebase Storage rules
│   └── app-store-assets/                # App Store submission materials
│       ├── metadata/                    # Legal docs, descriptions, configs
│       ├── screenshots/                 # App Store screenshots
│       ├── icons/                       # App icons and graphics
│       ├── marketing/                   # Marketing materials
│       └── real-screenshots/            # Screenshot capture tools
│
├── design-images/                       # Design inspiration and assets
├── goalstreak-landing/                  # Landing page website
├── docs/                                # Project documentation
├── development-sessions/                # Development logs and planning
├── .kiro/                               # Kiro IDE configuration
│   ├── specs/                           # Feature specifications
│   └── steering/                        # Development guidelines
└── Root files                           # README, gitignore, etc.
```

## Key Directories

### GoalStreakApp/
Main React Native app with all source code, native projects, and store assets.
- `src/` - All TypeScript/React Native source code
- `src/services/groupService.ts` - Accountability Groups service layer
- `src/components/social/` - Social UI components including Groups
- `app-store-assets/` - Everything needed for App Store submission
- `scripts/` - Build automation and utility scripts

### firebase/
Firebase backend configuration and deployment files:
- `firebase.json` - Project config (emulators, rules/indexes file paths)
- `firestore.rules` - Security rules for all Firestore collections
- `firestore.indexes.json` - Composite index definitions for efficient queries
- `storage.rules` - Firebase Storage access rules

Deploy commands (run from `GoalStreakApp/firebase/`):
- `firebase deploy --only firestore:rules` — Deploy security rules
- `firebase deploy --only firestore:indexes` — Deploy composite indexes

### .kiro/specs/
Feature specifications and implementation plans:
- `accountability-groups/` - Accountability groups feature spec
- `app-store-launch/` - App store launch specification
- Each spec contains requirements.md, design.md, and tasks.md

## Working Directory Guidelines

- **App Development**: `GoalStreakApp/src/`
- **App Store Submission**: `GoalStreakApp/app-store-assets/`
- **Firebase Config**: `GoalStreakApp/firebase/`
- **Feature Planning**: `.kiro/specs/`

## Quick Navigation — Most Important Files

```
GoalStreakApp/
├── app.json                             # App configuration
├── eas.json                             # Build configuration
├── src/utils/linkingUtils.ts            # Legal document links
├── firebase/
│   ├── firebase.json                    # Firebase project config
│   ├── firestore.rules                  # Firestore security rules
│   └── firestore.indexes.json          # Firestore composite indexes
└── app-store-assets/metadata/
    ├── privacy-policy.md                # Privacy policy
    ├── terms-of-service.md              # Terms of service
    ├── ios-metadata.json                # App Store metadata
    └── ios-legal-compliance-checklist.md # Compliance checklist
```

## Accountability Groups Files

```
GoalStreakApp/src/
├── services/groupService.ts             # Group CRUD, invitations, feed, progress
├── hooks/
│   ├── useGroups.ts                     # Group list & invitation hook
│   └── useGroupDetail.ts               # Group detail data & actions hook
├── screens/GroupDetailScreen.tsx         # Group detail screen
├── components/social/
│   ├── GroupsTab.tsx                    # Groups tab in Social screen
│   ├── GroupCard.tsx                    # Group list card
│   ├── GroupInvitationCard.tsx          # Invitation accept/decline
│   ├── GroupCreateForm.tsx             # Group creation modal
│   ├── GroupProgressCard.tsx           # Member progress display
│   ├── GroupFeedCard.tsx               # Group activity feed card
│   ├── LinkHabitsModal.tsx             # Habit linking modal
│   ├── InviteMembersModal.tsx          # Friend invitation modal
│   └── GroupSettingsModal.tsx          # Admin/member settings
└── __tests__/groups/
    └── GroupComponents.test.tsx         # 21 UI component tests
```

## Firebase Collections

```
firestore/
├── users/{userId}                       # User profiles
├── habits/{habitId}                     # Habit definitions
├── completions/{completionId}           # Habit completions
├── streaks/{habitId}                    # Streak calculations
├── friends/{friendshipId}               # Friend relationships
├── friendRequests/{requestId}           # Friend requests
├── activities/{activityId}              # Main activity feed
├── timerStates/{timerId}                # Timer states
├── groups/{groupId}                     # Accountability groups
├── groupInvitations/{invitationId}      # Group invitations
├── trackedHabits/{trackedHabitId}       # Habit-group associations
└── groupActivities/{activityId}         # Group activity feed
```

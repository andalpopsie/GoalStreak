---
inclusion: on-demand
---

# GoalStreak Project Essentials

## Current State (January 2025)
**Status**: Production Ready (100%) - App Store Prep Phase
**Timeline**: 112+ days (Aug 2024 - Jan 2025)
**Phase**: Legal compliance and iOS submission preparation

## Tech Stack

### Frontend
- React Native with Expo SDK 54.0.0
- TypeScript for type safety
- React Navigation 7.x
- React Native Reanimated 3.x
- Montserrat fonts

### Backend
- Firebase Auth (email/password)
- Firestore (real-time NoSQL)
- Firebase Storage (profile pictures)
- Firebase Cloud Messaging (notifications)

## Core Features Implemented

### ✅ Complete
1. **Authentication** - Email/password, profile management
2. **Habit Management** - Create/edit/delete with 39+ categories
3. **Tracking & Streaks** - Daily completion, streak calculations
4. **Social Features** - Friends, activity feed, reactions
5. **Analytics** - Progress charts, insights, trends
6. **iOS Compliance** - Privacy manifest, legal docs, COPPA/GDPR

## Architecture

### Data Models
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
}

interface Habit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly' | 'monthly';
  icon?: string;
  isPublic: boolean;
}

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'accepted';
}
```

### Firebase Structure
```
firestore/
├── users/{userId}
├── habits/{habitId}
├── completions/{completionId}
├── streaks/{habitId}
├── friends/{friendshipId}
├── friendRequests/{requestId}
└── activities/{activityId}
```

## Design System

### Color Palette
```typescript
primaryText: '#154D71'   // Dark blue for text
background: '#FDFDFD'    // Light gray background
accent1: '#B771E5'       // Purple for CTAs
accent2: '#154D71'       // Dark blue secondary
accent3: '#4A90A4'       // Teal for completed
```

### Typography Scale
```typescript
heading: 24      // Screen titles
subheading: 20   // Section headers
body: 16         // Standard content
caption: 14      // Secondary info
small: 12        // Disclaimers
```

### Spacing System (4px base grid)
```typescript
tight: 8         // Icon-text pairs
base: 16         // Related content
comfortable: 24  // Section breaks
loose: 32        // Major dividers
spacious: 48     // Screen sections
```

## Development Standards

### File Organization
- **Environment files**: Root directory ONLY (.env, .env.development, .env.production)
- **Config files**: config/ directory (.eslintrc.js, jest.config.js, tsconfig.json)
- **Documentation**: docs/ directory (consolidated, no duplicates)
- **Firebase**: firebase/ directory (rules, config)
- **Source code**: src/ directory (components, screens, services, hooks)

### Code Quality
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Functional components with hooks
- Proper error handling
- Accessibility implementation

### Component Standards
```typescript
// ✅ Good - Single component with variants
interface HabitCardProps {
  variant?: 'default' | 'compact';
  layout?: 'grid' | 'list';
  habit: Habit;
}

// ❌ Bad - Don't create separate files
CompactHabitCard.tsx
EnhancedHabitCard.tsx
```

### Naming Conventions
- Components: PascalCase (HabitCard.tsx)
- Files: camelCase for utils, PascalCase for components
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Collections: lowercase_with_underscores

## Security & Privacy

### iOS Legal Compliance
- Privacy manifest (PrivacyInfo.xcprivacy) for iOS 17+
- Comprehensive privacy usage descriptions
- Privacy policy and terms accessible in-app
- COPPA (13+), GDPR, CCPA compliant
- All URLs use goalstreak.co domain

### Firebase Security
- Users can only read/write their own data
- Friends can read shared habit activities
- Proper validation rules
- Input sanitization

## Performance Targets
- App startup: < 3 seconds
- Screen transitions: < 300ms
- Crash rate: < 1%
- Firebase uptime: 99.9%

## Key Services

### Core Services (14 total)
- `habitService` - CRUD operations for habits
- `completionService` - Habit completion tracking
- `streakService` - Streak calculations
- `friendService` - Social features
- `notificationService` - Push notifications
- `photoService` - Profile picture management
- `retryService` - Network resilience

### Custom Hooks
- `useAuth` - Authentication state
- `useHabits` - Habit data and operations
- `useHabitsWithSocial` - Habits with social integration
- `useNetworkStatus` - Network connectivity

## Known Technical Debt

### High Priority
1. Move Firebase config to secure environment variables
2. Implement comprehensive automated testing
3. Enhance Firebase Security Rules
4. Add crash reporting and analytics

### Medium Priority
1. Add detailed performance tracking
2. Enhance screen reader support
3. Prepare for internationalization
4. Improve offline data synchronization

## App Store Readiness

### Completed
- ✅ App icon and splash screen
- ✅ Privacy policy and terms of service
- ✅ Privacy manifest for iOS 17+
- ✅ Legal document links in-app
- ✅ Comprehensive privacy descriptions

### Pending
- [ ] iOS provisioning profiles
- [ ] App Store Connect setup
- [ ] Feature screenshots
- [ ] App Store metadata

## Development Workflow

### Git Workflow
1. Make changes
2. Verify with `git diff`
3. Commit immediately
4. Clear cache if needed
5. Test thoroughly

### Build Process
- Development: Expo Go for testing
- Production: EAS Build for releases
- Environment-specific configurations
- Automated deployment ready

## Critical Rules

### Before Creating Files
1. Can this be added to existing file?
2. Does similar file already exist?
3. Will this create duplication?
4. Is this truly necessary?

### File Creation Guidelines
- **Documentation**: Update existing, don't create new
- **Configuration**: Root for .env, config/ for build configs
- **Code**: Extend existing components, don't duplicate
- **Services**: Add methods to existing services

### Zero Duplicates Policy
- ❌ NO duplicate .env files
- ❌ NO duplicate documentation
- ❌ NO duplicate components for variations
- ✅ Single source of truth for everything

---

**Project represents 112+ days of development delivering a production-ready social habit tracking app with enterprise-grade architecture, ready for App Store submission.**

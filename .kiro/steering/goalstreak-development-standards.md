# GoalStreak Development Standards & Guidelines

## Project Overview
GoalStreak is a mobile accountability app built with React Native (Expo) and Firebase, focusing on habit tracking, streaks, and social accountability. Keep implementations simple, scalable, and user-focused.

**Current Status**: MVP Complete (100%) - Production-ready social habit tracking app
**Architecture**: React Native + Expo + Firebase + TypeScript
**Development Stage**: App Store preparation and launch optimization

## Tech Stack Standards

### Frontend (React Native + Expo)
- Use Expo SDK 54.0.0 for cross-platform development
- Implement TypeScript for type safety
- Use React Navigation for navigation
- Follow React Native best practices for performance

### Backend (Firebase)
- Use Firebase Authentication for user management
- Firestore for real-time database operations
- Firebase Cloud Messaging for push notifications
- Firebase Analytics for user insights

### UI/UX Standards
- Follow the established design system strictly
- Use Phosphor Icons consistently
- Implement responsive design for various screen sizes
- Prioritize accessibility (screen readers, color contrast)

## Design System Compliance

### Color Palette (Always Use These)
```javascript
const colors = {
  primaryText: '#001BB7',      // Deep Blue
  background: '#FFF6E9',       // Warm Neutral
  accent1: '#FF7F3E',          // Energetic Orange (CTA/Progress)
  accent2: '#80C4E9',          // Soft Blue (Secondary UI)
  accent3: '#37B5B6',          // Teal Green (Success/Completed)
}
```

### Typography
- Primary Font: Proxima Nova (fallback to system sans-serif)
- Headings: Bold, Deep Blue (#001BB7)
- Body: Regular, Deep Blue (#001BB7)
- Secondary/Captions: Light/Medium, Accent 2 (#80C4E9)

### Component Guidelines
- Primary buttons: Accent 1 background with white text
- Secondary buttons: Accent 2 outline or fill
- Completed states: Accent 3
- Active streaks: Accent 1 highlight
- Always use #FFF6E9 background for warmth

## Legal Compliance Standards

### iOS App Store Requirements
- All privacy usage descriptions must be comprehensive and user-friendly
- Privacy manifest file (PrivacyInfo.xcprivacy) must be complete and accurate
- Legal documents (privacy policy, terms of service) must be accessible in-app
- All URLs must use goalstreak.co domain
- Full compliance with COPPA (13+ age requirement), GDPR, and CCPA

### Privacy Implementation
- Use linkingUtils.ts for all external legal document links
- Include privacy policy and terms of service links in SignUpScreen and ProfileScreen
- Ensure graceful error handling for failed URL opening
- Maintain comprehensive privacy manifest for iOS 17+ compliance

## Project Organization Standards

### Directory Organization Principles
- **Logical Grouping**: Files organized by purpose and functionality
- **Clean Root**: Environment files in root, config files in config/
- **Zero Duplicates**: Single source of truth for all configuration
- **Professional Structure**: Ready for code review and App Store submission
- **Automated Maintenance**: Use `npm run cleanup:directory` for organization
- **Documentation First**: All guides and docs in dedicated `docs/` directory

### Organization Benefits
- **Improved Navigation**: Faster file discovery and logical grouping
- **Better Git Tracking**: Cleaner commit history and easier change tracking  
- **Enhanced Maintainability**: Clear separation of concerns
- **Developer Experience**: Easier onboarding and project understanding

### File Creation Rules (CRITICAL)
**ALWAYS follow these rules before creating ANY new file:**

1. **Documentation Files**
   - ❌ DON'T create new summary/report files for recent work
   - ✅ DO update existing documentation files
   - ✅ DO use CHANGELOG.md for incremental updates
   - ❌ DON'T duplicate guides or create redundant docs

2. **Configuration Files**
   - ❌ DON'T create duplicate .env files
   - ✅ DO keep .env files ONLY in root directory
   - ❌ DON'T create environment-specific config duplicates
   - ✅ DO use single config files with environment detection

3. **Code Files**
   - ❌ DON'T create new components for UI variations (use props/variants)
   - ✅ DO extend existing components with new props
   - ❌ DON'T create duplicate service files
   - ✅ DO add methods to existing services

4. **Before Creating ANY File, Ask:**
   - Can this be added to an existing file?
   - Does a similar file already exist?
   - Will this create duplication?
   - Is this truly necessary or just convenient?

## Code Standards

### File Structure (Optimized January 2025)
```
GoalStreakApp/
├── .env, .env.development, .env.production  # Environment variables (ROOT ONLY)
├── src/                   # Source code
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── services/          # Firebase and API services (14 services)
│   ├── utils/             # Helper functions
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── config/            # Environment configuration loader
│   └── constants/         # App constants (colors, sizes, etc.)
├── docs/                  # Documentation and guides (NO duplicates)
├── config/                # Config files ONLY (.eslintrc.js, jest.config.js, tsconfig.json)
├── firebase/              # Firebase configuration and rules
├── scripts/               # Build and utility scripts
├── assets/                # App assets (icons, fonts, etc.)
├── app-store-assets/      # App Store submission materials
├── temp/                  # Temporary files and build artifacts
└── [essential root files] # package.json, app.json, eas.json, etc.
```

**IMPORTANT**: 
- Environment files (.env*) live in ROOT directory ONLY
- Config directory contains build/lint/test configs ONLY
- Never duplicate configuration files

### Naming Conventions
- Components: PascalCase (e.g., `HabitCard.tsx`)
- Files: camelCase for utilities, PascalCase for components
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Firebase collections: lowercase with underscores

### Component Standards
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Include loading and error states
- Add accessibility props (accessibilityLabel, accessibilityRole)
- Keep components focused and single-responsibility

### State Management
- Use React Context for global state (auth, user data)
- Local state with useState for component-specific data
- Custom hooks for complex logic and Firebase operations

## Firebase Best Practices

### Firestore Structure
```
users/{userId}
├── profile: { name, email, profilePicture, createdAt }
├── settings: { privacy, notifications }

habits/{habitId}
├── userId, name, category, createdAt, isActive
├── privacy: { shareWithFriends }

completedLogs/{logId}
├── userId, habitId, completedAt, streak

friendships/{friendshipId}
├── requester, recipient, status, createdAt

activities/{activityId}
├── userId, habitId, type, createdAt, reactions
```

### Security Rules
- Users can only read/write their own data
- Friends can read shared habit activities
- Implement proper validation rules

### Performance
- Use pagination for large lists
- Implement offline persistence where appropriate
- Optimize queries with proper indexing
- Cache frequently accessed data

## Development Workflow

### MVP Focus
- Stick to core features: habit tracking, streaks, basic social features
- Avoid feature creep - document future features separately
- Prioritize user experience over complex features

### Testing Strategy
- Test on both iOS and Android regularly
- Use Expo Go for development testing
- Create production builds for final testing
- Test offline scenarios and edge cases

### Code Quality
- Use ESLint and Prettier for consistent formatting
- Implement proper error handling and user feedback
- Add loading states for all async operations
- Handle network failures gracefully

## User Experience Priorities

### Core Principles
- Minimal taps to complete actions
- Clear visual feedback for all interactions
- Intuitive navigation and information hierarchy
- Fast app startup and smooth animations

### Accessibility
- Support screen readers with proper labels
- Ensure sufficient color contrast
- Implement keyboard navigation where applicable
- Test with accessibility tools

### Performance Targets
- App startup < 3 seconds
- Screen transitions < 300ms
- Crash rate < 1%
- 99.9% uptime for Firebase services

## Social Features Guidelines

### Privacy First
- Default to private habits, opt-in to sharing
- Clear privacy controls for users
- Respect user data and sharing preferences

### Engagement Features
- Simple emoji reactions (👏, 🔥, 💪)
- Encouraging notifications, not spam
- Focus on positive reinforcement

## Deployment Standards

### Build Process
- Use EAS Build for production builds
- Separate development and production Firebase projects
- Implement proper environment configuration
- Test builds thoroughly before submission

### App Store Requirements
- Follow platform-specific guidelines
- Create proper app icons and screenshots
- Write clear app descriptions
- Implement required privacy policies

## Error Handling

### User-Facing Errors
- Show friendly, actionable error messages
- Provide retry mechanisms for network failures
- Log errors for debugging without exposing technical details

### Development Errors
- Use proper error boundaries in React
- Implement comprehensive logging
- Monitor crashes with Firebase Crashlytics

## Security Considerations

### Data Protection
- Never store sensitive data in plain text
- Use Firebase Security Rules properly
- Implement proper authentication flows
- Validate all user inputs

### Privacy
- Minimal data collection
- Clear privacy policy
- User control over data sharing
- Secure data transmission

## Performance Optimization

### React Native Specific
- Use FlatList for large lists
- Implement proper image optimization
- Avoid unnecessary re-renders
- Use React.memo and useMemo appropriately

### Firebase Optimization
- Minimize real-time listeners
- Use efficient query patterns
- Implement proper data pagination
- Monitor Firebase usage and costs

Remember: Keep it simple, focus on user value, and maintain high code quality throughout development.
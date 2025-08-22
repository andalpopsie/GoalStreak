# GoalStreak - Technical Stack & Build System

## Tech Stack
- **Frontend**: React Native with TypeScript + Expo
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Push Notifications**: Expo Notifications API (migrate to FCM later)
- **Charts & Visualizations**: Victory Native or react-native-svg-charts
- **Deployment**: Expo EAS + GitHub Actions for CI/CD

## Development Environment
- **Language**: TypeScript for type safety and better developer experience
- **Framework**: Expo for rapid React Native development
- **Database**: Firestore for real-time data sync
- **Authentication**: Firebase Auth with Google/Apple Sign-In support

## Common Commands
```bash
# Development
npx expo start                    # Start development server
npx expo start --ios             # Start iOS simulator
npx expo start --android         # Start Android emulator

# Building
npx expo build:ios               # Build for iOS
npx expo build:android           # Build for Android
eas build --platform all         # Build with EAS

# Testing
npm test                         # Run tests
npm run lint                     # Run linting
npm run type-check               # TypeScript type checking

# Deployment
eas submit --platform ios        # Submit to App Store
eas submit --platform android    # Submit to Google Play
```

## Code Standards
- Use TypeScript strict mode
- Follow React Native and Expo best practices
- Implement proper error handling for Firebase operations
- Use async/await for asynchronous operations
- Follow consistent naming conventions for components and functions
- Implement proper loading states and error boundaries
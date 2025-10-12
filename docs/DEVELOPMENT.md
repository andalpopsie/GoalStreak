# 🛠️ GoalStreak Development Guide

Complete setup and development workflow guide for GoalStreak habit tracking platform.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** (Xcode) or **Android Studio**
- **Firebase Project** with Auth, Firestore, and Storage enabled

### Setup
```bash
# Clone repository
git clone https://github.com/andalpopsie/GoalStreak.git
cd GoalStreak

# Install dependencies
cd GoalStreakApp
npm install

# Start development server
npm start
```

## 📱 Development Environment

### Required Tools
- **Xcode** (macOS) - iOS development and simulator
- **Android Studio** - Android development and emulator
- **VS Code** - Recommended editor with extensions:
  - React Native Tools
  - TypeScript and JavaScript Language Features
  - Prettier - Code formatter
  - ESLint

### Firebase Setup
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Firebase Storage
5. Download configuration files:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)

### Environment Configuration
```bash
# Create environment file
cp .env.example .env.local

# Configure Firebase credentials
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

## 🏗️ Project Architecture

### Directory Structure
```
GoalStreakApp/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Shared components
│   │   ├── habit/          # Habit-specific components
│   │   ├── social/         # Social feature components
│   │   └── analytics/      # Analytics components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── services/           # Firebase and API services
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   ├── constants/          # Theme, limits, configurations
│   └── utils/              # Helper functions
├── assets/                 # Images, icons, fonts
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

### Key Technologies
- **React Native + Expo SDK 54** - Cross-platform mobile development
- **TypeScript** - Type safety and developer experience
- **Firebase** - Backend services (Auth, Firestore, Storage, FCM)
- **React Navigation 7.x** - Navigation and routing
- **React Native Reanimated 3.x** - Smooth animations
- **Expo Notifications** - Push notification system

## 🔧 Development Workflow

### Daily Development
```bash
# Navigate to project
cd /Users/popsieandal/Documents/GoalStreak

# Check status and pull latest
git status
git pull origin main

# Start development
cd GoalStreakApp
npm start

# Choose platform:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Press 'w' for web (limited functionality)
```

### Code Standards
- **TypeScript** - All new code must be TypeScript
- **ESLint** - Follow configured linting rules
- **Prettier** - Use for consistent code formatting
- **Component Structure** - Functional components with hooks
- **File Naming** - PascalCase for components, camelCase for utilities

### Testing Approach
```bash
# Manual testing checklist
# 1. Test on iOS simulator
# 2. Test on Android emulator
# 3. Test core user flows
# 4. Verify Firebase integration
# 5. Check offline functionality

# Type checking
npm run type-check

# Linting (if configured)
npm run lint
```

## 🔥 Firebase Integration

### Services Used
- **Authentication** - User registration and login
- **Firestore** - Real-time database for habits, social data
- **Storage** - Profile photos and assets
- **Cloud Messaging** - Push notifications

### Data Models
```typescript
// Core data structures
interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  createdAt: Date;
}

interface Habit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly' | 'monthly';
  isPublic: boolean;
  createdAt: Date;
}

interface Completion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: Date;
  streak: number;
}
```

### Security Rules
```javascript
// Firestore security rules
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
    
    // Social features - friends can read shared activities
    match /activities/{activityId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.visibility == 'public');
    }
  }
}
```

## 📱 Platform-Specific Development

### iOS Development
```bash
# Start iOS simulator
npm run ios

# Common iOS issues:
# - Simulator not starting: Reset simulator
# - Build errors: Clean build folder in Xcode
# - Permission issues: Check Info.plist configurations
```

### Android Development
```bash
# Start Android emulator
npm run android

# Common Android issues:
# - Emulator not starting: Check AVD configuration
# - Build errors: Clean gradle cache
# - Permission issues: Check AndroidManifest.xml
```

### Web Development (Limited)
```bash
# Start web version (for testing only)
npm run web

# Note: Limited functionality on web
# - No camera/photo access
# - No push notifications
# - Some native features unavailable
```

## 🎨 UI/UX Development

### Design System
```typescript
// Color palette
const Colors = {
  primaryText: '#154D71',      // Dark blue for text
  background: '#FDFDFD',       // Light gray background
  accent1: '#FF894F',          // Warm orange for CTAs
  accent2: '#154D71',          // Dark blue for secondary
  accent3: '#4A90A4',          // Teal for completed states
};

// Typography
const Typography = {
  fontFamily: {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semibold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
  }
};
```

### Component Guidelines
- **Reusable Components** - Create in `src/components/common/`
- **Screen Components** - One per screen in `src/screens/`
- **Consistent Styling** - Use design system constants
- **Accessibility** - Include accessibility props
- **Performance** - Use React.memo for expensive components

## 🔔 Notification System

### Setup
```typescript
// Request permissions
import * as Notifications from 'expo-notifications';

const { status } = await Notifications.requestPermissionsAsync();
if (status !== 'granted') {
  // Handle permission denied
}

// Schedule notification
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Habit Reminder',
    body: 'Time to complete your habit!',
  },
  trigger: {
    date: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  },
});
```

### Best Practices
- **7-Day Scheduling** - Schedule notifications 7 days in advance
- **Individual Triggers** - Use specific dates, not repeating patterns
- **Timezone Handling** - Convert user input to device timezone
- **Permission Management** - Handle permission requests gracefully

## 🚀 Performance Optimization

### React Native Best Practices
```typescript
// Use React.memo for expensive components
export default React.memo(function HabitCard({ habit }) {
  // Component implementation
});

// Use useCallback for event handlers
const handlePress = useCallback(() => {
  // Handle press
}, [dependency]);

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

### Firebase Optimization
- **Efficient Queries** - Use proper indexing and limits
- **Real-time Listeners** - Clean up subscriptions properly
- **Offline Support** - Enable Firestore offline persistence
- **Batch Operations** - Use batch writes for multiple updates

## 🐛 Debugging

### Common Issues
```bash
# Metro bundler issues
npx react-native start --reset-cache

# iOS simulator issues
xcrun simctl erase all

# Android emulator issues
cd android && ./gradlew clean

# Firebase connection issues
# Check network connectivity
# Verify Firebase configuration
# Check security rules
```

### Debug Tools
- **React Native Debugger** - Advanced debugging
- **Flipper** - Mobile app debugging platform
- **Firebase Console** - Monitor backend services
- **Expo Dev Tools** - Expo-specific debugging

### Logging
```typescript
// Development logging
if (__DEV__) {
  console.log('Debug info:', data);
}

// Production error tracking
import crashlytics from '@react-native-firebase/crashlytics';
crashlytics().recordError(error);
```

## 📦 Dependencies Management

### Core Dependencies
```json
{
  "expo": "~54.0.0",
  "react": "18.2.0",
  "react-native": "0.74.5",
  "firebase": "^10.3.1",
  "@react-navigation/native": "^7.0.0",
  "react-native-reanimated": "~3.10.1"
}
```

### Adding New Dependencies
```bash
# Install new package
npm install package-name

# For React Native packages, may need:
npx expo install package-name

# Always test after adding dependencies
npm start
```

### Dependency Updates
```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update Expo SDK
npx expo install --fix
```

## 🔒 Security Considerations

### Data Protection
- **Input Validation** - Validate all user inputs
- **Authentication** - Proper Firebase Auth implementation
- **Authorization** - Firestore security rules
- **Sensitive Data** - Never store sensitive data in plain text

### Privacy
- **User Consent** - Request permissions appropriately
- **Data Minimization** - Collect only necessary data
- **Transparency** - Clear privacy policy
- **User Control** - Allow users to manage their data

## 📋 Troubleshooting

### Development Issues
| Issue | Solution |
|-------|----------|
| App won't start | Check Node.js version, clear cache |
| Build errors | Clean build, check dependencies |
| Firebase errors | Verify configuration, check network |
| Simulator issues | Reset simulator, restart computer |
| Performance issues | Check for memory leaks, optimize renders |

### Getting Help
- **Documentation** - Check this guide and official docs
- **GitHub Issues** - Search existing issues first
- **Community** - Expo and React Native communities
- **Stack Overflow** - Tag questions appropriately

## 🎯 Next Steps

### For New Developers
1. Complete environment setup
2. Run the app successfully
3. Make a small change and test
4. Read the codebase to understand architecture
5. Start with small bug fixes or improvements

### For Feature Development
1. Understand the existing architecture
2. Follow the established patterns
3. Write TypeScript with proper types
4. Test thoroughly on both platforms
5. Update documentation as needed

---

**Happy coding! 🚀**

For additional help, see:
- [Contributing Guide](CONTRIBUTING.md) - Git workflow and standards
- [Architecture Overview](ARCHITECTURE.md) - Technical decisions and patterns
- [Deployment Guide](DEPLOYMENT.md) - Build and release processes
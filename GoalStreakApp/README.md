# GoalStreak - Social Habit Tracking App

A React Native mobile application for building lasting habits through social accountability, streak tracking, and community support.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Emulator

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## 📱 Core Features

- **Habit Tracking**: Create and track daily habits with 39+ category icons
- **Streak System**: Build momentum with visual streak counters and milestones
- **Social Accountability**: Connect with friends, share progress, and motivate each other
- **Analytics Dashboard**: Comprehensive insights and progress visualization
- **Real-time Sync**: Offline support with Firebase real-time synchronization
- **Privacy Controls**: Granular settings for habit sharing and social features

## 🏗️ Project Structure

```
GoalStreakApp/
├── 📱 src/                     # Main application code
│   ├── components/             # Reusable UI components
│   ├── screens/               # Screen components
│   ├── navigation/            # Navigation configuration
│   ├── services/              # Firebase and API services
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript definitions
│   ├── constants/             # App constants and theme
│   └── utils/                 # Helper functions
│
├── 🧪 __tests__/              # Test suite (moved from src/)
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── security/              # Security tests
│   ├── performance/           # Performance tests
│   ├── components/            # Component tests
│   ├── screens/               # Screen tests
│   ├── hooks/                 # Hook tests
│   ├── utils/                 # Test utilities
│   ├── mocks/                 # Mock implementations
│   └── factories/             # Test data factories
│
├── 🔧 e2e/                    # End-to-end tests
├── 📊 reports/                # Generated test reports
├── 📚 docs/                   # Technical documentation
├── 🚀 app-store/              # App store submission files
└── ⚙️ scripts/               # Build and utility scripts
```

## 🧪 Testing

### Test Types
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Firebase service integration
- **Security Tests**: Input validation and security measures
- **Performance Tests**: Load testing and performance benchmarks
- **E2E Tests**: Complete user workflow testing

### Running Tests
```bash
# All tests
npm test

# Specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests with Firebase emulators
npm run test:security       # Security validation tests
npm run test:performance    # Performance and load tests
npm run test:e2e           # End-to-end tests

# Test utilities
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage reports
npm run test:ci           # CI-optimized test run
```

### Test Configuration
- `jest.config.js` - Main Jest configuration
- `jest.integration.config.js` - Firebase integration tests
- `jest.security.config.js` - Security-focused tests
- `jest.performance.config.js` - Performance testing
- `.detoxrc.js` - E2E test configuration

## 🔥 Firebase Setup

### Development Environment
```bash
# Start Firebase emulators
npm run emulators:start

# Run integration tests
npm run test:integration

# Stop emulators
npm run emulators:stop
```

### Firebase Services
- **Authentication**: User registration and login
- **Firestore**: Real-time database for habits, streaks, and social data
- **Storage**: Profile pictures and app assets
- **Cloud Messaging**: Push notifications (future)

## 🛠️ Development

### Code Quality
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting with security rules
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive testing framework

### Key Commands
```bash
# Development
npm start                  # Start Expo development server
npm run lint              # Run ESLint
npm run type-check        # TypeScript type checking

# Testing
npm run test:all          # Run complete test suite
npm run test:health-check # Test environment health check
npm run test:maintenance  # Automated test maintenance

# Build & Deploy
npm run build             # Production build
npm run test:ci:all       # CI test pipeline
```

## 📊 Architecture

### Tech Stack
- **Frontend**: React Native with Expo SDK
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State Management**: React Context + Custom Hooks
- **Navigation**: React Navigation 7.x
- **Animations**: React Native Reanimated 3.x
- **Testing**: Jest + Detox + Firebase Test SDK

### Design System
- **Colors**: Warm, accessible color palette
- **Typography**: Montserrat font family
- **Icons**: 39+ custom category icons with Ionicons
- **Components**: Reusable, accessible component library

## 🚀 Deployment

### Build Configurations
- **Development**: Local development with Firebase emulators
- **Staging**: Pre-production testing environment
- **Production**: Live app with production Firebase project

### App Store Preparation
- Assets and metadata in `app-store/` directory
- Privacy policy and terms of service
- App Store Connect and Google Play Console setup

## 📈 Performance

### Optimization Features
- Efficient Firestore queries without complex indexes
- React.memo and useMemo for performance optimization
- Offline-first architecture with real-time sync
- Image optimization and lazy loading

### Monitoring
- Firebase Performance Monitoring
- Crash reporting with Firebase Crashlytics
- Custom performance metrics and analytics

## 🔒 Security

### Security Measures
- Firebase Security Rules for data access control
- Input validation and sanitization
- Secure authentication flows
- Privacy controls for user data

### Security Testing
```bash
npm run test:security      # Run security test suite
npm run test:security:ci   # CI security validation
```

## 📚 Documentation

### Available Guides
- `TESTING_SETUP.md` - Complete testing setup guide
- `PERFORMANCE_TESTING.md` - Performance testing procedures
- `SECURITY_TESTING_SUMMARY.md` - Security validation summary
- `docs/` - Detailed technical documentation

### Key Documentation
- API documentation for services and hooks
- Component usage examples and props
- Testing patterns and best practices
- Deployment and CI/CD procedures

## 🤝 Contributing

### Development Workflow
1. Follow the established project structure
2. Write tests for new features
3. Ensure all tests pass before committing
4. Follow TypeScript and ESLint guidelines
5. Update documentation as needed

### Code Standards
- Use TypeScript for all new code
- Follow the established component patterns
- Implement proper error handling
- Add accessibility features
- Write comprehensive tests

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Check the documentation in `docs/`
- Review test examples in `__tests__/`
- Consult the troubleshooting guides

---

**Status**: Production Ready (MVP Complete)
**Version**: 1.0.0
**Last Updated**: August 31, 2025
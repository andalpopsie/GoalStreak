# iOS Pre-Launch Testing Guide

## Overview

This guide covers the comprehensive iOS pre-launch testing suite for GoalStreak, ensuring the app meets all requirements for iOS App Store submission.

## Testing Requirements

Based on task 5 requirements:
- **5.1**: Test app functionality on multiple iOS devices (iPhone SE, iPhone 14, iPhone 14 Pro Max, iPad)
- **5.2**: Test app functionality across iOS versions (iOS 15.0+ compatibility)
- **5.3**: Verify core user flows work flawlessly on iOS (onboarding, habit creation, social features)
- **5.4**: Test iOS-specific features (haptic feedback, iOS notifications, etc.)
- **5.5**: Additional iOS compatibility and accessibility testing

## Test Categories

### 1. Device Compatibility Tests
Tests app functionality across different iOS devices:

- **iPhone SE (3rd generation)** - Smallest supported screen (375x667)
- **iPhone 14** - Standard size (390x844)
- **iPhone 14 Pro Max** - Largest iPhone (430x932)
- **iPad (9th generation)** - Tablet form factor (810x1080)
- **iPad Pro 11"** - Large tablet (834x1194)

### 2. iOS Version Compatibility Tests
Ensures compatibility across iOS versions:

- **iOS 15.0+** - Minimum supported version
- **iOS 16.0+** - Current major version
- **iOS 17.0+** - Latest version
- **iOS 18.0+** - Future compatibility

### 3. Core User Flow Tests
Validates critical user journeys:

- **Onboarding Flow** - Registration, login, welcome experience
- **Habit Creation Flow** - Creating, editing, managing habits
- **Habit Completion Flow** - Completing habits, streak tracking
- **Social Features Flow** - Friend management, activity feed, reactions
- **Analytics Flow** - Progress tracking, insights, charts

### 4. iOS-Specific Feature Tests
Tests iOS platform features:

- **Haptic Feedback** - Touch feedback integration
- **iOS Notifications** - Push notifications, badges, scheduling
- **Background App Refresh** - Background processing
- **App State Transitions** - Foreground/background handling
- **Memory Management** - iOS memory constraints
- **Accessibility** - VoiceOver, Dynamic Type, accessibility features
- **Safe Area Handling** - Notch and safe area support

## Running Tests

### Quick Start
```bash
# Run comprehensive iOS testing suite
npm run test:ios

# Run smoke tests for critical functionality
npm run test:ios:smoke

# Run specific test categories
npm run test:ios:devices    # Device compatibility
npm run test:ios:flows      # User flows
npm run test:ios:features   # iOS-specific features
```

### Detailed Test Commands

#### Full Test Suite
```bash
# Complete iOS pre-launch testing
npm run test:ios:comprehensive
```

#### Individual Test Categories
```bash
# Device compatibility tests
jest --testPathPattern=ios-testing/userFlows

# iOS feature tests
jest --testPathPattern=ios-testing/iosFeatures

# Haptic feedback tests
jest --testPathPattern=HapticFeedback.test

# Notification tests
jest --testPathPattern=IOSNotifications.test
```

#### Manual Testing Commands
```bash
# Run Jest tests with specific patterns
npx jest src/__tests__/ios-testing --verbose

# Run with coverage
npx jest src/__tests__/ios-testing --coverage

# Watch mode for development
npx jest src/__tests__/ios-testing --watch
```

## Test Structure

```
src/__tests__/ios-testing/
├── IOSTestSuite.ts              # Main test suite class
├── IOSTestRunner.ts             # Test execution engine
├── runIOSTests.ts               # CLI interface
├── userFlows/                   # User flow tests
│   ├── OnboardingFlow.test.tsx
│   ├── HabitCreationFlow.test.tsx
│   └── SocialFeaturesFlow.test.tsx
└── iosFeatures/                 # iOS-specific feature tests
    ├── HapticFeedback.test.ts
    └── IOSNotifications.test.ts
```

## Device Testing Matrix

| Device | Screen Size | iOS Version | Test Priority |
|--------|-------------|-------------|---------------|
| iPhone SE (3rd gen) | 375×667 | 15.0+ | Critical |
| iPhone 14 | 390×844 | 16.0+ | Critical |
| iPhone 14 Pro Max | 430×932 | 16.0+ | Critical |
| iPad (9th gen) | 810×1080 | 15.0+ | High |
| iPad Pro 11" | 834×1194 | 15.0+ | High |

## Test Scenarios

### Critical Test Scenarios (Must Pass)
1. **App launches successfully** on all supported devices
2. **User can complete onboarding** without errors
3. **Habit creation and completion** works correctly
4. **Social features function** properly
5. **iOS notifications** work as expected
6. **Haptic feedback** provides appropriate responses

### High Priority Test Scenarios
1. **Performance** meets targets (startup < 3s, transitions < 300ms)
2. **Memory usage** stays within iOS limits
3. **Accessibility** features work with VoiceOver
4. **Safe area handling** works on devices with notches
5. **Background/foreground** transitions work smoothly

### Medium Priority Test Scenarios
1. **Dark mode** appearance is correct
2. **Dynamic Type** scaling works properly
3. **Landscape orientation** (iPad) functions correctly
4. **Network interruption** recovery works
5. **Large data sets** perform adequately

## Expected Results

### Pass Criteria
- **100% of critical scenarios** must pass
- **90%+ of high priority scenarios** should pass
- **80%+ overall pass rate** for App Store readiness
- **No crashes** during testing
- **Performance targets** met consistently

### App Store Readiness Indicators
✅ **Ready for Submission**:
- All critical tests pass
- No crashes or major bugs
- Performance meets targets
- iOS guidelines compliance

⚠️ **Needs Work**:
- Some high priority tests fail
- Minor performance issues
- Non-critical bugs present

❌ **Not Ready**:
- Critical tests fail
- Crashes or major bugs
- Poor performance
- iOS guideline violations

## Troubleshooting

### Common Issues

#### Test Environment Setup
```bash
# Install dependencies
npm install

# Clear Jest cache
npx jest --clearCache

# Reset Metro cache
npx expo start --clear
```

#### iOS Simulator Issues
```bash
# Reset iOS Simulator
xcrun simctl erase all

# Boot specific simulator
xcrun simctl boot "iPhone 14"
```

#### Test Failures
1. **Check test logs** for specific error messages
2. **Verify mock configurations** are correct
3. **Ensure test data** is properly set up
4. **Check platform-specific** code paths

### Performance Issues
- **Reduce test parallelization** if memory constrained
- **Use `--runInBand`** flag for Jest
- **Close other applications** during testing
- **Monitor system resources** during test execution

## Continuous Integration

### GitHub Actions Example
```yaml
name: iOS Testing
on: [push, pull_request]

jobs:
  ios-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ios:comprehensive
```

### Pre-commit Hooks
```bash
# Add to .husky/pre-commit
npm run test:ios:smoke
```

## Reporting

### Test Reports
The testing suite generates comprehensive reports including:

- **Test execution summary** (pass/fail counts, timing)
- **Device compatibility matrix** (results per device)
- **Performance metrics** (startup time, memory usage)
- **App Store readiness assessment**
- **Detailed recommendations** for fixes

### Report Formats
- **Console output** with color-coded results
- **JSON report** for CI/CD integration
- **HTML coverage report** for detailed analysis
- **Markdown summary** for documentation

## Best Practices

### Before Testing
1. **Update dependencies** to latest versions
2. **Clear caches** (Metro, Jest, npm)
3. **Ensure stable network** connection
4. **Close unnecessary applications**
5. **Use latest iOS Simulator** versions

### During Testing
1. **Monitor system resources** (CPU, memory)
2. **Watch for console warnings** and errors
3. **Note performance** characteristics
4. **Document any** manual testing observations

### After Testing
1. **Review all test results** thoroughly
2. **Address critical failures** immediately
3. **Plan fixes** for high-priority issues
4. **Update documentation** as needed
5. **Prepare for App Store** submission

## Support

### Getting Help
- **Check test logs** for detailed error information
- **Review this guide** for troubleshooting steps
- **Consult iOS documentation** for platform-specific issues
- **Test on physical devices** when possible

### Resources
- [iOS App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [React Native iOS Guide](https://reactnative.dev/docs/running-on-device)
- [Expo iOS Development](https://docs.expo.dev/workflow/ios-simulator/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

**Note**: This testing suite is designed to catch issues before App Store submission. While comprehensive, it should be supplemented with manual testing on physical devices and real user scenarios.
# End-to-End Testing with Detox

This directory contains the end-to-end (E2E) testing infrastructure for GoalStreak using Detox. The E2E tests validate complete user workflows across iOS and Android platforms.

## 📁 Directory Structure

```
e2e/
├── README.md                 # This file
├── jest.config.js           # Jest configuration for E2E tests
├── setup.ts                 # Global test setup and teardown
├── sample.test.ts           # Sample test (will be replaced)
├── scripts/
│   └── runTests.js          # Test execution script
├── utils/
│   ├── testHelpers.ts       # Common test utilities and helpers
│   ├── testDataManager.ts   # Test data setup and cleanup
│   ├── deviceManager.ts     # Device and simulator management
│   └── pathBuilder.js       # Artifact path customization
├── tests/                   # Test files (to be created)
│   ├── auth/               # Authentication tests
│   ├── habits/             # Habit management tests
│   ├── social/             # Social features tests
│   └── analytics/          # Analytics tests
├── artifacts/              # Test artifacts (screenshots, videos, logs)
└── reports/                # Test reports and results
```

## 🚀 Quick Start

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Detox CLI** (if not already installed)
   ```bash
   npm install -g detox-cli
   ```

3. **Setup iOS Simulator** (macOS only)
   - Install Xcode and iOS Simulator
   - Create iPhone 14 simulator if not exists

4. **Setup Android Emulator**
   - Install Android Studio
   - Create AVD with API 30 (Pixel 3 recommended)

### Running Tests

#### Basic Test Execution
```bash
# Run default configuration (iOS Debug)
npm run test:e2e

# Run specific platform
npm run test:e2e:ios
npm run test:e2e:android

# Run cross-platform tests
npm run test:e2e:cross

# Run with video recording
npm run test:e2e:record

# Run in CI mode (headless, no cleanup)
npm run test:e2e:ci
```

#### Advanced Options
```bash
# Run specific test file
node e2e/scripts/runTests.js --test=userJourney.test.ts

# Run specific configuration
node e2e/scripts/runTests.js --configuration=android.emu.debug

# Run with specific device
node e2e/scripts/runTests.js --device=iphone-14-pro-max

# Skip building (use existing build)
node e2e/scripts/runTests.js --no-build

# Enable verbose logging
node e2e/scripts/runTests.js --verbose
```

## 🧪 Test Structure

### Test Categories

1. **Authentication Tests** (`tests/auth/`)
   - User registration flow
   - Login/logout functionality
   - Password reset
   - Session management

2. **Habit Management Tests** (`tests/habits/`)
   - Habit creation and editing
   - Habit completion and streaks
   - Category selection
   - Habit deletion

3. **Social Features Tests** (`tests/social/`)
   - Friend requests and management
   - Activity feed interactions
   - Reactions and social engagement
   - Privacy controls

4. **Analytics Tests** (`tests/analytics/`)
   - Dashboard navigation
   - Chart rendering and data
   - Progress tracking
   - Statistics accuracy

5. **Cross-Platform Tests** (`tests/cross-platform/`)
   - Screen size compatibility
   - Platform-specific features
   - Performance validation
   - Accessibility compliance

### Test Naming Convention

```typescript
// File naming: [feature].[scenario].test.ts
// Examples:
auth.login.test.ts
habits.creation.test.ts
social.friendRequests.test.ts
analytics.dashboard.test.ts
```

## 🛠 Configuration

### Detox Configuration (`.detoxrc.js`)

The configuration supports multiple platforms and devices:

- **iOS Configurations**: iPhone SE, iPhone 14, iPhone 14 Pro Max, iPad Air
- **Android Configurations**: Pixel 3, Pixel 4 XL, Nexus 5X
- **Build Types**: Debug and Release builds
- **Device Types**: Simulators, Emulators, Physical devices

### Environment Variables

```bash
# Firebase configuration (use test environment)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=goalstreak-test
EXPO_PUBLIC_FIREBASE_API_KEY=your-test-api-key

# Detox configuration
DETOX_CONFIGURATION=ios.sim.debug
DETOX_DEVICE=iPhone 14

# Test configuration
E2E_TIMEOUT=120000
E2E_RETRIES=2
```

## 📝 Writing Tests

### Basic Test Structure

```typescript
import { 
  waitForElement, 
  tapElement, 
  typeText, 
  expectElementToBeVisible 
} from '@utils/testHelpers';

describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should perform specific action', async () => {
    // Arrange
    await waitForElement(by.id('home-screen'));
    
    // Act
    await tapElement('add-habit-button');
    await typeText('habit-name-input', 'Morning Exercise');
    await tapElement('save-habit-button');
    
    // Assert
    await expectElementToBeVisible('habit-card');
  });
});
```

### Using Test Helpers

```typescript
import { 
  TEST_IDS, 
  TIMEOUTS,
  generateRandomEmail,
  createTestUser,
  cleanupTestData 
} from '@utils/testHelpers';

describe('User Registration', () => {
  it('should register new user', async () => {
    const email = generateRandomEmail();
    
    await tapElement(TEST_IDS.SIGNUP_BUTTON);
    await typeText(TEST_IDS.EMAIL_INPUT, email);
    await typeText(TEST_IDS.PASSWORD_INPUT, 'TestPassword123!');
    await tapElement(TEST_IDS.SIGNUP_BUTTON);
    
    await waitForElement(
      by.id(TEST_IDS.HOME_SCREEN), 
      TIMEOUTS.LONG
    );
  });
});
```

### Test Data Management

```typescript
import { 
  createTestUser, 
  createTestHabits, 
  createTestFriendship 
} from '@utils/testDataManager';

describe('Social Features', () => {
  let user1, user2;
  
  beforeAll(async () => {
    // Setup test data
    user1 = await createTestUser();
    user2 = await createTestUser();
    await createTestFriendship(user1, user2);
  });
  
  afterAll(async () => {
    // Cleanup is handled automatically in global teardown
  });
});
```

## 🎯 Test IDs

All interactive elements should have `testID` props for reliable element selection:

```typescript
// Component implementation
<TouchableOpacity testID="add-habit-button" onPress={onPress}>
  <Text>Add Habit</Text>
</TouchableOpacity>

// Test usage
await element(by.id('add-habit-button')).tap();
```

### Test ID Conventions

- Use kebab-case: `add-habit-button`
- Be descriptive: `habit-card-morning-exercise`
- Include context: `social-screen-add-friend-button`
- Use consistent patterns across similar components

## 📊 Artifacts and Debugging

### Screenshots
- Automatically taken on test failures
- Manually triggered with `device.takeScreenshot(name)`
- Organized by platform, test status, and timestamp

### Videos
- Recorded when `--record` flag is used
- Useful for debugging complex interactions
- Stored in `e2e/artifacts/videos/`

### Logs
- Detox logs available in `e2e/artifacts/logs/`
- Console output captured during test execution
- Error logs with stack traces for debugging

### Test Reports
- JUnit XML format for CI integration
- JSON reports with detailed test results
- Coverage reports (if enabled)

## 🔧 Troubleshooting

### Common Issues

1. **App doesn't launch**
   ```bash
   # Rebuild the app
   npm run test:e2e:build
   
   # Check simulator/emulator status
   xcrun simctl list devices  # iOS
   adb devices                # Android
   ```

2. **Element not found**
   ```typescript
   // Add explicit waits
   await waitFor(element(by.id('element-id')))
     .toBeVisible()
     .withTimeout(10000);
   ```

3. **Flaky tests**
   ```typescript
   // Use retry mechanism
   await retryOperation(async () => {
     await element(by.id('flaky-element')).tap();
   }, 3);
   ```

4. **Performance issues**
   ```bash
   # Run single worker
   npm run test:e2e -- --maxWorkers=1
   
   # Increase timeouts
   npm run test:e2e -- --testTimeout=180000
   ```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=detox* npm run test:e2e

# Run with Node debugger
node --inspect-brk e2e/scripts/runTests.js

# Take manual screenshots
await device.takeScreenshot('debug-screenshot');
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:e2e:ios -- --headless
      
  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:e2e:android -- --headless
```

### Performance Targets

- **Test Execution**: < 5 minutes for full suite
- **App Launch**: < 3 seconds
- **Screen Transitions**: < 500ms
- **Test Reliability**: > 95% pass rate

## 📚 Best Practices

### Test Design
1. **Independent Tests**: Each test should be self-contained
2. **Clear Assertions**: Use descriptive assertion messages
3. **Proper Cleanup**: Clean up test data after each test
4. **Realistic Data**: Use realistic test data and scenarios

### Performance
1. **Minimize App Reloads**: Reuse app state when possible
2. **Efficient Selectors**: Use specific test IDs over text matching
3. **Parallel Execution**: Run tests in parallel when safe
4. **Resource Management**: Clean up resources properly

### Maintenance
1. **Regular Updates**: Keep Detox and dependencies updated
2. **Test Reviews**: Review and refactor tests regularly
3. **Documentation**: Keep test documentation current
4. **Monitoring**: Monitor test execution times and reliability

## 🤝 Contributing

When adding new E2E tests:

1. Follow the established directory structure
2. Use the provided test helpers and utilities
3. Add appropriate test IDs to components
4. Include both positive and negative test cases
5. Update this documentation if needed

## 📞 Support

For E2E testing issues:

1. Check the troubleshooting section above
2. Review Detox documentation: https://wix.github.io/Detox/
3. Check existing GitHub issues
4. Create detailed bug reports with logs and screenshots

---

Happy Testing! 🧪✨
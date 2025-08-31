# Testing Troubleshooting Guide

## Overview

This guide provides solutions to common testing issues encountered in the GoalStreak application. It covers problems across unit tests, integration tests, end-to-end tests, and CI/CD pipeline issues.

## Table of Contents

1. [Jest and Unit Test Issues](#jest-and-unit-test-issues)
2. [React Native Testing Library Issues](#react-native-testing-library-issues)
3. [Firebase Emulator Issues](#firebase-emulator-issues)
4. [Detox E2E Test Issues](#detox-e2e-test-issues)
5. [Mock and Dependency Issues](#mock-and-dependency-issues)
6. [Performance and Timeout Issues](#performance-and-timeout-issues)
7. [CI/CD Pipeline Issues](#cicd-pipeline-issues)
8. [Platform-Specific Issues](#platform-specific-issues)
9. [Debug Strategies](#debug-strategies)

## Jest and Unit Test Issues

### Issue: Tests Timing Out

**Symptoms:**
```
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Common Causes:**
- Unresolved promises
- Missing await keywords
- Infinite loops in async operations
- Network requests not properly mocked

**Solutions:**

1. **Increase timeout for specific tests:**
```typescript
it('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

2. **Check for unresolved promises:**
```typescript
// Bad - missing await
it('should create habit', () => {
  habitService.createHabit(habitData); // Missing await
  expect(result).toBeDefined();
});

// Good - proper async handling
it('should create habit', async () => {
  const result = await habitService.createHabit(habitData);
  expect(result).toBeDefined();
});
```

3. **Use Jest's async utilities:**
```typescript
// For testing promises
await expect(asyncFunction()).resolves.toBe(expectedValue);
await expect(asyncFunction()).rejects.toThrow('Error message');
```

4. **Debug hanging tests:**
```bash
# Run with detectOpenHandles to find hanging operations
npm test -- --detectOpenHandles

# Run specific test with verbose output
npm test -- --verbose MyTest.test.ts
```

### Issue: Tests Failing Intermittently

**Symptoms:**
- Tests pass sometimes, fail other times
- Different results on different machines
- Race conditions in test execution

**Solutions:**

1. **Ensure proper test isolation:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});
```

2. **Use proper async/await patterns:**
```typescript
// Bad - race condition
it('should update state', () => {
  component.updateState();
  expect(component.state).toBe(newState); // May fail due to timing
});

// Good - wait for state update
it('should update state', async () => {
  await component.updateState();
  expect(component.state).toBe(newState);
});
```

3. **Mock time-dependent operations:**
```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should handle delayed operations', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);
  
  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```

### Issue: Module Resolution Errors

**Symptoms:**
```
Cannot find module '@/components/Button' from 'src/components/Button.test.tsx'
```

**Solutions:**

1. **Check Jest configuration in `jest.config.js`:**
```javascript
module.exports = {
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1'
  }
};
```

2. **Verify TypeScript path mapping in `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

3. **Use relative imports in tests if path mapping fails:**
```typescript
// Instead of
import Button from '@/components/Button';

// Use
import Button from '../../components/Button';
```

## React Native Testing Library Issues

### Issue: Component Not Found

**Symptoms:**
```
Unable to find an element with testID "submit-button"
```

**Solutions:**

1. **Verify testID is properly set:**
```typescript
// Component
<Button testID="submit-button">Submit</Button>

// Test
const { getByTestId } = render(<MyComponent />);
expect(getByTestId('submit-button')).toBeTruthy();
```

2. **Use debug to inspect component tree:**
```typescript
const { debug } = render(<MyComponent />);
debug(); // Prints component tree to console
```

3. **Check for conditional rendering:**
```typescript
// Component might not be rendered due to conditions
const { queryByTestId } = render(<MyComponent showButton={false} />);
expect(queryByTestId('submit-button')).toBeNull();
```

4. **Wait for async elements:**
```typescript
const { findByTestId } = render(<MyComponent />);
const button = await findByTestId('submit-button'); // Waits up to 1000ms
expect(button).toBeTruthy();
```

### Issue: Events Not Firing

**Symptoms:**
- `fireEvent.press()` doesn't trigger handlers
- Mock functions not being called

**Solutions:**

1. **Ensure proper event targeting:**
```typescript
// Make sure the element is pressable
<TouchableOpacity testID="button" onPress={onPress}>
  <Text>Press me</Text>
</TouchableOpacity>

// Test
fireEvent.press(getByTestId('button'));
```

2. **Check for disabled states:**
```typescript
// Component might be disabled
<Button disabled={isLoading} onPress={onPress} />

// Test with proper state
render(<MyComponent isLoading={false} />);
```

3. **Use proper event types:**
```typescript
// For text inputs
fireEvent.changeText(getByTestId('input'), 'new text');

// For scroll views
fireEvent.scroll(getByTestId('scroll-view'), {
  nativeEvent: { contentOffset: { y: 100 } }
});
```

### Issue: Async State Updates

**Symptoms:**
- State changes not reflected in tests
- Components not re-rendering after state updates

**Solutions:**

1. **Use waitFor for async updates:**
```typescript
import { waitFor } from '@testing-library/react-native';

it('should update after async operation', async () => {
  const { getByText } = render(<MyComponent />);
  
  fireEvent.press(getByTestId('load-button'));
  
  await waitFor(() => {
    expect(getByText('Loaded')).toBeTruthy();
  });
});
```

2. **Use act for state updates:**
```typescript
import { act } from '@testing-library/react-native';

it('should handle state updates', async () => {
  const { getByText } = render(<MyComponent />);
  
  await act(async () => {
    fireEvent.press(getByTestId('update-button'));
  });
  
  expect(getByText('Updated')).toBeTruthy();
});
```

## Firebase Emulator Issues

### Issue: Emulator Connection Failed

**Symptoms:**
```
Error: Could not reach Firestore emulator. Is it running?
```

**Solutions:**

1. **Start emulators before running tests:**
```bash
# Start emulators
firebase emulators:start --only firestore,auth

# In another terminal, run tests
npm run test:integration
```

2. **Check emulator configuration in `firebase.json`:**
```json
{
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "auth": {
      "port": 9099
    }
  }
}
```

3. **Verify emulator connection in test setup:**
```typescript
// src/__tests__/utils/firebaseEmulator.ts
import { connectFirestoreEmulator } from 'firebase/firestore';

export const setupFirebaseEmulator = () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
};
```

4. **Check for port conflicts:**
```bash
# Check if ports are in use
lsof -i :8080  # Firestore
lsof -i :9099  # Auth

# Kill processes if needed
kill -9 <PID>
```

### Issue: Emulator Data Persistence

**Symptoms:**
- Test data persists between test runs
- Tests failing due to existing data

**Solutions:**

1. **Clear emulator data between tests:**
```typescript
beforeEach(async () => {
  await testEnv.clearFirestore();
});
```

2. **Use isolated test environments:**
```typescript
describe('Habit Tests', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: `test-${Date.now()}`, // Unique project ID
      firestore: { rules: firestoreRules }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });
});
```

3. **Use test-specific collections:**
```typescript
const testCollectionName = `habits_test_${Date.now()}`;
const habitsRef = db.collection(testCollectionName);
```

### Issue: Security Rules Testing

**Symptoms:**
```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Solutions:**

1. **Verify security rules are loaded:**
```typescript
const testEnv = await initializeTestEnvironment({
  projectId: 'test-project',
  firestore: {
    rules: fs.readFileSync('firestore.rules', 'utf8')
  }
});
```

2. **Use proper authentication context:**
```typescript
// Authenticated user
const authenticatedContext = testEnv.authenticatedContext('user-123', {
  email: 'test@example.com'
});

// Unauthenticated user
const unauthenticatedContext = testEnv.unauthenticatedContext();
```

3. **Test both allowed and denied operations:**
```typescript
// Should succeed
await firebase.assertSucceeds(
  authenticatedContext.firestore()
    .collection('habits')
    .doc('habit-123')
    .set({ userId: 'user-123', name: 'Test' })
);

// Should fail
await firebase.assertFails(
  unauthenticatedContext.firestore()
    .collection('habits')
    .doc('habit-123')
    .get()
);
```

## Detox E2E Test Issues

### Issue: App Not Launching

**Symptoms:**
```
Error: Failed to launch app. Make sure the app is installed and the device is connected.
```

**Solutions:**

1. **Verify Detox configuration in `.detoxrc.js`:**
```javascript
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/GoalStreak.app',
      build: 'xcodebuild -workspace ios/GoalStreak.xcworkspace -scheme GoalStreak -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    }
  }
};
```

2. **Build app before running E2E tests:**
```bash
# Build for iOS
detox build --configuration ios.debug

# Build for Android
detox build --configuration android.debug

# Run tests
detox test --configuration ios.debug
```

3. **Check simulator/emulator status:**
```bash
# List iOS simulators
xcrun simctl list devices

# Start specific simulator
xcrun simctl boot "iPhone 14"

# List Android emulators
emulator -list-avds

# Start Android emulator
emulator -avd Pixel_4_API_30
```

### Issue: Element Not Found in E2E Tests

**Symptoms:**
```
Error: Cannot find element with id "login-button"
```

**Solutions:**

1. **Add proper testID to components:**
```typescript
// Component
<Button testID="login-button" onPress={handleLogin}>
  Login
</Button>

// E2E Test
await element(by.id('login-button')).tap();
```

2. **Use waitFor for async elements:**
```typescript
await waitFor(element(by.id('login-button')))
  .toBeVisible()
  .withTimeout(5000);
```

3. **Check element hierarchy:**
```typescript
// Use more specific selectors
await element(by.id('login-form').withDescendant(by.id('login-button'))).tap();
```

4. **Handle platform differences:**
```typescript
if (device.getPlatform() === 'ios') {
  await element(by.id('ios-specific-button')).tap();
} else {
  await element(by.id('android-specific-button')).tap();
}
```

### Issue: Flaky E2E Tests

**Symptoms:**
- Tests pass sometimes, fail other times
- Timing-related failures

**Solutions:**

1. **Add proper waits:**
```typescript
// Wait for element to appear
await waitFor(element(by.id('success-message')))
  .toBeVisible()
  .withTimeout(10000);

// Wait for element to disappear
await waitFor(element(by.id('loading-spinner')))
  .not.toBeVisible()
  .withTimeout(5000);
```

2. **Handle animations:**
```typescript
// Disable animations in test builds
if (__DEV__) {
  // Disable animations for testing
  UIManager.setLayoutAnimationEnabledExperimental(false);
}

// Or wait for animations to complete
await element(by.id('animated-button')).tap();
await new Promise(resolve => setTimeout(resolve, 1000));
```

3. **Use stable selectors:**
```typescript
// Prefer testID over text (text might change)
by.id('stable-test-id')           // Good
by.text('Dynamic Text')           // Avoid if text changes
by.label('Accessible Label')      // Good for accessibility
```

## Mock and Dependency Issues

### Issue: Mocks Not Working

**Symptoms:**
- Real services being called instead of mocks
- Mock functions not being tracked

**Solutions:**

1. **Ensure mocks are properly configured:**
```typescript
// Manual mock
jest.mock('../../services/habitService', () => ({
  createHabit: jest.fn(),
  getUserHabits: jest.fn()
}));

// Auto mock
jest.mock('../../services/habitService');
```

2. **Clear mocks between tests:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

3. **Mock at the right level:**
```typescript
// Mock the module, not the import
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn()
}));
```

4. **Use mock implementations:**
```typescript
const mockCreateHabit = jest.fn();
mockCreateHabit.mockResolvedValue({ id: 'habit-123' });

// Or with implementation
mockCreateHabit.mockImplementation(async (userId, habitData) => ({
  ...habitData,
  id: `habit-${Date.now()}`,
  userId
}));
```

### Issue: React Native Module Mocks

**Symptoms:**
```
Error: Cannot find module 'react-native-reanimated'
```

**Solutions:**

1. **Add React Native mocks to setup:**
```typescript
// src/__tests__/setup.ts
import 'react-native-gesture-handler/jestSetup';

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

2. **Create manual mocks for complex modules:**
```typescript
// __mocks__/react-native-vector-icons.js
export default 'Icon';
export const getImageSource = jest.fn();
```

3. **Mock Expo modules:**
```typescript
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true)
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn()
}));
```

## Performance and Timeout Issues

### Issue: Slow Test Execution

**Symptoms:**
- Tests take too long to run
- CI/CD pipeline timeouts

**Solutions:**

1. **Run tests in parallel:**
```bash
# Use multiple workers
npm test -- --maxWorkers=4

# Or use percentage of CPU cores
npm test -- --maxWorkers=50%
```

2. **Optimize test setup:**
```typescript
// Use beforeAll for expensive setup
beforeAll(async () => {
  await setupTestEnvironment();
});

// Use beforeEach only for test-specific setup
beforeEach(() => {
  jest.clearAllMocks();
});
```

3. **Use test.only for debugging:**
```typescript
// Run only specific tests during development
test.only('should handle specific case', () => {
  // Test code
});
```

4. **Skip slow tests in development:**
```typescript
const runSlowTests = process.env.RUN_SLOW_TESTS === 'true';

(runSlowTests ? test : test.skip)('slow integration test', async () => {
  // Slow test code
});
```

### Issue: Memory Leaks in Tests

**Symptoms:**
```
Error: Exceeded maximum memory usage
```

**Solutions:**

1. **Clean up after tests:**
```typescript
afterEach(() => {
  // Clear timers
  jest.clearAllTimers();
  
  // Clear mocks
  jest.clearAllMocks();
  
  // Reset modules
  jest.resetModules();
});
```

2. **Use --detectOpenHandles:**
```bash
npm test -- --detectOpenHandles --forceExit
```

3. **Limit test concurrency:**
```bash
npm test -- --maxWorkers=2 --runInBand
```

## CI/CD Pipeline Issues

### Issue: Tests Failing in CI but Passing Locally

**Symptoms:**
- Tests pass on local machine
- Same tests fail in GitHub Actions/CI

**Solutions:**

1. **Check environment differences:**
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
  env:
    NODE_ENV: test
    CI: true
    FIREBASE_PROJECT_ID: test-project
```

2. **Use consistent Node.js versions:**
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'
```

3. **Install dependencies consistently:**
```yaml
- run: npm ci  # Use ci instead of install for consistent installs
```

4. **Handle timing differences:**
```typescript
// Increase timeouts for CI
const timeout = process.env.CI ? 10000 : 5000;

it('should handle operation', async () => {
  // Test code
}, timeout);
```

### Issue: Firebase Emulator in CI

**Symptoms:**
- Emulator not starting in CI environment

**Solutions:**

1. **Install Firebase CLI in CI:**
```yaml
- name: Install Firebase CLI
  run: npm install -g firebase-tools

- name: Start Firebase Emulators
  run: firebase emulators:start --only firestore,auth --project test-project &

- name: Wait for emulators
  run: sleep 10

- name: Run integration tests
  run: npm run test:integration
```

2. **Use Docker for consistent environment:**
```yaml
services:
  firebase:
    image: firebase/firebase-tools
    command: firebase emulators:start --only firestore,auth
    ports:
      - 8080:8080
      - 9099:9099
```

## Platform-Specific Issues

### Issue: iOS Simulator Issues

**Symptoms:**
- Simulator not responding
- App crashes on iOS

**Solutions:**

1. **Reset simulator:**
```bash
xcrun simctl erase all
xcrun simctl boot "iPhone 14"
```

2. **Check iOS version compatibility:**
```javascript
// .detoxrc.js
devices: {
  simulator: {
    type: 'ios.simulator',
    device: {
      type: 'iPhone 14',
      os: 'iOS 16.0'  // Specify iOS version
    }
  }
}
```

3. **Handle iOS-specific permissions:**
```typescript
// Handle iOS permission dialogs
if (device.getPlatform() === 'ios') {
  await device.launchApp({
    permissions: { notifications: 'YES', camera: 'YES' }
  });
}
```

### Issue: Android Emulator Issues

**Symptoms:**
- Emulator not starting
- App installation failures

**Solutions:**

1. **Check Android SDK setup:**
```bash
# Verify Android SDK
echo $ANDROID_HOME
echo $ANDROID_SDK_ROOT

# List available emulators
emulator -list-avds
```

2. **Start emulator with proper configuration:**
```bash
emulator -avd Pixel_4_API_30 -no-snapshot-save -no-snapshot-load -wipe-data
```

3. **Handle Android permissions:**
```typescript
if (device.getPlatform() === 'android') {
  await device.launchApp({
    permissions: { notifications: 'YES' }
  });
}
```

## Debug Strategies

### 1. Jest Debugging

```bash
# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug specific test
npm run test:debug -- Button.test.tsx
```

### 2. Component Debugging

```typescript
import { render } from '@testing-library/react-native';

const { debug, getByTestId } = render(<MyComponent />);

// Print component tree
debug();

// Print specific element
debug(getByTestId('button'));
```

### 3. E2E Debugging

```bash
# Run with verbose logging
detox test --loglevel verbose

# Take screenshots
await device.takeScreenshot('debug-screenshot');

# Log element attributes
const attributes = await element(by.id('button')).getAttributes();
console.log('Element attributes:', attributes);
```

### 4. Network Debugging

```typescript
// Log network requests in tests
const originalFetch = global.fetch;
global.fetch = jest.fn((...args) => {
  console.log('Fetch called with:', args);
  return originalFetch(...args);
});
```

### 5. State Debugging

```typescript
// Debug React state in tests
const TestComponent = () => {
  const [state, setState] = useState(initialState);
  
  // Log state changes in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      console.log('State changed:', state);
    }
  }, [state]);
  
  return <MyComponent state={state} />;
};
```

## Getting Help

### 1. Check Logs
- Jest error messages
- Console output
- CI/CD logs
- Device/simulator logs

### 2. Isolate the Problem
- Run single test file
- Disable other tests
- Use minimal reproduction case

### 3. Community Resources
- [Jest Documentation](https://jestjs.io/docs/troubleshooting)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/docs/troubleshooting)
- [Detox Troubleshooting](https://github.com/wix/Detox/blob/master/docs/Troubleshooting.md)
- [Firebase Emulator Issues](https://firebase.google.com/docs/emulator-suite/connect_and_prototype)

### 4. Team Support
- Create detailed issue reports
- Include error messages and stack traces
- Provide minimal reproduction steps
- Share relevant configuration files

Remember: Most testing issues are related to timing, mocking, or environment configuration. Start with the basics and work your way up to more complex solutions.
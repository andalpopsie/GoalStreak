# Test Troubleshooting Guide

This guide helps developers diagnose and fix common testing issues in the GoalStreak application.

## Quick Diagnosis

### 1. Check Test Status
```bash
# Run all tests to see current status
npm run test:all

# Check specific test suites
npm run test:unit
npm run test:integration
npm run test:security
npm run test:performance
npm run test:e2e
```

### 2. Check Coverage
```bash
# Generate coverage report
npm run test:coverage

# Check coverage thresholds
npm run test:ci
```

## Common Issues and Solutions

### Firebase Emulator Issues

#### Problem: "ECONNREFUSED" or "Firebase emulator not running"
**Symptoms:**
- Integration tests fail with connection errors
- Error messages about ports 9099, 8080, or 9199

**Solutions:**
```bash
# 1. Start emulators manually
npm run emulators:start

# 2. Check if ports are in use
lsof -i :9099
lsof -i :8080
lsof -i :9199

# 3. Kill processes using the ports
kill -9 $(lsof -t -i:9099)
kill -9 $(lsof -t -i:8080)
kill -9 $(lsof -t -i:9199)

# 4. Clear emulator data
npm run emulators:clear

# 5. Restart emulators
npm run emulators:stop
npm run emulators:start
```

#### Problem: "Firebase project not found"
**Solutions:**
```bash
# 1. Check Firebase configuration
firebase projects:list

# 2. Set correct project
firebase use goalstreak-dev

# 3. Login to Firebase
firebase login
```

### Dependency Issues

#### Problem: "Module not found" or "Cannot resolve dependency"
**Solutions:**
```bash
# 1. Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# 2. Clear npm cache
npm cache clean --force

# 3. Check for version conflicts
npm ls --depth=0
```

#### Problem: "Peer dependency warnings"
**Solutions:**
```bash
# 1. Install missing peer dependencies
npm install --save-dev @types/jest

# 2. Update dependencies
npm update

# 3. Check compatibility
npm outdated
```

### Test Environment Issues

#### Problem: "ReferenceError: window is not defined"
**Symptoms:**
- Tests fail in Node.js environment
- Browser-specific APIs not available

**Solutions:**
```javascript
// Add to test setup file
global.window = {};
global.document = {};
global.navigator = { userAgent: 'node.js' };

// Or use jsdom environment
// In jest.config.js
module.exports = {
  testEnvironment: 'jsdom'
};
```

#### Problem: "Cannot read property of undefined"
**Solutions:**
```javascript
// 1. Add proper mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// 2. Check test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// 3. Add null checks in tests
expect(result?.data).toBeDefined();
```

### React Native Testing Issues

#### Problem: "Invariant Violation: Element type is invalid"
**Solutions:**
```javascript
// 1. Mock React Native components
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  // ... other components
}));

// 2. Use proper test renderer
import { render } from '@testing-library/react-native';

// 3. Check component imports
import { Button } from '../components/Button';
```

#### Problem: "Cannot find module 'react-native-reanimated'"
**Solutions:**
```javascript
// Add to jest setup
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
```

### Coverage Issues

#### Problem: "Coverage below threshold"
**Solutions:**
```bash
# 1. Check which files need coverage
npm run test:coverage -- --verbose

# 2. Add tests for uncovered files
# Focus on files with low coverage percentage

# 3. Exclude files from coverage if needed
# In jest.config.js
coveragePathIgnorePatterns: [
  '/node_modules/',
  '/__tests__/',
  '/coverage/',
]
```

#### Problem: "Coverage report not generated"
**Solutions:**
```bash
# 1. Check Jest configuration
cat jest.config.js

# 2. Ensure coverage is enabled
npm run test -- --coverage

# 3. Check file permissions
ls -la coverage/
```

### Performance Test Issues

#### Problem: "Performance tests timeout"
**Solutions:**
```javascript
// 1. Increase timeout in test
jest.setTimeout(30000);

// 2. Optimize test data
const smallDataset = createMockData(10); // Instead of 1000

// 3. Use performance.now() for accurate timing
const start = performance.now();
// ... test code
const end = performance.now();
expect(end - start).toBeLessThan(1000);
```

#### Problem: "Memory leak in performance tests"
**Solutions:**
```javascript
// 1. Clean up after tests
afterEach(() => {
  // Clear large objects
  mockData = null;
  
  // Force garbage collection (if --expose-gc flag is used)
  if (global.gc) {
    global.gc();
  }
});

// 2. Use weak references for large objects
const weakMap = new WeakMap();
```

### Security Test Issues

#### Problem: "Security tests fail with false positives"
**Solutions:**
```javascript
// 1. Update security test patterns
const securePatterns = {
  // More specific patterns to avoid false positives
  password: /password\s*=\s*['"][^'"]{8,}['"]/i,
  apiKey: /api[_-]?key\s*=\s*['"][^'"]{16,}['"]/i,
};

// 2. Exclude test files from security scans
if (!filePath.includes('__tests__') && !filePath.includes('.test.')) {
  // Run security checks
}
```

### E2E Test Issues

#### Problem: "Detox tests fail to start"
**Solutions:**
```bash
# 1. Rebuild Detox
npm run test:e2e:build

# 2. Check simulator/emulator status
xcrun simctl list devices
adb devices

# 3. Reset simulator
xcrun simctl erase all

# 4. Check Detox configuration
cat .detoxrc.js
```

#### Problem: "Element not found in E2E tests"
**Solutions:**
```javascript
// 1. Add proper test IDs
<Button testID="login-button">Login</Button>

// 2. Wait for elements
await waitFor(element(by.id('login-button')))
  .toBeVisible()
  .withTimeout(5000);

// 3. Use more specific selectors
await element(by.text('Login').and(by.type('Button'))).tap();
```

## Debugging Strategies

### 1. Isolate the Problem
```bash
# Run single test file
npm test -- Button.test.tsx

# Run specific test case
npm test -- --testNamePattern="should render correctly"

# Run with verbose output
npm test -- --verbose
```

### 2. Add Debug Information
```javascript
// Add console logs in tests
console.log('Test data:', testData);
console.log('Component props:', props);

// Use debug from testing library
import { render, screen, debug } from '@testing-library/react-native';

const { debug } = render(<Component />);
debug(); // Prints component tree
```

### 3. Check Test Environment
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Jest version
npx jest --version

# Check environment variables
env | grep NODE
```

### 4. Use Jest Debug Mode
```bash
# Run Jest in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open Chrome DevTools and go to chrome://inspect
```

## Performance Optimization

### 1. Speed Up Tests
```javascript
// Use fake timers
jest.useFakeTimers();

// Mock expensive operations
jest.mock('../services/expensiveService', () => ({
  expensiveOperation: jest.fn().mockResolvedValue('mocked result'),
}));

// Run tests in parallel (default)
// Or run in band for debugging
npm test -- --runInBand
```

### 2. Reduce Test Flakiness
```javascript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// Add proper cleanup
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Use deterministic data
const fixedDate = new Date('2025-01-01');
jest.spyOn(Date, 'now').mockReturnValue(fixedDate.getTime());
```

## Getting Help

### 1. Check Logs
```bash
# View detailed test output
npm test -- --verbose --no-coverage

# Check CI logs
# Go to GitHub Actions tab in repository
```

### 2. Common Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://github.com/wix/Detox)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### 3. Team Communication
- Create GitHub issue with test failure details
- Include error messages, stack traces, and environment info
- Tag relevant team members for assistance

## Preventive Measures

### 1. Regular Maintenance
```bash
# Update dependencies monthly
npm update

# Run security audit
npm audit

# Clean up old test artifacts
rm -rf coverage/ test-results/
```

### 2. Code Quality
```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### 3. Monitoring
- Set up test result notifications
- Monitor test execution times
- Track coverage trends
- Review test failure patterns

Remember: When in doubt, start with the simplest solution and work your way up to more complex debugging techniques.
# GoalStreak Testing Guide

## Overview

This comprehensive guide covers all aspects of testing in the GoalStreak application, from setup and execution to best practices and troubleshooting. Our testing strategy follows a pyramid approach with unit tests (70%), integration tests (20%), and end-to-end tests (10%).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Testing Architecture](#testing-architecture)
3. [Setup and Installation](#setup-and-installation)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Testing Patterns](#testing-patterns)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)
9. [Best Practices](#best-practices)

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Testing Architecture

### Test Types and Structure

```
src/__tests__/
├── unit/                    # Unit tests (70%)
│   ├── services/           # Service layer tests
│   ├── utils/              # Utility function tests
│   └── hooks/              # Custom hook tests
├── components/             # Component tests (20%)
│   ├── Button.test.tsx
│   ├── HabitCard.test.tsx
│   └── Input.test.tsx
├── integration/            # Integration tests (15%)
│   ├── firebase-*.test.ts
│   └── real-time-sync.test.ts
├── security/               # Security tests (5%)
│   ├── authentication*.test.ts
│   └── inputValidation.test.ts
├── performance/            # Performance tests (5%)
│   ├── load*.test.ts
│   └── component*.test.ts
├── mocks/                  # Mock implementations
├── factories/              # Test data factories
└── utils/                  # Test utilities

e2e/                        # End-to-end tests (10%)
├── tests/
│   ├── auth/
│   ├── habits/
│   ├── social/
│   └── cross-platform/
└── utils/
```

### Technology Stack

- **Jest**: Test runner and assertion library
- **React Native Testing Library**: Component testing
- **Detox**: End-to-end testing
- **Firebase Emulators**: Integration testing
- **ESLint Security**: Static security analysis

## Setup and Installation

### Prerequisites

```bash
# Node.js 18+ and npm
node --version  # Should be 18+
npm --version

# Firebase CLI for emulators
npm install -g firebase-tools

# Detox CLI for E2E tests
npm install -g detox-cli
```

### Initial Setup

1. **Install Dependencies**
   ```bash
   cd GoalStreakApp
   npm install
   ```

2. **Configure Firebase Emulators**
   ```bash
   # Login to Firebase
   firebase login
   
   # Initialize emulators (if not already done)
   firebase init emulators
   ```

3. **Setup Test Environment**
   ```bash
   # Copy environment template
   cp .env.test.example .env.test
   
   # Configure test Firebase project
   # Edit .env.test with your test project credentials
   ```

4. **Verify Setup**
   ```bash
   # Run basic test to verify setup
   npm run test:setup
   ```

### IDE Configuration

#### VS Code Setup

Create `.vscode/settings.json`:
```json
{
  "jest.jestCommandLine": "npm test --",
  "jest.autoRun": {
    "watch": false,
    "onStartup": ["all-tests"]
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

Recommended extensions:
- Jest Runner
- ES6 Mocha Snippets
- Firebase Explorer

## Running Tests

### Test Commands

```bash
# Basic test commands
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run with coverage report

# Specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:security     # Security tests only
npm run test:performance  # Performance tests only

# Test specific files or patterns
npm test Button            # Run tests matching "Button"
npm test -- --testPathPattern=components  # Run component tests
npm test -- --testNamePattern="should render"  # Run specific test cases

# Debug mode
npm run test:debug         # Run tests with debugger
npm run test:debug Button  # Debug specific test file
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html

# Coverage thresholds (configured in jest.config.js)
# - Statements: 80%
# - Branches: 80%
# - Functions: 80%
# - Lines: 80%
```

### Firebase Emulator Tests

```bash
# Start Firebase emulators
npm run emulators:start

# Run integration tests (requires emulators)
npm run test:integration

# Stop emulators
npm run emulators:stop
```

### End-to-End Tests

```bash
# Build app for testing
npm run build:e2e

# Run E2E tests
npm run test:e2e

# Run E2E tests on specific platform
npm run test:e2e:ios
npm run test:e2e:android

# Run specific E2E test suite
npm run test:e2e -- --testNamePattern="Habit Workflow"
```

## Writing Tests

### Unit Test Example

```typescript
// src/__tests__/services/habitService.test.ts
import { habitService } from '../../services/habitService';
import { createMockHabit } from '../factories/habitFactory';

describe('HabitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHabit', () => {
    it('should create habit with valid data', async () => {
      // Arrange
      const habitData = createMockHabit({
        name: 'Morning Workout',
        category: 'fitness'
      });

      // Act
      const result = await habitService.createHabit('user-123', habitData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.name).toBe('Morning Workout');
    });

    it('should throw error for invalid data', async () => {
      // Arrange
      const invalidData = { name: '' };

      // Act & Assert
      await expect(
        habitService.createHabit('user-123', invalidData)
      ).rejects.toThrow('Invalid habit name');
    });
  });
});
```

### Component Test Example

```typescript
// src/__tests__/components/HabitCard.test.tsx
import React from 'react';
import { render, fireEvent } from '../utils/testUtils';
import HabitCard from '../../components/HabitCard';
import { createMockHabit } from '../factories/habitFactory';

describe('HabitCard', () => {
  const mockHabit = createMockHabit();
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders habit information correctly', () => {
    const { getByText } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} />
    );

    expect(getByText(mockHabit.name)).toBeTruthy();
  });

  it('calls onToggle when pressed', () => {
    const { getByTestId } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} />
    );

    fireEvent.press(getByTestId('habit-card'));
    expect(mockOnToggle).toHaveBeenCalledWith(mockHabit.id);
  });

  it('shows loading state', () => {
    const { getByTestId } = render(
      <HabitCard 
        habit={mockHabit} 
        onToggle={mockOnToggle}
        isLoading={true}
      />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### Integration Test Example

```typescript
// src/__tests__/integration/firebase-habits.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { habitService } from '../../services/habitService';

describe('Firebase Habits Integration', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'goalstreak-test',
      firestore: { rules: firestoreRules }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should create and retrieve habits', async () => {
    const userId = 'test-user';
    const habitData = {
      name: 'Integration Test Habit',
      category: 'fitness',
      frequency: 'daily'
    };

    // Create habit
    const habitId = await habitService.createHabit(userId, habitData);
    expect(habitId).toBeDefined();

    // Retrieve habits
    const habits = await habitService.getUserHabits(userId);
    expect(habits).toHaveLength(1);
    expect(habits[0].name).toBe('Integration Test Habit');
  });
});
```

### E2E Test Example

```typescript
// e2e/tests/habits/habitWorkflow.test.ts
import { by, device, element, expect } from 'detox';

describe('Habit Workflow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete full habit creation workflow', async () => {
    // Navigate to create habit
    await element(by.id('add-habit-button')).tap();

    // Fill habit form
    await element(by.id('habit-name-input')).typeText('Morning Run');
    await element(by.id('category-fitness')).tap();
    await element(by.id('create-habit-button')).tap();

    // Verify habit appears
    await expect(element(by.text('Morning Run'))).toBeVisible();

    // Complete habit
    await element(by.id('habit-Morning Run')).tap();

    // Verify completion
    await expect(element(by.id('completed-indicator'))).toBeVisible();
  });
});
```

## Testing Patterns

### 1. Arrange-Act-Assert (AAA) Pattern

```typescript
it('should calculate streak correctly', () => {
  // Arrange
  const completions = [
    { date: '2025-01-01', completed: true },
    { date: '2025-01-02', completed: true },
    { date: '2025-01-03', completed: false }
  ];

  // Act
  const streak = calculateStreak(completions);

  // Assert
  expect(streak).toBe(2);
});
```

### 2. Test Data Factories

```typescript
// Use factories for consistent test data
const habit = createMockHabit({
  name: 'Custom Habit Name',
  category: 'fitness'
});

// Instead of inline objects
const habit = {
  id: 'habit-123',
  name: 'Custom Habit Name',
  // ... many more properties
};
```

### 3. Mock External Dependencies

```typescript
// Mock Firebase services
jest.mock('../../services/firebase', () => ({
  db: mockFirestore,
  auth: mockAuth
}));

// Mock React Native modules
jest.mock('react-native-reanimated', () => 
  require('react-native-reanimated/mock')
);
```

### 4. Test Error Scenarios

```typescript
it('should handle network errors gracefully', async () => {
  // Mock network failure
  mockFirestore.collection.mockRejectedValue(
    new Error('Network error')
  );

  // Test error handling
  await expect(habitService.getHabits()).rejects.toThrow('Network error');
});
```

### 5. Async Testing Patterns

```typescript
// Using async/await
it('should load habits asynchronously', async () => {
  const habits = await habitService.getHabits();
  expect(habits).toBeDefined();
});

// Using waitFor for UI updates
it('should show loading state', async () => {
  render(<HabitList />);
  
  await waitFor(() => {
    expect(screen.getByTestId('loading')).toBeTruthy();
  });
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Tests Timing Out

**Problem**: Tests fail with timeout errors
```
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Solutions**:
```typescript
// Increase timeout for specific tests
it('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout

// Use proper async/await
await waitFor(() => {
  expect(element).toBeVisible();
}, { timeout: 10000 });

// Check for unresolved promises
// Make sure all async operations are properly awaited
```

#### 2. Firebase Emulator Issues

**Problem**: Firebase emulator connection errors

**Solutions**:
```bash
# Check if emulators are running
firebase emulators:start --only firestore,auth

# Clear emulator data
firebase emulators:exec --only firestore "npm run test:integration"

# Check emulator ports
lsof -i :8080  # Firestore
lsof -i :9099  # Auth
```

#### 3. React Native Testing Library Issues

**Problem**: Component not found or rendering issues

**Solutions**:
```typescript
// Use proper test IDs
<Button testID="submit-button">Submit</Button>

// Wait for async updates
await waitFor(() => {
  expect(getByText('Success')).toBeTruthy();
});

// Use proper queries
getByTestId('button')     // Throws if not found
queryByTestId('button')   // Returns null if not found
findByTestId('button')    // Async, waits for element
```

#### 4. Mock Issues

**Problem**: Mocks not working correctly

**Solutions**:
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Reset modules for clean state
beforeEach(() => {
  jest.resetModules();
});

// Manual mock implementation
jest.mock('../../services/habitService', () => ({
  createHabit: jest.fn().mockResolvedValue({ id: 'test-id' })
}));
```

#### 5. E2E Test Failures

**Problem**: Detox tests failing or flaky

**Solutions**:
```typescript
// Add proper waits
await waitFor(element(by.id('button'))).toBeVisible().withTimeout(5000);

// Use stable selectors
by.id('stable-test-id')           // Preferred
by.text('Dynamic Text')           // Avoid if text changes

// Handle animations
await element(by.id('button')).tap();
await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for animation
```

### Debug Strategies

#### 1. Debug Jest Tests

```bash
# Run with debugger
npm run test:debug

# Add breakpoints in code
debugger;

# Use console.log strategically
console.log('Test data:', testData);
```

#### 2. Debug Component Tests

```typescript
// Use debug utility
import { render } from '@testing-library/react-native';

const { debug } = render(<Component />);
debug(); // Prints component tree
```

#### 3. Debug E2E Tests

```bash
# Run with verbose logging
detox test --loglevel verbose

# Take screenshots on failure
await device.takeScreenshot('failure-screenshot');

# Use element inspection
await element(by.id('button')).tap();
console.log(await element(by.id('button')).getAttributes());
```

### Performance Issues

#### 1. Slow Test Execution

**Solutions**:
- Run tests in parallel: `npm test -- --maxWorkers=4`
- Use `--onlyChanged` flag for faster feedback
- Optimize test setup and teardown
- Use shallow rendering when appropriate

#### 2. Memory Leaks

**Solutions**:
- Clear timers and intervals in cleanup
- Unsubscribe from observables
- Clear mocks and reset modules
- Use `--detectOpenHandles` to find leaks

## Contributing

### Adding New Tests

1. **Choose the Right Test Type**
   - Unit tests for isolated functions/components
   - Integration tests for service interactions
   - E2E tests for complete user workflows

2. **Follow Naming Conventions**
   ```
   ComponentName.test.tsx
   serviceName.test.ts
   featureName.integration.test.ts
   userWorkflow.e2e.test.ts
   ```

3. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should create habit with valid data and return habit ID')
   
   // Bad
   it('should work')
   ```

4. **Follow Test Structure**
   ```typescript
   describe('ComponentName', () => {
     describe('methodName', () => {
       it('should do something specific', () => {
         // Test implementation
       });
     });
   });
   ```

### Code Review Checklist

- [ ] Tests cover happy path and error scenarios
- [ ] Test names are descriptive and clear
- [ ] Proper use of mocks and test data
- [ ] No hardcoded values or magic numbers
- [ ] Async operations properly handled
- [ ] Tests are isolated and don't depend on each other
- [ ] Performance considerations addressed
- [ ] Accessibility testing included where relevant

### Test Coverage Guidelines

- **Minimum Coverage**: 80% for all metrics
- **Critical Paths**: 95%+ coverage required
- **New Features**: Must include comprehensive tests
- **Bug Fixes**: Must include regression tests

## Best Practices

### 1. Test Organization

```typescript
// Group related tests
describe('HabitService', () => {
  describe('createHabit', () => {
    it('should create habit with valid data');
    it('should throw error for invalid data');
    it('should handle network failures');
  });
  
  describe('updateHabit', () => {
    // Update-related tests
  });
});
```

### 2. Test Data Management

```typescript
// Use factories for consistent data
const habit = createMockHabit({
  name: 'Test Habit',
  category: 'fitness'
});

// Avoid magic numbers
const EXPECTED_STREAK_LENGTH = 7;
expect(streak.length).toBe(EXPECTED_STREAK_LENGTH);
```

### 3. Async Testing

```typescript
// Always await async operations
await expect(asyncFunction()).resolves.toBe(expectedValue);

// Use proper timeout handling
await waitFor(() => {
  expect(element).toBeVisible();
}, { timeout: 5000 });
```

### 4. Error Testing

```typescript
// Test both success and failure scenarios
it('should handle authentication errors', async () => {
  mockAuth.signIn.mockRejectedValue(new Error('Invalid credentials'));
  
  await expect(authService.signIn(email, password))
    .rejects.toThrow('Invalid credentials');
});
```

### 5. Performance Testing

```typescript
// Test performance-critical operations
it('should render large habit list efficiently', () => {
  const startTime = performance.now();
  
  render(<HabitList habits={largeHabitList} />);
  
  const renderTime = performance.now() - startTime;
  expect(renderTime).toBeLessThan(100); // 100ms threshold
});
```

### 6. Accessibility Testing

```typescript
// Include accessibility checks
it('should be accessible', () => {
  const { getByLabelText } = render(<HabitCard habit={mockHabit} />);
  
  expect(getByLabelText('Complete habit')).toBeTruthy();
});
```

## Resources

### Documentation Links
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://github.com/wix/Detox)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### Internal Resources
- [Test Troubleshooting Guide](./TEST_TROUBLESHOOTING.md)
- [Performance Testing Guide](../PERFORMANCE_TESTING.md)
- [Security Testing Guide](../SECURITY_TESTING_SUMMARY.md)
- [Testing Setup Guide](../TESTING_SETUP.md)

### Team Contacts
- **Testing Lead**: [Your Name] - [email]
- **DevOps**: [DevOps Team] - [email]
- **Security**: [Security Team] - [email]

---

*This guide is a living document. Please contribute improvements and updates as our testing practices evolve.*
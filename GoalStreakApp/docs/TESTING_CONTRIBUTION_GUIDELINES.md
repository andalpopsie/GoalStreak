# Testing Contribution Guidelines

## Overview

This document provides guidelines for contributing to the GoalStreak testing suite. Whether you're adding new features, fixing bugs, or improving existing functionality, following these guidelines ensures our tests remain maintainable, reliable, and effective.

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Test Requirements](#test-requirements)
3. [Writing New Tests](#writing-new-tests)
4. [Test Review Process](#test-review-process)
5. [Testing Standards](#testing-standards)
6. [Common Patterns](#common-patterns)
7. [Documentation Requirements](#documentation-requirements)
8. [Performance Considerations](#performance-considerations)

## Before You Start

### Prerequisites

1. **Read the Testing Guide**: Familiarize yourself with our [Testing Guide](./TESTING_GUIDE.md)
2. **Understand the Architecture**: Review the [Testing Patterns](./TESTING_PATTERNS.md)
3. **Set Up Your Environment**: Follow the setup instructions in [Testing Setup](../TESTING_SETUP.md)

### Development Workflow

1. **Create a Feature Branch**: 
   ```bash
   git checkout -b feature/add-habit-validation-tests
   ```

2. **Write Tests First (TDD)**: When adding new features, write tests before implementation
3. **Run Tests Locally**: Ensure all tests pass before submitting
4. **Update Documentation**: Update relevant documentation for new testing patterns

## Test Requirements

### Coverage Requirements

All new code must meet these coverage thresholds:

- **Statements**: 80% minimum
- **Branches**: 80% minimum  
- **Functions**: 80% minimum
- **Lines**: 80% minimum

**Critical paths require 95%+ coverage:**
- Authentication flows
- Data persistence operations
- Security-related functions
- Payment/subscription logic (when implemented)

### Test Types Required

For each new feature, provide:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test interactions between components/services
3. **E2E Tests**: Test critical user workflows (for major features)
4. **Security Tests**: Test input validation and security measures
5. **Performance Tests**: Test performance-critical operations

### Regression Tests

When fixing bugs:
- **Always add a regression test** that reproduces the bug
- Ensure the test fails before the fix and passes after
- Document the bug scenario in the test description

## Writing New Tests

### Test File Organization

```
src/__tests__/
├── unit/
│   ├── services/
│   │   └── newService.test.ts
│   └── utils/
│       └── newUtil.test.ts
├── components/
│   └── NewComponent.test.tsx
├── integration/
│   └── newFeature.integration.test.ts
├── security/
│   └── newFeature.security.test.ts
└── performance/
    └── newFeature.performance.test.ts
```

### Naming Conventions

**Test Files:**
```
ComponentName.test.tsx
serviceName.test.ts
utilityName.test.ts
featureName.integration.test.ts
featureName.e2e.test.ts
```

**Test Descriptions:**
```typescript
// Good - Descriptive and specific
describe('HabitService', () => {
  describe('createHabit', () => {
    it('should create habit with valid data and return habit ID', () => {});
    it('should throw ValidationError for empty habit name', () => {});
    it('should handle Firestore connection errors gracefully', () => {});
  });
});

// Bad - Vague and unclear
describe('HabitService', () => {
  it('should work', () => {});
  it('should handle errors', () => {});
});
```

### Test Structure Template

```typescript
// Unit Test Template
describe('ComponentName/ServiceName', () => {
  // Setup and teardown
  let component: ComponentType;
  let mockDependency: jest.Mocked<DependencyType>;

  beforeEach(() => {
    mockDependency = createMockDependency();
    component = new ComponentType(mockDependency);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle happy path scenario', () => {
      // Arrange
      const input = createValidInput();
      const expectedOutput = createExpectedOutput();

      // Act
      const result = component.methodName(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should handle error scenario', () => {
      // Arrange
      const invalidInput = createInvalidInput();

      // Act & Assert
      expect(() => component.methodName(invalidInput))
        .toThrow('Expected error message');
    });

    it('should handle edge case', () => {
      // Test edge cases, boundary conditions, etc.
    });
  });
});
```

### Component Test Template

```typescript
// Component Test Template
import React from 'react';
import { render, fireEvent, waitFor } from '../utils/testUtils';
import ComponentName from '../../components/ComponentName';
import { createMockProps } from '../factories/componentFactory';

describe('ComponentName', () => {
  const defaultProps = createMockProps();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByTestId } = render(<ComponentName {...defaultProps} />);
      expect(getByTestId('component-name')).toBeTruthy();
    });

    it('should display correct content', () => {
      const { getByText } = render(<ComponentName {...defaultProps} />);
      expect(getByText(defaultProps.title)).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should handle button press', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <ComponentName {...defaultProps} onPress={mockOnPress} />
      );

      fireEvent.press(getByTestId('action-button'));

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Management', () => {
    it('should update state on user input', async () => {
      const { getByTestId, getByText } = render(<ComponentName {...defaultProps} />);

      fireEvent.changeText(getByTestId('input-field'), 'new value');

      await waitFor(() => {
        expect(getByText('new value')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failure', async () => {
      const propsWithError = { ...defaultProps, hasError: true };
      const { getByText } = render(<ComponentName {...propsWithError} />);

      expect(getByText('Error message')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(<ComponentName {...defaultProps} />);
      expect(getByLabelText('Component description')).toBeTruthy();
    });
  });
});
```

## Test Review Process

### Self-Review Checklist

Before submitting your tests, ensure:

- [ ] **All tests pass locally**
- [ ] **Coverage thresholds are met**
- [ ] **Tests follow naming conventions**
- [ ] **Tests are properly organized**
- [ ] **Mock dependencies are used appropriately**
- [ ] **Tests are isolated and independent**
- [ ] **Error scenarios are tested**
- [ ] **Edge cases are covered**
- [ ] **Accessibility is tested (for components)**
- [ ] **Performance is considered**
- [ ] **Documentation is updated**

### Code Review Guidelines

**For Reviewers:**

1. **Test Quality**:
   - Are tests testing behavior, not implementation?
   - Do tests have clear, descriptive names?
   - Are assertions specific and meaningful?

2. **Coverage**:
   - Are all code paths tested?
   - Are error scenarios covered?
   - Are edge cases handled?

3. **Maintainability**:
   - Are tests easy to understand?
   - Are test utilities reused appropriately?
   - Is test data managed consistently?

4. **Performance**:
   - Do tests run efficiently?
   - Are expensive operations mocked?
   - Is test setup optimized?

**Review Comments Examples:**

```typescript
// Good feedback
"Consider testing the error scenario when the API returns a 500 status code"
"This test could be more specific - what exactly should the validation error message be?"
"Great use of the factory pattern for test data!"

// Avoid vague feedback
"This test is wrong"
"Fix this"
"Needs improvement"
```

## Testing Standards

### Assertion Guidelines

**Use Specific Assertions:**
```typescript
// Good - Specific and clear
expect(result.id).toBe('habit-123');
expect(result.name).toBe('Morning Workout');
expect(result.createdAt).toBeInstanceOf(Date);

// Bad - Too generic
expect(result).toBeTruthy();
expect(result).toBeDefined();
```

**Test Error Messages:**
```typescript
// Good - Test specific error messages
expect(() => validateHabit(invalidHabit))
  .toThrow('Habit name must be at least 2 characters');

// Bad - Generic error testing
expect(() => validateHabit(invalidHabit)).toThrow();
```

### Mock Guidelines

**Mock External Dependencies:**
```typescript
// Good - Mock external services
jest.mock('../../services/firebase', () => ({
  db: mockFirestore,
  auth: mockAuth
}));

// Bad - Don't mock internal utilities unless necessary
jest.mock('../../utils/dateUtils'); // Usually not needed
```

**Use Realistic Mock Data:**
```typescript
// Good - Realistic mock data
const mockHabit = createMockHabit({
  name: 'Morning Meditation',
  category: 'mindfulness',
  createdAt: new Date('2025-01-01')
});

// Bad - Unrealistic or minimal data
const mockHabit = { id: '1', name: 'test' };
```

### Async Testing Standards

**Always Use Proper Async Patterns:**
```typescript
// Good - Proper async/await
it('should create habit asynchronously', async () => {
  const result = await habitService.createHabit(habitData);
  expect(result.id).toBeDefined();
});

// Bad - Missing await
it('should create habit', () => {
  const result = habitService.createHabit(habitData); // Missing await
  expect(result.id).toBeDefined(); // Will fail
});
```

**Use waitFor for UI Updates:**
```typescript
// Good - Wait for async UI updates
it('should show success message', async () => {
  fireEvent.press(getByTestId('submit-button'));
  
  await waitFor(() => {
    expect(getByText('Success!')).toBeTruthy();
  });
});
```

## Common Patterns

### Test Data Factories

**Always use factories for consistent test data:**
```typescript
// Create factory functions
export const createMockHabit = (overrides = {}) => ({
  id: `habit-${Date.now()}`,
  userId: 'user-123',
  name: 'Default Habit',
  category: 'fitness',
  frequency: 'daily',
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Use in tests
const fitnessHabit = createMockHabit({ 
  category: 'fitness', 
  name: 'Morning Run' 
});
```

### Custom Render Function

**Use custom render for consistent component testing:**
```typescript
// Custom render with providers
const customRender = (ui, options = {}) => {
  const AllProviders = ({ children }) => (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );

  return render(ui, { wrapper: AllProviders, ...options });
};

// Use in tests
const { getByText } = customRender(<MyComponent />);
```

### Error Testing Pattern

**Test both success and failure scenarios:**
```typescript
describe('createHabit', () => {
  it('should create habit successfully', async () => {
    // Test success case
  });

  it('should handle validation errors', async () => {
    // Test validation failure
  });

  it('should handle network errors', async () => {
    // Test network failure
  });

  it('should handle permission errors', async () => {
    // Test permission failure
  });
});
```

## Documentation Requirements

### Test Documentation

**Document complex test scenarios:**
```typescript
/**
 * Test Case: Streak Calculation with Timezone Changes
 * 
 * Scenario: User completes habits across different timezones
 * Expected: Streak calculation should account for user's local timezone
 * 
 * Business Rule: Streaks are calculated based on consecutive days
 * in the user's local timezone, not UTC.
 */
it('should calculate streaks correctly across timezones', () => {
  // Test implementation
});
```

**Document test utilities:**
```typescript
/**
 * Creates a mock habit with realistic default values
 * 
 * @param overrides - Properties to override in the mock habit
 * @returns Mock habit object with all required properties
 * 
 * @example
 * const fitnessHabit = createMockHabit({ 
 *   category: 'fitness',
 *   name: 'Morning Run' 
 * });
 */
export const createMockHabit = (overrides = {}) => {
  // Implementation
};
```

### README Updates

When adding new test categories or patterns:

1. Update the main [Testing Guide](./TESTING_GUIDE.md)
2. Add examples to [Testing Patterns](./TESTING_PATTERNS.md)
3. Update troubleshooting guides if needed
4. Document any new test utilities or helpers

## Performance Considerations

### Test Performance Guidelines

**Keep tests fast:**
- Unit tests should run in < 100ms each
- Integration tests should run in < 1s each
- E2E tests should run in < 30s each

**Optimize test setup:**
```typescript
// Good - Expensive setup in beforeAll
beforeAll(async () => {
  await setupTestDatabase();
  await seedTestData();
});

// Bad - Expensive setup in beforeEach
beforeEach(async () => {
  await setupTestDatabase(); // Too slow for each test
});
```

**Use appropriate test granularity:**
```typescript
// Good - Test specific functionality
it('should validate email format', () => {
  expect(validateEmail('invalid')).toBe(false);
});

it('should validate email length', () => {
  expect(validateEmail('a'.repeat(300) + '@test.com')).toBe(false);
});

// Bad - One test doing too much
it('should validate all email scenarios', () => {
  // Testing 20 different scenarios in one test
});
```

### Memory Management

**Clean up after tests:**
```typescript
afterEach(() => {
  // Clear mocks
  jest.clearAllMocks();
  
  // Clear timers
  jest.clearAllTimers();
  
  // Clean up subscriptions
  cleanup();
});
```

**Avoid memory leaks:**
```typescript
// Good - Proper cleanup
const subscription = observable.subscribe(callback);
afterEach(() => {
  subscription.unsubscribe();
});

// Bad - No cleanup
observable.subscribe(callback); // Memory leak
```

## Getting Help

### Resources

1. **Documentation**: Check existing testing guides and patterns
2. **Examples**: Look at similar tests in the codebase
3. **Team**: Ask team members for guidance on complex scenarios
4. **Community**: Refer to Jest, React Native Testing Library, and Detox documentation

### Asking for Help

When asking for help, provide:

1. **Context**: What are you trying to test?
2. **Current Code**: What have you tried?
3. **Error Messages**: Include full error messages and stack traces
4. **Expected Behavior**: What should happen?
5. **Environment**: Local vs CI, platform differences, etc.

### Contributing Back

If you solve a testing problem:

1. **Document the solution** in the troubleshooting guide
2. **Create reusable utilities** for common patterns
3. **Share knowledge** with the team
4. **Update guidelines** if you discover better practices

## Examples and Templates

### New Feature Test Checklist

When adding a new feature, create tests for:

- [ ] **Happy path scenarios**
- [ ] **Input validation**
- [ ] **Error handling**
- [ ] **Edge cases**
- [ ] **Security considerations**
- [ ] **Performance impact**
- [ ] **Accessibility**
- [ ] **Cross-platform compatibility**

### Bug Fix Test Checklist

When fixing a bug:

- [ ] **Reproduce the bug with a test**
- [ ] **Verify the test fails before the fix**
- [ ] **Implement the fix**
- [ ] **Verify the test passes after the fix**
- [ ] **Add related edge case tests**
- [ ] **Update documentation if needed**

Remember: Good tests are an investment in the future maintainability and reliability of our application. Take the time to write quality tests that will help the team move fast with confidence.
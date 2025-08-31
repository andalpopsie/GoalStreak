# Comprehensive Testing Suite Design

## Overview

This design document outlines the technical implementation of a comprehensive testing infrastructure for GoalStreak. The testing suite will provide multiple layers of testing (unit, integration, component, E2E, security) with automated CI/CD integration to ensure code quality, security, and reliability.

## Architecture

### Testing Pyramid Structure

```
    E2E Tests (5%)
   ┌─────────────────┐
   │   Detox/Maestro │
   └─────────────────┘
  
  Integration Tests (15%)
 ┌───────────────────────┐
 │ Firebase Emulators    │
 │ Service Integration   │
 └───────────────────────┘

Component Tests (30%)
┌─────────────────────────────┐
│ React Native Testing Library│
│ Component Behavior Testing  │
└─────────────────────────────┘

Unit Tests (50%)
┌───────────────────────────────────┐
│ Jest + TypeScript                 │
│ Services, Hooks, Utils Testing    │
└───────────────────────────────────┘
```

### Technology Stack

**Core Testing Framework:**
- **Jest**: Primary test runner and assertion library
- **React Native Testing Library**: Component testing
- **Firebase Emulators**: Integration testing environment
- **Detox**: End-to-end testing framework
- **ESLint Security**: Static security analysis

**Additional Tools:**
- **@testing-library/react-hooks**: Hook testing
- **jest-expo**: Expo-specific Jest configuration
- **firebase-functions-test**: Firebase Functions testing
- **codecov**: Coverage reporting
- **husky**: Git hooks for automated testing

## Components and Interfaces

### 1. Test Configuration Layer

```typescript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### 2. Mock Infrastructure

```typescript
// src/__mocks__/firebase.ts
export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    })),
    add: jest.fn(),
    where: jest.fn(() => mockFirestore.collection()),
    orderBy: jest.fn(() => mockFirestore.collection()),
    get: jest.fn(() => ({ docs: [] }))
  }))
};

// src/__mocks__/react-native-reanimated.js
export default {
  Value: jest.fn(),
  event: jest.fn(),
  add: jest.fn(),
  eq: jest.fn(),
  set: jest.fn(),
  cond: jest.fn(),
  interpolate: jest.fn(),
  View: jest.fn(),
  Extrapolate: { CLAMP: jest.fn() },
  Transition: { Together: { sequence: jest.fn() } },
  Easing: { in: jest.fn(), out: jest.fn(), inOut: jest.fn() }
};
```

### 3. Test Data Factory

```typescript
// src/__tests__/factories/habitFactory.ts
import { Habit, HabitCategory, HabitFrequency } from '../../types';

export const createMockHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-123',
  userId: 'user-123',
  name: 'Morning Workout',
  category: 'fitness' as HabitCategory,
  frequency: 'daily' as HabitFrequency,
  isPublic: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides
});
```

### 4. Component Testing Framework

```typescript
// src/__tests__/utils/testUtils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { AuthProvider } from '../../hooks/useAuth';
import { NavigationContainer } from '@react-navigation/native';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NavigationContainer>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
```

## Data Models

### Test Configuration Models

```typescript
// src/__tests__/types/testTypes.ts
export interface TestConfig {
  timeout: number;
  retries: number;
  setupTimeout: number;
  teardownTimeout: number;
}

export interface MockFirebaseConfig {
  projectId: string;
  auth: {
    uid: string;
    email: string;
  };
  firestore: {
    host: string;
    port: number;
  };
}

export interface TestUser {
  uid: string;
  email: string;
  displayName: string;
  customClaims?: Record<string, any>;
}

export interface TestHabit {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  streak: number;
}
```

### Security Test Models

```typescript
// src/__tests__/security/securityTestTypes.ts
export interface SecurityTestCase {
  name: string;
  description: string;
  input: any;
  expectedResult: 'pass' | 'fail';
  vulnerability: string;
}

export interface AuthSecurityTest {
  testType: 'password' | 'session' | 'token';
  scenario: string;
  maliciousInput: string;
  expectedBehavior: string;
}
```

## Error Handling

### Test Error Management

```typescript
// src/__tests__/utils/errorHandling.ts
export class TestError extends Error {
  constructor(
    message: string,
    public testType: string,
    public component?: string
  ) {
    super(message);
    this.name = 'TestError';
  }
}

export const handleTestError = (error: Error, context: string) => {
  console.error(`Test failed in ${context}:`, error.message);
  
  if (error.message.includes('Firebase')) {
    throw new TestError(
      'Firebase emulator not running. Run: firebase emulators:start',
      'integration',
      context
    );
  }
  
  if (error.message.includes('Network')) {
    throw new TestError(
      'Network connectivity required for this test',
      'integration',
      context
    );
  }
  
  throw error;
};
```

### Async Test Utilities

```typescript
// src/__tests__/utils/asyncUtils.ts
export const waitForAsync = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));
```

## Testing Strategy

### 1. Unit Testing Strategy

**Services Testing:**
```typescript
// Example: habitService.test.ts
describe('HabitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHabit', () => {
    it('should create habit with valid data', async () => {
      const habitData = createMockHabit();
      const result = await habitService.createHabit('user-123', habitData);
      
      expect(result).toBeDefined();
      expect(mockFirestore.collection).toHaveBeenCalledWith('habits');
    });

    it('should throw error for invalid data', async () => {
      const invalidData = { name: '' };
      
      await expect(
        habitService.createHabit('user-123', invalidData)
      ).rejects.toThrow('Invalid habit name');
    });
  });
});
```

**Hook Testing:**
```typescript
// Example: useHabits.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useHabits } from '../useHabits';

describe('useHabits', () => {
  it('should load habits on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useHabits());
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.habits).toBeDefined();
  });
});
```

### 2. Component Testing Strategy

```typescript
// Example: HabitCard.test.tsx
import { render, fireEvent } from '../utils/testUtils';
import HabitCard from '../../components/HabitCard';

describe('HabitCard', () => {
  const mockHabit = createMockHabit();
  const mockOnToggle = jest.fn();

  it('renders habit information correctly', () => {
    const { getByText } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} />
    );
    
    expect(getByText('Morning Workout')).toBeTruthy();
  });

  it('calls onToggle when pressed', () => {
    const { getByTestId } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} />
    );
    
    fireEvent.press(getByTestId('habit-card'));
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Integration Testing Strategy

```typescript
// Example: firebase.integration.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firebase Integration', () => {
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

  it('should enforce security rules', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const bob = testEnv.authenticatedContext('bob');
    
    // Alice can read her own habits
    await firebase.assertSucceeds(
      alice.firestore().collection('habits').doc('alice-habit').get()
    );
    
    // Bob cannot read Alice's habits
    await firebase.assertFails(
      bob.firestore().collection('habits').doc('alice-habit').get()
    );
  });
});
```

### 4. Security Testing Strategy

```typescript
// Example: security.test.ts
describe('Security Tests', () => {
  describe('Input Validation', () => {
    it('should sanitize habit names', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('alert("xss")');
    });

    it('should prevent SQL injection in search', () => {
      const maliciousQuery = "'; DROP TABLE users; --";
      
      expect(() => searchHabits(maliciousQuery))
        .not.toThrow();
    });
  });

  describe('Authentication Security', () => {
    it('should not log passwords', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      signIn('user@test.com', 'password123');
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('password123')
      );
    });
  });
});
```

### 5. E2E Testing Strategy

```typescript
// Example: e2e/habitFlow.test.ts
describe('Habit Management Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete full habit workflow', async () => {
    // Login
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Create habit
    await element(by.id('add-habit-button')).tap();
    await element(by.id('habit-name-input')).typeText('Morning Run');
    await element(by.id('save-habit-button')).tap();
    
    // Complete habit
    await element(by.id('habit-Morning Run')).tap();
    
    // Verify completion
    await expect(element(by.id('completed-indicator'))).toBeVisible();
  });
});
```

## Implementation Phases

### Phase 1: Foundation Setup (Week 1)
- Jest configuration and setup
- Mock infrastructure
- Test utilities and factories
- Basic unit test examples

### Phase 2: Core Testing (Week 2)
- Service layer unit tests
- Hook testing implementation
- Component testing framework
- Security testing basics

### Phase 3: Integration Testing (Week 3)
- Firebase emulator setup
- Integration test suite
- Network and offline testing
- Performance testing framework

### Phase 4: E2E and Automation (Week 4)
- Detox E2E testing setup
- CI/CD integration
- Coverage reporting
- Documentation and maintenance guides

## Monitoring and Metrics

### Test Coverage Metrics
- Line coverage: 80% minimum
- Branch coverage: 80% minimum
- Function coverage: 85% minimum
- Statement coverage: 80% minimum

### Performance Metrics
- Test execution time: <30 seconds for unit tests
- E2E test completion: <5 minutes
- Memory usage during tests: <500MB
- Test reliability: >95% pass rate

### Security Metrics
- Zero critical vulnerabilities
- All OWASP Top 10 covered
- 100% authentication flow coverage
- No sensitive data in logs/errors

This comprehensive testing design ensures GoalStreak maintains high code quality, security, and reliability as it scales from MVP to a full-featured social habit tracking platform.
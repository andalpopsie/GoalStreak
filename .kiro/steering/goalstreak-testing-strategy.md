# GoalStreak Testing Strategy

## Testing Overview
Comprehensive testing strategy for GoalStreak to ensure reliability, performance, and user satisfaction. This document outlines testing approaches, tools, and best practices for the React Native + Firebase application.

## Testing Pyramid Structure

### Unit Tests (Foundation - 70%)
Focus on individual functions, components, and services in isolation.

### Integration Tests (Middle - 20%)
Test interactions between components, services, and Firebase operations.

### End-to-End Tests (Top - 10%)
Test complete user workflows across the entire application.

## Unit Testing Strategy

### Core Services Testing
```typescript
// habitService.test.ts
import { habitService } from '../services/habitService';
import { mockFirestore } from '../__mocks__/firebase';

describe('HabitService', () => {
  beforeEach(() => {
    mockFirestore.clearAll();
  });

  describe('createHabit', () => {
    it('should create a habit with valid data', async () => {
      const habitData = {
        name: 'Morning Meditation',
        category: 'mindfulness',
        frequency: 'daily',
        isPublic: false
      };
      
      const habitId = await habitService.createHabit('user123', habitData);
      
      expect(habitId).toBeDefined();
      expect(mockFirestore.collection('habits').doc(habitId).data()).toMatchObject({
        userId: 'user123',
        name: 'Morning Meditation',
        category: 'mindfulness'
      });
    });

    it('should throw error for invalid habit data', async () => {
      const invalidHabitData = {
        name: '', // Invalid empty name
        category: 'invalid',
        frequency: 'daily',
        isPublic: false
      };
      
      await expect(
        habitService.createHabit('user123', invalidHabitData)
      ).rejects.toThrow('Invalid habit name');
    });
  });

  describe('getUserHabits', () => {
    it('should return user habits sorted by creation date', async () => {
      // Setup test data
      await mockFirestore.collection('habits').add({
        userId: 'user123',
        name: 'Habit 1',
        createdAt: new Date('2025-01-01')
      });
      
      const habits = await habitService.getUserHabits('user123');
      
      expect(habits).toHaveLength(1);
      expect(habits[0].name).toBe('Habit 1');
    });
  });
});
```

### Component Testing
```typescript
// AnimatedCircularHabitCard.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AnimatedCircularHabitCard from '../components/AnimatedCircularHabitCard';

const mockHabit = {
  id: 'habit1',
  name: 'Morning Run',
  category: 'fitness',
  userId: 'user123',
  frequency: 'daily',
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockStreak = {
  habitId: 'habit1',
  currentStreak: 5,
  longestStreak: 10,
  lastCompletedDate: new Date()
};

describe('AnimatedCircularHabitCard', () => {
  it('renders habit information correctly', () => {
    const { getByText } = render(
      <AnimatedCircularHabitCard
        habit={mockHabit}
        streak={mockStreak}
        isCompleted={false}
        isLoading={false}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    expect(getByText('Morning Run')).toBeTruthy();
    expect(getByText('5')).toBeTruthy(); // Current streak
  });

  it('calls onToggle when habit card is pressed', async () => {
    const mockOnToggle = jest.fn();
    
    const { getByTestId } = render(
      <AnimatedCircularHabitCard
        habit={mockHabit}
        streak={mockStreak}
        isCompleted={false}
        isLoading={false}
        onToggle={mockOnToggle}
        onDelete={jest.fn()}
      />
    );
    
    fireEvent.press(getByTestId('habit-card-button'));
    
    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  it('shows completed state correctly', () => {
    const { getByTestId } = render(
      <AnimatedCircularHabitCard
        habit={mockHabit}
        streak={mockStreak}
        isCompleted={true}
        isLoading={false}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    const progressCircle = getByTestId('progress-circle');
    expect(progressCircle.props.style).toMatchObject({
      backgroundColor: expect.stringContaining('#4A90A4') // Completed color
    });
  });
});
```

### Hook Testing
```typescript
// useHabits.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHabits } from '../hooks/useHabits';
import { AuthProvider } from '../hooks/useAuth';

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useHabits', () => {
  it('loads habits on mount', async () => {
    const { result } = renderHook(() => useHabits(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.habits).toBeDefined();
  });

  it('creates habit successfully', async () => {
    const { result } = renderHook(() => useHabits(), { wrapper });
    
    const habitData = {
      name: 'Test Habit',
      category: 'fitness',
      frequency: 'daily',
      isPublic: false
    };
    
    await act(async () => {
      await result.current.createHabit(habitData);
    });
    
    expect(result.current.habits).toContainEqual(
      expect.objectContaining({ name: 'Test Habit' })
    );
  });
});
```

## Integration Testing Strategy

### Firebase Integration Tests
```typescript
// firebase.integration.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { habitService } from '../services/habitService';

describe('Firebase Integration', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'goalstreak-test',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /{document=**} {
                allow read, write: if true;
              }
            }
          }
        `
      }
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
      frequency: 'daily',
      isPublic: false
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

### Social Features Integration Tests
```typescript
// social.integration.test.ts
describe('Social Features Integration', () => {
  it('should handle friend request workflow', async () => {
    const user1 = 'user1@test.com';
    const user2 = 'user2@test.com';
    
    // Send friend request
    const requestId = await friendService.sendFriendRequest(user1, user2);
    expect(requestId).toBeDefined();
    
    // Accept friend request
    await friendService.acceptFriendRequest(requestId);
    
    // Verify friendship
    const user1Friends = await friendService.getFriends(user1);
    const user2Friends = await friendService.getFriends(user2);
    
    expect(user1Friends.friends).toHaveLength(1);
    expect(user2Friends.friends).toHaveLength(1);
  });

  it('should create and display activity feed', async () => {
    const userId = 'test-user';
    const habitId = 'test-habit';
    
    // Create activity
    await friendService.createActivity(
      userId,
      'habit_completed',
      habitId,
      'Morning Run',
      'fitness'
    );
    
    // Retrieve activity feed
    const feed = await friendService.getActivityFeed(userId);
    expect(feed.activities).toHaveLength(1);
    expect(feed.activities[0].habitName).toBe('Morning Run');
  });
});
```

## End-to-End Testing Strategy

### User Journey Tests
```typescript
// e2e/userJourney.test.ts
import { by, device, element, expect } from 'detox';

describe('User Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete full habit tracking workflow', async () => {
    // Login
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Wait for home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Create new habit
    await element(by.id('add-habit-button')).tap();
    await element(by.id('habit-name-input')).typeText('Morning Meditation');
    await element(by.id('category-picker')).tap();
    await element(by.text('Mindfulness')).tap();
    await element(by.id('create-habit-button')).tap();
    
    // Verify habit appears on home screen
    await expect(element(by.text('Morning Meditation'))).toBeVisible();
    
    // Complete habit
    await element(by.id('habit-card-Morning Meditation')).tap();
    
    // Verify completion
    await expect(element(by.id('completed-indicator'))).toBeVisible();
    
    // Check streak counter
    await expect(element(by.text('1'))).toBeVisible(); // First day streak
  });

  it('should handle social features workflow', async () => {
    // Navigate to social screen
    await element(by.id('social-tab')).tap();
    
    // Add friend
    await element(by.id('add-friend-button')).tap();
    await element(by.id('friend-email-input')).typeText('friend@example.com');
    await element(by.id('send-request-button')).tap();
    
    // Verify request sent
    await expect(element(by.text('Friend request sent'))).toBeVisible();
    
    // Check activity feed
    await element(by.id('activity-feed-tab')).tap();
    await expect(element(by.id('activity-feed'))).toBeVisible();
  });
});
```

### Performance Tests
```typescript
// e2e/performance.test.ts
describe('Performance Tests', () => {
  it('should load home screen within 3 seconds', async () => {
    const startTime = Date.now();
    
    await device.launchApp();
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(3000);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  it('should handle large habit lists efficiently', async () => {
    // Create 50 habits for performance testing
    for (let i = 0; i < 50; i++) {
      await createTestHabit(`Habit ${i}`);
    }
    
    const startTime = Date.now();
    await device.reloadReactNative();
    
    await waitFor(element(by.id('habits-grid')))
      .toBeVisible()
      .withTimeout(5000);
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000); // Should render within 2 seconds
  });
});
```

## Testing Tools & Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
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

### Test Setup
```typescript
// src/__tests__/setup.ts
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Firebase
jest.mock('../services/firebase', () => ({
  auth: {},
  db: {},
  storage: {}
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Expo modules
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true)
}));

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
```

### Firebase Mocking
```typescript
// src/__mocks__/firebase.ts
export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      data: jest.fn()
    })),
    add: jest.fn(),
    where: jest.fn(() => mockFirestore.collection()),
    orderBy: jest.fn(() => mockFirestore.collection()),
    limit: jest.fn(() => mockFirestore.collection()),
    get: jest.fn(() => ({
      docs: [],
      forEach: jest.fn()
    }))
  })),
  clearAll: jest.fn()
};

export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
};
```

## Testing Automation & CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  e2e:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for testing
      run: npx expo build:ios --type simulator
    
    - name: Run E2E tests
      run: npm run test:e2e
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "detox test",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Quality Assurance Process

### Code Review Checklist
- [ ] All tests pass
- [ ] Code coverage meets threshold (80%)
- [ ] No security vulnerabilities
- [ ] Performance impact assessed
- [ ] Accessibility requirements met
- [ ] Error handling implemented
- [ ] Documentation updated

### Testing Checklist Before Release
- [ ] Unit tests: 100% pass rate
- [ ] Integration tests: All critical paths covered
- [ ] E2E tests: Core user journeys validated
- [ ] Performance tests: Meet benchmarks
- [ ] Security tests: No vulnerabilities
- [ ] Accessibility tests: WCAG compliance
- [ ] Cross-platform tests: iOS and Android
- [ ] Offline functionality tests
- [ ] Social features tests
- [ ] Data persistence tests

## Monitoring & Analytics

### Test Metrics Tracking
- Test execution time trends
- Code coverage trends
- Flaky test identification
- Performance regression detection
- User journey completion rates

### Production Monitoring
- Crash reporting with Firebase Crashlytics
- Performance monitoring with Firebase Performance
- User analytics with Firebase Analytics
- Real-time error tracking
- User feedback collection

Remember: Testing is not just about finding bugs, but ensuring a reliable, performant, and delightful user experience.
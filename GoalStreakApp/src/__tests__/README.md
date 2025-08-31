# GoalStreak Testing Infrastructure

This directory contains the comprehensive testing infrastructure for GoalStreak, implementing task 2 from the testing suite specification.

## 📁 Directory Structure

```
src/__tests__/
├── README.md                    # This file
├── setup.ts                     # Jest setup configuration
├── mocks/                       # Firebase and external service mocks
│   ├── firebase.ts             # Comprehensive Firebase mocks
│   ├── firebase.test.ts        # Tests for Firebase mocks
│   ├── expo.js                 # Expo module mocks
│   ├── react-native.js         # React Native mocks
│   └── reanimated.js           # React Native Reanimated mocks
├── factories/                   # Test data factories
│   ├── habitFactory.ts         # Habit, completion, and streak factories
│   ├── userFactory.ts          # User and authentication factories
│   ├── socialFactory.ts        # Social features factories
│   └── factories.test.ts       # Tests for all factories
├── utils/                       # Test utilities
│   ├── testUtils.tsx           # React component testing utilities
│   ├── asyncUtils.ts           # Async operation testing utilities
│   ├── errorUtils.ts           # Error handling testing utilities
│   ├── testSetup.ts            # Comprehensive test setup utilities
│   └── firebaseEmulator.ts     # Firebase emulator utilities
├── unit/                        # Unit tests
│   ├── basic.test.ts           # Basic Jest setup verification
│   └── setup.test.ts           # Setup verification tests
├── integration/                 # Integration tests (placeholder)
└── e2e/                        # End-to-end tests (placeholder)
```

## 🔧 Firebase Mock Infrastructure

### Comprehensive Firebase Service Mocks

Our Firebase mocks provide realistic behavior for:

- **Authentication**: Sign in/up, user management, auth state changes
- **Firestore**: Document CRUD, collections, queries, real-time listeners
- **Storage**: File upload/download, metadata management

### Key Features

- **Realistic Data Store**: In-memory data persistence across operations
- **Query Support**: Where clauses, ordering, limits with proper filtering
- **Real-time Listeners**: Simulated onSnapshot behavior
- **Batch Operations**: Transaction and batch write support
- **Error Simulation**: Configurable error scenarios for testing

### Usage Example

```typescript
import { mockFirestore, mockAuth } from '../mocks/firebase';

// Create and retrieve documents
await mockFirestore.collection('habits').doc('habit-1').set(habitData);
const doc = await mockFirestore.collection('habits').doc('habit-1').get();

// Query with filters
const querySnapshot = await mockFirestore
  .collection('habits')
  .where('userId', '==', 'user-123')
  .where('category', '==', 'fitness')
  .get();

// Authentication
const result = await mockAuth.signInWithEmailAndPassword('test@example.com', 'password123');
```

## 🏭 Test Data Factories

### Habit Factory (`habitFactory.ts`)

Creates realistic habit data with:
- 39+ category-specific habit names
- Proper frequency and target value handling
- Complete habit data with completions and streaks
- Streak calculation based on completion history

```typescript
import { createMockHabit, createMockHabitWithData } from '../factories/habitFactory';

const habit = createMockHabit({ category: 'fitness', name: 'Morning Workout' });
const { habit, completions, streak } = createMockHabitWithData({}, 7); // 7 days of completions
```

### User Factory (`userFactory.ts`)

Creates user data for:
- Firestore user documents
- Firebase Auth user objects
- Login/signup forms
- Authentication credentials

```typescript
import { createMockUser, createMockAuthUser } from '../factories/userFactory';

const user = createMockUser({ email: 'test@example.com' });
const authUser = createMockAuthUser({ uid: user.id });
```

### Social Factory (`socialFactory.ts`)

Creates social feature data:
- Friends and friend requests
- Social activities with reactions
- Complete social networks
- User profiles and settings

```typescript
import { createMockSocialNetwork } from '../factories/socialFactory';

const network = createMockSocialNetwork('user-123');
// Returns: { user, friends, activities, friendRequests, socialSettings, userProfile }
```

## 🛠 Test Utilities

### Component Testing (`testUtils.tsx`)

Provides React component testing utilities:
- Custom render function with all providers
- Authentication state management
- Navigation container setup
- Theme provider integration

```typescript
import { renderWithAuth, renderWithoutAuth } from '../utils/testUtils';

// Render with authenticated user
const { getByText } = renderWithAuth(<MyComponent />, { uid: 'user-123' });

// Render without authentication
const { getByText } = renderWithoutAuth(<LoginScreen />);
```

### Async Testing (`asyncUtils.ts`)

Handles async operations in tests:
- Wait for conditions with timeout
- Promise management utilities
- Mock async functions with controllable resolution
- Performance measurement tools

```typescript
import { waitForCondition, createMockAsyncFunction } from '../utils/asyncUtils';

await waitForCondition(() => element.isVisible(), 5000);

const mockFn = createMockAsyncFunction();
mockFn.resolve('success'); // Control when promise resolves
```

### Error Handling (`errorUtils.ts`)

Comprehensive error testing utilities:
- Firebase error simulation
- Network and timeout errors
- Validation error helpers
- Error assertion utilities

```typescript
import { createAuthError, expectError } from '../utils/errorUtils';

const error = createAuthError.userNotFound();
expectError.toBeAuthError(error, 'auth/user-not-found');
```

### Test Setup (`testSetup.ts`)

Complete test environment management:
- Factory ID reset for consistent data
- Mock data clearing and setup
- Test scenario generators
- Performance testing utilities

```typescript
import { createTestScenario, clearAllMockData } from '../utils/testSetup';

const scenario = createTestScenario({
  userId: 'test-user',
  habitCount: 5,
  friendCount: 3,
  withAuth: true
});
```

## 🔥 Firebase Emulator Support

### Emulator Configuration

Complete Firebase emulator setup for integration testing:
- Firestore emulator on port 8080
- Auth emulator on port 9099
- Storage emulator on port 9199
- Security rules and indexes

### Emulator Utilities (`firebaseEmulator.ts`)

```typescript
import { initializeFirebaseEmulators, createTestUser } from '../utils/firebaseEmulator';

const { auth, db, storage } = await initializeFirebaseEmulators();
const user = await createTestUser('test@example.com', 'password123');
```

## 📋 Configuration Files

### Firebase Configuration
- `firebase.json`: Emulator configuration
- `firestore.rules`: Security rules for testing
- `storage.rules`: Storage security rules
- `firestore.indexes.json`: Required indexes

### Jest Configuration
The testing infrastructure integrates with the existing Jest setup and provides:
- TypeScript support
- React Native Testing Library integration
- Mock module resolution
- Coverage reporting

## 🧪 Testing Best Practices

### 1. Use Factories for Consistent Data
```typescript
// Good: Use factories for consistent, realistic data
const habit = createMockHabit({ category: 'fitness' });

// Avoid: Manual object creation
const habit = { id: '123', name: 'test', /* ... */ };
```

### 2. Reset State Between Tests
```typescript
beforeEach(() => {
  clearAllMockData();
  resetAllFactoryIds();
});
```

### 3. Use Realistic Test Scenarios
```typescript
// Create complete test scenarios
const scenario = createTestScenario({
  habitCount: 3,
  friendCount: 2,
  withAuth: true
});
```

### 4. Test Error Conditions
```typescript
// Test error scenarios
mockFirestore.collection('habits').doc('invalid').get.mockRejectedValue(
  createFirestoreError.notFound()
);
```

### 5. Use Async Utilities
```typescript
// Wait for async operations
await waitForCondition(() => mockAuth.currentUser !== null);
await flushPromises();
```

## 🎯 Requirements Fulfilled

This implementation fulfills the following requirements from the testing specification:

### Requirement 6.1 & 6.2 (Firebase Mocks)
- ✅ Comprehensive Firebase Auth mocks with realistic behavior
- ✅ Firestore operation mocks with query support and data persistence
- ✅ Firebase Storage mocks for file operations
- ✅ Firebase emulator configuration for integration tests

### Requirement 6.2, 6.3 & 6.4 (Test Utilities)
- ✅ Factory functions for User, Habit, Streak, and Social data models
- ✅ Test utility functions for async operations and promises
- ✅ Custom render function with provider wrappers
- ✅ Error handling utilities for test scenarios

## 🚀 Next Steps

With this infrastructure in place, you can now:

1. **Write Unit Tests**: Use the factories and mocks to test individual functions
2. **Create Integration Tests**: Use Firebase emulators for realistic testing
3. **Build Component Tests**: Use the render utilities for React component testing
4. **Implement E2E Tests**: Build on this foundation for end-to-end testing

The mock infrastructure provides a solid foundation for comprehensive testing while maintaining realistic behavior and performance.
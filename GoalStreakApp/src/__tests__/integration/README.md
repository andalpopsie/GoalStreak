# Firebase Integration Tests

This directory contains comprehensive integration tests for GoalStreak's Firebase backend using Firebase emulators.

## Overview

The integration tests verify:
- Firebase emulator setup and configuration
- Firestore and Storage security rules
- Real-time data synchronization
- Offline data persistence and sync
- Conflict resolution for concurrent operations
- Cross-device data consistency
- Performance with large datasets

## Test Structure

### Core Test Files

- **`firebase-emulator.test.ts`** - Basic emulator setup and connectivity tests
- **`firebase-security-rules.test.ts`** - Comprehensive Firestore security rules testing
- **`firebase-storage-security.test.ts`** - Firebase Storage security rules testing
- **`real-time-sync.test.ts`** - Real-time synchronization and offline behavior tests
- **`integration-test-runner.test.ts`** - Complete workflow and performance tests

### Supporting Files

- **`setup.ts`** - Test environment configuration and global setup
- **`../utils/firebaseEmulator.ts`** - Firebase emulator utilities and helpers
- **`../utils/testDataSeeder.ts`** - Comprehensive test data seeding utilities

## Prerequisites

### 1. Firebase Tools Installation

```bash
npm install -g firebase-tools
```

### 2. Firebase Emulators Setup

The emulators are configured in `firebase.json`:

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### 3. Security Rules

Ensure the following files exist:
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules
- `firestore.indexes.json` - Firestore indexes configuration

## Running Integration Tests

### Start Firebase Emulators

```bash
# Using the provided script
node scripts/start-emulators.js

# Or manually
npx firebase emulators:start --only auth,firestore,storage
```

### Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npx jest src/__tests__/integration/firebase-emulator.test.ts

# Run with coverage
npm run test:integration -- --coverage

# Run in watch mode (for development)
npx jest src/__tests__/integration --watch
```

### Stop Emulators

```bash
# Using the provided script
node scripts/stop-emulators.js

# Check emulator status
node scripts/stop-emulators.js --status
```

## Test Categories

### 1. Emulator Setup Tests (`firebase-emulator.test.ts`)

- ✅ Firebase emulator initialization
- ✅ Service connectivity (Auth, Firestore, Storage)
- ✅ Test user creation and authentication
- ✅ Basic data seeding functionality
- ✅ Error handling for emulator connection issues

### 2. Security Rules Tests (`firebase-security-rules.test.ts`)

#### User Data Access Control
- ✅ Users can read/write their own data
- ✅ Users cannot access other users' data
- ✅ Unauthenticated access is properly denied

#### Habit Data Security
- ✅ Habit CRUD operations with proper ownership
- ✅ Cross-user habit access prevention
- ✅ Habit privacy controls

#### Social Features Security
- ✅ Friend relationship access controls
- ✅ Friend request permissions
- ✅ Activity feed visibility rules (public/friends/private)
- ✅ Bidirectional friendship verification

#### Profile and Settings Security
- ✅ User profile read/write permissions
- ✅ Social settings privacy controls
- ✅ Cross-user profile access rules

### 3. Storage Security Tests (`firebase-storage-security.test.ts`)

#### Profile Picture Security
- ✅ Users can upload their own profile pictures
- ✅ File size limits (5MB) enforcement
- ✅ Content type restrictions (images only)
- ✅ Cross-user upload prevention
- ✅ Public read access for profile pictures

#### App Assets Security
- ✅ Public read access to app assets
- ✅ Upload prevention to assets folder
- ✅ Asset deletion prevention

#### Security Vulnerabilities
- ✅ Path traversal attack prevention
- ✅ Invalid file name handling
- ✅ Empty file rejection
- ✅ Unauthenticated access controls

### 4. Real-time Sync Tests (`real-time-sync.test.ts`)

#### Real-time Updates
- ✅ Habit completion synchronization across devices
- ✅ Streak updates in real-time
- ✅ Friend activity feed updates
- ✅ Activity reaction synchronization
- ✅ Multiple rapid completion handling

#### Offline Behavior
- ✅ Offline data persistence
- ✅ Online sync after reconnection
- ✅ Offline update synchronization
- ✅ Cache vs server data verification

#### Conflict Resolution
- ✅ Concurrent update handling with server timestamps
- ✅ Document creation conflicts
- ✅ Last-write-wins behavior verification

#### Query Updates
- ✅ Real-time query result updates
- ✅ Document addition/modification in queries
- ✅ Ordered query result maintenance

### 5. Integration Workflow Tests (`integration-test-runner.test.ts`)

#### Complete Workflows
- ✅ End-to-end user workflow with real-time updates
- ✅ Concurrent operation handling
- ✅ Data consistency across operations
- ✅ Error scenario handling

#### Performance Testing
- ✅ Large dataset handling (5 users, 50 habits)
- ✅ Rapid sequential operations (20 operations)
- ✅ Performance benchmarking and timing

#### Coverage Reporting
- ✅ Comprehensive test coverage report
- ✅ Collection coverage verification
- ✅ Operation coverage verification
- ✅ Security scenario coverage

## Test Data Structure

### Users
```typescript
{
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Habits
```typescript
{
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly' | 'monthly';
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Completions
```typescript
{
  id: string;
  habitId: string;
  userId: string;
  completedAt: Date;
}
```

### Social Data
```typescript
// Friends
{
  id: string;
  userId: string;
  friendId: string;
  friendEmail: string;
  friendName: string;
  status: 'accepted';
  createdAt: Date;
}

// Activities
{
  id: string;
  userId: string;
  userName: string;
  type: 'habit_completed';
  habitId: string;
  habitName: string;
  habitCategory: string;
  visibility: 'public' | 'friends' | 'private';
  timestamp: Date;
  reactions: { heart: number; fire: number; medal: number; };
}
```

## Debugging Integration Tests

### Common Issues

1. **Emulators Not Running**
   ```
   Error: Firebase emulators are not running
   ```
   **Solution:** Start emulators with `node scripts/start-emulators.js`

2. **Port Conflicts**
   ```
   Error: Port 8080 is already in use
   ```
   **Solution:** Check and kill processes using emulator ports, or change ports in `firebase.json`

3. **Security Rules Errors**
   ```
   Error: Permission denied
   ```
   **Solution:** Verify security rules in `firestore.rules` and `storage.rules`

4. **Test Timeouts**
   ```
   Error: Test timed out
   ```
   **Solution:** Increase timeout in test configuration or check emulator performance

### Debugging Commands

```bash
# Check emulator status
node scripts/stop-emulators.js --status

# View emulator UI
open http://localhost:4000

# Check Firebase logs
npx firebase emulators:start --debug

# Run single test with verbose output
npx jest src/__tests__/integration/firebase-emulator.test.ts --verbose
```

### Test Environment Variables

```bash
# Enable debug logging
DEBUG=true npm run test:integration

# Set custom timeout
JEST_TIMEOUT=60000 npm run test:integration

# Run with specific emulator ports
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:integration
```

## Performance Benchmarks

### Expected Performance Metrics

- **Emulator Startup:** < 30 seconds
- **User Creation:** < 1 second per user
- **Data Seeding (50 habits):** < 30 seconds
- **Real-time Sync:** < 2 seconds for updates
- **Rapid Operations (20 concurrent):** < 10 seconds
- **Security Rules Test Suite:** < 60 seconds
- **Complete Integration Suite:** < 5 minutes

### Monitoring Performance

```bash
# Run tests with timing
npm run test:integration -- --verbose --detectOpenHandles

# Profile memory usage
node --inspect-brk node_modules/.bin/jest src/__tests__/integration

# Monitor emulator performance
npx firebase emulators:start --inspect-functions
```

## Contributing

### Adding New Integration Tests

1. **Create Test File**
   ```typescript
   // src/__tests__/integration/new-feature.test.ts
   describe('New Feature Integration', () => {
     // Test implementation
   });
   ```

2. **Follow Naming Convention**
   - Use descriptive test names
   - Group related tests in describe blocks
   - Include setup and teardown as needed

3. **Use Existing Utilities**
   - Import from `../utils/firebaseEmulator`
   - Use `createTestDataSeeder` for data setup
   - Follow existing patterns for async operations

4. **Update Documentation**
   - Add test description to this README
   - Update coverage report in `integration-test-runner.test.ts`
   - Document any new test utilities

### Best Practices

- **Isolation:** Each test should be independent
- **Cleanup:** Always clean up test data
- **Timeouts:** Set appropriate timeouts for async operations
- **Error Handling:** Test both success and failure scenarios
- **Performance:** Monitor test execution time
- **Documentation:** Keep tests well-documented and maintainable

## Troubleshooting

### Firebase Emulator Issues

1. **Clear Emulator Data**
   ```bash
   node scripts/stop-emulators.js --clear-data
   ```

2. **Reset Emulator State**
   ```bash
   npx firebase emulators:start --import=./emulator-data --export-on-exit
   ```

3. **Check Emulator Logs**
   ```bash
   npx firebase emulators:start --debug
   ```

### Test-Specific Issues

1. **Flaky Tests**
   - Increase timeouts for real-time operations
   - Add proper wait conditions
   - Check for race conditions

2. **Memory Leaks**
   - Ensure all listeners are unsubscribed
   - Clean up Firebase instances
   - Monitor test memory usage

3. **Security Rule Changes**
   - Restart emulators after rule changes
   - Verify rule syntax with Firebase CLI
   - Test rules in isolation

For additional help, check the [Firebase Emulator Documentation](https://firebase.google.com/docs/emulator-suite) or create an issue in the project repository.
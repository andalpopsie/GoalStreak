/**
 * Integration Test Setup
 * Configures Firebase emulators and test environment for integration testing
 */

import { initializeFirebaseEmulators, cleanupFirebaseEmulators, areEmulatorsRunning } from '../utils/firebaseEmulator';

// Global test timeout for integration tests
jest.setTimeout(30000);

// Global setup for all integration tests
beforeAll(async () => {
  console.log('🚀 Setting up integration test environment...');
  
  // Check if emulators are running
  const emulatorsRunning = await areEmulatorsRunning();
  if (!emulatorsRunning) {
    throw new Error(
      '❌ Firebase emulators are not running. Please start them with: npm run emulators:start'
    );
  }
  
  // Initialize Firebase emulators
  try {
    await initializeFirebaseEmulators();
    console.log('✅ Firebase emulators initialized for testing');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase emulators:', error);
    throw error;
  }
});

// Global cleanup after all integration tests
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  try {
    await cleanupFirebaseEmulators();
    console.log('✅ Integration test cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup integration tests:', error);
  }
});

// Reset emulator data between test suites
beforeEach(async () => {
  // Note: Firebase emulators automatically reset data between test runs
  // when using the --import/--export flags or when restarted
});

// Export test utilities for integration tests
export * from '../utils/firebaseEmulator';
export * from '../utils/testUtils';
export * from '../factories/habitFactory';
export * from '../factories/userFactory';
export * from '../factories/socialFactory';
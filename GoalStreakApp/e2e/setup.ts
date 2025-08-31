import { beforeAll, beforeEach, afterAll, afterEach } from '@jest/globals';
import detox from 'detox';
import { setupDevice, cleanupDevice, waitForDeviceReady } from './utils/deviceManager';
import { cleanupTestData, resetTestEnvironment } from './utils/testDataManager';

const config = require('../.detoxrc.js');

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting E2E test suite setup...');
  
  try {
    // Initialize Detox
    await detox.init(config, { initGlobals: false });
    console.log('✅ Detox initialized');
    
    // Wait for device to be ready
    await waitForDeviceReady();
    console.log('✅ Device ready');
    
    // Setup device configuration
    await setupDevice();
    console.log('✅ Device configured');
    
    // Reset test environment
    await resetTestEnvironment();
    console.log('✅ Test environment reset');
    
    console.log('🎉 E2E test suite setup complete');
  } catch (error) {
    console.error('❌ E2E test suite setup failed:', error);
    throw error;
  }
}, 300000); // 5 minute timeout for setup

// Setup before each test
beforeEach(async () => {
  try {
    // Reload the app to ensure clean state
    await device.reloadReactNative();
    
    // Wait a moment for the app to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
}, 30000); // 30 second timeout per test setup

// Cleanup after each test
afterEach(async () => {
  try {
    // Take screenshot on test failure
    const testState = expect.getState();
    if (testState.currentTestName && testState.assertionCalls === 0) {
      // Test might have failed, take screenshot
      const testName = testState.currentTestName.replace(/[^a-zA-Z0-9]/g, '_');
      await device.takeScreenshot(`failed_${testName}`);
    }
  } catch (error) {
    console.warn('⚠️ Post-test cleanup warning:', error);
  }
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Starting E2E test suite teardown...');
  
  try {
    // Cleanup test data
    await cleanupTestData();
    console.log('✅ Test data cleaned up');
    
    // Cleanup device
    await cleanupDevice();
    console.log('✅ Device cleaned up');
    
    // Cleanup Detox
    await detox.cleanup();
    console.log('✅ Detox cleaned up');
    
    console.log('🎉 E2E test suite teardown complete');
  } catch (error) {
    console.error('❌ E2E test suite teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
}, 60000); // 1 minute timeout for teardown

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export global utilities for tests
declare global {
  var testHelpers: typeof import('./utils/testHelpers');
  var deviceManager: typeof import('./utils/deviceManager');
  var testDataManager: typeof import('./utils/testDataManager');
}

// Make utilities available globally
global.testHelpers = require('./utils/testHelpers');
global.deviceManager = require('./utils/deviceManager');
global.testDataManager = require('./utils/testDataManager');
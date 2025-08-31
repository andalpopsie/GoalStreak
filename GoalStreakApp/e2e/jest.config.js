module.exports = {
  rootDir: '..',
  testMatch: [
    '<rootDir>/e2e/**/*.test.{js,ts}',
    '<rootDir>/e2e/tests/**/*.test.{js,ts}'
  ],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'detox/runners/jest/reporter',
    ['jest-junit', {
      outputDirectory: './e2e/reports',
      outputName: 'e2e-test-results.xml',
      suiteName: 'E2E Tests'
    }]
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.ts'],
  
  // Coverage configuration (if needed)
  collectCoverage: false,
  
  // Module resolution
  moduleNameMapping: {
    '^@e2e/(.*)$': '<rootDir>/e2e/$1',
    '^@utils/(.*)$': '<rootDir>/e2e/utils/$1',
    '^@tests/(.*)$': '<rootDir>/e2e/tests/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test environment options
  testEnvironmentOptions: {
    eventListeners: [
      {
        onTestStart: async (test) => {
          console.log(`Starting E2E test: ${test.path}`);
        },
        onTestComplete: async (test, testResult) => {
          console.log(`Completed E2E test: ${test.path} - ${testResult.testResults.length} tests`);
        }
      }
    ]
  },
  
  // Retry configuration for flaky tests
  retry: process.env.CI ? 2 : 0,
  
  // Bail configuration
  bail: process.env.CI ? 1 : 0,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  detectOpenHandles: true,
  forceExit: true
};
/**
 * Jest Configuration for Integration Tests
 * Specialized configuration for Firebase emulator integration testing
 */

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'Integration Tests',
  testMatch: [
    '<rootDir>/__tests__/integration/**/*.test.{js,jsx,ts,tsx}'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/utils/testSetup.ts'
  ],
  testEnvironment: 'node',
  // Longer timeout for integration tests
  testTimeout: 30000,
  // Run integration tests serially to avoid conflicts
  maxWorkers: 1,
  // Clear mocks between tests
  clearMocks: true,
  // Collect coverage from integration test files
  collectCoverageFrom: [
    'src/services/**/*.{js,jsx,ts,tsx}',
    'src/hooks/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!__tests__/**',
    '!src/__mocks__/**'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  // Module name mapping for Firebase
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    '^firebase/(.*)$': '<rootDir>/node_modules/firebase/$1'
  },
  // Transform configuration for Firebase modules
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/)'
  ]
};
/**
 * Jest Configuration for Performance Tests
 * Specialized configuration for performance and load testing
 */

export default {
  preset: 'react-native',
  displayName: 'Performance Tests',
  testMatch: [
    '<rootDir>/__tests__/performance/**/*.test.{js,jsx,ts,tsx}',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/utils/testSetup.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!__tests__/**',
    '!src/__mocks__/**',
  ],
  coverageDirectory: 'coverage/performance',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Performance test specific settings
  testTimeout: 60000, // 60 seconds for load tests
  maxWorkers: 1, // Run performance tests sequentially
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo))'
  ],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__tests__/mocks/react-native.js',
    '^@react-native/(.*)$': '<rootDir>/__tests__/mocks/react-native.js',
    '^expo/(.*)$': '<rootDir>/__tests__/mocks/expo.js'
  },
  globals: {
    __DEV__: false,
    __PERFORMANCE_TESTING__: true,
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  },
  
  // Verbose output for performance analysis
  verbose: true,
  
  // Custom reporters for performance metrics
  reporters: ['default'],
};
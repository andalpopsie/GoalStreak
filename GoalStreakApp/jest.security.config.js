/**
 * Jest Configuration for Security Tests
 * 
 * Specialized Jest configuration for running security-focused tests
 * with appropriate timeouts and reporting for security validation.
 */

module.exports = {
  preset: 'react-native',
  displayName: 'Security Tests',
  testMatch: [
    '<rootDir>/src/__tests__/security/**/*.test.{js,jsx,ts,tsx}'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/__tests__/security/securitySetup.ts'
  ],
  collectCoverageFrom: [
    'src/utils/inputValidation.ts',
    'src/services/**/*.ts',
    'src/hooks/useAuth.tsx',
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
  testTimeout: 30000, // 30 seconds for security tests
  verbose: true,
  reporters: [
    'default'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/src/__tests__/mocks/react-native.js',
    '^@react-native/(.*)$': '<rootDir>/src/__tests__/mocks/react-native.js',
    '^expo/(.*)$': '<rootDir>/src/__tests__/mocks/expo.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@firebase|firebase)/)'
  ],
  testEnvironment: 'node',
  globals: {
    __DEV__: false,
    __SECURITY_TEST__: true,
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  }
};
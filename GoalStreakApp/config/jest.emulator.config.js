// Jest config for Firebase emulator tests (security rules + service integration).
//
// These tests talk to a REAL Firestore emulator over the network and must NOT
// load the React Native preset or the firebase mocks from src/__tests__/setup.ts.
// Run them via the Firebase CLI so the emulator is started/stopped automatically:
//
//   firebase emulators:exec --only firestore \
//     "npx jest --config config/jest.emulator.config.js" \
//     --project goalstreak-test
//
// (run from GoalStreakApp/firebase/ — see firebase/package or the deploy note).
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/*.rules.test.(ts|tsx)',
    '<rootDir>/src/**/*.emulator.test.(ts|tsx)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  // The emulator can be slow to accept the first connection on a cold start.
  testTimeout: 20000,
  globals: {
    __DEV__: true
  }
};

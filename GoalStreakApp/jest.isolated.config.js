module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/test-isolated/**/*.test.js'
  ],
  collectCoverageFrom: [
    'test-isolated/**/*.js'
  ],
  moduleFileExtensions: ['js', 'json', 'node'],
  globals: {
    __DEV__: true
  }
};
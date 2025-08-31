// Basic test setup for Jest

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};

// Set up global test environment
beforeEach(() => {
  jest.clearAllMocks();
});

// Increase timeout for async operations
jest.setTimeout(10000);
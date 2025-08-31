/**
 * Security Test Setup
 * 
 * Setup configuration and utilities specifically for security testing.
 * Includes mocks, test data, and security-specific test utilities.
 */

import 'react-native-gesture-handler/jestSetup';

// Extend global type for security test utilities
declare global {
  var securityTestUtils: any;
}

// Mock Firebase for security tests
jest.mock('../../services/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  },
  db: {},
  storage: {}
}));

// Mock AsyncStorage for security tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock React Native modules for security tests
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios)
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 }))
  },
  Alert: {
    alert: jest.fn()
  }
}));

// Security test utilities
global.securityTestUtils = {
  // Common XSS payloads for testing
  xssPayloads: [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(\'xss\')">',
    'javascript:alert("xss")',
    '<svg onload="alert(\'xss\')">',
    '"><script>alert("xss")</script>',
    '<iframe src="javascript:alert(\'xss\')"></iframe>',
    '<body onload="alert(\'xss\')">',
    '<div onclick="alert(\'xss\')">Click me</div>',
    '&lt;script&gt;alert("xss")&lt;/script&gt;',
    '%3Cscript%3Ealert("xss")%3C/script%3E'
  ],

  // Common SQL injection payloads for testing
  sqlInjectionPayloads: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM users --",
    "'; DELETE FROM habits WHERE '1'='1'; --",
    "' OR 1=1 --",
    "admin'--",
    "admin'/*",
    "' OR 'x'='x",
    "'; EXEC xp_cmdshell('dir'); --",
    "1' AND (SELECT COUNT(*) FROM users) > 0 --"
  ],

  // Test user data
  testUsers: {
    alice: { uid: 'alice', email: 'alice@example.com', displayName: 'Alice' },
    bob: { uid: 'bob', email: 'bob@example.com', displayName: 'Bob' },
    charlie: { uid: 'charlie', email: 'charlie@example.com', displayName: 'Charlie' },
    malicious: { uid: 'malicious', email: 'hacker@evil.com', displayName: '<script>alert("xss")</script>' }
  },

  // Test habit data
  testHabits: {
    privateHabit: {
      id: 'habit-private',
      userId: 'alice',
      name: 'Private Habit',
      isPublic: false,
      category: 'fitness'
    },
    publicHabit: {
      id: 'habit-public',
      userId: 'alice',
      name: 'Public Habit',
      isPublic: true,
      category: 'health'
    },
    maliciousHabit: {
      id: 'habit-malicious',
      userId: 'malicious',
      name: '<script>alert("xss")</script>',
      isPublic: true,
      category: 'other'
    }
  },

  // Security validation helpers
  validateNoXSS(input: string): boolean {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /onclick=/i,
      /<iframe/i,
      /<svg/i,
      /<img/i
    ];
    
    return !xssPatterns.some(pattern => pattern.test(input));
  },

  validateNoSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM/i,
      /UNION\s+SELECT/i,
      /EXEC\s+/i,
      /--/,
      /\/\*/,
      /'\s*OR\s*'/i
    ];
    
    return !sqlPatterns.some(pattern => pattern.test(input));
  },

  validateSecureToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    // Basic JWT format validation
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    return jwtRegex.test(token);
  },

  validateSecurePassword(password: string): boolean {
    if (!password || password.length < 8) return false;
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return hasLower && hasUpper && hasNumber && hasSpecial;
  },

  // Mock rate limiter for testing
  mockRateLimiter: {
    attempts: new Map(),
    checkLimit(identifier: string, maxAttempts: number): boolean {
      const current = this.attempts.get(identifier) || 0;
      if (current >= maxAttempts) return false;
      
      this.attempts.set(identifier, current + 1);
      return true;
    },
    reset(identifier: string): void {
      this.attempts.delete(identifier);
    },
    clear(): void {
      this.attempts.clear();
    }
  }
};

// Security test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset rate limiter
  global.securityTestUtils.mockRateLimiter.clear();
  
  // Set security test environment flag
  process.env.NODE_ENV = 'test';
  process.env.SECURITY_TEST = 'true';
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllTimers();
});

// Global error handler for security tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in security test:', reason);
});

// Console override for security tests to catch sensitive data logging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
  const message = args.join(' ');
  
  // Check for potential sensitive data in logs
  const sensitivePatterns = [
    /password[:\s]*[^\s]+/i,
    /token[:\s]*[^\s]+/i,
    /api[_-]?key[:\s]*[^\s]+/i,
    /secret[:\s]*[^\s]+/i
  ];
  
  const hasSensitiveData = sensitivePatterns.some(pattern => pattern.test(message));
  
  if (hasSensitiveData && process.env.SECURITY_TEST === 'true') {
    console.warn('⚠️  Potential sensitive data in console.log:', message);
  }
  
  originalConsoleLog(...args);
};

console.error = (...args: any[]) => {
  const message = args.join(' ');
  
  // Allow error logging but warn about sensitive data
  const sensitivePatterns = [
    /password[:\s]*[^\s]+/i,
    /token[:\s]*[^\s]+/i,
    /api[_-]?key[:\s]*[^\s]+/i
  ];
  
  const hasSensitiveData = sensitivePatterns.some(pattern => pattern.test(message));
  
  if (hasSensitiveData && process.env.SECURITY_TEST === 'true') {
    console.warn('⚠️  Potential sensitive data in console.error:', message);
  }
  
  originalConsoleError(...args);
};

// Export security test configuration
export const securityTestConfig = {
  maxTestTimeout: 30000,
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  tokenExpiryTime: 3600000, // 1 hour
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedFileExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};
/**
 * Security Tests: Input Validation and Sanitization
 * 
 * Tests protection against XSS attacks, SQL injection, file upload security,
 * and API parameter validation according to requirements 8.1 and 8.4.
 */

import { habitService, completionService } from '../../services/habitService';
import { friendService } from '../../services/friendService';
import { validateHabitInput, sanitizeInput, validateEmail, validatePassword } from '../../utils/inputValidation';
import { HabitCategory, HabitFrequency } from '../../types';

// Mock Firebase to prevent actual database operations during security tests
jest.mock('../../services/firebase', () => ({
  db: {},
  auth: {},
  storage: {}
}));

describe('Security Tests: Input Validation and Sanitization', () => {
  
  describe('XSS Attack Prevention', () => {
    const xssPayloads = [
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
    ];

    test('should sanitize XSS payloads in habit names', () => {
      xssPayloads.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        
        // Should not contain script tags or javascript: protocol
        expect(sanitized).not.toMatch(/<script/i);
        expect(sanitized).not.toMatch(/javascript:/i);
        expect(sanitized).not.toMatch(/onerror=/i);
        expect(sanitized).not.toMatch(/onload=/i);
        expect(sanitized).not.toMatch(/onclick=/i);
        expect(sanitized).not.toMatch(/<iframe/i);
        expect(sanitized).not.toMatch(/<svg/i);
        expect(sanitized).not.toMatch(/<img/i);
        
        // Should be safe for display
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
      });
    });

    test('should validate habit input and reject XSS attempts', () => {
      xssPayloads.forEach(payload => {
        const result = validateHabitInput({
          name: payload,
          category: 'fitness',
          frequency: 'daily',
          isPublic: false
        });
        
        // Should either reject the input or sanitize it
        if (result.isValid) {
          expect(result.sanitizedData.name).not.toMatch(/<script/i);
          expect(result.sanitizedData.name).not.toMatch(/javascript:/i);
        } else {
          expect(result.errors).toContain('Invalid characters in habit name');
        }
      });
    });

    test('should sanitize XSS payloads in user display names', () => {
      xssPayloads.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        
        // Should remove all HTML tags and dangerous content
        expect(sanitized).not.toMatch(/<[^>]*>/);
        expect(sanitized).not.toMatch(/javascript:/i);
        expect(sanitized).not.toMatch(/on\w+=/i);
      });
    });

    test('should sanitize XSS payloads in habit notes', () => {
      xssPayloads.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        
        // Notes should be completely sanitized
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toMatch(/on\w+\s*=/i);
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    const sqlInjectionPayloads = [
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
    ];

    test('should prevent SQL injection in habit search queries', () => {
      sqlInjectionPayloads.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        
        // Should not contain SQL injection patterns
        expect(sanitized).not.toMatch(/DROP\s+TABLE/i);
        expect(sanitized).not.toMatch(/DELETE\s+FROM/i);
        expect(sanitized).not.toMatch(/UNION\s+SELECT/i);
        expect(sanitized).not.toMatch(/EXEC\s+/i);
        expect(sanitized).not.toMatch(/--/);
        expect(sanitized).not.toMatch(/\/\*/);
        expect(sanitized).not.toMatch(/'\s*OR\s*'/i);
      });
    });

    test('should validate email inputs against SQL injection', () => {
      sqlInjectionPayloads.forEach(payload => {
        const result = validateEmail(payload);
        
        // Should reject malicious email formats
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should sanitize user input in friend search', () => {
      sqlInjectionPayloads.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        
        // Should remove SQL injection patterns
        expect(sanitized).not.toMatch(/[';]/);
        expect(sanitized).not.toMatch(/--/);
        expect(sanitized).not.toMatch(/\/\*/);
        expect(sanitized).not.toMatch(/\*\//);
      });
    });
  });

  describe('File Upload Security', () => {
    const maliciousFileTypes = [
      'script.js',
      'malware.exe',
      'virus.bat',
      'trojan.scr',
      'backdoor.php',
      'shell.jsp',
      'exploit.asp',
      'malicious.svg',
      'fake.png.exe',
      'image.jpg.js'
    ];

    test('should validate file types for profile pictures', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maliciousTypes = [
        'application/javascript',
        'application/x-executable',
        'text/html',
        'application/php',
        'text/x-shellscript'
      ];

      allowedTypes.forEach(type => {
        expect(isValidImageType(type)).toBe(true);
      });

      maliciousTypes.forEach(type => {
        expect(isValidImageType(type)).toBe(false);
      });
    });

    test('should validate file extensions', () => {
      maliciousFileTypes.forEach(filename => {
        const isValid = validateFileExtension(filename);
        expect(isValid).toBe(false);
      });

      // Valid image extensions should pass
      const validImages = ['profile.jpg', 'avatar.png', 'photo.gif', 'image.webp'];
      validImages.forEach(filename => {
        const isValid = validateFileExtension(filename);
        expect(isValid).toBe(true);
      });
    });

    test('should validate file size limits', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      expect(validateFileSize(1024)).toBe(true); // 1KB - valid
      expect(validateFileSize(maxSize)).toBe(true); // Exactly 5MB - valid
      expect(validateFileSize(maxSize + 1)).toBe(false); // Over 5MB - invalid
      expect(validateFileSize(10 * 1024 * 1024)).toBe(false); // 10MB - invalid
    });

    test('should sanitize file names', () => {
      const maliciousNames = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config',
        'file<script>alert("xss")</script>.jpg',
        'image"; rm -rf / #.png',
        'photo$(whoami).jpg'
      ];

      maliciousNames.forEach(filename => {
        const sanitized = sanitizeFileName(filename);
        
        expect(sanitized).not.toMatch(/\.\./);
        expect(sanitized).not.toMatch(/[<>]/);
        expect(sanitized).not.toMatch(/[";$]/);
        expect(sanitized).not.toMatch(/script/i);
      });
    });
  });

  describe('API Parameter Validation', () => {
    test('should validate habit creation parameters', () => {
      const invalidInputs = [
        { name: '', category: 'fitness' as HabitCategory, frequency: 'daily' as HabitFrequency, isPublic: false },
        { name: 'a'.repeat(101), category: 'fitness' as HabitCategory, frequency: 'daily' as HabitFrequency, isPublic: false },
        { name: 'Valid Name', category: 'invalid_category' as any, frequency: 'daily' as HabitFrequency, isPublic: false },
        { name: 'Valid Name', category: 'fitness' as HabitCategory, frequency: 'invalid_frequency' as any, isPublic: false },
        { name: 'Valid Name', category: 'fitness' as HabitCategory, frequency: 'daily' as HabitFrequency, isPublic: 'not_boolean' as any },
      ];

      invalidInputs.forEach(input => {
        const result = validateHabitInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should validate user ID parameters', () => {
      const invalidUserIds = [
        '',
        null,
        undefined,
        123,
        {},
        [],
        'user<script>alert("xss")</script>',
        'user"; DROP TABLE users; --',
        '../../../etc/passwd'
      ];

      invalidUserIds.forEach(userId => {
        const result = validateUserId(userId as any);
        expect(result.isValid).toBe(false);
      });

      // Valid user IDs should pass
      const validUserIds = ['user123', 'abc-def-ghi', 'user_123_abc'];
      validUserIds.forEach(userId => {
        const result = validateUserId(userId);
        expect(result.isValid).toBe(true);
      });
    });

    test('should validate email parameters', () => {
      const invalidEmails = [
        '',
        'not-an-email',
        'user@',
        '@domain.com',
        'user..name@domain.com',
        'user@domain',
        'user@.com',
        'user name@domain.com',
        'user<script>@domain.com',
        'user@domain.com<script>alert("xss")</script>'
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
      });

      // Valid emails should pass
      const validEmails = [
        'user@domain.com',
        'test.email@example.org',
        'user+tag@domain.co.uk'
      ];
      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      });
    });

    test('should validate password strength', () => {
      const weakPasswords = [
        '',
        '123',
        'password',
        '12345678',
        'abcdefgh',
        'ABCDEFGH',
        'Password',
        '12345Abc'
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      // Strong passwords should pass
      const strongPasswords = [
        'MyStr0ngP@ssw0rd!',
        'C0mpl3x_P@ssw0rd123',
        'S3cur3!P@ssw0rd#2024'
      ];
      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
      });
    });

    test('should validate numeric parameters', () => {
      const invalidNumbers = [
        'not-a-number',
        '123abc',
        'Infinity',
        'NaN',
        null,
        undefined,
        {},
        []
      ];

      invalidNumbers.forEach(value => {
        const result = validateNumericInput(value as any);
        expect(result.isValid).toBe(false);
      });

      // Valid numbers should pass
      const validNumbers = [0, 1, 100, 1.5, -1, '123', '45.67'];
      validNumbers.forEach(value => {
        const result = validateNumericInput(value);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Error Handling Security', () => {
    test('should not expose sensitive information in error messages', () => {
      const sensitiveData = [
        'password123',
        'firebase-api-key',
        'database-connection-string',
        'user-token-abc123',
        'internal-server-error-details'
      ];

      // Mock console.error to capture error logs
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        // Simulate various error scenarios
        throw new Error('Database connection failed: password123');
      } catch (error) {
        const userMessage = sanitizeErrorMessage((error as Error).message);
        
        // User-facing message should not contain sensitive data
        sensitiveData.forEach(sensitive => {
          expect(userMessage).not.toContain(sensitive);
        });
        
        // Should provide generic, helpful message
        expect(userMessage).toMatch(/something went wrong|please try again|error occurred/i);
      }

      consoleSpy.mockRestore();
    });

    test('should log detailed errors for debugging without exposing to users', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const sensitiveError = new Error('Firebase Auth failed: Invalid API key abc123');
      const userMessage = handleSecureError(sensitiveError, 'authentication');

      // User message should be generic
      expect(userMessage).toBe('Authentication failed. Please try again.');
      
      // Detailed error should be logged for developers
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation authentication failed:'),
        sensitiveError
      );

      consoleSpy.mockRestore();
    });
  });
});

// Helper functions for validation (these would be implemented in utils/inputValidation.ts)
function isValidImageType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimeType);
}

function validateFileExtension(filename: string): boolean {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(extension);
}

function validateFileSize(sizeInBytes: number): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return sizeInBytes <= maxSize;
}

function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove dangerous characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/script/gi, '') // Remove script references
    .replace(/[";$]/g, '') // Remove command injection chars
    .trim();
}

function validateUserId(userId: any): { isValid: boolean; error?: string } {
  if (!userId || typeof userId !== 'string') {
    return { isValid: false, error: 'Invalid user ID format' };
  }
  
  if (userId.length < 3 || userId.length > 50) {
    return { isValid: false, error: 'User ID length invalid' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return { isValid: false, error: 'User ID contains invalid characters' };
  }
  
  return { isValid: true };
}

function validateNumericInput(value: any): { isValid: boolean; error?: string } {
  if (value === null || value === undefined) {
    return { isValid: false, error: 'Value is required' };
  }
  
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: 'Invalid numeric value' };
  }
  
  return { isValid: true };
}

function sanitizeErrorMessage(errorMessage: string): string {
  // Remove sensitive patterns
  return errorMessage
    .replace(/password[:\s]*[^\s]+/gi, 'password: [REDACTED]')
    .replace(/api[_-]?key[:\s]*[^\s]+/gi, 'api_key: [REDACTED]')
    .replace(/token[:\s]*[^\s]+/gi, 'token: [REDACTED]')
    .replace(/connection[_-]?string[:\s]*[^\s]+/gi, 'connection_string: [REDACTED]')
    || 'Something went wrong. Please try again.';
}

function handleSecureError(error: Error, operation: string): string {
  // Log detailed error for debugging (server-side only)
  console.error(`Operation ${operation} failed:`, error);
  
  // Return generic user-friendly message
  const userMessages: { [key: string]: string } = {
    'authentication': 'Authentication failed. Please try again.',
    'habit_creation': 'Failed to create habit. Please try again.',
    'friend_request': 'Failed to send friend request. Please try again.',
    'default': 'Something went wrong. Please try again.'
  };
  
  return userMessages[operation] || userMessages.default;
}
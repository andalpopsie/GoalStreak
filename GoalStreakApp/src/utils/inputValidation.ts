/**
 * Input Validation and Sanitization Utilities
 *
 * Provides comprehensive input validation and sanitization functions
 * to prevent XSS, SQL injection, and other security vulnerabilities.
 */

import { CreateHabitForm } from '../types';

// Valid habit categories
const VALID_CATEGORIES = [
  'fitness',
  'health',
  'mindfulness',
  'productivity',
  'learning',
  'creativity',
  'social',
  'finance',
  'career',
  'hobbies',
  'environment',
  'family',
  'spiritual',
  'travel',
  'cooking',
  'reading',
  'music',
  'art',
  'sports',
  'technology',
  'volunteering',
  'self-care',
  'organization',
  'communication',
  'other',
];

// Valid habit frequencies
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength?: 'weak' | 'medium' | 'strong';
}

/**
 * Sanitizes input by removing dangerous characters and HTML tags
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return (
    input
      // Remove HTML tags and brackets
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '')
      // Remove script content
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove SQL injection patterns
      .replace(/[';]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      // Remove directory traversal
      .replace(/\.\./g, '')
      // Remove command injection characters
      .replace(/[`${}]/g, '')
      // Remove quotes that could be used for injection
      .replace(/["']/g, '')
      // Trim whitespace
      .trim()
  );
}

/**
 * Validates habit input data
 */
export function validateHabitInput(habitData: CreateHabitForm): ValidationResult {
  const errors: string[] = [];
  const sanitizedData = { ...habitData };

  // Validate and sanitize name
  if (!habitData.name || typeof habitData.name !== 'string') {
    errors.push('Habit name is required');
  } else {
    const sanitizedName = sanitizeInput(habitData.name);
    if (sanitizedName.length < 2) {
      errors.push('Habit name must be at least 2 characters');
    } else if (sanitizedName.length > 100) {
      errors.push('Habit name must be less than 100 characters');
    }

    // Check for dangerous patterns in original input
    const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /[<>]/, /['"]/];

    const hasDangerousContent = dangerousPatterns.some((pattern) => pattern.test(habitData.name));
    if (hasDangerousContent || sanitizedName !== habitData.name.trim()) {
      errors.push('Invalid characters in habit name');
    }

    sanitizedData.name = sanitizedName;
  }

  // Validate category
  if (!habitData.category || !VALID_CATEGORIES.includes(habitData.category)) {
    errors.push('Invalid habit category');
  }

  // Validate frequency
  if (!habitData.frequency || !VALID_FREQUENCIES.includes(habitData.frequency)) {
    errors.push('Invalid habit frequency');
  }

  // Validate isPublic
  if (typeof habitData.isPublic !== 'boolean') {
    errors.push('Invalid privacy setting');
  }

  // Validate optional fields
  if (habitData.targetValue !== undefined && habitData.targetValue !== null) {
    if (typeof habitData.targetValue !== 'number' || habitData.targetValue < 0) {
      errors.push('Invalid target value');
    }
  }

  if (habitData.unit) {
    const sanitizedUnit = sanitizeInput(habitData.unit);
    if (sanitizedUnit.length > 20) {
      errors.push('Unit must be less than 20 characters');
    }
    sanitizedData.unit = sanitizedUnit;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
}

/**
 * Validates email format and security
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  // Check for basic XSS patterns
  if (email.includes('<') || email.includes('>') || email.includes('script')) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check for SQL injection patterns
  if (email.includes("'") || email.includes('"') || email.includes('--') || email.includes('/*')) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Basic email regex validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check length limits
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  return { isValid: true };
}

/**
 * Validates password strength and security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  // Length requirements
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password is too long (max 128 characters)');
  }

  // Character requirements
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common password checks
  const commonPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 12;

    const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(
      Boolean
    ).length;

    if (criteriaCount >= 4) {
      strength = 'strong';
    } else if (criteriaCount >= 3) {
      strength = 'medium';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? strength : undefined,
  };
}

/**
 * Validates user display name
 */
export function validateDisplayName(displayName: string): ValidationResult {
  const errors: string[] = [];

  if (!displayName || typeof displayName !== 'string') {
    errors.push('Display name is required');
    return { isValid: false, errors };
  }

  const sanitized = sanitizeInput(displayName);

  if (sanitized.length < 2) {
    errors.push('Display name must be at least 2 characters');
  }

  if (sanitized.length > 50) {
    errors.push('Display name must be less than 50 characters');
  }

  if (sanitized !== displayName) {
    errors.push('Display name contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitized,
  };
}

/**
 * Validates file upload security
 */
export function validateFileUpload(file: {
  name: string;
  type: string;
  size: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed');
  }

  // Validate file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    errors.push('Invalid file extension');
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }

  // Validate filename for security
  const sanitizedName = sanitizeFileName(file.name);
  if (sanitizedName !== file.name) {
    errors.push('Invalid characters in filename');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: { ...file, name: sanitizedName },
  };
}

/**
 * Sanitizes filename for security
 */
export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove dangerous characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/script/gi, '') // Remove script references
    .replace(/[";$`]/g, '') // Remove command injection chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
}

/**
 * Validates search query input
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];

  if (!query || typeof query !== 'string') {
    errors.push('Search query is required');
    return { isValid: false, errors };
  }

  const sanitized = sanitizeInput(query);

  if (sanitized.length < 1) {
    errors.push('Search query is too short');
  }

  if (sanitized.length > 100) {
    errors.push('Search query is too long');
  }

  // Check for SQL injection patterns
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /exec\s+/i,
    /xp_cmdshell/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(query)) {
      errors.push('Invalid search query');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitized,
  };
}

/**
 * Validates API parameters for security
 */
export function validateApiParameters(params: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    // Validate parameter names
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      errors.push(`Invalid parameter name: ${key}`);
      continue;
    }

    // Sanitize string values
    if (typeof value === 'string') {
      const sanitized = sanitizeInput(value);
      if (sanitized !== value) {
        errors.push(`Invalid characters in parameter: ${key}`);
      }
      sanitizedData[key] = sanitized;
    } else if (typeof value === 'number') {
      if (!isFinite(value)) {
        errors.push(`Invalid numeric value for parameter: ${key}`);
      } else {
        sanitizedData[key] = value;
      }
    } else if (typeof value === 'boolean') {
      sanitizedData[key] = value;
    } else if (value === null || value === undefined) {
      sanitizedData[key] = value;
    } else {
      errors.push(`Invalid parameter type for: ${key}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  checkLimit(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    record.count++;
    return true;
  }

  getRemainingAttempts(identifier: string, maxAttempts: number): number {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - record.count);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Global rate limiter instances
export const authRateLimiter = new RateLimiter();
export const apiRateLimiter = new RateLimiter();

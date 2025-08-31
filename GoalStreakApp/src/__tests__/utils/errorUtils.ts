// Error Handling Utilities for Testing
import { FirebaseError } from 'firebase/app';

/**
 * Common Firebase error codes for testing
 */
export const FIREBASE_ERROR_CODES = {
  // Auth errors
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_WRONG_PASSWORD: 'auth/wrong-password',
  AUTH_EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_INVALID_EMAIL: 'auth/invalid-email',
  AUTH_USER_DISABLED: 'auth/user-disabled',
  AUTH_TOO_MANY_REQUESTS: 'auth/too-many-requests',
  AUTH_NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  
  // Firestore errors
  FIRESTORE_PERMISSION_DENIED: 'firestore/permission-denied',
  FIRESTORE_NOT_FOUND: 'firestore/not-found',
  FIRESTORE_ALREADY_EXISTS: 'firestore/already-exists',
  FIRESTORE_RESOURCE_EXHAUSTED: 'firestore/resource-exhausted',
  FIRESTORE_FAILED_PRECONDITION: 'firestore/failed-precondition',
  FIRESTORE_ABORTED: 'firestore/aborted',
  FIRESTORE_OUT_OF_RANGE: 'firestore/out-of-range',
  FIRESTORE_UNIMPLEMENTED: 'firestore/unimplemented',
  FIRESTORE_INTERNAL: 'firestore/internal',
  FIRESTORE_UNAVAILABLE: 'firestore/unavailable',
  FIRESTORE_DATA_LOSS: 'firestore/data-loss',
  FIRESTORE_UNAUTHENTICATED: 'firestore/unauthenticated',
  
  // Storage errors
  STORAGE_OBJECT_NOT_FOUND: 'storage/object-not-found',
  STORAGE_BUCKET_NOT_FOUND: 'storage/bucket-not-found',
  STORAGE_PROJECT_NOT_FOUND: 'storage/project-not-found',
  STORAGE_QUOTA_EXCEEDED: 'storage/quota-exceeded',
  STORAGE_UNAUTHENTICATED: 'storage/unauthenticated',
  STORAGE_UNAUTHORIZED: 'storage/unauthorized',
  STORAGE_RETRY_LIMIT_EXCEEDED: 'storage/retry-limit-exceeded',
  STORAGE_INVALID_CHECKSUM: 'storage/invalid-checksum',
  STORAGE_CANCELED: 'storage/canceled',
  STORAGE_INVALID_EVENT_NAME: 'storage/invalid-event-name',
  STORAGE_INVALID_URL: 'storage/invalid-url',
  STORAGE_INVALID_ARGUMENT: 'storage/invalid-argument',
  STORAGE_NO_DEFAULT_BUCKET: 'storage/no-default-bucket',
  STORAGE_CANNOT_SLICE_BLOB: 'storage/cannot-slice-blob',
  STORAGE_SERVER_FILE_WRONG_SIZE: 'storage/server-file-wrong-size'
} as const;

/**
 * Create a mock Firebase error
 */
export const createMockFirebaseError = (
  code: string,
  message?: string,
  customData?: any
): FirebaseError => {
  const error = new Error(message || `Firebase error: ${code}`) as FirebaseError;
  error.code = code;
  error.name = 'FirebaseError';
  error.customData = customData;
  return error;
};

/**
 * Create common authentication errors
 */
export const createAuthError = {
  userNotFound: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.AUTH_USER_NOT_FOUND,
      message || 'There is no user record corresponding to this identifier.'
    ),
    
  wrongPassword: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.AUTH_WRONG_PASSWORD,
      message || 'The password is invalid or the user does not have a password.'
    ),
    
  emailAlreadyInUse: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.AUTH_EMAIL_ALREADY_IN_USE,
      message || 'The email address is already in use by another account.'
    ),
    
  weakPassword: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.AUTH_WEAK_PASSWORD,
      message || 'The password must be 6 characters long or more.'
    ),
    
  invalidEmail: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.AUTH_INVALID_EMAIL,
      message || 'The email address is badly formatted.'
    ),
    
  tooManyRequests: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.AUTH_TOO_MANY_REQUESTS,
      message || 'Too many unsuccessful login attempts. Please try again later.'
    ),
    
  networkError: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.AUTH_NETWORK_REQUEST_FAILED,
      message || 'A network error has occurred.'
    )
};

/**
 * Create common Firestore errors
 */
export const createFirestoreError = {
  permissionDenied: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.FIRESTORE_PERMISSION_DENIED,
      message || 'Missing or insufficient permissions.'
    ),
    
  notFound: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.FIRESTORE_NOT_FOUND,
      message || 'Some requested document was not found.'
    ),
    
  alreadyExists: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.FIRESTORE_ALREADY_EXISTS,
      message || 'Some document that we attempted to create already exists.'
    ),
    
  resourceExhausted: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.FIRESTORE_RESOURCE_EXHAUSTED,
      message || 'Some resource has been exhausted, perhaps a per-user quota.'
    ),
    
  unauthenticated: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.FIRESTORE_UNAUTHENTICATED,
      message || 'The request does not have valid authentication credentials.'
    ),
    
  unavailable: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.FIRESTORE_UNAVAILABLE,
      message || 'The service is currently unavailable.'
    )
};

/**
 * Create common Storage errors
 */
export const createStorageError = {
  objectNotFound: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.STORAGE_OBJECT_NOT_FOUND,
      message || 'No object exists at the desired reference.'
    ),
    
  quotaExceeded: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.STORAGE_QUOTA_EXCEEDED,
      message || 'Quota for bucket exceeded, please view quota on firebase.google.com/pricing/.'
    ),
    
  unauthenticated: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.STORAGE_UNAUTHENTICATED,
      message || 'User is not authenticated, please authenticate using Firebase Authentication and try again.'
    ),
    
  unauthorized: (message?: string) => 
    createMockFirebaseError(
      FIREBASE_ERROR_CODES.STORAGE_UNAUTHORIZED,
      message || 'User does not have permission to access this object.'
    )
};

/**
 * Network error simulation
 */
export const createNetworkError = (message?: string): Error => {
  const error = new Error(message || 'Network request failed');
  error.name = 'NetworkError';
  return error;
};

/**
 * Timeout error simulation
 */
export const createTimeoutError = (timeout: number = 5000): Error => {
  const error = new Error(`Request timed out after ${timeout}ms`);
  error.name = 'TimeoutError';
  return error;
};

/**
 * Validation error simulation
 */
export const createValidationError = (field: string, message?: string): Error => {
  const error = new Error(message || `Validation failed for field: ${field}`);
  error.name = 'ValidationError';
  (error as any).field = field;
  return error;
};

/**
 * Test error scenarios
 */
export const ERROR_SCENARIOS = {
  // Authentication scenarios
  loginWithInvalidCredentials: () => createAuthError.userNotFound(),
  loginWithWrongPassword: () => createAuthError.wrongPassword(),
  signupWithExistingEmail: () => createAuthError.emailAlreadyInUse(),
  signupWithWeakPassword: () => createAuthError.weakPassword(),
  authNetworkFailure: () => createAuthError.networkError(),
  
  // Firestore scenarios
  unauthorizedAccess: () => createFirestoreError.permissionDenied(),
  documentNotFound: () => createFirestoreError.notFound(),
  documentAlreadyExists: () => createFirestoreError.alreadyExists(),
  quotaExceeded: () => createFirestoreError.resourceExhausted(),
  serviceUnavailable: () => createFirestoreError.unavailable(),
  
  // Storage scenarios
  fileNotFound: () => createStorageError.objectNotFound(),
  storageQuotaExceeded: () => createStorageError.quotaExceeded(),
  storageUnauthorized: () => createStorageError.unauthorized(),
  
  // Network scenarios
  networkFailure: () => createNetworkError(),
  requestTimeout: () => createTimeoutError(),
  
  // Validation scenarios
  invalidHabitName: () => createValidationError('name', 'Habit name is required'),
  invalidEmail: () => createValidationError('email', 'Invalid email format'),
  invalidPassword: () => createValidationError('password', 'Password must be at least 6 characters')
};

/**
 * Error assertion helpers
 */
export const expectError = {
  toBeFirebaseError: (error: any, expectedCode?: string) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('FirebaseError');
    if (expectedCode) {
      expect(error.code).toBe(expectedCode);
    }
  },
  
  toBeAuthError: (error: any, expectedCode?: string) => {
    expectError.toBeFirebaseError(error, expectedCode);
    if (expectedCode) {
      expect(error.code).toMatch(/^auth\//);
    }
  },
  
  toBeFirestoreError: (error: any, expectedCode?: string) => {
    expectError.toBeFirebaseError(error, expectedCode);
    if (expectedCode) {
      expect(error.code).toMatch(/^firestore\//);
    }
  },
  
  toBeStorageError: (error: any, expectedCode?: string) => {
    expectError.toBeFirebaseError(error, expectedCode);
    if (expectedCode) {
      expect(error.code).toMatch(/^storage\//);
    }
  },
  
  toBeNetworkError: (error: any) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NetworkError');
  },
  
  toBeTimeoutError: (error: any) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TimeoutError');
  },
  
  toBeValidationError: (error: any, expectedField?: string) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    if (expectedField) {
      expect((error as any).field).toBe(expectedField);
    }
  }
};

/**
 * Mock error handler for testing
 */
export const createMockErrorHandler = () => {
  const handler = jest.fn();
  
  return {
    handler,
    expectCalled: (times: number = 1) => {
      expect(handler).toHaveBeenCalledTimes(times);
    },
    expectCalledWith: (error: any) => {
      expect(handler).toHaveBeenCalledWith(error);
    },
    expectNotCalled: () => {
      expect(handler).not.toHaveBeenCalled();
    },
    reset: () => {
      handler.mockClear();
    }
  };
};

/**
 * Simulate intermittent errors for testing retry logic
 */
export const createIntermittentError = (
  successAfterAttempts: number = 3,
  errorToThrow: Error = createNetworkError()
) => {
  let attemptCount = 0;
  
  return jest.fn(() => {
    attemptCount++;
    if (attemptCount < successAfterAttempts) {
      throw errorToThrow;
    }
    return Promise.resolve('success');
  });
};
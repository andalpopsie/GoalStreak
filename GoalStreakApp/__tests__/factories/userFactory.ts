import { User, LoginForm, SignUpForm } from '../../types';

// Realistic user data
const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Sage', 'River'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com', 'test.com'];

// Generate unique ID for testing
let userIdCounter = 1;
const generateUserId = (): string => `test-user-${userIdCounter++}-${Date.now()}`;

/**
 * Create a mock User (Firestore user document)
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const domain = EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  
  return {
    id: generateUserId(),
    email,
    displayName: `${firstName} ${lastName}`,
    profilePicture: undefined,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides
  };
};

/**
 * Create multiple mock users
 */
export const createMockUsers = (count: number): User[] => {
  const users: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const createdDate = new Date('2025-01-01T00:00:00Z');
    createdDate.setDate(createdDate.getDate() + i);
    
    users.push(createMockUser({
      createdAt: createdDate,
      updatedAt: createdDate,
      profilePicture: i % 3 === 0 ? `https://mock-avatar.com/user-${i}.jpg` : undefined
    }));
  }
  
  return users;
};

/**
 * Create a mock Firebase Auth User
 */
export const createMockAuthUser = (overrides: any = {}): any => {
  const user = createMockUser(overrides);
  
  return {
    uid: user.id,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.profilePicture || null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: user.createdAt.toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    providerData: [
      {
        uid: user.email,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.profilePicture || null,
        providerId: 'password'
      }
    ],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn(() => Promise.resolve()),
    getIdToken: jest.fn(() => Promise.resolve('mock-id-token')),
    getIdTokenResult: jest.fn(() => Promise.resolve({
      token: 'mock-id-token',
      authTime: user.createdAt.toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      signInProvider: 'password',
      signInSecondFactor: null,
      claims: {
        email: user.email,
        email_verified: true
      }
    })),
    reload: jest.fn(() => Promise.resolve()),
    toJSON: jest.fn(() => ({
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.profilePicture || null,
      emailVerified: true
    })),
    ...overrides
  };
};

/**
 * Create a mock login form
 */
export const createMockLoginForm = (overrides: Partial<LoginForm> = {}): LoginForm => ({
  email: 'test@example.com',
  password: 'password123',
  ...overrides
});

/**
 * Create a mock signup form
 */
export const createMockSignUpForm = (overrides: Partial<SignUpForm> = {}): SignUpForm => {
  const user = createMockUser();
  
  return {
    email: user.email,
    password: 'password123',
    confirmPassword: 'password123',
    displayName: user.displayName,
    ...overrides
  };
};

/**
 * Create test credentials for authentication
 */
export const createTestCredentials = (overrides: any = {}) => ({
  email: 'test@example.com',
  password: 'password123',
  displayName: 'Test User',
  ...overrides
});

/**
 * Create multiple test credentials
 */
export const createMultipleTestCredentials = (count: number) => {
  const credentials = [];
  
  for (let i = 0; i < count; i++) {
    const user = createMockUser();
    credentials.push({
      email: user.email,
      password: `password${i + 1}23`,
      displayName: user.displayName
    });
  }
  
  return credentials;
};

/**
 * Create a user with authentication state
 */
export const createMockUserWithAuth = (overrides: any = {}) => {
  const user = createMockUser(overrides);
  const authUser = createMockAuthUser({ uid: user.id, email: user.email, displayName: user.displayName });
  
  return {
    user,
    authUser,
    credentials: {
      email: user.email,
      password: 'password123'
    }
  };
};

/**
 * Reset user ID counter for consistent testing
 */
export const resetUserFactoryIds = (): void => {
  userIdCounter = 1;
};
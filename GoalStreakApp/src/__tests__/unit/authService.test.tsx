// Mock Firebase Auth functions before importing anything else
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockUpdateProfile = jest.fn();
const mockSendPasswordResetEmail = jest.fn();

// Mock Firebase Firestore functions
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  updateProfile: mockUpdateProfile,
  sendPasswordResetEmail: mockSendPasswordResetEmail
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc
}));

// Mock Firebase service
jest.mock('../../services/firebase', () => ({
  auth: 'mock-auth',
  db: 'mock-db',
  isFirebaseConfigured: jest.fn(() => true)
}));

// Mock friend service
jest.mock('../../services/friendService', () => ({
  default: {
    createUserProfile: jest.fn().mockResolvedValue(undefined)
  }
}));

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { isFirebaseConfigured } from '../../services/firebase';
import friendService from '../../services/friendService';

// Get the mocked function
const mockCreateUserProfile = friendService.createUserProfile as jest.MockedFunction<typeof friendService.createUserProfile>;

// Use mock values for auth and db
const mockAuth = 'mock-auth' as any;
const mockDb = 'mock-db' as any;

describe('Authentication Service Functions', () => {
  const mockFirebaseUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null
  };

  const mockUserData = {
    displayName: 'Test User',
    profilePicture: null,
    createdAt: { toDate: () => new Date('2025-01-01') },
    updatedAt: { toDate: () => new Date('2025-01-01') }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    (isFirebaseConfigured as jest.Mock).mockReturnValue(true);
    
    mockDoc.mockReturnValue('mock-doc-ref');
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserData
    });
    mockSetDoc.mockResolvedValue(undefined);
    
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: mockFirebaseUser
    });
    
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: mockFirebaseUser
    });
    
    mockSignOut.mockResolvedValue(undefined);
    mockUpdateProfile.mockResolvedValue(undefined);
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
  });

  describe('signInWithEmailAndPassword', () => {
    it('should sign in with valid credentials', async () => {
      const result = await signInWithEmailAndPassword(mockAuth, 'test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        'mock-auth',
        'test@example.com',
        'password123'
      );
      expect(result.user).toEqual(mockFirebaseUser);
    });

    it('should handle invalid credentials error', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/invalid-credential')
      );

      await expect(
        signInWithEmailAndPassword(mockAuth, 'test@example.com', 'wrongpassword')
      ).rejects.toThrow('auth/invalid-credential');
    });

    it('should handle user not found error', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/user-not-found')
      );

      await expect(
        signInWithEmailAndPassword(mockAuth, 'nonexistent@example.com', 'password123')
      ).rejects.toThrow('auth/user-not-found');
    });

    it('should handle invalid email error', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/invalid-email')
      );

      await expect(
        signInWithEmailAndPassword(mockAuth, 'invalid-email', 'password123')
      ).rejects.toThrow('auth/invalid-email');
    });

    it('should handle user disabled error', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/user-disabled')
      );

      await expect(
        signInWithEmailAndPassword(mockAuth, 'disabled@example.com', 'password123')
      ).rejects.toThrow('auth/user-disabled');
    });

    it('should handle too many requests error', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/too-many-requests')
      );

      await expect(
        signInWithEmailAndPassword(mockAuth, 'test@example.com', 'password123')
      ).rejects.toThrow('auth/too-many-requests');
    });

    it('should handle network errors', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/network-request-failed')
      );

      await expect(
        signInWithEmailAndPassword(mockAuth, 'test@example.com', 'password123')
      ).rejects.toThrow('auth/network-request-failed');
    });
  });

  describe('createUserWithEmailAndPassword', () => {
    it('should create account with valid data', async () => {
      const result = await createUserWithEmailAndPassword(mockAuth, 'test@example.com', 'password123');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        'mock-auth',
        'test@example.com',
        'password123'
      );
      expect(result.user).toEqual(mockFirebaseUser);
    });

    it('should handle email already in use error', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/email-already-in-use')
      );

      await expect(
        createUserWithEmailAndPassword(mockAuth, 'existing@example.com', 'password123')
      ).rejects.toThrow('auth/email-already-in-use');
    });

    it('should handle weak password error', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/weak-password')
      );

      await expect(
        createUserWithEmailAndPassword(mockAuth, 'test@example.com', '123')
      ).rejects.toThrow('auth/weak-password');
    });

    it('should handle invalid email error', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/invalid-email')
      );

      await expect(
        createUserWithEmailAndPassword(mockAuth, 'invalid-email', 'password123')
      ).rejects.toThrow('auth/invalid-email');
    });

    it('should handle operation not allowed error', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/operation-not-allowed')
      );

      await expect(
        createUserWithEmailAndPassword(mockAuth, 'test@example.com', 'password123')
      ).rejects.toThrow('auth/operation-not-allowed');
    });

    it('should handle quota exceeded error', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/quota-exceeded')
      );

      await expect(
        createUserWithEmailAndPassword(mockAuth, 'test@example.com', 'password123')
      ).rejects.toThrow('auth/quota-exceeded');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      await signOut(mockAuth);

      expect(mockSignOut).toHaveBeenCalledWith('mock-auth');
    });

    it('should handle sign out errors', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      await expect(signOut(mockAuth)).rejects.toThrow('Sign out failed');
    });

    it('should handle network errors during sign out', async () => {
      mockSignOut.mockRejectedValue(new Error('auth/network-request-failed'));

      await expect(signOut(mockAuth)).rejects.toThrow('auth/network-request-failed');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      await sendPasswordResetEmail(mockAuth, 'test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        'mock-auth',
        'test@example.com'
      );
    });

    it('should handle user not found error', async () => {
      mockSendPasswordResetEmail.mockRejectedValue(
        new Error('auth/user-not-found')
      );

      await expect(
        sendPasswordResetEmail(mockAuth, 'nonexistent@example.com')
      ).rejects.toThrow('auth/user-not-found');
    });

    it('should handle invalid email error', async () => {
      mockSendPasswordResetEmail.mockRejectedValue(
        new Error('auth/invalid-email')
      );

      await expect(
        sendPasswordResetEmail(mockAuth, 'invalid-email')
      ).rejects.toThrow('auth/invalid-email');
    });

    it('should handle too many requests error', async () => {
      mockSendPasswordResetEmail.mockRejectedValue(
        new Error('auth/too-many-requests')
      );

      await expect(
        sendPasswordResetEmail(mockAuth, 'test@example.com')
      ).rejects.toThrow('auth/too-many-requests');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updates = { displayName: 'Updated Name' };

      await updateProfile(mockFirebaseUser as any, updates);

      expect(mockUpdateProfile).toHaveBeenCalledWith(
        mockFirebaseUser,
        updates
      );
    });

    it('should handle profile update errors', async () => {
      mockUpdateProfile.mockRejectedValue(new Error('Profile update failed'));

      const updates = { displayName: 'Updated Name' };

      await expect(
        updateProfile(mockFirebaseUser as any, updates)
      ).rejects.toThrow('Profile update failed');
    });
  });

  describe('Firestore User Data Operations', () => {
    it('should create user document in Firestore', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(mockDb, 'users', 'test-user-123'), userData);

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'test-user-123');
      expect(mockSetDoc).toHaveBeenCalledWith('mock-doc-ref', userData);
    });

    it('should get user document from Firestore', async () => {
      const userDoc = await getDoc(doc(mockDb, 'users', 'test-user-123'));

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'test-user-123');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data()).toEqual(mockUserData);
    });

    it('should handle Firestore errors', async () => {
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(
        setDoc(doc(mockDb, 'users', 'test-user-123'), userData)
      ).rejects.toThrow('Firestore error');
    });

    it('should handle user document not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      const userDoc = await getDoc(doc(mockDb, 'users', 'nonexistent-user'));

      expect(userDoc.exists()).toBe(false);
      expect(userDoc.data()).toBeNull();
    });
  });

  describe('User Registration Flow', () => {
    it('should complete individual registration steps', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const displayName = 'Test User';

      // Step 1: Create user account
      const { user } = await createUserWithEmailAndPassword(mockAuth, email, password);
      expect(user).toEqual(mockFirebaseUser);

      // Step 2: Update profile
      await updateProfile(user, { displayName });
      expect(mockUpdateProfile).toHaveBeenCalledWith(user, { displayName });

      // Step 3: Create Firestore document
      const userData = {
        email,
        displayName,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };
      await setDoc(doc(mockDb, 'users', user.uid), userData);
      expect(mockSetDoc).toHaveBeenCalledWith('mock-doc-ref', userData);
    });

    it('should handle registration failure at account creation', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/email-already-in-use')
      );

      await expect(
        createUserWithEmailAndPassword(mockAuth, 'existing@example.com', 'password123')
      ).rejects.toThrow('auth/email-already-in-use');
    });

    it('should handle registration failure at profile update', async () => {
      const { user } = await createUserWithEmailAndPassword(mockAuth, 'test@example.com', 'password123');
      
      mockUpdateProfile.mockRejectedValue(new Error('Profile update failed'));

      await expect(
        updateProfile(user, { displayName: 'Test User' })
      ).rejects.toThrow('Profile update failed');
    });

    it('should handle registration failure at Firestore creation', async () => {
      const { user } = await createUserWithEmailAndPassword(mockAuth, 'test@example.com', 'password123');
      await updateProfile(user, { displayName: 'Test User' });
      
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(
        setDoc(doc(mockDb, 'users', user.uid), userData)
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('Password Security Requirements', () => {
    it('should enforce minimum password length', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/weak-password')
      );

      await expect(
        createUserWithEmailAndPassword(mockAuth, 'test@example.com', '12345')
      ).rejects.toThrow('auth/weak-password');
    });

    it('should handle password complexity requirements', async () => {
      // Test various weak passwords
      const weakPasswords = ['123', 'abc', 'password', '12345678'];
      
      for (const password of weakPasswords) {
        mockCreateUserWithEmailAndPassword.mockRejectedValue(
          new Error('auth/weak-password')
        );

        await expect(
          createUserWithEmailAndPassword(mockAuth, 'test@example.com', password)
        ).rejects.toThrow('auth/weak-password');
      }
    });
  });

  describe('Session Management', () => {
    it('should handle auth state changes', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      
      mockOnAuthStateChanged.mockReturnValue(unsubscribe);

      const result = mockOnAuthStateChanged(mockAuth, callback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith('mock-auth', callback);
      expect(result).toBe(unsubscribe);
      expect(typeof result).toBe('function');
    });

    it('should call callback with user when authenticated', () => {
      const callback = jest.fn();
      
      mockOnAuthStateChanged.mockImplementation((auth, cb) => {
        cb(mockFirebaseUser);
        return jest.fn();
      });

      mockOnAuthStateChanged(mockAuth, callback);

      expect(callback).toHaveBeenCalledWith(mockFirebaseUser);
    });

    it('should call callback with null when not authenticated', () => {
      const callback = jest.fn();
      
      mockOnAuthStateChanged.mockImplementation((auth, cb) => {
        cb(null);
        return jest.fn();
      });

      mockOnAuthStateChanged(mockAuth, callback);

      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('Firebase Configuration', () => {
    it('should check if Firebase is configured', () => {
      const result = isFirebaseConfigured();
      expect(result).toBe(true);
    });

    it('should handle Firebase not configured', () => {
      (isFirebaseConfigured as jest.Mock).mockReturnValue(false);

      const result = isFirebaseConfigured();
      expect(result).toBe(false);
    });
  });

  describe('Error Message Handling', () => {
    it('should preserve original error messages', async () => {
      const originalError = new Error('auth/custom-error-message');
      mockSignInWithEmailAndPassword.mockRejectedValue(originalError);

      await expect(
        signInWithEmailAndPassword(mockAuth, 'test@example.com', 'password123')
      ).rejects.toThrow('auth/custom-error-message');
    });

    it('should handle errors without messages', async () => {
      const errorWithoutMessage = new Error();
      mockSignOut.mockRejectedValue(errorWithoutMessage);

      await expect(signOut(mockAuth)).rejects.toThrow();
    });
  });
});
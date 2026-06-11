import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import { User as AppUser, AuthState } from '../types';
import friendService from '../services/friendService';
import { generateUsername, isUsernameAvailable, reserveUsername } from '../utils/usernameUtils';
import { accountDeletionService } from '../services/accountDeletionService';
import subscriptionService from '../services/subscriptionService';

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // If Firebase is not configured, set loading to false and return
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();

          const appUser: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || userData?.displayName || '',
            username: userData?.username,
            profilePicture: firebaseUser.photoURL || userData?.profilePicture,
            createdAt: userData?.createdAt?.toDate() || new Date(),
            updatedAt: userData?.updatedAt?.toDate() || new Date(),
          };

          // Backfill username for existing users who don't have one
          if (!userData?.username && firebaseUser.displayName) {
            let username = generateUsername(firebaseUser.displayName);
            let attempts = 0;
            while (!(await isUsernameAvailable(username)) && attempts < 5) {
              username = generateUsername(firebaseUser.displayName);
              attempts++;
            }
            await setDoc(doc(db, 'users', firebaseUser.uid), { username, updatedAt: new Date() }, { merge: true });
            await reserveUsername(username, firebaseUser.uid);
            appUser.username = username;
          }

          setAuthState({
            user: appUser,
            isLoading: false,
            isAuthenticated: true,
          });

          // Fire-and-forget: initialize RevenueCat for the signed-in user.
          // Intentionally not awaited so it does not block sign-in or the
          // first render of the home screen. If initialization fails, the
          // user is treated as Free until the next `getProStatus` call
          // resolves (Req 1.1, 1.2, 1.3, 1.4).
          subscriptionService.initialize(appUser.id).catch((err) => {
            console.error('Failed to initialize subscription service:', err);
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Convert Firebase errors to user-friendly messages
      const errorCode = error.code;
      let userMessage = 'Failed to sign in. Please try again.';
      
      switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          userMessage = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/invalid-email':
          userMessage = 'Invalid email address. Please enter a valid email.';
          break;
        case 'auth/user-disabled':
          userMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Too many failed attempts. Please try again later or reset your password.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          // Log technical error for debugging, but show user-friendly message
          console.error('Sign in error:', errorCode, error.message);
          userMessage = 'Unable to sign in. Please try again later.';
      }
      
      throw new Error(userMessage);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      const userData = {
        email,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
        hasCompletedOnboarding: false, // New users need onboarding
      };

      // Generate a unique username
      let username = generateUsername(displayName);
      let attempts = 0;
      while (!(await isUsernameAvailable(username)) && attempts < 5) {
        username = generateUsername(displayName);
        attempts++;
      }

      (userData as any).username = username;
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // Reserve the username
      await reserveUsername(username, firebaseUser.uid);

      // Create user profile for social features
      await friendService.createUserProfile(firebaseUser.uid, email, displayName);
    } catch (error: any) {
      // Convert Firebase errors to user-friendly messages
      const errorCode = error.code;
      let userMessage = 'Failed to create account. Please try again.';
      
      switch (errorCode) {
        case 'auth/email-already-in-use':
          userMessage = 'This email is already registered. Please sign in or use a different email.';
          break;
        case 'auth/invalid-email':
          userMessage = 'Invalid email address. Please enter a valid email.';
          break;
        case 'auth/weak-password':
          userMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/operation-not-allowed':
          userMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          // Log technical error for debugging, but show user-friendly message
          console.error('Sign up error:', errorCode, error.message);
          userMessage = 'Unable to create account. Please try again later.';
      }
      
      throw new Error(userMessage);
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured()) {
      return;
    }

    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      // Convert Firebase errors to user-friendly messages
      const errorCode = error.code;
      let userMessage = 'Failed to send password reset email. Please try again.';
      
      switch (errorCode) {
        case 'auth/invalid-email':
          userMessage = 'Invalid email address. Please enter a valid email.';
          break;
        case 'auth/user-not-found':
          userMessage = 'No account found with this email address.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          // Log technical error for debugging, but show user-friendly message
          console.error('Password reset error:', errorCode, error.message);
          userMessage = 'Unable to send reset email. Please try again later.';
      }
      
      throw new Error(userMessage);
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!authState.user || !isFirebaseConfigured()) {
      throw new Error('User not authenticated or Firebase not configured');
    }

    try {
      const userRef = doc(db, 'users', authState.user.id);
      await setDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      }, { merge: true });

      // Update local state
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  /**
   * Permanently deletes the current user's account and all associated data.
   * Requires the user's password to re-authenticate (Apple Guideline 5.1.1(v)).
   */
  const deleteAccount = async (password: string) => {
    if (!authState.user || !isFirebaseConfigured()) {
      throw new Error('User not authenticated or Firebase not configured');
    }

    try {
      await accountDeletionService.reauthenticateAndDeleteAccount(password);
      // Auth state will update via onAuthStateChanged after deletion.
    } catch (error: any) {
      const errorCode = error.code;
      let userMessage = 'Failed to delete account. Please try again.';

      switch (errorCode) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          userMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your connection and try again.';
          break;
        case 'auth/requires-recent-login':
          userMessage = 'For security, please sign out and sign back in before deleting your account.';
          break;
        default:
          console.error('Account deletion error:', errorCode, error.message);
          userMessage = error.message || 'Unable to delete account. Please try again later.';
      }

      throw new Error(userMessage);
    }
  };

  const value: AuthContextType = {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

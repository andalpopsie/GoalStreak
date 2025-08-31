import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { mockAuth } from '../mocks/firebase';
import { useAuth, AuthProvider } from '../../hooks/useAuth';

// Mock Firebase services
jest.mock('../../services/firebase', () => ({
  auth: mockAuth,
  isFirebaseConfigured: jest.fn(() => true)
}));

// Mock friend service
jest.mock('../../services/friendService', () => ({
  createUserProfile: jest.fn(() => Promise.resolve())
}));

describe('useAuth Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.currentUser = null;
  });

  describe('Basic Functionality', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should provide sign in function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(typeof result.current.signIn).toBe('function');
    });

    it('should provide sign up function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(typeof result.current.signUp).toBe('function');
    });

    it('should provide sign out function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(typeof result.current.signOut).toBe('function');
    });
  });

  describe('Authentication State', () => {
    it('should handle authentication state changes', async () => {
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });
    });
  });
});
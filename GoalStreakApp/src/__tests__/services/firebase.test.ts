import { isFirebaseConfigured } from '../../services/firebase';

// Mock Firebase to avoid actual connections
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn()
}));

describe('Firebase Service', () => {
  describe('isFirebaseConfigured', () => {
    it('should return boolean indicating Firebase configuration status', () => {
      const result = isFirebaseConfigured();
      expect(typeof result).toBe('boolean');
    });

    it('should handle missing configuration gracefully', () => {
      // Test that the function doesn't throw
      expect(() => isFirebaseConfigured()).not.toThrow();
    });
  });
});
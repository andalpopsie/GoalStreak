// Test Firebase Mocks Infrastructure
import { mockFirestore, mockAuth, mockStorage } from './firebase';
import { createMockHabit } from '../factories/habitFactory';
import { createMockUser } from '../factories/userFactory';

describe('Firebase Mocks Infrastructure', () => {
  beforeEach(() => {
    mockFirestore.clearAll();
    mockAuth.currentUser = null;
    jest.clearAllMocks();
  });

  describe('Firestore Mock', () => {
    it('should handle document creation and retrieval', async () => {
      const testData = { name: 'Test Habit', category: 'fitness' };
      
      // Create document
      const docRef = mockFirestore.collection('habits').doc('test-id');
      await docRef.set(testData);
      
      // Retrieve document
      const docSnap = await docRef.get();
      
      expect(docSnap.exists).toBe(true);
      expect(docSnap.data()).toMatchObject(testData);
      expect(docSnap.id).toBe('test-id');
    });

    it('should handle collection queries with where clauses', async () => {
      const userId = 'test-user-123';
      const habit1 = createMockHabit({ userId, name: 'Habit 1' });
      const habit2 = createMockHabit({ userId, name: 'Habit 2' });
      const habit3 = createMockHabit({ userId: 'other-user', name: 'Habit 3' });
      
      // Add documents to collection
      await mockFirestore.collection('habits').doc(habit1.id).set(habit1);
      await mockFirestore.collection('habits').doc(habit2.id).set(habit2);
      await mockFirestore.collection('habits').doc(habit3.id).set(habit3);
      
      // Query with where clause
      const querySnapshot = await mockFirestore
        .collection('habits')
        .where('userId', '==', userId)
        .get();
      
      expect(querySnapshot.docs).toHaveLength(2);
      expect(querySnapshot.docs[0].data().name).toBe('Habit 1');
      expect(querySnapshot.docs[1].data().name).toBe('Habit 2');
    });

    it('should handle batch operations', async () => {
      const batch = mockFirestore.batch();
      const docRef1 = mockFirestore.collection('habits').doc('habit-1');
      const docRef2 = mockFirestore.collection('habits').doc('habit-2');
      
      batch.set(docRef1, { name: 'Habit 1' });
      batch.set(docRef2, { name: 'Habit 2' });
      
      await batch.commit();
      
      const doc1 = await docRef1.get();
      const doc2 = await docRef2.get();
      
      expect(doc1.data().name).toBe('Habit 1');
      expect(doc2.data().name).toBe('Habit 2');
    });

    it('should handle real-time listeners', (done) => {
      const docRef = mockFirestore.collection('habits').doc('test-id');
      
      const unsubscribe = docRef.onSnapshot((snapshot: any) => {
        expect(snapshot.exists).toBe(true);
        expect(snapshot.data().name).toBe('Test Habit');
        unsubscribe();
        done();
      });
      
      // Trigger the listener
      docRef.set({ name: 'Test Habit' });
    });
  });

  describe('Auth Mock', () => {
    it('should handle successful sign in', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      const result = await mockAuth.signInWithEmailAndPassword(email, password);
      
      expect(result.user).toBeTruthy();
      expect(result.user.email).toBe(email);
      expect(mockAuth.currentUser).toBe(result.user);
    });

    it('should handle sign in failure', async () => {
      const email = 'wrong@example.com';
      const password = 'wrongpassword';
      
      await expect(
        mockAuth.signInWithEmailAndPassword(email, password)
      ).rejects.toThrow('auth/invalid-credential');
    });

    it('should handle user creation', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      
      const result = await mockAuth.createUserWithEmailAndPassword(email, password);
      
      expect(result.user).toBeTruthy();
      expect(result.user.email).toBe(email);
      expect(mockAuth.currentUser).toBe(result.user);
    });

    it('should handle sign out', async () => {
      // First sign in
      await mockAuth.signInWithEmailAndPassword('test@example.com', 'password123');
      expect(mockAuth.currentUser).toBeTruthy();
      
      // Then sign out
      await mockAuth.signOut();
      expect(mockAuth.currentUser).toBeNull();
    });

    it('should handle auth state changes', (done) => {
      const unsubscribe = mockAuth.onAuthStateChanged((user: any) => {
        expect(user).toBeNull();
        unsubscribe();
        done();
      });
    });
  });

  describe('Storage Mock', () => {
    it('should handle file upload', async () => {
      const storageRef = mockStorage.ref('users/test-user/profile.jpg');
      const file = new Blob(['test content'], { type: 'image/jpeg' });
      
      const uploadResult = await storageRef.put(file, {
        contentType: 'image/jpeg'
      });
      
      expect(uploadResult.ref.fullPath).toBe('users/test-user/profile.jpg');
      expect(uploadResult.metadata.contentType).toBe('image/jpeg');
    });

    it('should handle download URL generation', async () => {
      const storageRef = mockStorage.ref('users/test-user/profile.jpg');
      
      const downloadURL = await storageRef.getDownloadURL();
      
      expect(downloadURL).toMatch(/^https:\/\/mock-storage\.com/);
      expect(downloadURL).toContain('users/test-user/profile.jpg');
    });

    it('should handle file deletion', async () => {
      const storageRef = mockStorage.ref('users/test-user/profile.jpg');
      
      await expect(storageRef.delete()).resolves.toBeUndefined();
    });

    it('should handle metadata operations', async () => {
      const storageRef = mockStorage.ref('users/test-user/profile.jpg');
      
      const metadata = await storageRef.getMetadata();
      expect(metadata.name).toBe('profile.jpg');
      expect(metadata.fullPath).toBe('users/test-user/profile.jpg');
      
      const updatedMetadata = await storageRef.updateMetadata({
        customMetadata: { userId: 'test-user' }
      });
      expect(updatedMetadata.customMetadata.userId).toBe('test-user');
    });
  });

  describe('Mock Data Store', () => {
    it('should persist data across operations', async () => {
      const habit = createMockHabit();
      
      // Store data
      await mockFirestore.collection('habits').doc(habit.id).set(habit);
      
      // Retrieve data using different reference
      const docRef = mockFirestore.collection('habits').doc(habit.id);
      const docSnap = await docRef.get();
      
      expect(docSnap.exists).toBe(true);
      expect(docSnap.data()).toMatchObject(habit);
    });

    it('should clear all data when requested', async () => {
      const habit = createMockHabit();
      await mockFirestore.collection('habits').doc(habit.id).set(habit);
      
      // Verify data exists
      let docSnap = await mockFirestore.collection('habits').doc(habit.id).get();
      expect(docSnap.exists).toBe(true);
      
      // Clear all data
      mockFirestore.clearAll();
      
      // Verify data is cleared
      docSnap = await mockFirestore.collection('habits').doc(habit.id).get();
      expect(docSnap.exists).toBe(false);
    });

    it('should handle complex queries with multiple conditions', async () => {
      const userId = 'test-user-123';
      const habits = [
        createMockHabit({ userId, category: 'fitness', frequency: 'daily' }),
        createMockHabit({ userId, category: 'fitness', frequency: 'weekly' }),
        createMockHabit({ userId, category: 'wellness', frequency: 'daily' }),
        createMockHabit({ userId: 'other-user', category: 'fitness', frequency: 'daily' })
      ];
      
      // Store all habits
      for (const habit of habits) {
        await mockFirestore.collection('habits').doc(habit.id).set(habit);
      }
      
      // Query with multiple conditions
      const querySnapshot = await mockFirestore
        .collection('habits')
        .where('userId', '==', userId)
        .where('category', '==', 'fitness')
        .get();
      
      expect(querySnapshot.docs).toHaveLength(2);
      querySnapshot.docs.forEach((doc: any) => {
        expect(doc.data().userId).toBe(userId);
        expect(doc.data().category).toBe('fitness');
      });
    });
  });
});
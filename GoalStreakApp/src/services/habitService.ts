// Habit Service - Firestore operations for habits with retry logic
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { withRetry, RETRY_CONFIGS } from './retryService';
import { Habit, HabitCompletion, Streak, CreateHabitForm } from '../types';

// Collection references
const HABITS_COLLECTION = 'habits';
const COMPLETIONS_COLLECTION = 'completions';
const STREAKS_COLLECTION = 'streaks';

// Habit CRUD Operations
export const habitService = {
  // Create a new habit
  async createHabit(userId: string, habitData: CreateHabitForm): Promise<string> {
    return withRetry(async () => {
      const habit: Omit<Habit, 'id'> = {
        userId,
        name: habitData.name.trim(),
        description: habitData.description?.trim(),
        category: habitData.category,
        frequency: habitData.frequency,
        targetValue: habitData.targetValue,
        unit: habitData.unit?.trim(),
        isPublic: habitData.isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, HABITS_COLLECTION), habit);
      
      // Initialize streak data
      await this.initializeStreak(docRef.id);
      
      return docRef.id;
    }, RETRY_CONFIGS.habitCreation);
  },

  // Get user's habits
  async getUserHabits(userId: string): Promise<Habit[]> {
    try {
      const q = query(
        collection(db, HABITS_COLLECTION),
        where('userId', '==', userId)
        // Removed orderBy to avoid index requirement for now
      );
      
      const querySnapshot = await getDocs(q);
      const habits: Habit[] = [];
      
      querySnapshot.forEach((doc) => {
        habits.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        } as Habit);
      });
      
      // Sort in JavaScript instead of Firestore
      habits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return habits;
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw new Error('Failed to fetch habits');
    }
  },

  // Listen to user's habits in real-time
  subscribeToUserHabits(userId: string, callback: (habits: Habit[]) => void): () => void {
    const q = query(
      collection(db, HABITS_COLLECTION),
      where('userId', '==', userId)
      // Removed orderBy to avoid index requirement for now
    );

    return onSnapshot(q, (querySnapshot) => {
      const habits: Habit[] = [];
      querySnapshot.forEach((doc) => {
        habits.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        } as Habit);
      });
      
      // Sort in JavaScript instead of Firestore
      habits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      callback(habits);
    });
  },

  // Update habit
  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      await updateDoc(habitRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      throw new Error('Failed to update habit');
    }
  },

  // Delete habit
  async deleteHabit(habitId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete habit
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      batch.delete(habitRef);
      
      // Delete associated completions
      const completionsQuery = query(
        collection(db, COMPLETIONS_COLLECTION),
        where('habitId', '==', habitId)
      );
      const completionsSnapshot = await getDocs(completionsQuery);
      completionsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Delete streak data
      const streakRef = doc(db, STREAKS_COLLECTION, habitId);
      batch.delete(streakRef);
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw new Error('Failed to delete habit');
    }
  },

  // Initialize streak data for a new habit
  async initializeStreak(habitId: string): Promise<void> {
    try {
      const streak = {
        habitId,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
      };
      
      const streakRef = doc(db, STREAKS_COLLECTION, habitId);
      await setDoc(streakRef, streak);
    } catch (error) {
      console.error('Error initializing streak:', error);
      throw error;
    }
  },

  // Update streak based on completions
  async updateStreak(habitId: string): Promise<void> {
    try {
      // Simplified query to avoid index requirement
      const q = query(
        collection(db, COMPLETIONS_COLLECTION),
        where('habitId', '==', habitId)
      );
      
      const querySnapshot = await getDocs(q);
      const completions: Date[] = [];
      
      querySnapshot.forEach((doc) => {
        const date = doc.data().completedAt.toDate();
        date.setHours(0, 0, 0, 0); // Normalize to start of day
        completions.push(date);
      });
      
      // Sort in JavaScript instead of Firestore
      completions.sort((a, b) => b.getTime() - a.getTime());
      
      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (completions.length > 0) {
        // Check if completed today or yesterday (to maintain streak)
        const lastCompletion = completions[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastCompletion.getTime() === today.getTime() || 
            lastCompletion.getTime() === yesterday.getTime()) {
          
          // Count consecutive days
          let checkDate = new Date(lastCompletion);
          for (const completion of completions) {
            if (completion.getTime() === checkDate.getTime()) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }
      
      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      let expectedDate = completions.length > 0 ? new Date(completions[0]) : null;
      
      for (const completion of completions) {
        if (expectedDate && completion.getTime() === expectedDate.getTime()) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          tempStreak = 1;
          expectedDate = new Date(completion);
          expectedDate.setDate(expectedDate.getDate() - 1);
        }
      }
      
      // Update or create streak document
      const streakRef = doc(db, STREAKS_COLLECTION, habitId);
      const streakData = {
        habitId,
        currentStreak,
        longestStreak,
        lastCompletedDate: completions.length > 0 ? completions[0] : null,
      };
      
      // Use setDoc with merge to create or update
      await setDoc(streakRef, streakData, { merge: true });
    } catch (error) {
      console.error('Error updating streak:', error);
      throw new Error('Failed to update streak');
    }
  },
};

// Habit Completion Operations
export const completionService = {
  // Mark habit as completed for today
  async completeHabit(habitId: string, userId: string, value?: number, notes?: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day
      
      // Check if already completed today
      const existingCompletion = await this.getTodayCompletion(habitId, userId);
      if (existingCompletion) {
        throw new Error('Habit already completed today');
      }
      
      // Create completion object with only defined values
      const completion: any = {
        habitId,
        userId,
        completedAt: new Date(),
      };
      
      // Only add optional fields if they have values
      if (value !== undefined && value !== null) {
        completion.value = value;
      }
      
      if (notes && notes.trim()) {
        completion.notes = notes.trim();
      }
      
      await addDoc(collection(db, COMPLETIONS_COLLECTION), completion);
      
      // Update streak
      await habitService.updateStreak(habitId);
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  },

  // Undo habit completion for today
  async uncompleteHabit(habitId: string, userId: string): Promise<void> {
    try {
      const completion = await this.getTodayCompletion(habitId, userId);
      if (!completion) {
        throw new Error('No completion found for today');
      }
      
      await deleteDoc(doc(db, COMPLETIONS_COLLECTION, completion.id));
      
      // Update streak
      await habitService.updateStreak(habitId);
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    }
  },

  // Get today's completion for a habit
  async getTodayCompletion(habitId: string, userId: string): Promise<HabitCompletion | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Simplified query to avoid index requirement
      const q = query(
        collection(db, COMPLETIONS_COLLECTION),
        where('habitId', '==', habitId),
        where('userId', '==', userId)
        // Removed date range query to avoid index requirement
      );
      
      const querySnapshot = await getDocs(q);
      
      // Filter for today's completion in JavaScript
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const completedAt = data.completedAt.toDate();
        
        if (completedAt >= today && completedAt < tomorrow) {
          return {
            id: doc.id,
            ...data,
            completedAt,
          } as HabitCompletion;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting today completion:', error);
      return null;
    }
  },

  // Get habit completions for a date range
  async getHabitCompletions(habitId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
    try {
      // Simplified query to avoid index requirement
      const q = query(
        collection(db, COMPLETIONS_COLLECTION),
        where('habitId', '==', habitId)
        // Removed date range and orderBy to avoid index requirement
      );
      
      const querySnapshot = await getDocs(q);
      const completions: HabitCompletion[] = [];
      
      // Filter and sort in JavaScript
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const completedAt = data.completedAt.toDate();
        
        if (completedAt >= startDate && completedAt <= endDate) {
          completions.push({
            id: doc.id,
            ...data,
            completedAt,
          } as HabitCompletion);
        }
      });
      
      // Sort by date descending
      completions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      
      return completions;
    } catch (error) {
      console.error('Error fetching completions:', error);
      throw new Error('Failed to fetch completions');
    }
  },
};

// Streak Operations
export const streakService = {
  // Get streak data for a habit
  async getStreak(habitId: string): Promise<Streak | null> {
    try {
      const streakDoc = await getDoc(doc(db, STREAKS_COLLECTION, habitId));
      
      if (!streakDoc.exists()) {
        return null;
      }
      
      const data = streakDoc.data();
      return {
        habitId,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastCompletedDate: data.lastCompletedDate?.toDate(),
      };
    } catch (error) {
      console.error('Error getting streak:', error);
      return null;
    }
  },
};

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
import { Habit, HabitCompletion, Streak, CreateHabitForm, TimerConfig, TimerSession, TimerState } from '../types';
import { notificationService } from './notificationService';
import { achievementsService } from './achievementsService';

// Collection references
const HABITS_COLLECTION = 'habits';
const COMPLETIONS_COLLECTION = 'completions';
const STREAKS_COLLECTION = 'streaks';
const TIMER_SESSIONS_COLLECTION = 'timerSessions';
const TIMER_STATES_COLLECTION = 'timerStates';

// Habit CRUD Operations
export const habitService = {
  // Create a new habit
  async createHabit(userId: string, habitData: CreateHabitForm): Promise<string> {
    return withRetry(async () => {
      const habit: any = {
        userId,
        name: habitData.name.trim(),
        category: habitData.category,
        frequency: habitData.frequency,
        isPublic: habitData.isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only add optional fields if they have values (avoid undefined)
      if (habitData.targetValue !== undefined && habitData.targetValue !== null) {
        habit.targetValue = habitData.targetValue;
      }
      if (habitData.unit) {
        habit.unit = habitData.unit.trim();
      }
      if (habitData.icon) {
        habit.icon = habitData.icon;
      }
      
      // Handle timer configuration with proper validation
      if (habitData.timer && habitData.timer.enabled) {
        habit.timer = {
          enabled: habitData.timer.enabled,
          durationMinutes: habitData.timer.durationMinutes,
          autoComplete: habitData.timer.autoComplete,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Handle reminder configuration
      if (habitData.reminderEnabled && habitData.reminderTime) {
        habit.reminderEnabled = habitData.reminderEnabled;
        habit.reminderTime = habitData.reminderTime;
      }

      const docRef = await addDoc(collection(db, HABITS_COLLECTION), habit);
      
      // Initialize streak data
      await this.initializeStreak(docRef.id);
      
      // Check for habit collector achievement
      const userHabits = await this.getUserHabits(userId);
      if (userHabits.length >= 5) {
        await achievementsService.unlockAchievement('habit_collector');
      }
      
      // Schedule notification if reminder is enabled
      if (habitData.reminderEnabled && habitData.reminderTime) {
        try {
          const fullHabit: Habit = {
            id: docRef.id,
            ...habit,
          };
          await notificationService.scheduleHabitReminder(fullHabit);
          console.log('✅ Notification scheduled for new habit');
        } catch (notificationError) {
          console.error('⚠️ Failed to schedule notification (non-critical):', notificationError);
        }
      }
      
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
      
      // Prepare update data
      const updateData: any = {
        ...updates,
        updatedAt: new Date(),
      };

      // Handle timer configuration updates
      if (updates.timer !== undefined) {
        if (updates.timer && updates.timer.enabled) {
          updateData.timer = {
            enabled: updates.timer.enabled,
            durationMinutes: updates.timer.durationMinutes,
            autoComplete: updates.timer.autoComplete,
            createdAt: updates.timer.createdAt || new Date(),
            updatedAt: new Date()
          };
        } else {
          // Remove timer configuration if disabled
          updateData.timer = null;
        }
      }

      await updateDoc(habitRef, updateData);
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

  // Get habit with timer configuration
  async getHabitWithTimer(habitId: string): Promise<Habit | null> {
    try {
      const habitDoc = await getDoc(doc(db, HABITS_COLLECTION, habitId));
      
      if (!habitDoc.exists()) {
        return null;
      }
      
      const data = habitDoc.data();
      return {
        id: habitDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        timer: data.timer ? {
          ...data.timer,
          createdAt: data.timer.createdAt?.toDate(),
          updatedAt: data.timer.updatedAt?.toDate()
        } : undefined
      } as Habit;
    } catch (error) {
      console.error('Error getting habit with timer:', error);
      return null;
    }
  },

  // Update only timer configuration for a habit
  async updateHabitTimer(habitId: string, timerConfig: TimerConfig | null): Promise<void> {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      
      const updateData: any = {
        updatedAt: new Date()
      };

      if (timerConfig && timerConfig.enabled) {
        updateData.timer = {
          enabled: timerConfig.enabled,
          durationMinutes: timerConfig.durationMinutes,
          autoComplete: timerConfig.autoComplete,
          createdAt: timerConfig.createdAt || new Date(),
          updatedAt: new Date()
        };
      } else {
        // Remove timer configuration
        updateData.timer = null;
      }

      await updateDoc(habitRef, updateData);
    } catch (error) {
      console.error('Error updating habit timer:', error);
      throw new Error('Failed to update habit timer');
    }
  },

  // Get all habits with timer configurations for a user
  async getUserHabitsWithTimers(userId: string): Promise<Habit[]> {
    try {
      const q = query(
        collection(db, HABITS_COLLECTION),
        where('userId', '==', userId),
        where('timer.enabled', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const habits: Habit[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        habits.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          timer: data.timer ? {
            ...data.timer,
            createdAt: data.timer.createdAt?.toDate(),
            updatedAt: data.timer.updatedAt?.toDate()
          } : undefined
        } as Habit);
      });
      
      // Sort by creation date
      habits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return habits;
    } catch (error) {
      console.error('Error fetching habits with timers:', error);
      // Fallback to getting all habits and filtering
      const allHabits = await this.getUserHabits(userId);
      return allHabits.filter(habit => habit.timer?.enabled);
    }
  },

  // TEMPORARY: Clear all habits for a user (for testing)
  async clearAllHabits(userId: string): Promise<void> {
    try {
      
      // Get all user habits
      const habits = await this.getUserHabits(userId);
      
      // Delete each habit (this will also delete completions and streaks)
      for (const habit of habits) {
        await this.deleteHabit(habit.id);
      }
      
    } catch (error) {
      console.error('Error clearing all habits:', error);
      throw new Error('Failed to clear all habits');
    }
  },
};

// Habit Completion Operations
export const completionService = {
  // Mark habit as completed for today
  async completeHabit(habitId: string, userId: string, value?: number, notes?: string, timerSessionId?: string): Promise<void> {
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

      // Add timer session reference if provided
      if (timerSessionId) {
        completion.timerSessionId = timerSessionId;
        
        // Get timer session details for completion record
        try {
          const timerSession = await firebaseTimerSessionService.getTimerSession(timerSessionId);
          if (timerSession) {
            completion.timerSession = {
              sessionId: timerSessionId,
              duration: timerSession.actualDuration,
              targetDuration: timerSession.targetDuration,
              completedViaTimer: timerSession.completed && timerSession.completionMethod === 'timer'
            };
          }
        } catch (error) {
          console.error('Error fetching timer session details:', error);
          // Continue with completion even if timer session fetch fails
        }
      }
      
      await addDoc(collection(db, COMPLETIONS_COLLECTION), completion);
      
      // Update streak
      await habitService.updateStreak(habitId);
      
      // Check for achievements
      await this.checkCompletionAchievements(habitId, userId);
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
        return; // Gracefully handle - nothing to uncomplete
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

  // Check for completion-related achievements
  async checkCompletionAchievements(habitId: string, userId: string): Promise<void> {
    try {
      // Check for first completion
      const allCompletions = await this.getHabitCompletions(
        habitId,
        new Date(0),
        new Date()
      );
      
      if (allCompletions.length === 1) {
        await achievementsService.unlockAchievement('first_step');
      }

      // Check for time-based achievements
      const todayCompletion = await this.getTodayCompletion(habitId, userId);
      if (todayCompletion) {
        const hour = todayCompletion.completedAt.getHours();
        
        // Early bird (before 8 AM)
        if (hour < 8) {
          await achievementsService.unlockAchievement('early_bird');
        }
        
        // Night owl (after 10 PM)
        if (hour >= 22) {
          await achievementsService.unlockAchievement('night_owl');
        }

        // Weekend warrior (Saturday or Sunday)
        const day = todayCompletion.completedAt.getDay();
        if (day === 0 || day === 6) {
          await achievementsService.unlockAchievement('weekend_warrior');
        }
      }

      // Check for streak achievements
      const streak = await streakService.getStreak(habitId);
      if (streak) {
        if (streak.currentStreak >= 3) {
          await achievementsService.unlockAchievement('first_streak');
        }
        if (streak.currentStreak >= 7) {
          await achievementsService.unlockAchievement('week_warrior');
        }
        if (streak.currentStreak >= 30) {
          await achievementsService.unlockAchievement('month_master');
        }
        if (streak.currentStreak >= 100) {
          await achievementsService.unlockAchievement('century_club');
        }

        // Check for comeback kid (restarted after breaking a streak)
        if (streak.currentStreak >= 3 && streak.longestStreak > streak.currentStreak) {
          await achievementsService.unlockAchievement('comeback_kid');
        }
      }

      // Check for perfect week (all habits completed for 7 days)
      const userHabits = await habitService.getUserHabits(userId);
      if (userHabits.length > 0) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        let isPerfectWeek = true;
        for (const habit of userHabits) {
          const completions = await this.getHabitCompletions(
            habit.id,
            sevenDaysAgo,
            new Date()
          );
          
          // Check if completed every day for the past 7 days
          const uniqueDays = new Set(
            completions.map(c => c.completedAt.toDateString())
          );
          
          if (uniqueDays.size < 7) {
            isPerfectWeek = false;
            break;
          }
        }
        
        if (isPerfectWeek) {
          await achievementsService.unlockAchievement('perfect_week');
        }
      }
    } catch (error) {
      console.error('Error checking completion achievements:', error);
      // Don't throw - achievement checking shouldn't break habit completion
    }
  },
};

// Firebase Timer Session Operations
export const firebaseTimerSessionService = {
  // Create a new timer session in Firebase
  async createTimerSession(session: Omit<TimerSession, 'id'>): Promise<string> {
    return withRetry(async () => {
      const sessionData = {
        ...session,
        startTime: Timestamp.fromDate(session.startTime),
        endTime: session.endTime ? Timestamp.fromDate(session.endTime) : null,
        createdAt: Timestamp.fromDate(session.createdAt)
      };

      const docRef = await addDoc(collection(db, TIMER_SESSIONS_COLLECTION), sessionData);
      return docRef.id;
    }, RETRY_CONFIGS.habitCreation);
  },

  // Update an existing timer session
  async updateTimerSession(sessionId: string, updates: Partial<TimerSession>): Promise<void> {
    try {
      const sessionRef = doc(db, TIMER_SESSIONS_COLLECTION, sessionId);
      
      const updateData: any = { ...updates };
      
      // Convert Date objects to Timestamps
      if (updates.startTime) {
        updateData.startTime = Timestamp.fromDate(updates.startTime);
      }
      if (updates.endTime) {
        updateData.endTime = Timestamp.fromDate(updates.endTime);
      }
      if (updates.createdAt) {
        updateData.createdAt = Timestamp.fromDate(updates.createdAt);
      }

      await updateDoc(sessionRef, updateData);
    } catch (error) {
      console.error('Error updating timer session:', error);
      throw new Error('Failed to update timer session');
    }
  },

  // Get timer sessions for a habit
  async getHabitTimerSessions(habitId: string, limit: number = 50): Promise<TimerSession[]> {
    try {
      const q = query(
        collection(db, TIMER_SESSIONS_COLLECTION),
        where('habitId', '==', habitId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sessions: TimerSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime?.toDate(),
          createdAt: data.createdAt.toDate()
        } as TimerSession);
      });
      
      return sessions.slice(0, limit);
    } catch (error) {
      console.error('Error fetching habit timer sessions:', error);
      // Fallback to simple query without orderBy
      try {
        const q = query(
          collection(db, TIMER_SESSIONS_COLLECTION),
          where('habitId', '==', habitId)
        );
        
        const querySnapshot = await getDocs(q);
        const sessions: TimerSession[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          sessions.push({
            id: doc.id,
            ...data,
            startTime: data.startTime.toDate(),
            endTime: data.endTime?.toDate(),
            createdAt: data.createdAt.toDate()
          } as TimerSession);
        });
        
        // Sort in JavaScript
        sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return sessions.slice(0, limit);
      } catch (fallbackError) {
        console.error('Error in fallback timer sessions query:', fallbackError);
        return [];
      }
    }
  },

  // Get timer sessions for a user
  async getUserTimerSessions(userId: string, limit: number = 100): Promise<TimerSession[]> {
    try {
      const q = query(
        collection(db, TIMER_SESSIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sessions: TimerSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime?.toDate(),
          createdAt: data.createdAt.toDate()
        } as TimerSession);
      });
      
      return sessions.slice(0, limit);
    } catch (error) {
      console.error('Error fetching user timer sessions:', error);
      // Fallback to simple query without orderBy
      try {
        const q = query(
          collection(db, TIMER_SESSIONS_COLLECTION),
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const sessions: TimerSession[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          sessions.push({
            id: doc.id,
            ...data,
            startTime: data.startTime.toDate(),
            endTime: data.endTime?.toDate(),
            createdAt: data.createdAt.toDate()
          } as TimerSession);
        });
        
        // Sort in JavaScript
        sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return sessions.slice(0, limit);
      } catch (fallbackError) {
        console.error('Error in fallback user timer sessions query:', fallbackError);
        return [];
      }
    }
  },

  // Delete a timer session
  async deleteTimerSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TIMER_SESSIONS_COLLECTION, sessionId));
    } catch (error) {
      console.error('Error deleting timer session:', error);
      throw new Error('Failed to delete timer session');
    }
  },

  // Get timer session by ID
  async getTimerSession(sessionId: string): Promise<TimerSession | null> {
    try {
      const sessionDoc = await getDoc(doc(db, TIMER_SESSIONS_COLLECTION, sessionId));
      
      if (!sessionDoc.exists()) {
        return null;
      }
      
      const data = sessionDoc.data();
      return {
        id: sessionDoc.id,
        ...data,
        startTime: data.startTime.toDate(),
        endTime: data.endTime?.toDate(),
        createdAt: data.createdAt.toDate()
      } as TimerSession;
    } catch (error) {
      console.error('Error getting timer session:', error);
      return null;
    }
  },

  // Clean up old timer sessions (older than 90 days)
  async cleanupOldSessions(userId: string): Promise<void> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const q = query(
        collection(db, TIMER_SESSIONS_COLLECTION),
        where('userId', '==', userId),
        where('createdAt', '<', Timestamp.fromDate(ninetyDaysAgo))
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      if (querySnapshot.size > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error cleaning up old timer sessions:', error);
      // Don't throw - cleanup failure shouldn't break the app
    }
  }
};

// Firebase Timer State Sync Operations
export const firebaseTimerStateService = {
  // Save timer state to Firebase for cross-device sync
  async saveTimerState(userId: string, habitId: string, timerState: TimerState): Promise<void> {
    try {
      const stateRef = doc(db, TIMER_STATES_COLLECTION, `${userId}_${habitId}`);
      
      const stateData = {
        userId,
        habitId: timerState.habitId,
        isActive: timerState.isActive,
        isPaused: timerState.isPaused,
        startTime: timerState.startTime ? Timestamp.fromDate(timerState.startTime) : null,
        pausedTime: timerState.pausedTime,
        remainingTime: timerState.remainingTime,
        progress: timerState.progress,
        lastUpdate: Timestamp.fromDate(timerState.lastUpdate),
        originalDuration: timerState.originalDuration,
        syncedAt: Timestamp.fromDate(new Date())
      };

      await setDoc(stateRef, stateData, { merge: true });
    } catch (error) {
      console.error('Error saving timer state to Firebase:', error);
      // Don't throw - sync failure shouldn't break timer functionality
    }
  },

  // Load timer state from Firebase
  async loadTimerState(userId: string, habitId: string): Promise<TimerState | null> {
    try {
      const stateDoc = await getDoc(doc(db, TIMER_STATES_COLLECTION, `${userId}_${habitId}`));
      
      if (!stateDoc.exists()) {
        return null;
      }
      
      const data = stateDoc.data();
      return {
        habitId: data.habitId,
        isActive: data.isActive,
        isPaused: data.isPaused,
        startTime: data.startTime?.toDate() || null,
        pausedTime: data.pausedTime,
        remainingTime: data.remainingTime,
        progress: data.progress,
        lastUpdate: data.lastUpdate.toDate(),
        originalDuration: data.originalDuration || 0
      };
    } catch (error) {
      console.error('Error loading timer state from Firebase:', error);
      return null;
    }
  },

  // Delete timer state from Firebase
  async deleteTimerState(userId: string, habitId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TIMER_STATES_COLLECTION, `${userId}_${habitId}`));
    } catch (error) {
      console.error('Error deleting timer state from Firebase:', error);
      // Don't throw - cleanup failure shouldn't break the app
    }
  },

  // Get all active timer states for a user
  async getUserActiveTimerStates(userId: string): Promise<TimerState[]> {
    try {
      const q = query(
        collection(db, TIMER_STATES_COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const states: TimerState[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        states.push({
          habitId: data.habitId,
          isActive: data.isActive,
          isPaused: data.isPaused,
          startTime: data.startTime?.toDate() || null,
          pausedTime: data.pausedTime,
          remainingTime: data.remainingTime,
          progress: data.progress,
          lastUpdate: data.lastUpdate.toDate(),
          originalDuration: data.originalDuration || 0
        });
      });
      
      return states;
    } catch (error) {
      console.error('Error getting user active timer states:', error);
      return [];
    }
  },

  // Subscribe to timer state changes for real-time sync
  subscribeToTimerState(userId: string, habitId: string, callback: (state: TimerState | null) => void): () => void {
    const stateRef = doc(db, TIMER_STATES_COLLECTION, `${userId}_${habitId}`);
    
    return onSnapshot(stateRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const state: TimerState = {
          habitId: data.habitId,
          isActive: data.isActive,
          isPaused: data.isPaused,
          startTime: data.startTime?.toDate() || null,
          pausedTime: data.pausedTime,
          remainingTime: data.remainingTime,
          progress: data.progress,
          lastUpdate: data.lastUpdate.toDate(),
          originalDuration: data.originalDuration || 0
        };
        callback(state);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in timer state subscription:', error);
      callback(null);
    });
  },

  // Clean up inactive timer states (older than 24 hours)
  async cleanupInactiveStates(userId: string): Promise<void> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const q = query(
        collection(db, TIMER_STATES_COLLECTION),
        where('userId', '==', userId),
        where('lastUpdate', '<', Timestamp.fromDate(twentyFourHoursAgo))
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      if (querySnapshot.size > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error cleaning up inactive timer states:', error);
      // Don't throw - cleanup failure shouldn't break the app
    }
  }
};

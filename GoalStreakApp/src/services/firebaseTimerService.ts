// Enhanced Timer Service with Firebase Integration
// Extends the core timer service with Firebase sync and offline support

import { TimerService, timerService } from './timerService';
import { firebaseTimerSessionService, firebaseTimerStateService } from './habitService';
import { 
  TimerState, 
  TimerSession, 
  TimerError,
  TimerEvent,
  TimerEventType
} from '../types/timer';
import { TIMER_CONSTANTS } from '../constants/timer';
import * as Network from 'expo-network';

/**
 * Enhanced Timer Service with Firebase Integration
 * Provides offline-first timer functionality with Firebase sync
 */
export class FirebaseTimerService extends TimerService {
  private userId: string | null = null;
  private isOnline: boolean = true;
  private syncQueue: Array<{ action: string; data: any }> = [];
  private syncInProgress: boolean = false;
  private networkCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeNetworkMonitoring();
  }

  /**
   * Set the current user ID for Firebase operations
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Start a timer with Firebase sync
   */
  async startTimer(habitId: string, durationMinutes: number, userId: string): Promise<TimerState> {
    // Start timer locally first (offline-first approach)
    const timerState = await super.startTimer(habitId, durationMinutes, userId);
    
    // Sync to Firebase if online
    if (this.isOnline && this.userId) {
      try {
        await firebaseTimerStateService.saveTimerState(this.userId, habitId, timerState);
      } catch (error) {
        console.error('Failed to sync timer start to Firebase:', error);
        // Queue for later sync
        this.queueSync('saveTimerState', { userId: this.userId, habitId, timerState });
      }
    } else {
      // Queue for sync when online
      this.queueSync('saveTimerState', { userId, habitId, timerState });
    }

    return timerState;
  }

  /**
   * Pause a timer with Firebase sync
   */
  async pauseTimer(habitId: string, userId: string): Promise<TimerState> {
    const timerState = await super.pauseTimer(habitId, userId);
    
    // Sync to Firebase if online
    if (this.isOnline && this.userId) {
      try {
        await firebaseTimerStateService.saveTimerState(this.userId, habitId, timerState);
      } catch (error) {
        console.error('Failed to sync timer pause to Firebase:', error);
        this.queueSync('saveTimerState', { userId: this.userId, habitId, timerState });
      }
    } else {
      this.queueSync('saveTimerState', { userId, habitId, timerState });
    }

    return timerState;
  }

  /**
   * Resume a timer with Firebase sync
   */
  async resumeTimer(habitId: string, userId: string): Promise<TimerState> {
    const timerState = await super.resumeTimer(habitId, userId);
    
    // Sync to Firebase if online
    if (this.isOnline && this.userId) {
      try {
        await firebaseTimerStateService.saveTimerState(this.userId, habitId, timerState);
      } catch (error) {
        console.error('Failed to sync timer resume to Firebase:', error);
        this.queueSync('saveTimerState', { userId: this.userId, habitId, timerState });
      }
    } else {
      this.queueSync('saveTimerState', { userId, habitId, timerState });
    }

    return timerState;
  }

  /**
   * Reset a timer with Firebase sync
   */
  async resetTimer(habitId: string, userId: string): Promise<void> {
    await super.resetTimer(habitId, userId);
    
    // Remove from Firebase if online
    if (this.isOnline && this.userId) {
      try {
        await firebaseTimerStateService.deleteTimerState(this.userId, habitId);
      } catch (error) {
        console.error('Failed to sync timer reset to Firebase:', error);
        this.queueSync('deleteTimerState', { userId: this.userId, habitId });
      }
    } else {
      this.queueSync('deleteTimerState', { userId, habitId });
    }
  }

  /**
   * Complete a timer with Firebase session tracking
   */
  async completeTimer(habitId: string, userId: string): Promise<TimerSession> {
    const session = await super.completeTimer(habitId, userId);
    
    // Save session to Firebase if online
    if (this.isOnline && this.userId) {
      try {
        const sessionId = await firebaseTimerSessionService.createTimerSession({
          habitId: session.habitId,
          userId: session.userId,
          startTime: session.startTime,
          endTime: session.endTime,
          targetDuration: session.targetDuration,
          actualDuration: session.actualDuration,
          pausedDuration: session.pausedDuration,
          completed: session.completed,
          completionMethod: session.completionMethod,
          createdAt: session.createdAt
        });
        
        // Update local session with Firebase ID
        session.id = sessionId;
        
        // Remove timer state from Firebase
        await firebaseTimerStateService.deleteTimerState(this.userId, habitId);
      } catch (error) {
        console.error('Failed to sync timer completion to Firebase:', error);
        this.queueSync('createTimerSession', { session });
        this.queueSync('deleteTimerState', { userId: this.userId, habitId });
      }
    } else {
      this.queueSync('createTimerSession', { session });
      this.queueSync('deleteTimerState', { userId, habitId });
    }

    return session;
  }

  /**
   * Load timer states from Firebase on app start
   */
  async loadTimerStatesFromFirebase(userId: string): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    try {
      const firebaseStates = await firebaseTimerStateService.getUserActiveTimerStates(userId);
      
      for (const firebaseState of firebaseStates) {
        // Check if we have a more recent local state
        const localState = this.getTimerState(firebaseState.habitId);
        
        if (!localState || firebaseState.lastUpdate > localState.lastUpdate) {
          // Firebase state is newer or we don't have local state
          // Restore the timer state locally
          await this.restoreTimerFromFirebase(firebaseState, userId);
        } else if (localState.lastUpdate > firebaseState.lastUpdate) {
          // Local state is newer - sync to Firebase
          await firebaseTimerStateService.saveTimerState(userId, firebaseState.habitId, localState);
        }
      }
    } catch (error) {
      console.error('Error loading timer states from Firebase:', error);
    }
  }

  /**
   * Subscribe to real-time timer state changes for a habit
   */
  subscribeToTimerStateSync(habitId: string, userId: string): () => void {
    if (!this.isOnline) {
      return () => {}; // Return empty unsubscribe function
    }

    return firebaseTimerStateService.subscribeToTimerState(userId, habitId, (firebaseState) => {
      if (!firebaseState) {
        return;
      }

      const localState = this.getTimerState(habitId);
      
      // Only update if Firebase state is newer
      if (!localState || firebaseState.lastUpdate > localState.lastUpdate) {
        this.restoreTimerFromFirebase(firebaseState, userId);
      }
    });
  }

  /**
   * Sync pending operations when coming back online
   */
  async syncPendingOperations(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (const operation of operations) {
      try {
        await this.executeSyncOperation(operation);
      } catch (error) {
        console.error('Error syncing operation:', operation, error);
        // Re-queue failed operations
        this.syncQueue.push(operation);
      }
    }

    this.syncInProgress = false;
  }

  /**
   * Get timer sessions from Firebase with offline fallback
   */
  async getTimerSessions(habitId: string, limit: number = 50): Promise<TimerSession[]> {
    if (this.isOnline) {
      try {
        return await firebaseTimerSessionService.getHabitTimerSessions(habitId, limit);
      } catch (error) {
        console.error('Error fetching timer sessions from Firebase:', error);
      }
    }

    // Fallback to local sessions
    return await super.constructor.prototype.getHabitTimerSessions?.call(this, habitId) || [];
  }

  /**
   * Handle app coming to foreground
   */
  async handleAppForeground(): Promise<void> {
    // Call parent class method
    await super.handleAppForeground();
    
    // Sync any pending operations that might have been queued
    await this.syncPendingOperations();
  }

  /**
   * Clean up old data both locally and in Firebase
   */
  async cleanup(): Promise<void> {
    super.cleanup();

    // Clear network monitoring interval
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }

    if (this.isOnline && this.userId) {
      try {
        await firebaseTimerStateService.cleanupInactiveStates(this.userId);
        await firebaseTimerSessionService.cleanupOldSessions(this.userId);
      } catch (error) {
        console.error('Error cleaning up Firebase timer data:', error);
      }
    }
  }

  // Private methods

  private initializeNetworkMonitoring(): void {
    // Check network status periodically
    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        const wasOnline = this.isOnline;
        this.isOnline = networkState.isConnected ?? false;

        if (!wasOnline && this.isOnline) {
          // Just came back online - sync pending operations
          this.syncPendingOperations();
        }
      } catch (error) {
        console.error('Error checking network status:', error);
      }
    };

    // Check immediately and then every 30 seconds
    checkNetworkStatus();
    this.networkCheckInterval = setInterval(checkNetworkStatus, 30000);
  }

  private queueSync(action: string, data: any): void {
    this.syncQueue.push({ action, data });
    
    // Limit queue size to prevent memory issues
    if (this.syncQueue.length > 100) {
      this.syncQueue = this.syncQueue.slice(-50); // Keep last 50 operations
    }
  }

  private async executeSyncOperation(operation: { action: string; data: any }): Promise<void> {
    const { action, data } = operation;

    switch (action) {
      case 'saveTimerState':
        await firebaseTimerStateService.saveTimerState(data.userId, data.habitId, data.timerState);
        break;
      
      case 'deleteTimerState':
        await firebaseTimerStateService.deleteTimerState(data.userId, data.habitId);
        break;
      
      case 'createTimerSession':
        await firebaseTimerSessionService.createTimerSession({
          habitId: data.session.habitId,
          userId: data.session.userId,
          startTime: data.session.startTime,
          endTime: data.session.endTime,
          targetDuration: data.session.targetDuration,
          actualDuration: data.session.actualDuration,
          pausedDuration: data.session.pausedDuration,
          completed: data.session.completed,
          completionMethod: data.session.completionMethod,
          createdAt: data.session.createdAt
        });
        break;
      
      default:
        console.warn('Unknown sync operation:', action);
    }
  }

  private async restoreTimerFromFirebase(firebaseState: TimerState, userId: string): Promise<void> {
    try {
      // Calculate current state based on Firebase data and elapsed time
      const now = new Date();
      const timeSinceLastUpdate = now.getTime() - firebaseState.lastUpdate.getTime();

      if (firebaseState.isActive && !firebaseState.isPaused) {
        // Timer was running - update remaining time
        const newRemainingTime = Math.max(0, firebaseState.remainingTime - timeSinceLastUpdate);
        
        if (newRemainingTime > 0) {
          // Timer is still running - restore it
          const targetDuration = firebaseState.remainingTime / (1 - firebaseState.progress);
          const elapsedTime = targetDuration - newRemainingTime;
          
          const restoredState: TimerState = {
            ...firebaseState,
            startTime: new Date(now.getTime() - elapsedTime),
            remainingTime: newRemainingTime,
            progress: targetDuration > 0 ? elapsedTime / targetDuration : 0,
            lastUpdate: now
          };

          // Restore timer locally
          (this as any).activeTimers.set(firebaseState.habitId, restoredState);
          (this as any).startUpdateInterval(firebaseState.habitId);
        } else {
          // Timer completed while offline - clean up
          await firebaseTimerStateService.deleteTimerState(userId, firebaseState.habitId);
        }
      } else {
        // Timer was paused - restore as-is
        (this as any).activeTimers.set(firebaseState.habitId, {
          ...firebaseState,
          lastUpdate: now
        });
      }
    } catch (error) {
      console.error('Error restoring timer from Firebase:', error);
    }
  }
}

// Export enhanced timer service instance
export const firebaseTimerService = new FirebaseTimerService();

// Export convenience functions that use the enhanced service
export const enhancedTimerService = {
  // Initialize with user ID
  initialize: (userId: string) => {
    firebaseTimerService.setUserId(userId);
    return firebaseTimerService.loadTimerStatesFromFirebase(userId);
  },

  // Start timer with Firebase sync
  startTimer: (habitId: string, durationMinutes: number, userId: string) => 
    firebaseTimerService.startTimer(habitId, durationMinutes, userId),

  // Pause timer with Firebase sync
  pauseTimer: (habitId: string, userId: string) => 
    firebaseTimerService.pauseTimer(habitId, userId),

  // Resume timer with Firebase sync
  resumeTimer: (habitId: string, userId: string) => 
    firebaseTimerService.resumeTimer(habitId, userId),

  // Reset timer with Firebase sync
  resetTimer: (habitId: string, userId: string) => 
    firebaseTimerService.resetTimer(habitId, userId),

  // Complete timer with Firebase session tracking
  completeTimer: (habitId: string, userId: string) => 
    firebaseTimerService.completeTimer(habitId, userId),

  // Complete timer and mark habit as completed
  completeTimerAndHabit: async (habitId: string, userId: string) => {
    const session = await firebaseTimerService.completeTimer(habitId, userId);
    
    // Import completion service dynamically to avoid circular dependency
    const { completionService } = await import('./habitService');
    
    try {
      // Check if habit is already completed today to avoid duplicate completions
      const existingCompletion = await completionService.getTodayCompletion(habitId, userId);
      if (existingCompletion) {
        return session;
      }

      // Complete the habit with timer session reference and appropriate notes
      await completionService.completeHabit(
        habitId, 
        userId, 
        undefined, // value
        'Completed via timer', // notes
        session.id // timer session ID
      );
      
    } catch (error) {
      console.error('Error completing habit after timer completion:', error);
      // Timer completion succeeded, but habit completion failed
      // This is not critical - the timer session is still recorded
      
      // Re-throw specific errors that should be handled by the caller
      if (error.message?.includes('already completed')) {
      } else {
        console.warn('Habit completion failed after timer completion, but timer session was saved');
      }
    }
    
    return session;
  },

  // Get timer state (local)
  getTimerState: (habitId: string) => 
    firebaseTimerService.getTimerState(habitId),

  // Get all active timers
  getAllActiveTimers: () => 
    firebaseTimerService.getAllActiveTimers(),

  // Check if habit has active timer
  hasActiveTimer: (habitId: string) => 
    firebaseTimerService.hasActiveTimer(habitId),

  // Subscribe to real-time sync
  subscribeToSync: (habitId: string, userId: string) => 
    firebaseTimerService.subscribeToTimerStateSync(habitId, userId),

  // Get timer sessions with Firebase fallback
  getTimerSessions: (habitId: string, limit?: number) => 
    firebaseTimerService.getTimerSessions(habitId, limit),

  // Handle app foreground
  handleAppForeground: () => 
    firebaseTimerService.handleAppForeground(),

  // Cleanup
  cleanup: () => 
    firebaseTimerService.cleanup(),

  // Add event listener
  addEventListener: (eventType: TimerEventType, listener: (event: TimerEvent) => void) => 
    firebaseTimerService.addEventListener(eventType, listener),

  // Remove event listener
  removeEventListener: (eventType: TimerEventType, listener: (event: TimerEvent) => void) => 
    firebaseTimerService.removeEventListener(eventType, listener)
};
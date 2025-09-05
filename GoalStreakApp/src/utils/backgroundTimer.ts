// Background Timer Utilities - Handle timer accuracy when app is backgrounded
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerState, StoredTimerState, TimerEvent } from '../types/timer';
import { TIMER_STORAGE_KEYS, TIMER_CONSTANTS, TIMER_EVENTS } from '../constants/timer';

/**
 * Background Timer Manager
 * Handles timer state when app goes to background and restores accurate state on foreground
 */
export class BackgroundTimerManager {
  private appStateSubscription: any = null;
  private backgroundTime: Date | null = null;
  private isInBackground = false;
  private completedTimersWhileBackground: Set<string> = new Set();
  private eventListeners: Map<string, ((event: TimerEvent) => void)[]> = new Map();

  constructor() {
    this.initializeAppStateListener();
  }

  /**
   * Initialize app state listener to track background/foreground transitions
   */
  private initializeAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.handleAppGoingToBackground();
    } else if (nextAppState === 'active' && this.isInBackground) {
      this.handleAppComingToForeground();
    }
  }

  /**
   * Handle app going to background
   */
  private async handleAppGoingToBackground(): Promise<void> {
    try {
      this.backgroundTime = new Date();
      this.isInBackground = true;

      // Save current timestamp for accurate restoration
      await AsyncStorage.setItem(
        '@goalstreak/background_time',
        this.backgroundTime?.toISOString() || new Date().toISOString()
      );

      // Save all active timer states as checkpoints for recovery
      await this.saveActiveTimerCheckpoints();

      
      // Emit background event
      this.emitEvent({
        type: 'timer_backgrounded',
        habitId: '',
        userId: '',
        timestamp: this.backgroundTime,
        data: { backgroundTime: this.backgroundTime?.toISOString() || new Date().toISOString() }
      });
    } catch (error) {
      console.error('Error handling app background:', error);
    }
  }

  /**
   * Handle app coming to foreground
   */
  private async handleAppComingToForeground(): Promise<void> {
    try {
      const foregroundTime = new Date();
      this.isInBackground = false;

      // Get background time
      const backgroundTimeStr = await AsyncStorage.getItem('@goalstreak/background_time');
      if (!backgroundTimeStr || !this.backgroundTime) {
        return;
      }

      const backgroundTime = new Date(backgroundTimeStr);
      const timeInBackground = foregroundTime.getTime() - backgroundTime.getTime();


      // Update timer states based on background time and detect completions
      const completedTimers = await this.updateTimersAfterBackground(timeInBackground);

      // Handle completed timers
      for (const habitId of completedTimers) {
        this.completedTimersWhileBackground.add(habitId);
        
        // Emit completion event for each completed timer
        this.emitEvent({
          type: 'timer_completed',
          habitId,
          userId: '',
          timestamp: foregroundTime,
          data: { 
            completedInBackground: true,
            backgroundDuration: timeInBackground,
            autoCompleted: true
          }
        });
      }

      // Emit foreground event
      this.emitEvent({
        type: 'timer_foregrounded',
        habitId: '',
        userId: '',
        timestamp: foregroundTime,
        data: { 
          backgroundDuration: timeInBackground,
          completedTimers: Array.from(completedTimers)
        }
      });

      // Clear background time
      this.backgroundTime = null;
      await AsyncStorage.removeItem('@goalstreak/background_time');
    } catch (error) {
      console.error('Error handling app foreground:', error);
    }
  }

  /**
   * Update timer states after returning from background
   * Returns array of habit IDs for timers that completed while in background
   */
  private async updateTimersAfterBackground(timeInBackground: number): Promise<string[]> {
    const completedTimers: string[] = [];
    
    try {
      const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEYS.ACTIVE_TIMERS);
      if (!stored) {
        return completedTimers;
      }

      const storedTimers: Record<string, StoredTimerState> = JSON.parse(stored);
      const updatedTimers: Record<string, StoredTimerState> = {};
      const now = new Date();

      for (const [habitId, storedTimer] of Object.entries(storedTimers)) {
        try {
          // Skip if timer was paused
          if (!storedTimer.isActive || storedTimer.isPaused) {
            updatedTimers[habitId] = storedTimer;
            continue;
          }

          // Calculate accurate remaining time using background timer calculations
          const startTime = new Date(storedTimer.startTime);
          const remainingTime = this.calculateRemainingTime(
            startTime,
            storedTimer.targetDuration,
            storedTimer.pausedTime,
            now
          );

          // Check if timer completed while in background
          if (remainingTime <= 0) {
            completedTimers.push(habitId);
            
            // Mark timer as completed but keep in storage for completion handling
            updatedTimers[habitId] = {
              ...storedTimer,
              isActive: false, // Mark as inactive since it completed
              lastUpdate: now.toISOString()
            };
          } else {
            // Update timer with new remaining time
            updatedTimers[habitId] = {
              ...storedTimer,
              lastUpdate: now.toISOString()
            };
          }
        } catch (error) {
          console.error(`Error updating timer ${habitId} after background:`, error);
          // Keep original timer state if update fails
          updatedTimers[habitId] = storedTimer;
        }
      }

      // Save updated timers
      await AsyncStorage.setItem(
        TIMER_STORAGE_KEYS.ACTIVE_TIMERS,
        JSON.stringify(updatedTimers)
      );

      return completedTimers;
    } catch (error) {
      console.error('Error updating timers after background:', error);
      return completedTimers;
    }
  }

  /**
   * Calculate accurate elapsed time accounting for background time
   */
  static calculateAccurateElapsedTime(
    startTime: Date,
    pausedTime: number,
    currentTime: Date = new Date()
  ): number {
    const totalElapsed = currentTime.getTime() - startTime.getTime();
    return Math.max(0, totalElapsed - pausedTime);
  }

  /**
   * Calculate remaining time for a timer
   */
  static calculateRemainingTime(
    startTime: Date,
    targetDuration: number,
    pausedTime: number,
    currentTime: Date = new Date()
  ): number {
    const elapsedTime = this.calculateAccurateElapsedTime(startTime, pausedTime, currentTime);
    return Math.max(0, targetDuration - elapsedTime);
  }

  /**
   * Instance method for calculating remaining time (used by background manager)
   */
  private calculateRemainingTime(
    startTime: Date,
    targetDuration: number,
    pausedTime: number,
    currentTime: Date = new Date()
  ): number {
    return BackgroundTimerManager.calculateRemainingTime(startTime, targetDuration, pausedTime, currentTime);
  }

  /**
   * Calculate progress for a timer (0-1)
   */
  static calculateProgress(
    startTime: Date,
    targetDuration: number,
    pausedTime: number,
    currentTime: Date = new Date()
  ): number {
    if (targetDuration <= 0) {
      return 0;
    }

    const elapsedTime = this.calculateAccurateElapsedTime(startTime, pausedTime, currentTime);
    return Math.min(1, elapsedTime / targetDuration);
  }

  /**
   * Check if a timer has completed
   */
  static hasTimerCompleted(
    startTime: Date,
    targetDuration: number,
    pausedTime: number,
    currentTime: Date = new Date()
  ): boolean {
    const remainingTime = this.calculateRemainingTime(startTime, targetDuration, pausedTime, currentTime);
    return remainingTime <= 0;
  }

  /**
   * Restore timer state with accurate calculations
   */
  static restoreTimerState(storedTimer: StoredTimerState, currentTime: Date = new Date()): TimerState | null {
    try {
      const startTime = new Date(storedTimer.startTime);
      const targetDuration = storedTimer.targetDuration;

      // Calculate current state
      const remainingTime = this.calculateRemainingTime(startTime, targetDuration, storedTimer.pausedTime, currentTime);
      const progress = this.calculateProgress(startTime, targetDuration, storedTimer.pausedTime, currentTime);

      return {
        habitId: storedTimer.habitId,
        isActive: storedTimer.isActive && remainingTime > 0, // Deactivate if completed
        isPaused: storedTimer.isPaused,
        startTime,
        pausedTime: storedTimer.pausedTime,
        remainingTime,
        progress,
        lastUpdate: currentTime,
        originalDuration: targetDuration
      };
    } catch (error) {
      console.error('Error restoring timer state:', error);
      return null;
    }
  }

  /**
   * Get time spent in background for debugging
   */
  async getLastBackgroundDuration(): Promise<number | null> {
    try {
      const backgroundTimeStr = await AsyncStorage.getItem('@goalstreak/last_background_duration');
      return backgroundTimeStr ? parseInt(backgroundTimeStr, 10) : null;
    } catch (error) {
      console.error('Error getting background duration:', error);
      return null;
    }
  }

  /**
   * Save active timer checkpoints when going to background
   */
  private async saveActiveTimerCheckpoints(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEYS.ACTIVE_TIMERS);
      if (!stored) {
        return;
      }

      const storedTimers: Record<string, StoredTimerState> = JSON.parse(stored);
      const checkpoints: Record<string, any> = {};

      for (const [habitId, timer] of Object.entries(storedTimers)) {
        if (timer.isActive) {
          checkpoints[habitId] = {
            habitId: timer.habitId,
            startTime: timer.startTime,
            pausedTime: timer.pausedTime,
            targetDuration: timer.targetDuration,
            isActive: timer.isActive,
            isPaused: timer.isPaused,
            backgroundTime: new Date().toISOString()
          };
        }
      }

      await AsyncStorage.setItem(
        '@goalstreak/timer_background_checkpoints',
        JSON.stringify(checkpoints)
      );
    } catch (error) {
      console.error('Error saving timer checkpoints:', error);
    }
  }

  /**
   * Get timers that completed while in background
   */
  getCompletedTimersWhileBackground(): string[] {
    return Array.from(this.completedTimersWhileBackground);
  }

  /**
   * Clear completed timers tracking
   */
  clearCompletedTimersWhileBackground(): void {
    this.completedTimersWhileBackground.clear();
  }

  /**
   * Check if a timer completed while in background
   */
  didTimerCompleteInBackground(habitId: string): boolean {
    return this.completedTimersWhileBackground.has(habitId);
  }

  /**
   * Add event listener for background timer events
   */
  addEventListener(eventType: string, listener: (event: TimerEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: (event: TimerEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: TimerEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in background timer event listener:', error);
        }
      });
    }
  }

  /**
   * Get current background state
   */
  getBackgroundState(): { isInBackground: boolean; backgroundTime: Date | null } {
    return {
      isInBackground: this.isInBackground,
      backgroundTime: this.backgroundTime
    };
  }

  /**
   * Force update timers (for manual refresh)
   */
  async forceUpdateTimers(): Promise<string[]> {
    if (!this.isInBackground && this.backgroundTime) {
      const timeInBackground = new Date().getTime() - this.backgroundTime.getTime();
      return await this.updateTimersAfterBackground(timeInBackground);
    }
    return [];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear completed timers tracking
    this.completedTimersWhileBackground.clear();
  }
}

// Singleton instance
export const backgroundTimerManager = new BackgroundTimerManager();

/**
 * Utility functions for timer calculations
 */
export const TimerCalculations = {
  /**
   * Convert milliseconds to human-readable format
   */
  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Convert minutes to milliseconds
   */
  minutesToMilliseconds(minutes: number): number {
    return minutes * 60 * 1000;
  },

  /**
   * Convert milliseconds to minutes
   */
  millisecondsToMinutes(milliseconds: number): number {
    return Math.round(milliseconds / (60 * 1000));
  },

  /**
   * Get progress percentage (0-100)
   */
  getProgressPercentage(progress: number): number {
    return Math.round(Math.max(0, Math.min(100, progress * 100)));
  },

  /**
   * Check if timer should show warning (less than 5 minutes remaining)
   */
  shouldShowWarning(remainingTime: number): boolean {
    return remainingTime > 0 && remainingTime <= (5 * 60 * 1000); // 5 minutes in ms
  },

  /**
   * Check if timer is in final minute
   */
  isInFinalMinute(remainingTime: number): boolean {
    return remainingTime > 0 && remainingTime <= (60 * 1000); // 1 minute in ms
  },

  /**
   * Calculate time until next milestone (25%, 50%, 75%, 100%)
   */
  getNextMilestone(progress: number): { milestone: number; timeToMilestone: number } | null {
    const milestones = [0.25, 0.5, 0.75, 1.0];
    
    for (const milestone of milestones) {
      if (progress < milestone) {
        return {
          milestone,
          timeToMilestone: milestone - progress
        };
      }
    }
    
    return null; // Already at 100%
  }
};

/**
 * Timer persistence utilities
 */
export const TimerPersistence = {
  /**
   * Save timer checkpoint for recovery
   */
  async saveCheckpoint(habitId: string, timerState: TimerState): Promise<void> {
    try {
      const checkpoint = {
        habitId: timerState.habitId,
        startTime: timerState.startTime?.toISOString() || '',
        pausedTime: timerState.pausedTime,
        remainingTime: timerState.remainingTime,
        progress: timerState.progress,
        isActive: timerState.isActive,
        isPaused: timerState.isPaused,
        timestamp: new Date().toISOString()
      };

      await AsyncStorage.setItem(
        `@goalstreak/timer_checkpoint_${habitId}`,
        JSON.stringify(checkpoint)
      );
    } catch (error) {
      console.error('Error saving timer checkpoint:', error);
    }
  },

  /**
   * Load timer checkpoint
   */
  async loadCheckpoint(habitId: string): Promise<any | null> {
    try {
      const stored = await AsyncStorage.getItem(`@goalstreak/timer_checkpoint_${habitId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading timer checkpoint:', error);
      return null;
    }
  },

  /**
   * Clear timer checkpoint
   */
  async clearCheckpoint(habitId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@goalstreak/timer_checkpoint_${habitId}`);
    } catch (error) {
      console.error('Error clearing timer checkpoint:', error);
    }
  },

  /**
   * Clear all timer checkpoints
   */
  async clearAllCheckpoints(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const checkpointKeys = keys.filter(key => 
        key.startsWith('@goalstreak/timer_checkpoint_') ||
        key.startsWith('@goalstreak/timer_background_checkpoints')
      );
      
      if (checkpointKeys.length > 0) {
        await AsyncStorage.multiRemove(checkpointKeys);
      }
    } catch (error) {
      console.error('Error clearing all timer checkpoints:', error);
    }
  },

  /**
   * Save timer state for background recovery
   */
  async saveBackgroundState(timers: Record<string, StoredTimerState>): Promise<void> {
    try {
      const backgroundState = {
        timers,
        timestamp: new Date().toISOString(),
        appState: 'background'
      };

      await AsyncStorage.setItem(
        '@goalstreak/timer_background_state',
        JSON.stringify(backgroundState)
      );
    } catch (error) {
      console.error('Error saving background timer state:', error);
    }
  },

  /**
   * Load timer state from background recovery
   */
  async loadBackgroundState(): Promise<{ timers: Record<string, StoredTimerState>; timestamp: string } | null> {
    try {
      const stored = await AsyncStorage.getItem('@goalstreak/timer_background_state');
      if (!stored) {
        return null;
      }

      const backgroundState = JSON.parse(stored);
      return {
        timers: backgroundState.timers || {},
        timestamp: backgroundState.timestamp
      };
    } catch (error) {
      console.error('Error loading background timer state:', error);
      return null;
    }
  },

  /**
   * Clear background state
   */
  async clearBackgroundState(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@goalstreak/timer_background_state');
    } catch (error) {
      console.error('Error clearing background timer state:', error);
    }
  },

  /**
   * Get all timer-related storage keys for debugging
   */
  async getTimerStorageKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => 
        key.includes('timer') || 
        key.includes('background_time') ||
        key.includes('checkpoint')
      );
    } catch (error) {
      console.error('Error getting timer storage keys:', error);
      return [];
    }
  }
};
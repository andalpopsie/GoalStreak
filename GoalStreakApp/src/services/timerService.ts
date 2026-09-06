// Timer Service - Core timer functionality with state management and persistence
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TimerState,
  TimerSession,
  TimerConfig,
  TimerError,
  TimerErrorDetails,
  StoredTimerState,
  TimerCalculations,
  TimerEvent,
  TimerEventType,
} from '../types/timer';
import {
  TIMER_CONSTANTS,
  TIMER_STORAGE_KEYS,
  TIMER_ERROR_MESSAGES,
  TIMER_EVENTS,
} from '../constants/timer';
import { validateTimerState } from '../utils/timerValidation';
import {
  BackgroundTimerManager,
  backgroundTimerManager,
  TimerCalculations as BackgroundTimerCalculations,
  TimerPersistence,
} from '../utils/backgroundTimer';

/**
 * Core Timer Service Class
 * Handles timer lifecycle, calculations, and persistence
 */
export class TimerService {
  private activeTimers: Map<string, TimerState> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private persistenceInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, ((event: TimerEvent) => void)[]> = new Map();

  constructor() {
    this.initializePersistence();
    this.loadPersistedTimers();
    this.initializeBackgroundHandling();
  }

  /**
   * Start a timer for a habit with enhanced error handling
   */
  async startTimer(habitId: string, durationMinutes: number, userId: string): Promise<TimerState> {
    try {
      // Import error handler dynamically to avoid circular dependencies
      const { timerErrorHandler } = await import('../utils/timerErrorHandler');

      // Enhanced input validation - temporarily bypassed
      const inputValidation = { isValid: true, errors: [] };

      /*
      const inputValidation = timerErrorHandler.validateTimerInput({
        duration: durationMinutes,
        habitId,
        userId
      });
      */

      if (!inputValidation.isValid) {
        const errorMessage = inputValidation.errors.map((e) => e.message).join(', ');
        const error = this.createError(TimerError.INVALID_DURATION, errorMessage, habitId);
        await timerErrorHandler.handleError(error, {
          habitId,
          operation: 'startTimer',
          additionalData: { durationMinutes, userId },
        });
        throw error;
      }

      // Check if timer already exists for this habit
      if (this.activeTimers.has(habitId)) {
        const error = this.createError(
          TimerError.TIMER_ALREADY_ACTIVE,
          TIMER_ERROR_MESSAGES[TimerError.TIMER_ALREADY_ACTIVE],
          habitId
        );
        await timerErrorHandler.handleError(error, {
          habitId,
          operation: 'startTimer',
          additionalData: { existingTimer: true },
        });
        throw error;
      }

      // Check concurrent timer limit
      if (this.activeTimers.size >= TIMER_CONSTANTS.MAX_CONCURRENT_TIMERS) {
        const error = this.createError(
          TimerError.MAX_CONCURRENT_TIMERS_EXCEEDED,
          TIMER_ERROR_MESSAGES[TimerError.MAX_CONCURRENT_TIMERS_EXCEEDED],
          habitId
        );
        await timerErrorHandler.handleError(error, {
          habitId,
          operation: 'startTimer',
          additionalData: {
            activeTimerCount: this.activeTimers.size,
            maxAllowed: TIMER_CONSTANTS.MAX_CONCURRENT_TIMERS,
          },
        });
        throw error;
      }

      const now = new Date();
      const durationMs = durationMinutes * 60 * 1000;

      // Create timer state
      const timerState: TimerState = {
        habitId,
        isActive: true,
        isPaused: false,
        startTime: now,
        pausedTime: 0,
        remainingTime: durationMs,
        progress: 0,
        lastUpdate: now,
        originalDuration: durationMs,
      };

      // Enhanced timer state validation
      const stateValidation = timerErrorHandler.validateTimerState(timerState);
      if (!stateValidation.isValid) {
        const error = this.createError(
          TimerError.INVALID_TIMER_STATE,
          stateValidation.errors.join(', '),
          habitId
        );
        await timerErrorHandler.handleError(error, {
          habitId,
          operation: 'startTimer',
          additionalData: { timerState, validationErrors: stateValidation.errors },
        });
        throw error;
      }

      // Store timer state
      this.activeTimers.set(habitId, timerState);

      // Start update interval
      this.startUpdateInterval(habitId);

      // Persist state with error handling
      try {
        await this.persistTimerState();
      } catch (persistError) {
        console.error('Failed to persist timer state:', persistError);
        await timerErrorHandler.handleError(TimerError.TIMER_PERSISTENCE_FAILED, {
          habitId,
          operation: 'startTimer',
          additionalData: { persistError: persistError.message },
        });
        // Continue execution - timer can work without persistence
      }

      // Save checkpoint for background recovery
      try {
        await this.saveTimerCheckpoint(habitId);
      } catch (checkpointError) {
        console.error('Failed to save timer checkpoint:', checkpointError);
        // Non-critical error - continue execution
      }

      // Emit event
      this.emitEvent(TIMER_EVENTS.STARTED, habitId, userId, { durationMinutes });

      return timerState;
    } catch (error) {
      console.error('Error starting timer:', error);

      // If it's already a timer error, re-throw it
      if (
        error instanceof Error &&
        error.name &&
        Object.values(TimerError).includes(error.name as TimerError)
      ) {
        throw error;
      }

      // Handle unexpected errors
      const { timerErrorHandler } = await import('../utils/timerErrorHandler');
      const enhancedError = await timerErrorHandler.handleError(error, {
        habitId,
        operation: 'startTimer',
        additionalData: { durationMinutes, userId },
      });

      throw this.createError(TimerError.INVALID_TIMER_STATE, 'Failed to start timer', habitId);
    }
  }

  /**
   * Pause a timer with enhanced error handling
   */
  async pauseTimer(habitId: string, userId: string): Promise<TimerState> {
    try {
      const { timerErrorHandler } = await import('../utils/timerErrorHandler');

      // Validate inputs
      const inputValidation = timerErrorHandler.validateTimerInput({ habitId, userId });
      if (!inputValidation.isValid) {
        const errorMessage = inputValidation.errors.map((e) => e.message).join(', ');
        const error = this.createError(TimerError.INVALID_TIMER_STATE, errorMessage, habitId);
        await timerErrorHandler.handleError(error, {
          habitId,
          operation: 'pauseTimer',
          additionalData: { userId },
        });
        throw error;
      }

      const timerState = this.activeTimers.get(habitId);
      if (!timerState) {
        const error = this.createError(
          TimerError.TIMER_NOT_FOUND,
          TIMER_ERROR_MESSAGES[TimerError.TIMER_NOT_FOUND],
          habitId
        );
        await timerErrorHandler.handleError(error, {
          habitId,
          operation: 'pauseTimer',
          additionalData: { userId, activeTimerCount: this.activeTimers.size },
        });
        throw error;
      }

      // Validate timer state before pausing
      if (!timerState.isActive) {
        const error = this.createError(
          TimerError.TIMER_NOT_ACTIVE,
          'Timer is not active and cannot be paused',
          habitId
        );
        await timerErrorHandler.handleError(error, {
          habitId,
          operation: 'pauseTimer',
          additionalData: {
            userId,
            timerState: {
              isActive: timerState.isActive,
              isPaused: timerState.isPaused,
            },
          },
        });
        throw error;
      }

      if (timerState.isPaused) {
        const error = this.createError(
          TimerError.TIMER_NOT_ACTIVE,
          'Timer is already paused',
          habitId
        );
        await timerErrorHandler.handleError(error, {
          habitId,
          operation: 'pauseTimer',
          additionalData: { userId, alreadyPaused: true },
        });
        throw error;
      }

      // Update timer calculations before pausing
      try {
        this.updateTimerCalculations(timerState);
      } catch (calcError) {
        console.error('Error updating timer calculations:', calcError);
        await timerErrorHandler.handleError(calcError, {
          habitId,
          operation: 'pauseTimer',
          additionalData: { userId, step: 'updateCalculations' },
        });
        // Continue with pause operation
      }

      // Pause timer
      timerState.isPaused = true;
      timerState.lastUpdate = new Date();

      // Validate state after modification
      const stateValidation = timerErrorHandler.validateTimerState(timerState);
      if (!stateValidation.isValid) {
        console.warn('Timer state validation failed after pause:', stateValidation.errors);
        // Continue execution but log the issue
      }

      // Stop update interval
      this.stopUpdateInterval(habitId);

      // Persist state with error handling
      try {
        await this.persistTimerState();
      } catch (persistError) {
        console.error('Failed to persist timer state after pause:', persistError);
        await timerErrorHandler.handleError(TimerError.TIMER_PERSISTENCE_FAILED, {
          habitId,
          operation: 'pauseTimer',
          additionalData: { userId, persistError: persistError.message },
        });
        // Continue execution - timer can work without persistence
      }

      // Save checkpoint for background recovery
      try {
        await this.saveTimerCheckpoint(habitId);
      } catch (checkpointError) {
        console.error('Failed to save timer checkpoint after pause:', checkpointError);
        // Non-critical error - continue execution
      }

      // Emit event
      this.emitEvent(TIMER_EVENTS.PAUSED, habitId, userId, {
        remainingTime: timerState.remainingTime,
        progress: timerState.progress,
      });

      return timerState;
    } catch (error) {
      console.error('Error pausing timer:', error);

      // If it's already a timer error, re-throw it
      if (
        error instanceof Error &&
        error.name &&
        Object.values(TimerError).includes(error.name as TimerError)
      ) {
        throw error;
      }

      // Handle unexpected errors
      const { timerErrorHandler } = await import('../utils/timerErrorHandler');
      await timerErrorHandler.handleError(error, {
        habitId,
        operation: 'pauseTimer',
        additionalData: { userId },
      });

      throw this.createError(TimerError.INVALID_TIMER_STATE, 'Failed to pause timer', habitId);
    }
  }

  /**
   * Resume a paused timer
   */
  async resumeTimer(habitId: string, userId: string): Promise<TimerState> {
    try {
      const timerState = this.activeTimers.get(habitId);
      if (!timerState) {
        throw this.createError(
          TimerError.TIMER_NOT_FOUND,
          TIMER_ERROR_MESSAGES[TimerError.TIMER_NOT_FOUND],
          habitId
        );
      }

      if (!timerState.isActive || !timerState.isPaused) {
        throw this.createError(TimerError.TIMER_NOT_ACTIVE, 'Timer is not paused', habitId);
      }

      // Resume timer
      timerState.isPaused = false;
      timerState.startTime = new Date(); // Reset start time to now
      timerState.lastUpdate = new Date();

      // Restart update interval
      this.startUpdateInterval(habitId);

      // Persist state
      await this.persistTimerState();

      // Emit event
      this.emitEvent(TIMER_EVENTS.RESUMED, habitId, userId, {
        remainingTime: timerState.remainingTime,
        progress: timerState.progress,
      });

      return timerState;
    } catch (error) {
      console.error('Error resuming timer:', error);
      throw error;
    }
  }

  /**
   * Reset a timer
   */
  async resetTimer(habitId: string, userId: string): Promise<void> {
    try {
      const timerState = this.activeTimers.get(habitId);
      if (!timerState) {
        throw this.createError(
          TimerError.TIMER_NOT_FOUND,
          TIMER_ERROR_MESSAGES[TimerError.TIMER_NOT_FOUND],
          habitId
        );
      }

      // Stop update interval
      this.stopUpdateInterval(habitId);

      // Remove from active timers
      this.activeTimers.delete(habitId);

      // Persist state
      await this.persistTimerState();

      // Emit event
      this.emitEvent(TIMER_EVENTS.RESET, habitId, userId);
    } catch (error) {
      console.error('Error resetting timer:', error);
      throw error;
    }
  }

  /**
   * Complete a timer (when it reaches zero or manually completed)
   */
  async completeTimer(habitId: string, userId: string): Promise<TimerSession> {
    try {
      const timerState = this.activeTimers.get(habitId);
      if (!timerState) {
        throw this.createError(
          TimerError.TIMER_NOT_FOUND,
          TIMER_ERROR_MESSAGES[TimerError.TIMER_NOT_FOUND],
          habitId
        );
      }

      // Calculate final values
      this.updateTimerCalculations(timerState);

      // Create timer session record
      const session: TimerSession = {
        id: `${habitId}_${Date.now()}`,
        habitId,
        userId,
        startTime: timerState.startTime!,
        endTime: new Date(),
        targetDuration: this.calculateTargetDuration(timerState),
        actualDuration: this.calculateActualDuration(timerState),
        pausedDuration: Math.round(timerState.pausedTime / (60 * 1000)), // Convert to minutes
        completed: true,
        completionMethod: timerState.remainingTime <= 0 ? 'timer' : 'manual',
        createdAt: new Date(),
      };

      // Stop update interval
      this.stopUpdateInterval(habitId);

      // Remove from active timers
      this.activeTimers.delete(habitId);

      // Save session to storage
      await this.saveTimerSession(session);

      // Persist state
      await this.persistTimerState();

      // Emit event
      this.emitEvent(TIMER_EVENTS.COMPLETED, habitId, userId, {
        sessionId: session.id,
        actualDuration: session.actualDuration,
        completionMethod: session.completionMethod,
      });

      return session;
    } catch (error) {
      console.error('Error completing timer:', error);
      throw error;
    }
  }

  /**
   * Get current timer state for a habit
   */
  getTimerState(habitId: string): TimerState | null {
    const timerState = this.activeTimers.get(habitId);
    if (!timerState) {
      return null;
    }

    // Update calculations before returning
    this.updateTimerCalculations(timerState);
    return { ...timerState }; // Return copy to prevent external mutations
  }

  /**
   * Get all active timers
   */
  getAllActiveTimers(): TimerState[] {
    const timers: TimerState[] = [];
    for (const [habitId, timerState] of this.activeTimers) {
      this.updateTimerCalculations(timerState);
      timers.push({ ...timerState });
    }
    return timers;
  }

  /**
   * Check if a habit has an active timer
   */
  hasActiveTimer(habitId: string): boolean {
    return this.activeTimers.has(habitId);
  }

  /**
   * Get timer calculations for a timer state
   */
  getTimerCalculations(timerState: TimerState): TimerCalculations {
    const targetDuration = this.calculateTargetDuration(timerState);
    const elapsedTime = this.calculateElapsedTime(timerState);
    const remainingTime = Math.max(0, targetDuration - elapsedTime);
    const progress = targetDuration > 0 ? Math.min(1, elapsedTime / targetDuration) : 0;

    return {
      totalDuration: targetDuration,
      elapsedTime,
      remainingTime,
      progress,
      progressPercentage: Math.round(progress * 100),
    };
  }

  /**
   * Add event listener for timer events
   */
  addEventListener(eventType: TimerEventType, listener: (event: TimerEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: TimerEventType, listener: (event: TimerEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Stop all update intervals
    for (const [habitId] of this.activeTimers) {
      this.stopUpdateInterval(habitId);
    }

    // Stop persistence interval
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
      this.persistenceInterval = null;
    }

    // Clear event listeners
    this.eventListeners.clear();

    // Cleanup background timer manager
    backgroundTimerManager.cleanup();

    // Clear all timer checkpoints
    TimerPersistence.clearAllCheckpoints().catch((error) => {
      console.error('Error clearing timer checkpoints during cleanup:', error);
    });
  }

  /**
   * Initialize background timer handling
   */
  private initializeBackgroundHandling(): void {
    // Background timer manager is already initialized as singleton
    // We just need to ensure it's active
  }

  /**
   * Handle app going to background - save timer states
   */
  async handleAppBackground(): Promise<void> {
    try {
      // Update all timer calculations before saving
      for (const [habitId, timerState] of this.activeTimers) {
        if (timerState.isActive && !timerState.isPaused) {
          this.updateTimerCalculations(timerState);
        }
      }

      // Persist current state
      await this.persistTimerState();

      // Save individual checkpoints for each active timer
      for (const [habitId, timerState] of this.activeTimers) {
        if (timerState.isActive) {
          await this.saveTimerCheckpoint(habitId);
        }
      }
    } catch (error) {
      console.error('Error handling app background:', error);
    }
  }

  /**
   * Handle app coming to foreground - refresh timer states
   */
  async handleAppForeground(): Promise<void> {
    try {
      // Force update timers through background manager first
      const completedTimers = await backgroundTimerManager.forceUpdateTimers();

      // Reload persisted timers to get updated states after background
      await this.loadPersistedTimers();

      // Handle timers that completed while in background
      for (const habitId of completedTimers) {
        // Remove from active timers since it completed
        this.activeTimers.delete(habitId);

        // Stop any update intervals
        this.stopUpdateInterval(habitId);

        // Clear checkpoint since timer completed
        await this.clearTimerCheckpoint(habitId);

        // Emit completion event with background completion flag
        this.emitEvent(TIMER_EVENTS.COMPLETED, habitId, '', {
          autoCompleted: true,
          completedInBackground: true,
          requiresHabitCompletion: true, // Flag to indicate habit should be marked complete
        });
      }

      // Check remaining active timers for any other completions
      for (const [habitId, timerState] of this.activeTimers) {
        if (timerState.remainingTime <= 0 && timerState.isActive) {
          this.emitEvent(TIMER_EVENTS.COMPLETED, habitId, '', {
            autoCompleted: true,
            completedOnForeground: true,
            requiresHabitCompletion: true,
          });
        }
      }

      // Clear background completion tracking
      backgroundTimerManager.clearCompletedTimersWhileBackground();
    } catch (error) {
      console.error('Error handling app foreground:', error);
    }
  }

  /**
   * Save timer checkpoint for background recovery
   */
  async saveTimerCheckpoint(habitId: string): Promise<void> {
    try {
      const timerState = this.activeTimers.get(habitId);
      if (timerState) {
        await TimerPersistence.saveCheckpoint(habitId, timerState);
      }
    } catch (error) {
      console.error('Error saving timer checkpoint:', error);
    }
  }

  /**
   * Load timer checkpoint for recovery
   */
  async loadTimerCheckpoint(habitId: string): Promise<TimerState | null> {
    try {
      const checkpoint = await TimerPersistence.loadCheckpoint(habitId);
      if (!checkpoint) {
        return null;
      }

      // Restore timer state using background timer calculations
      const storedTimer: StoredTimerState = {
        habitId: checkpoint.habitId,
        startTime: checkpoint.startTime,
        pausedTime: checkpoint.pausedTime,
        targetDuration: 0, // Will be calculated
        lastUpdate: checkpoint.timestamp,
        isActive: checkpoint.isActive,
        isPaused: checkpoint.isPaused,
      };

      return BackgroundTimerManager.restoreTimerState(storedTimer);
    } catch (error) {
      console.error('Error loading timer checkpoint:', error);
      return null;
    }
  }

  /**
   * Clear timer checkpoint
   */
  async clearTimerCheckpoint(habitId: string): Promise<void> {
    try {
      await TimerPersistence.clearCheckpoint(habitId);
    } catch (error) {
      console.error('Error clearing timer checkpoint:', error);
    }
  }

  // Private methods

  private startUpdateInterval(habitId: string): void {
    // Clear existing interval if any
    this.stopUpdateInterval(habitId);

    const interval = setInterval(() => {
      const timerState = this.activeTimers.get(habitId);
      if (!timerState || !timerState.isActive || timerState.isPaused) {
        this.stopUpdateInterval(habitId);
        return;
      }

      this.updateTimerCalculations(timerState);

      // Check if timer completed
      if (timerState.remainingTime <= 0) {
        this.stopUpdateInterval(habitId);
        // Timer completed - emit event with habit completion flag
        this.emitEvent(TIMER_EVENTS.COMPLETED, habitId, '', {
          autoCompleted: true,
          requiresHabitCompletion: true, // Flag to indicate habit should be marked complete
        });
      }
    }, TIMER_CONSTANTS.PROGRESS_UPDATE_INTERVAL);

    this.updateIntervals.set(habitId, interval);
  }

  private stopUpdateInterval(habitId: string): void {
    const interval = this.updateIntervals.get(habitId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(habitId);
    }
  }

  private updateTimerCalculations(timerState: TimerState): void {
    if (!timerState.isActive) {
      return;
    }

    const now = new Date();
    const calculations = this.getTimerCalculations(timerState);

    timerState.remainingTime = calculations.remainingTime;
    timerState.progress = calculations.progress;
    timerState.lastUpdate = now;
  }

  private calculateTargetDuration(timerState: TimerState): number {
    // Use the original duration stored when timer was started
    return timerState.originalDuration || 0;
  }

  private calculateElapsedTime(timerState: TimerState): number {
    if (!timerState.startTime || !timerState.isActive) {
      return 0;
    }

    // Use background timer calculations for accuracy
    return BackgroundTimerManager.calculateAccurateElapsedTime(
      timerState.startTime,
      timerState.pausedTime,
      new Date()
    );
  }

  private calculateActualDuration(timerState: TimerState): number {
    const elapsedTime = this.calculateElapsedTime(timerState);
    return Math.round(elapsedTime / (60 * 1000)); // Convert to minutes
  }

  private async persistTimerState(): Promise<void> {
    try {
      const storedTimers: Record<string, StoredTimerState> = {};

      for (const [habitId, timerState] of this.activeTimers) {
        storedTimers[habitId] = {
          habitId: timerState.habitId,
          startTime: timerState.startTime?.toISOString() || '',
          pausedTime: timerState.pausedTime,
          targetDuration: this.calculateTargetDuration(timerState),
          lastUpdate: timerState.lastUpdate?.toISOString() || new Date().toISOString(),
          isActive: timerState.isActive,
          isPaused: timerState.isPaused,
        };
      }

      // Save to regular storage
      await AsyncStorage.setItem(TIMER_STORAGE_KEYS.ACTIVE_TIMERS, JSON.stringify(storedTimers));

      // Also save to background state for better recovery
      await TimerPersistence.saveBackgroundState(storedTimers);
    } catch (error) {
      console.error('Error persisting timer state:', error);
      throw this.createError(
        TimerError.TIMER_PERSISTENCE_FAILED,
        TIMER_ERROR_MESSAGES[TimerError.TIMER_PERSISTENCE_FAILED]
      );
    }
  }

  private async loadPersistedTimers(): Promise<void> {
    try {
      // Try to load from background state first (more recent)
      const backgroundState = await TimerPersistence.loadBackgroundState();
      let storedTimers: Record<string, StoredTimerState> = {};

      if (backgroundState) {
        storedTimers = backgroundState.timers;
      } else {
        // Fallback to regular active timers storage
        const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEYS.ACTIVE_TIMERS);
        if (stored) {
          storedTimers = JSON.parse(stored);
        }
      }

      if (Object.keys(storedTimers).length === 0) {
        return;
      }

      const now = new Date();
      const completedTimers: string[] = [];

      for (const [habitId, storedTimer] of Object.entries(storedTimers)) {
        try {
          // Use background timer manager to restore accurate state
          const restoredState = BackgroundTimerManager.restoreTimerState(storedTimer, now);

          if (restoredState && restoredState.remainingTime > 0 && restoredState.isActive) {
            // Timer is still active
            this.activeTimers.set(habitId, restoredState);

            // Restart update interval if timer was active and not paused
            if (!restoredState.isPaused) {
              this.startUpdateInterval(habitId);
            }
          } else if (restoredState && restoredState.remainingTime <= 0) {
            // Timer completed while app was closed/backgrounded
            completedTimers.push(habitId);

            // Don't add to active timers since it's completed
            // Clear any stored checkpoint
            await this.clearTimerCheckpoint(habitId);
          } else if (storedTimer.isActive === false) {
            // Timer was already marked as inactive (completed)
            completedTimers.push(habitId);
          }
        } catch (error) {
          console.error(`Error restoring timer for habit ${habitId}:`, error);
          // Skip this timer and continue with others
        }
      }

      // Emit completion events for timers that completed while closed
      for (const habitId of completedTimers) {
        this.emitEvent(TIMER_EVENTS.COMPLETED, habitId, '', {
          autoCompleted: true,
          completedWhileClosed: true,
          requiresHabitCompletion: true,
        });
      }

      // Update stored state to reflect current active timers
      await this.persistTimerState();

      // Clear background state since we've processed it
      if (backgroundState) {
        await TimerPersistence.clearBackgroundState();
      }
    } catch (error) {
      console.error('Error loading persisted timers:', error);
      // Don't throw - app should continue even if timer restoration fails
    }
  }

  private initializePersistence(): void {
    // Periodically persist timer state
    this.persistenceInterval = setInterval(() => {
      this.persistTimerState().catch((error) => {
        console.error('Error in periodic persistence:', error);
      });
    }, TIMER_CONSTANTS.PERSISTENCE_INTERVAL);
  }

  private async saveTimerSession(session: TimerSession): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEYS.TIMER_SESSIONS);
      const sessions: TimerSession[] = stored ? JSON.parse(stored) : [];

      sessions.push(session);

      // Keep only last 100 sessions to prevent storage bloat
      if (sessions.length > 100) {
        sessions.splice(0, sessions.length - 100);
      }

      await AsyncStorage.setItem(TIMER_STORAGE_KEYS.TIMER_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving timer session:', error);
      // Don't throw - session saving failure shouldn't break timer completion
    }
  }

  private emitEvent(
    type: TimerEventType,
    habitId: string,
    userId: string,
    data?: Record<string, any>
  ): void {
    const event: TimerEvent = {
      type,
      habitId,
      userId,
      timestamp: new Date(),
      data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in timer event listener:', error);
        }
      });
    }
  }

  private createError(code: TimerError, message: string, habitId?: string): Error {
    const error = new Error(message);
    error.name = code;
    (error as any).habitId = habitId;
    return error;
  }
}

// Export singleton instance
export const timerService = new TimerService();

// Export timer session utilities
export const timerSessionService = {
  /**
   * Get timer sessions for a habit
   */
  async getHabitTimerSessions(habitId: string): Promise<TimerSession[]> {
    try {
      const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEYS.TIMER_SESSIONS);
      if (!stored) {
        return [];
      }

      const sessions: TimerSession[] = JSON.parse(stored);
      return sessions
        .filter((session) => session.habitId === habitId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting habit timer sessions:', error);
      return [];
    }
  },

  /**
   * Get all timer sessions for a user
   */
  async getUserTimerSessions(userId: string): Promise<TimerSession[]> {
    try {
      const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEYS.TIMER_SESSIONS);
      if (!stored) {
        return [];
      }

      const sessions: TimerSession[] = JSON.parse(stored);
      return sessions
        .filter((session) => session.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting user timer sessions:', error);
      return [];
    }
  },

  /**
   * Clear old timer sessions (keep last 30 days)
   */
  async clearOldSessions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEYS.TIMER_SESSIONS);
      if (!stored) {
        return;
      }

      const sessions: TimerSession[] = JSON.parse(stored);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSessions = sessions.filter(
        (session) => new Date(session.createdAt) > thirtyDaysAgo
      );

      await AsyncStorage.setItem(TIMER_STORAGE_KEYS.TIMER_SESSIONS, JSON.stringify(recentSessions));
    } catch (error) {
      console.error('Error clearing old timer sessions:', error);
    }
  },
};

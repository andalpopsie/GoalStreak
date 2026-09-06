// Enhanced Timer Error Handler for GoalStreak
// Provides comprehensive error handling, user-friendly messages, and recovery strategies

import { Alert } from 'react-native';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerError, TimerErrorDetails, TimerValidationError, TimerState } from '../types/timer';
import { TIMER_ERROR_MESSAGES, TIMER_CONSTANTS, TIMER_STORAGE_KEYS } from '../constants/timer';

// Enhanced error types for better categorization
export enum TimerErrorSeverity {
  LOW = 'low', // Minor issues, app continues normally
  MEDIUM = 'medium', // Noticeable issues, some functionality affected
  HIGH = 'high', // Major issues, timer functionality compromised
  CRITICAL = 'critical', // Critical issues, app stability at risk
}

export enum TimerErrorCategory {
  VALIDATION = 'validation', // Input validation errors
  NETWORK = 'network', // Network connectivity issues
  STORAGE = 'storage', // Local storage problems
  PERMISSION = 'permission', // Permission-related errors
  STATE = 'state', // Timer state inconsistencies
  SYSTEM = 'system', // System-level errors
}

export interface EnhancedTimerError extends TimerErrorDetails {
  severity: TimerErrorSeverity;
  category: TimerErrorCategory;
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: string[];
  retryable: boolean;
}

// Error mapping configuration
const ERROR_CONFIG: Record<
  TimerError,
  {
    severity: TimerErrorSeverity;
    category: TimerErrorCategory;
    recoverable: boolean;
    retryable: boolean;
    recoveryActions: string[];
  }
> = {
  [TimerError.INVALID_DURATION]: {
    severity: TimerErrorSeverity.LOW,
    category: TimerErrorCategory.VALIDATION,
    recoverable: true,
    retryable: false,
    recoveryActions: ['Adjust timer duration', 'Use suggested durations'],
  },
  [TimerError.TIMER_ALREADY_ACTIVE]: {
    severity: TimerErrorSeverity.MEDIUM,
    category: TimerErrorCategory.STATE,
    recoverable: true,
    retryable: false,
    recoveryActions: ['Stop current timer first', 'Use existing timer'],
  },
  [TimerError.TIMER_NOT_FOUND]: {
    severity: TimerErrorSeverity.MEDIUM,
    category: TimerErrorCategory.STATE,
    recoverable: true,
    retryable: false,
    recoveryActions: ['Start a new timer', 'Refresh app'],
  },
  [TimerError.TIMER_NOT_ACTIVE]: {
    severity: TimerErrorSeverity.LOW,
    category: TimerErrorCategory.STATE,
    recoverable: true,
    retryable: false,
    recoveryActions: ['Start timer first', 'Check timer status'],
  },
  [TimerError.BACKGROUND_SYNC_FAILED]: {
    severity: TimerErrorSeverity.MEDIUM,
    category: TimerErrorCategory.NETWORK,
    recoverable: true,
    retryable: true,
    recoveryActions: ['Check internet connection', 'Retry when online'],
  },
  [TimerError.NOTIFICATION_PERMISSION_DENIED]: {
    severity: TimerErrorSeverity.LOW,
    category: TimerErrorCategory.PERMISSION,
    recoverable: true,
    retryable: false,
    recoveryActions: ['Enable notifications in settings', 'Use visual indicators'],
  },
  [TimerError.STORAGE_QUOTA_EXCEEDED]: {
    severity: TimerErrorSeverity.HIGH,
    category: TimerErrorCategory.STORAGE,
    recoverable: true,
    retryable: false,
    recoveryActions: ['Clear app cache', 'Free up device storage'],
  },
  [TimerError.MAX_CONCURRENT_TIMERS_EXCEEDED]: {
    severity: TimerErrorSeverity.MEDIUM,
    category: TimerErrorCategory.VALIDATION,
    recoverable: true,
    retryable: false,
    recoveryActions: ['Stop other timers', 'Complete existing timers'],
  },
  [TimerError.TIMER_PERSISTENCE_FAILED]: {
    severity: TimerErrorSeverity.HIGH,
    category: TimerErrorCategory.STORAGE,
    recoverable: true,
    retryable: true,
    recoveryActions: ['Restart app', 'Check device storage'],
  },
  [TimerError.INVALID_TIMER_STATE]: {
    severity: TimerErrorSeverity.HIGH,
    category: TimerErrorCategory.STATE,
    recoverable: true,
    retryable: false,
    recoveryActions: ['Reset timer', 'Restart app'],
  },
};

// User-friendly error messages
const USER_FRIENDLY_MESSAGES: Record<TimerError, string> = {
  [TimerError.INVALID_DURATION]: 'Please choose a timer duration between 1 minute and 24 hours.',
  [TimerError.TIMER_ALREADY_ACTIVE]:
    'This habit already has an active timer. Stop it first or use the existing timer.',
  [TimerError.TIMER_NOT_FOUND]: 'No timer found for this habit. You can start a new timer.',
  [TimerError.TIMER_NOT_ACTIVE]: 'No active timer to pause or stop. Start a timer first.',
  [TimerError.BACKGROUND_SYNC_FAILED]:
    "Timer data will sync when you're back online. Your progress is saved locally.",
  [TimerError.NOTIFICATION_PERMISSION_DENIED]:
    'Enable notifications in your device settings to get timer alerts.',
  [TimerError.STORAGE_QUOTA_EXCEEDED]:
    'Your device is running low on storage. Some timer data may not be saved.',
  [TimerError.MAX_CONCURRENT_TIMERS_EXCEEDED]: `You can only run ${TIMER_CONSTANTS.MAX_CONCURRENT_TIMERS} timers at once. Complete or stop other timers first.`,
  [TimerError.TIMER_PERSISTENCE_FAILED]:
    'Unable to save timer progress. Your data may be lost if you close the app.',
  [TimerError.INVALID_TIMER_STATE]:
    'Timer is in an invalid state. Try resetting the timer or restarting the app.',
};

/**
 * Enhanced Timer Error Handler Class
 */
export class TimerErrorHandler {
  private static instance: TimerErrorHandler;
  private errorHistory: EnhancedTimerError[] = [];
  private retryAttempts: Map<string, number> = new Map();
  private maxRetryAttempts = 3;
  private errorCallbacks: Map<TimerError, ((error: EnhancedTimerError) => void)[]> = new Map();

  private constructor() {}

  static getInstance(): TimerErrorHandler {
    if (!TimerErrorHandler.instance) {
      TimerErrorHandler.instance = new TimerErrorHandler();
    }
    return TimerErrorHandler.instance;
  }

  /**
   * Handle timer error with enhanced processing
   */
  async handleError(
    error: Error | TimerError | string,
    context?: {
      habitId?: string;
      sessionId?: string;
      operation?: string;
      additionalData?: Record<string, any>;
    }
  ): Promise<EnhancedTimerError> {
    const enhancedError = await this.processError(error, context);

    // Add to error history
    this.errorHistory.push(enhancedError);
    this.trimErrorHistory();

    // Log error for debugging
    this.logError(enhancedError);

    // Execute error callbacks
    this.executeErrorCallbacks(enhancedError);

    // Handle error based on severity
    await this.handleErrorBySeverity(enhancedError);

    return enhancedError;
  }

  /**
   * Process raw error into enhanced error object
   */
  private async processError(
    error: Error | TimerError | string,
    context?: {
      habitId?: string;
      sessionId?: string;
      operation?: string;
      additionalData?: Record<string, any>;
    }
  ): Promise<EnhancedTimerError> {
    let timerError: TimerError;
    let originalMessage: string;

    // Determine error type
    if (typeof error === 'string') {
      timerError = TimerError.INVALID_TIMER_STATE;
      originalMessage = error;
    } else if (Object.values(TimerError).includes(error as TimerError)) {
      timerError = error as TimerError;
      originalMessage = TIMER_ERROR_MESSAGES[timerError];
    } else if (error instanceof Error) {
      // Try to map common error patterns
      timerError = this.mapErrorToTimerError(error);
      originalMessage = error.message;
    } else {
      timerError = TimerError.INVALID_TIMER_STATE;
      originalMessage = 'Unknown error occurred';
    }

    const config = ERROR_CONFIG[timerError];
    const networkState = await this.getNetworkState();

    return {
      code: timerError,
      message: originalMessage,
      habitId: context?.habitId,
      sessionId: context?.sessionId,
      context: {
        operation: context?.operation,
        networkConnected: networkState.isConnected,
        timestamp: new Date().toISOString(),
        ...context?.additionalData,
      },
      timestamp: new Date(),
      severity: config.severity,
      category: config.category,
      recoverable: config.recoverable,
      userMessage: USER_FRIENDLY_MESSAGES[timerError],
      technicalMessage: originalMessage,
      recoveryActions: config.recoveryActions,
      retryable: config.retryable,
    };
  }

  /**
   * Map generic errors to timer-specific errors
   */
  private mapErrorToTimerError(error: Error): TimerError {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection')) {
      return TimerError.BACKGROUND_SYNC_FAILED;
    }
    if (message.includes('storage') || message.includes('quota')) {
      return TimerError.STORAGE_QUOTA_EXCEEDED;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return TimerError.NOTIFICATION_PERMISSION_DENIED;
    }
    if (message.includes('duration') || message.includes('invalid')) {
      return TimerError.INVALID_DURATION;
    }
    if (message.includes('active') || message.includes('running')) {
      return TimerError.TIMER_ALREADY_ACTIVE;
    }
    if (message.includes('not found') || message.includes('missing')) {
      return TimerError.TIMER_NOT_FOUND;
    }

    return TimerError.INVALID_TIMER_STATE;
  }

  /**
   * Handle error based on severity level
   */
  private async handleErrorBySeverity(error: EnhancedTimerError): Promise<void> {
    switch (error.severity) {
      case TimerErrorSeverity.LOW:
        // Log only, no user interruption
        console.warn('Timer warning:', error.userMessage);
        break;

      case TimerErrorSeverity.MEDIUM:
        // Show non-blocking notification
        this.showToastError(error);
        break;

      case TimerErrorSeverity.HIGH:
        // Show alert with recovery options
        this.showAlertError(error);
        break;

      case TimerErrorSeverity.CRITICAL:
        // Show critical error dialog with forced actions
        this.showCriticalError(error);
        break;
    }
  }

  /**
   * Show toast-style error (non-blocking)
   */
  private showToastError(error: EnhancedTimerError): void {
    // In a real app, you'd use a toast library
  }

  /**
   * Show alert dialog with recovery options
   */
  private showAlertError(error: EnhancedTimerError): void {
    const buttons = [{ text: 'OK', style: 'default' as const }];

    if (error.retryable) {
      buttons.unshift({
        text: 'Retry',
        style: 'default' as const,
        onPress: () => this.handleRetry(error),
      });
    }

    Alert.alert('Timer Issue', error.userMessage, buttons);
  }

  /**
   * Show critical error dialog
   */
  private showCriticalError(error: EnhancedTimerError): void {
    Alert.alert(
      'Critical Timer Error',
      `${error.userMessage}\n\nRecommended actions:\n${error.recoveryActions.map((action) => `• ${action}`).join('\n')}`,
      [{ text: 'OK', style: 'default' }]
    );
  }

  /**
   * Handle retry logic
   */
  private async handleRetry(error: EnhancedTimerError): Promise<void> {
    const retryKey = `${error.code}_${error.habitId || 'global'}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;

    if (attempts >= this.maxRetryAttempts) {
      Alert.alert(
        'Retry Limit Reached',
        'Maximum retry attempts exceeded. Please try again later or restart the app.'
      );
      return;
    }

    this.retryAttempts.set(retryKey, attempts + 1);

    // Implement retry logic based on error type
    switch (error.category) {
      case TimerErrorCategory.NETWORK:
        await this.retryNetworkOperation(error);
        break;
      case TimerErrorCategory.STORAGE:
        await this.retryStorageOperation(error);
        break;
      default:
    }
  }

  /**
   * Retry network operations
   */
  private async retryNetworkOperation(error: EnhancedTimerError): Promise<void> {
    const networkState = await this.getNetworkState();

    if (!networkState.isConnected) {
      Alert.alert('No Internet Connection', 'Please check your internet connection and try again.');
      return;
    }

    // Trigger sync retry (would be implemented by the calling service)
  }

  /**
   * Retry storage operations
   */
  private async retryStorageOperation(error: EnhancedTimerError): Promise<void> {
    try {
      // Check available storage
      const storageInfo = await this.getStorageInfo();

      if (storageInfo.availableSpace < 1024 * 1024) {
        // Less than 1MB
        Alert.alert(
          'Storage Full',
          'Your device is running low on storage. Please free up some space and try again.'
        );
        return;
      }
    } catch (retryError) {
      console.error('Error during storage retry:', retryError);
    }
  }

  /**
   * Validate timer input with enhanced validation
   */
  validateTimerInput(input: { duration?: number; habitId?: string; userId?: string }): {
    isValid: boolean;
    errors: TimerValidationError[];
  } {
    const errors: TimerValidationError[] = [];

    // Validate duration
    if (input.duration !== undefined) {
      const duration = Number(input.duration); // Ensure it's a number
      if (typeof duration !== 'number' || isNaN(duration)) {
        errors.push({
          field: 'general',
          code: 'INVALID_TYPE',
          message: 'Duration must be a valid number',
        });
      } else if (duration < TIMER_CONSTANTS.MIN_DURATION_MINUTES) {
        errors.push({
          field: 'general',
          code: 'DURATION_TOO_SHORT',
          message: `Duration must be at least ${TIMER_CONSTANTS.MIN_DURATION_MINUTES} minute`,
        });
      } else if (duration > TIMER_CONSTANTS.MAX_DURATION_MINUTES) {
        errors.push({
          field: 'general',
          code: 'DURATION_TOO_LONG',
          message: `Duration must be no more than ${TIMER_CONSTANTS.MAX_DURATION_MINUTES / 60} hours`,
        });
      }
    }

    // Validate habit ID
    if (input.habitId !== undefined) {
      if (
        !input.habitId ||
        typeof input.habitId !== 'string' ||
        input.habitId.trim().length === 0
      ) {
        errors.push({
          field: 'general',
          code: 'INVALID_HABIT_ID',
          message: 'Valid habit ID is required',
        });
      }
    }

    // Validate user ID
    if (input.userId !== undefined) {
      if (!input.userId || typeof input.userId !== 'string' || input.userId.trim().length === 0) {
        errors.push({
          field: 'general',
          code: 'INVALID_USER_ID',
          message: 'Valid user ID is required',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate timer state consistency
   */
  validateTimerState(state: Partial<TimerState>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!state.habitId) {
      errors.push('Timer state must have a habit ID');
    }

    if (typeof state.isActive !== 'boolean') {
      errors.push('Timer state must have a valid isActive flag');
    }

    if (typeof state.isPaused !== 'boolean') {
      errors.push('Timer state must have a valid isPaused flag');
    }

    if (state.isActive && !state.startTime) {
      errors.push('Active timer must have a start time');
    }

    if (
      state.remainingTime !== undefined &&
      (typeof state.remainingTime !== 'number' || state.remainingTime < 0)
    ) {
      errors.push('Remaining time must be a non-negative number');
    }

    if (
      state.progress !== undefined &&
      (typeof state.progress !== 'number' || state.progress < 0 || state.progress > 1)
    ) {
      errors.push('Progress must be a number between 0 and 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Register error callback
   */
  onError(errorType: TimerError, callback: (error: EnhancedTimerError) => void): void {
    if (!this.errorCallbacks.has(errorType)) {
      this.errorCallbacks.set(errorType, []);
    }
    this.errorCallbacks.get(errorType)!.push(callback);
  }

  /**
   * Execute error callbacks
   */
  private executeErrorCallbacks(error: EnhancedTimerError): void {
    const callbacks = this.errorCallbacks.get(error.code);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(error);
        } catch (callbackError) {
          console.error('Error in timer error callback:', callbackError);
        }
      });
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(): EnhancedTimerError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.retryAttempts.clear();
  }

  /**
   * Get network state
   */
  private async getNetworkState(): Promise<{ isConnected: boolean; type?: string }> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return {
        isConnected: networkState.isConnected ?? false,
        type: networkState.type,
      };
    } catch (error) {
      console.error('Error getting network state:', error);
      return { isConnected: false };
    }
  }

  /**
   * Get storage information
   */
  private async getStorageInfo(): Promise<{ availableSpace: number; totalSpace: number }> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use a library like react-native-device-info
      const keys = await AsyncStorage.getAllKeys();
      const estimatedUsage = keys.length * 1024; // Rough estimate

      return {
        availableSpace: 100 * 1024 * 1024 - estimatedUsage, // Assume 100MB available
        totalSpace: 100 * 1024 * 1024,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        availableSpace: 0,
        totalSpace: 0,
      };
    }
  }

  /**
   * Log error for debugging
   */
  private logError(error: EnhancedTimerError): void {
    const logData = {
      timestamp: error.timestamp?.toISOString() || new Date().toISOString(),
      code: error.code,
      severity: error.severity,
      category: error.category,
      habitId: error.habitId,
      operation: error.context?.operation,
      message: error.technicalMessage,
      recoverable: error.recoverable,
      retryable: error.retryable,
    };

    console.error('Timer Error:', JSON.stringify(logData, null, 2));
  }

  /**
   * Trim error history to prevent memory issues
   */
  private trimErrorHistory(): void {
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-25); // Keep last 25 errors
    }
  }
}

// Export singleton instance
export const timerErrorHandler = TimerErrorHandler.getInstance();

// Export utility functions
export const timerErrorUtils = {
  /**
   * Create user-friendly error message
   */
  createUserMessage: (error: TimerError, context?: string): string => {
    const baseMessage = USER_FRIENDLY_MESSAGES[error];
    return context ? `${baseMessage} (${context})` : baseMessage;
  },

  /**
   * Check if error is recoverable
   */
  isRecoverable: (error: TimerError): boolean => {
    return ERROR_CONFIG[error]?.recoverable ?? false;
  },

  /**
   * Check if error is retryable
   */
  isRetryable: (error: TimerError): boolean => {
    return ERROR_CONFIG[error]?.retryable ?? false;
  },

  /**
   * Get error severity
   */
  getSeverity: (error: TimerError): TimerErrorSeverity => {
    return ERROR_CONFIG[error]?.severity ?? TimerErrorSeverity.MEDIUM;
  },

  /**
   * Get recovery actions
   */
  getRecoveryActions: (error: TimerError): string[] => {
    return ERROR_CONFIG[error]?.recoveryActions ?? ['Try again later'];
  },
};

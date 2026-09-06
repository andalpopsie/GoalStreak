// Timer validation utilities for GoalStreak
import {
  TimerConfig,
  TimerConfigForm,
  TimerValidationResult,
  TimerValidationError,
  TimerError,
} from '../types/timer';
import { TIMER_CONSTANTS } from '../constants/timer';

/**
 * Validates timer configuration data
 */
export const validateTimerConfig = (config: Partial<TimerConfig>): TimerValidationResult => {
  const errors: TimerValidationError[] = [];

  // Validate duration
  if (config.durationMinutes !== undefined) {
    if (typeof config.durationMinutes !== 'number' || isNaN(config.durationMinutes)) {
      errors.push({
        field: 'durationMinutes',
        code: 'INVALID_TYPE',
        message: 'Duration must be a valid number',
      });
    } else if (config.durationMinutes < TIMER_CONSTANTS.MIN_DURATION_MINUTES) {
      errors.push({
        field: 'durationMinutes',
        code: 'DURATION_TOO_SHORT',
        message: `Duration must be at least ${TIMER_CONSTANTS.MIN_DURATION_MINUTES} minute`,
      });
    } else if (config.durationMinutes > TIMER_CONSTANTS.MAX_DURATION_MINUTES) {
      errors.push({
        field: 'durationMinutes',
        code: 'DURATION_TOO_LONG',
        message: `Duration must be no more than ${TIMER_CONSTANTS.MAX_DURATION_MINUTES / 60} hours`,
      });
    }
  }

  // Validate enabled flag
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
    errors.push({
      field: 'enabled',
      code: 'INVALID_TYPE',
      message: 'Enabled must be a boolean value',
    });
  }

  // Validate autoComplete flag
  if (config.autoComplete !== undefined && typeof config.autoComplete !== 'boolean') {
    errors.push({
      field: 'autoComplete',
      code: 'INVALID_TYPE',
      message: 'AutoComplete must be a boolean value',
    });
  }

  // Create sanitized data
  const sanitizedData: Partial<TimerConfig> = {};

  if (config.enabled !== undefined) {
    sanitizedData.enabled = Boolean(config.enabled);
  }

  if (config.durationMinutes !== undefined && !isNaN(config.durationMinutes)) {
    // Clamp duration to valid range
    sanitizedData.durationMinutes = Math.max(
      TIMER_CONSTANTS.MIN_DURATION_MINUTES,
      Math.min(TIMER_CONSTANTS.MAX_DURATION_MINUTES, Math.floor(config.durationMinutes))
    );
  }

  if (config.autoComplete !== undefined) {
    sanitizedData.autoComplete = Boolean(config.autoComplete);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
};

/**
 * Validates timer form data and converts to TimerConfig
 */
export const validateTimerForm = (form: TimerConfigForm): TimerValidationResult => {
  const errors: TimerValidationError[] = [];

  // Validate hours
  if (typeof form.hours !== 'number' || isNaN(form.hours) || form.hours < 0 || form.hours > 23) {
    errors.push({
      field: 'general',
      code: 'INVALID_HOURS',
      message: 'Hours must be between 0 and 23',
    });
  }

  // Validate minutes
  if (
    typeof form.minutes !== 'number' ||
    isNaN(form.minutes) ||
    form.minutes < 0 ||
    form.minutes > 59
  ) {
    errors.push({
      field: 'general',
      code: 'INVALID_MINUTES',
      message: 'Minutes must be between 0 and 59',
    });
  }

  // Calculate total duration
  const totalMinutes = form.hours * 60 + form.minutes;

  // Validate total duration
  if (totalMinutes < TIMER_CONSTANTS.MIN_DURATION_MINUTES) {
    errors.push({
      field: 'general',
      code: 'DURATION_TOO_SHORT',
      message: `Timer must be at least ${TIMER_CONSTANTS.MIN_DURATION_MINUTES} minute`,
    });
  }

  if (totalMinutes > TIMER_CONSTANTS.MAX_DURATION_MINUTES) {
    errors.push({
      field: 'general',
      code: 'DURATION_TOO_LONG',
      message: `Timer must be no more than ${TIMER_CONSTANTS.MAX_DURATION_MINUTES / 60} hours`,
    });
  }

  // Create sanitized TimerConfig
  const sanitizedData: Partial<TimerConfig> = {
    enabled: Boolean(form.enabled),
    durationMinutes: totalMinutes,
    autoComplete: Boolean(form.autoComplete),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
};

/**
 * Converts TimerConfig to TimerConfigForm for editing
 */
export const timerConfigToForm = (config: TimerConfig): TimerConfigForm => {
  const hours = Math.floor(config.durationMinutes / 60);
  const minutes = config.durationMinutes % 60;

  return {
    enabled: config.enabled,
    hours,
    minutes,
    autoComplete: config.autoComplete,
  };
};

/**
 * Validates if a timer duration is within suggested increments
 */
export const isSuggestedIncrement = (minutes: number): boolean => {
  return (TIMER_CONSTANTS.ALLOWED_INCREMENTS as readonly number[]).includes(minutes);
};

/**
 * Gets the nearest suggested increment for a given duration
 */
export const getNearestSuggestedIncrement = (minutes: number): number => {
  const increments = TIMER_CONSTANTS.ALLOWED_INCREMENTS;

  // Find the closest increment
  let closest: number = increments[0];
  let minDiff = Math.abs(minutes - closest);

  for (const increment of increments) {
    const diff = Math.abs(minutes - increment);
    if (diff < minDiff) {
      minDiff = diff;
      closest = increment;
    }
  }

  return closest;
};

/**
 * Validates timer state for consistency with enhanced edge case handling
 */
export const validateTimerState = (state: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Null/undefined check
  if (!state || typeof state !== 'object') {
    errors.push('Timer state must be a valid object');
    return { isValid: false, errors };
  }

  // Habit ID validation
  if (!state.habitId || typeof state.habitId !== 'string' || state.habitId.trim().length === 0) {
    errors.push('Timer state must have a valid habitId');
  }

  // Boolean flags validation
  if (typeof state.isActive !== 'boolean') {
    errors.push('Timer state must have a valid isActive boolean');
  }

  if (typeof state.isPaused !== 'boolean') {
    errors.push('Timer state must have a valid isPaused boolean');
  }

  // Logical state validation
  if (state.isActive === false && state.isPaused === true) {
    errors.push('Timer cannot be paused if it is not active');
  }

  // Start time validation
  if (state.isActive && !state.startTime) {
    errors.push('Active timer must have a startTime');
  }

  if (state.startTime) {
    const startTime = state.startTime instanceof Date ? state.startTime : new Date(state.startTime);
    if (isNaN(startTime.getTime())) {
      errors.push('Timer startTime must be a valid Date or ISO string');
    } else if (startTime > new Date()) {
      errors.push('Timer startTime cannot be in the future');
    }
  }

  // Paused time validation
  if (typeof state.pausedTime !== 'number' || state.pausedTime < 0) {
    errors.push('Timer pausedTime must be a non-negative number');
  } else if (state.pausedTime > 24 * 60 * 60 * 1000) {
    // More than 24 hours
    errors.push('Timer pausedTime cannot exceed 24 hours');
  }

  // Remaining time validation
  if (typeof state.remainingTime !== 'number' || state.remainingTime < 0) {
    errors.push('Timer remainingTime must be a non-negative number');
  } else if (state.remainingTime > TIMER_CONSTANTS.MAX_DURATION_MINUTES * 60 * 1000) {
    errors.push(
      `Timer remainingTime cannot exceed ${TIMER_CONSTANTS.MAX_DURATION_MINUTES / 60} hours`
    );
  }

  // Progress validation
  if (typeof state.progress !== 'number' || state.progress < 0 || state.progress > 1) {
    errors.push('Timer progress must be a number between 0 and 1');
  }

  // Last update validation
  if (state.lastUpdate) {
    const lastUpdate =
      state.lastUpdate instanceof Date ? state.lastUpdate : new Date(state.lastUpdate);
    if (isNaN(lastUpdate.getTime())) {
      errors.push('Timer lastUpdate must be a valid Date or ISO string');
    }
  }

  // Cross-field validation
  if (state.isActive && state.remainingTime === 0 && state.progress < 1) {
    errors.push('Timer with zero remaining time should have progress of 1');
  }

  if (state.progress === 1 && state.remainingTime > 0) {
    errors.push('Completed timer (progress = 1) should have zero remaining time');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitizes timer duration input
 */
export const sanitizeTimerDuration = (input: string | number): number => {
  let duration: number;

  if (typeof input === 'string') {
    duration = parseInt(input, 10);
  } else {
    duration = input;
  }

  // Handle invalid numbers
  if (isNaN(duration) || duration < 0) {
    return TIMER_CONSTANTS.DEFAULT_DURATION_MINUTES;
  }

  // Clamp to valid range
  return Math.max(
    TIMER_CONSTANTS.MIN_DURATION_MINUTES,
    Math.min(TIMER_CONSTANTS.MAX_DURATION_MINUTES, Math.floor(duration))
  );
};

/**
 * Formats timer duration for display
 */
export const formatTimerDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Formats remaining time for display (MM:SS or HH:MM:SS)
 */
export const formatRemainingTime = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

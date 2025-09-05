// Timer constants for GoalStreak
import { TimerError, TimerValidationRules } from '../types/timer';

// Core Timer Constants
export const TIMER_CONSTANTS = {
  // Duration limits
  MIN_DURATION_MINUTES: 1,
  MAX_DURATION_MINUTES: 24 * 60, // 24 hours
  DEFAULT_DURATION_MINUTES: 25, // Pomodoro technique default
  
  // Update intervals
  PROGRESS_UPDATE_INTERVAL: 100, // Update every 100ms for smooth animation
  BACKGROUND_SYNC_INTERVAL: 5000, // Sync every 5 seconds when backgrounded
  PERSISTENCE_INTERVAL: 1000, // Save state every second
  
  // Limits
  MAX_CONCURRENT_TIMERS: 3, // Maximum number of concurrent active timers
  
  // Notifications
  NOTIFICATION_PROGRESS_THRESHOLD: 0.75, // Send notification at 75% completion
  
  // Suggested increments for timer duration picker
  ALLOWED_INCREMENTS: [1, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120], // Minutes
  
  // Animation and UI
  PROGRESS_RING_ANIMATION_DURATION: 300, // Animation duration in ms
  TIMER_RING_STROKE_WIDTH: 6,
  TIMER_RING_SIZE_OFFSET: 20, // Offset from habit circle
  
  // Colors (matching design system)
  COLORS: {
    INACTIVE: '#E8E8E8', // Light gray for inactive timer
    ACTIVE: '#FF7F3E', // Energetic Orange for active timer
    COMPLETED: '#37B5B6', // Teal Green for completed timer
    PAUSED: '#80C4E9', // Soft Blue for paused timer
  },
} as const;

// Timer Validation Rules
export const TIMER_VALIDATION_RULES: TimerValidationRules = {
  minDurationMinutes: TIMER_CONSTANTS.MIN_DURATION_MINUTES,
  maxDurationMinutes: TIMER_CONSTANTS.MAX_DURATION_MINUTES,
  allowedIncrements: TIMER_CONSTANTS.ALLOWED_INCREMENTS,
  maxConcurrentTimers: TIMER_CONSTANTS.MAX_CONCURRENT_TIMERS,
};

// Timer Error Messages
export const TIMER_ERROR_MESSAGES: Record<TimerError, string> = {
  [TimerError.INVALID_DURATION]: `Timer duration must be between ${TIMER_CONSTANTS.MIN_DURATION_MINUTES} minute and ${TIMER_CONSTANTS.MAX_DURATION_MINUTES / 60} hours`,
  [TimerError.TIMER_ALREADY_ACTIVE]: 'A timer is already running for this habit',
  [TimerError.TIMER_NOT_FOUND]: 'Timer not found for this habit',
  [TimerError.TIMER_NOT_ACTIVE]: 'No active timer found for this habit',
  [TimerError.BACKGROUND_SYNC_FAILED]: 'Timer data will sync when connection is restored',
  [TimerError.NOTIFICATION_PERMISSION_DENIED]: 'Enable notifications to receive timer alerts',
  [TimerError.STORAGE_QUOTA_EXCEEDED]: 'Storage full. Some timer data may not be saved',
  [TimerError.MAX_CONCURRENT_TIMERS_EXCEEDED]: `Maximum number of concurrent timers (${TIMER_CONSTANTS.MAX_CONCURRENT_TIMERS}) reached`,
  [TimerError.TIMER_PERSISTENCE_FAILED]: 'Failed to save timer state. Progress may be lost',
  [TimerError.INVALID_TIMER_STATE]: 'Timer is in an invalid state. Please reset and try again',
};

// AsyncStorage Keys
export const TIMER_STORAGE_KEYS = {
  ACTIVE_TIMERS: '@goalstreak/active_timers',
  TIMER_SESSIONS: '@goalstreak/timer_sessions',
  TIMER_PREFERENCES: '@goalstreak/timer_preferences',
  TIMER_HISTORY: '@goalstreak/timer_history',
} as const;

// Timer Status Constants
export const TIMER_STATUS = {
  IDLE: 'idle',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
} as const;

// Timer Event Types for Analytics
export const TIMER_EVENTS = {
  STARTED: 'timer_started',
  PAUSED: 'timer_paused',
  RESUMED: 'timer_resumed',
  RESET: 'timer_reset',
  COMPLETED: 'timer_completed',
  CANCELLED: 'timer_cancelled',
  BACKGROUND_SYNC: 'timer_background_sync',
  NOTIFICATION_SENT: 'timer_notification_sent',
  ERROR_OCCURRED: 'timer_error_occurred',
} as const;

// Default Timer Preferences
export const DEFAULT_TIMER_PREFERENCES = {
  defaultDuration: TIMER_CONSTANTS.DEFAULT_DURATION_MINUTES,
  enableNotifications: true,
  enableProgressNotifications: true,
  enableHapticFeedback: true,
  soundEnabled: true,
  autoStartNext: false,
} as const;

// Timer Notification Configuration
export const TIMER_NOTIFICATION_CONFIG = {
  COMPLETION_NOTIFICATION_ID: 'timer_completion',
  PROGRESS_NOTIFICATION_ID: 'timer_progress',
  REMINDER_NOTIFICATION_ID: 'timer_reminder',
  
  // Notification channels (Android)
  CHANNEL_ID: 'timer_notifications',
  CHANNEL_NAME: 'Timer Notifications',
  CHANNEL_DESCRIPTION: 'Notifications for habit timer progress and completion',
  
  // Notification priorities
  PRIORITY_HIGH: 'high',
  PRIORITY_DEFAULT: 'default',
  PRIORITY_LOW: 'low',
} as const;

// Timer Performance Targets
export const TIMER_PERFORMANCE_TARGETS = {
  MAX_MEMORY_USAGE_MB: 10, // Maximum memory usage for timer functionality
  TARGET_FPS: 60, // Target frame rate for animations
  MAX_UPDATE_LATENCY_MS: 50, // Maximum latency for timer updates
  BACKGROUND_BATTERY_DRAIN_PERCENT: 1, // Maximum additional battery drain per hour
} as const;

// Timer Accessibility
export const TIMER_ACCESSIBILITY = {
  LABELS: {
    START_TIMER: 'Start timer',
    PAUSE_TIMER: 'Pause timer',
    RESUME_TIMER: 'Resume timer',
    RESET_TIMER: 'Reset timer',
    TIMER_PROGRESS: 'Timer progress',
    TIME_REMAINING: 'Time remaining',
    TIMER_COMPLETED: 'Timer completed',
  },
  
  ANNOUNCEMENTS: {
    TIMER_STARTED: 'Timer started',
    TIMER_PAUSED: 'Timer paused',
    TIMER_RESUMED: 'Timer resumed',
    TIMER_RESET: 'Timer reset',
    TIMER_COMPLETED: 'Timer completed',
    PROGRESS_UPDATE: 'Timer progress: {percentage}% complete',
    TIME_REMAINING: '{time} remaining',
  },
  
  HAPTIC_PATTERNS: {
    TIMER_START: 'light',
    TIMER_PAUSE: 'medium',
    TIMER_COMPLETE: 'heavy',
    PROGRESS_MILESTONE: 'light', // At 25%, 50%, 75%
  },
} as const;

// Timer Design System Integration
export const TIMER_DESIGN = {
  // Progress ring specifications
  PROGRESS_RING: {
    STROKE_WIDTH: 6,
    STROKE_LINECAP: 'round' as const,
    SHADOW_COLOR: 'rgba(0, 27, 183, 0.1)',
    SHADOW_OFFSET: { width: 0, height: 2 },
    SHADOW_RADIUS: 4,
  },
  
  // Timer display
  TIMER_DISPLAY: {
    FONT_FAMILY: 'Montserrat_600SemiBold',
    FONT_SIZE: 14,
    COLOR: '#001BB7', // Deep Blue
    TEXT_ALIGN: 'center' as const,
    MARGIN_TOP: 4,
  },
  
  // Control buttons
  CONTROL_BUTTONS: {
    SIZE: 44,
    BORDER_RADIUS: 22,
    MARGIN_HORIZONTAL: 8,
    ELEVATION: 2, // Android shadow
    SHADOW_COLOR: 'rgba(0, 0, 0, 0.1)', // iOS shadow
    SHADOW_OFFSET: { width: 0, height: 2 },
    SHADOW_RADIUS: 4,
  },
  
  // Animation curves
  ANIMATIONS: {
    PROGRESS_UPDATE: 'easeInOut' as const,
    STATE_TRANSITION: 'spring' as const,
    COLOR_TRANSITION: 'linear' as const,
  },
} as const;
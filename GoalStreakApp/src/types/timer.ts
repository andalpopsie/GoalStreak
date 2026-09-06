// Timer-specific type definitions for GoalStreak
// This file contains all timer-related types, interfaces, and enums

// Core Timer Configuration
export interface TimerConfig {
  enabled: boolean;
  durationMinutes: number; // Total duration in minutes (1-1440 for 1 min to 24 hours)
  autoComplete: boolean; // Auto-complete habit when timer finishes
  createdAt?: Date;
  updatedAt?: Date;
}

// Timer Runtime State
export interface TimerState {
  habitId: string;
  isActive: boolean;
  isPaused: boolean;
  startTime: Date | null;
  pausedTime: number; // Accumulated paused time in milliseconds
  remainingTime: number; // Remaining time in milliseconds
  progress: number; // Progress value between 0 and 1
  lastUpdate: Date; // Last time the timer was updated
  originalDuration: number; // Original timer duration in milliseconds (for calculations)
}

// Timer Session for tracking and analytics
export interface TimerSession {
  id: string;
  habitId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  targetDuration: number; // Original timer duration in minutes
  actualDuration: number; // Time actually spent in minutes
  pausedDuration: number; // Total time paused in minutes
  completed: boolean;
  completionMethod: 'timer' | 'manual'; // How the habit was completed
  createdAt: Date;
}

// Timer Validation and Configuration
export interface TimerValidationRules {
  minDurationMinutes: number; // Minimum 1 minute
  maxDurationMinutes: number; // Maximum 24 hours (1440 minutes)
  allowedIncrements: readonly number[]; // Suggested minute increments [1, 5, 10, 15, 30, 45, 60]
  maxConcurrentTimers: number; // Maximum number of concurrent active timers
}

// User Timer Preferences
export interface TimerPreferences {
  userId: string;
  defaultDuration: number; // Default timer duration in minutes
  enableNotifications: boolean;
  enableProgressNotifications: boolean; // Notifications at 75% completion
  enableHapticFeedback: boolean;
  soundEnabled: boolean;
  autoStartNext: boolean; // Auto-start next timer in sequence
  updatedAt: Date;
}

// Timer Error Handling
export enum TimerError {
  INVALID_DURATION = 'INVALID_DURATION',
  TIMER_ALREADY_ACTIVE = 'TIMER_ALREADY_ACTIVE',
  TIMER_NOT_FOUND = 'TIMER_NOT_FOUND',
  TIMER_NOT_ACTIVE = 'TIMER_NOT_ACTIVE',
  BACKGROUND_SYNC_FAILED = 'BACKGROUND_SYNC_FAILED',
  NOTIFICATION_PERMISSION_DENIED = 'NOTIFICATION_PERMISSION_DENIED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  MAX_CONCURRENT_TIMERS_EXCEEDED = 'MAX_CONCURRENT_TIMERS_EXCEEDED',
  TIMER_PERSISTENCE_FAILED = 'TIMER_PERSISTENCE_FAILED',
  INVALID_TIMER_STATE = 'INVALID_TIMER_STATE',
}

export interface TimerErrorDetails {
  code: TimerError;
  message: string;
  habitId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  timestamp: Date;
}

// Timer Validation
export interface TimerValidationResult {
  isValid: boolean;
  errors: TimerValidationError[];
  sanitizedData?: Partial<TimerConfig>;
}

export interface TimerValidationError {
  field: keyof TimerConfig | 'general';
  code: string;
  message: string;
}

// Timer Events for Analytics
export interface TimerEvent {
  type: TimerEventType;
  habitId: string;
  sessionId?: string;
  userId: string;
  timestamp: Date;
  data?: Record<string, any>;
}

export type TimerEventType =
  | 'timer_started'
  | 'timer_paused'
  | 'timer_resumed'
  | 'timer_reset'
  | 'timer_completed'
  | 'timer_cancelled'
  | 'timer_background_sync'
  | 'timer_notification_sent'
  | 'timer_error_occurred';

// Timer Storage and Persistence
export interface StoredTimerState {
  habitId: string;
  startTime: string; // ISO string for serialization
  pausedTime: number;
  targetDuration: number;
  lastUpdate: string; // ISO string
  isActive: boolean;
  isPaused: boolean;
}

export const TimerStorageKeys = {
  ACTIVE_TIMERS: '@goalstreak/active_timers',
  TIMER_SESSIONS: '@goalstreak/timer_sessions',
  TIMER_PREFERENCES: '@goalstreak/timer_preferences',
} as const;

// Timer Form Types
export interface TimerConfigForm {
  enabled: boolean;
  hours: number; // Hours component (0-23)
  minutes: number; // Minutes component (0-59)
  autoComplete: boolean;
}

// Timer Component Props
export interface TimerControlsProps {
  timerState: TimerState | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onComplete?: () => void;
  compact?: boolean; // For different display contexts
  disabled?: boolean;
}

// Note: Habit interface will be imported from main types when needed
export interface TimerProgressRingProps {
  habit: {
    id: string;
    name: string;
    timer?: TimerConfig;
  };
  timerState: TimerState | null;
  size: number;
  strokeWidth: number;
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerReset: () => void;
  onTimerComplete: () => void;
}

export interface TimerConfigModalProps {
  habit?: {
    id: string;
    name: string;
    timer?: TimerConfig;
  };
  isVisible: boolean;
  initialConfig?: TimerConfig;
  onSave: (timerConfig: TimerConfig) => void;
  onCancel: () => void;
}

// Timer Context State Management
export interface TimerContextState {
  activeTimers: Record<string, TimerState>; // habitId -> TimerState
  timerSessions: TimerSession[];
  preferences: TimerPreferences | null;
  isLoading: boolean;
  error: TimerErrorDetails | null;
}

export interface TimerContextActions {
  startTimer: (habitId: string, duration: number) => Promise<void>;
  pauseTimer: (habitId: string) => Promise<void>;
  resumeTimer: (habitId: string) => Promise<void>;
  resetTimer: (habitId: string) => Promise<void>;
  completeTimer: (habitId: string) => Promise<void>;
  updateTimerProgress: (habitId: string) => void;
  loadTimerState: () => Promise<void>;
  saveTimerState: () => Promise<void>;
  clearError: () => void;
}

// Timer Utility Types
export type TimerStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface TimerCalculations {
  totalDuration: number; // Total duration in milliseconds
  elapsedTime: number; // Time elapsed in milliseconds
  remainingTime: number; // Time remaining in milliseconds
  progress: number; // Progress as decimal (0-1)
  progressPercentage: number; // Progress as percentage (0-100)
}

// Timer Notification Types
export interface TimerNotification {
  id: string;
  habitId: string;
  type: 'progress' | 'completion' | 'reminder';
  title: string;
  body: string;
  scheduledTime: Date;
  data?: Record<string, any>;
}

export interface TimerNotificationConfig {
  enableCompletionNotifications: boolean;
  enableProgressNotifications: boolean;
  progressThreshold: number; // 0-1, when to send progress notification
  enableReminderNotifications: boolean;
  reminderInterval: number; // Minutes before timer ends to send reminder
}

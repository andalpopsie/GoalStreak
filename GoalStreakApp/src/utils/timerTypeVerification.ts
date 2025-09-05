// Timer type verification script
// This file demonstrates that all timer types work correctly

import {
  TimerConfig,
  TimerState,
  TimerSession,
  TimerConfigForm,
  TimerError,
  TimerValidationResult
} from '../types/timer';
import {
  validateTimerConfig,
  validateTimerForm,
  timerConfigToForm,
  formatTimerDuration,
  formatRemainingTime
} from './timerValidation';
import { TIMER_CONSTANTS } from '../constants/timer';

// Verify TimerConfig interface
const sampleTimerConfig: TimerConfig = {
  enabled: true,
  durationMinutes: 25,
  autoComplete: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Verify TimerState interface
const sampleTimerState: TimerState = {
  habitId: 'habit-123',
  isActive: true,
  isPaused: false,
  startTime: new Date(),
  pausedTime: 0,
  remainingTime: 1500000, // 25 minutes in milliseconds
  progress: 0.0,
  lastUpdate: new Date()
};

// Verify TimerSession interface
const sampleTimerSession: TimerSession = {
  id: 'session-123',
  habitId: 'habit-123',
  userId: 'user-123',
  startTime: new Date(),
  endTime: new Date(),
  targetDuration: 25,
  actualDuration: 23,
  pausedDuration: 2,
  completed: true,
  completionMethod: 'timer',
  createdAt: new Date()
};

// Verify TimerConfigForm interface
const sampleTimerForm: TimerConfigForm = {
  enabled: true,
  hours: 0,
  minutes: 25,
  autoComplete: true
};

// Verify validation functions work
export const verifyTimerTypes = () => {

  // Test timer config validation
  const configValidation = validateTimerConfig(sampleTimerConfig);

  // Test timer form validation
  const formValidation = validateTimerForm(sampleTimerForm);

  // Test config to form conversion
  const convertedForm = timerConfigToForm(sampleTimerConfig);

  // Test formatting functions
  const durationFormatted = formatTimerDuration(90); // 1h 30m
  const timeFormatted = formatRemainingTime(90000); // 01:30

  // Test constants
    minDuration: TIMER_CONSTANTS.MIN_DURATION_MINUTES,
    maxDuration: TIMER_CONSTANTS.MAX_DURATION_MINUTES,
    defaultDuration: TIMER_CONSTANTS.DEFAULT_DURATION_MINUTES
  });

  // Test error enum
  const errorExample = TimerError.INVALID_DURATION;


  return {
    configValidation,
    formValidation,
    convertedForm,
    durationFormatted,
    timeFormatted,
    constants: TIMER_CONSTANTS,
    sampleConfig: sampleTimerConfig,
    sampleState: sampleTimerState,
    sampleSession: sampleTimerSession
  };
};

// Export sample data for use in other parts of the application
export const SAMPLE_TIMER_DATA = {
  config: sampleTimerConfig,
  state: sampleTimerState,
  session: sampleTimerSession,
  form: sampleTimerForm
};

// Verify enhanced Habit interface with timer
export interface HabitWithTimer {
  id: string;
  userId: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isPublic: boolean;
  timer?: TimerConfig; // Optional timer configuration
  createdAt: Date;
  updatedAt: Date;
}

// Sample habit with timer
const sampleHabitWithTimer: HabitWithTimer = {
  id: 'habit-123',
  userId: 'user-123',
  name: 'Morning Meditation',
  category: 'mindfulness',
  frequency: 'daily',
  isPublic: false,
  timer: sampleTimerConfig,
  createdAt: new Date(),
  updatedAt: new Date()
};


export { sampleHabitWithTimer };
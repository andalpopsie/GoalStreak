// Timer Context - Global timer state management for GoalStreak
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus, DeviceEventEmitter } from 'react-native';
import { 
  TimerState, 
  TimerSession, 
  TimerErrorDetails, 
  TimerEvent,
  TimerContextState, 
  TimerContextActions,
  TimerError
} from '../types/timer';
import { enhancedTimerService } from '../services/firebaseTimerService';
import { backgroundTimerManager } from '../utils/backgroundTimer';

// Timer Context State
interface TimerContextValue extends TimerContextState, TimerContextActions {}

// Timer Actions
type TimerAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: TimerErrorDetails | null }
  | { type: 'SET_ACTIVE_TIMERS'; payload: Record<string, TimerState> }
  | { type: 'UPDATE_TIMER'; payload: { habitId: string; timerState: TimerState } }
  | { type: 'REMOVE_TIMER'; payload: string }
  | { type: 'ADD_SESSION'; payload: TimerSession }
  | { type: 'SET_SESSIONS'; payload: TimerSession[] }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: TimerContextState = {
  activeTimers: {},
  timerSessions: [],
  preferences: null,
  isLoading: false,
  error: null
};

// Timer reducer
function timerReducer(state: TimerContextState, action: TimerAction): TimerContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_ACTIVE_TIMERS':
      return { ...state, activeTimers: action.payload };
    
    case 'UPDATE_TIMER':
      return {
        ...state,
        activeTimers: {
          ...state.activeTimers,
          [action.payload.habitId]: action.payload.timerState
        }
      };
    
    case 'REMOVE_TIMER':
      const { [action.payload]: removed, ...remainingTimers } = state.activeTimers;
      return { ...state, activeTimers: remainingTimers };
    
    case 'ADD_SESSION':
      return {
        ...state,
        timerSessions: [action.payload, ...state.timerSessions]
      };
    
    case 'SET_SESSIONS':
      return { ...state, timerSessions: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Create context
const TimerContext = createContext<TimerContextValue | undefined>(undefined);

// Timer Provider Props
interface TimerProviderProps {
  children: ReactNode;
  userId?: string;
}

// Timer Provider Component
export function TimerProvider({ children, userId }: TimerProviderProps) {
  const [state, dispatch] = useReducer(timerReducer, initialState);

  // Error handler
  const handleError = useCallback((error: any, context?: string) => {
    // Check if this is a Firebase index error (non-critical)
    if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
      console.warn('Firebase index missing (non-critical):', error.message);
      console.warn('Timer functionality will continue to work. Index can be created later.');
      return; // Don't show this error to users
    }
    
    // Check if this is a cleanup operation error (non-critical)
    if (context?.includes('cleanup') || context?.includes('cleaning')) {
      console.warn('Timer cleanup operation failed (non-critical):', error.message);
      return; // Don't show cleanup errors to users
    }
    
    console.error('Timer error:', error, 'Context:', context);
    
    let timerError: TimerErrorDetails;
    
    if (error.name && Object.values(TimerError).includes(error.name)) {
      timerError = {
        code: error.name as TimerError,
        message: error.message,
        habitId: error.habitId,
        context: context ? { context } : undefined,
        timestamp: new Date()
      };
    } else {
      timerError = {
        code: TimerError.INVALID_TIMER_STATE,
        message: 'An unexpected error occurred',
        context: context ? { context, originalError: error.message } : undefined,
        timestamp: new Date()
      };
    }
    
    dispatch({ type: 'SET_ERROR', payload: timerError });
  }, []);

  // Load initial timer state
  const loadTimerState = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Initialize Firebase timer service with user ID
      if (userId) {
        await enhancedTimerService.initialize(userId);
      }
      
      // Get active timers from service
      const activeTimers = enhancedTimerService.getAllActiveTimers();
      const timersMap: Record<string, TimerState> = {};
      
      activeTimers.forEach(timer => {
        timersMap[timer.habitId] = timer;
      });
      
      dispatch({ type: 'SET_ACTIVE_TIMERS', payload: timersMap });
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      handleError(error, 'loadTimerState');
    }
  }, [userId, handleError]);

  // Save timer state
  const saveTimerState = useCallback(async () => {
    try {
      // Timer service handles persistence automatically
      // This is mainly for manual saves if needed
      await new Promise(resolve => setTimeout(resolve, 0)); // Placeholder
    } catch (error) {
      handleError(error, 'saveTimerState');
    }
  }, [handleError]);

  // Start timer
  const startTimer = useCallback(async (habitId: string, duration: number) => {
    if (!userId) {
      handleError(new Error('User not authenticated'), 'startTimer');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      
      const timerState = await enhancedTimerService.startTimer(habitId, duration, userId);
      
      dispatch({ type: 'UPDATE_TIMER', payload: { habitId, timerState } });
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      handleError(error, 'startTimer');
    }
  }, [userId, handleError]);

  // Pause timer
  const pauseTimer = useCallback(async (habitId: string) => {
    if (!userId) {
      handleError(new Error('User not authenticated'), 'pauseTimer');
      return;
    }

    try {
      const timerState = await enhancedTimerService.pauseTimer(habitId, userId);
      dispatch({ type: 'UPDATE_TIMER', payload: { habitId, timerState } });
    } catch (error) {
      handleError(error, 'pauseTimer');
    }
  }, [userId, handleError]);

  // Resume timer
  const resumeTimer = useCallback(async (habitId: string) => {
    if (!userId) {
      handleError(new Error('User not authenticated'), 'resumeTimer');
      return;
    }

    try {
      const timerState = await enhancedTimerService.resumeTimer(habitId, userId);
      dispatch({ type: 'UPDATE_TIMER', payload: { habitId, timerState } });
    } catch (error) {
      handleError(error, 'resumeTimer');
    }
  }, [userId, handleError]);

  // Reset timer
  const resetTimer = useCallback(async (habitId: string) => {
    if (!userId) {
      handleError(new Error('User not authenticated'), 'resetTimer');
      return;
    }

    try {
      await enhancedTimerService.resetTimer(habitId, userId);
      dispatch({ type: 'REMOVE_TIMER', payload: habitId });
    } catch (error) {
      handleError(error, 'resetTimer');
    }
  }, [userId, handleError]);

  // Complete timer
  const completeTimer = useCallback(async (habitId: string) => {
    if (!userId) {
      handleError(new Error('User not authenticated'), 'completeTimer');
      return;
    }

    try {
      const session = await enhancedTimerService.completeTimer(habitId, userId);
      dispatch({ type: 'REMOVE_TIMER', payload: habitId });
      dispatch({ type: 'ADD_SESSION', payload: session });
    } catch (error) {
      handleError(error, 'completeTimer');
    }
  }, [userId, handleError]);

  // Update timer progress (called by UI components)
  const updateTimerProgress = useCallback((habitId: string) => {
    try {
      const timerState = enhancedTimerService.getTimerState(habitId);
      if (timerState) {
        dispatch({ type: 'UPDATE_TIMER', payload: { habitId, timerState } });
      }
    } catch (error) {
      handleError(error, 'updateTimerProgress');
    }
  }, [handleError]);

  // Timer update interval - runs every second to update active timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      Object.keys(state.activeTimers).forEach(habitId => {
        const timer = state.activeTimers[habitId];
        if (timer && timer.isActive && !timer.isPaused) {
          const elapsed = now - timer.startTime.getTime() - timer.pausedTime;
          const remaining = Math.max(0, timer.originalDuration - elapsed);
          const progress = timer.originalDuration > 0 ? (timer.originalDuration - remaining) / timer.originalDuration : 0;
          
          if (remaining <= 0) {
            // Timer completed
            completeTimer(habitId);
          } else {
            // Update timer state
            const updatedTimer = {
              ...timer,
              remainingTime: remaining,
              progress: progress,
              lastUpdate: new Date(now)
            };
            
            dispatch({ 
              type: 'UPDATE_TIMER', 
              payload: { habitId, timerState: updatedTimer } 
            });
          }
        }
      });
    }, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [state.activeTimers, completeTimer]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - handle background timer updates
        try {
          
          // Call the enhanced timer service's foreground handler
          await (enhancedTimerService as any).handleAppForeground?.();
          
          // Refresh timer states
          await loadTimerState();
        } catch (error) {
          console.error('Error handling app foreground:', error);
          // Still try to load timer state even if foreground handling fails
          await loadTimerState();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background - save timer states
        try {
          
          // Call the enhanced timer service's background handler
          await (enhancedTimerService as any).handleAppBackground?.();
        } catch (error) {
          console.error('Error handling app background:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [loadTimerState]);

  // Set up timer event listeners
  useEffect(() => {
    const handleTimerCompleted = async (event: TimerEvent) => {
      
      if (event.data?.autoCompleted) {
        // Remove timer from active timers since it completed
        dispatch({ type: 'REMOVE_TIMER', payload: event.habitId });
        
        // If this completion requires habit completion, handle it directly
        if (event.data?.requiresHabitCompletion && userId) {
          
          try {
            // Use the enhanced timer service to complete both timer and habit
            await enhancedTimerService.completeTimerAndHabit(event.habitId, userId);
          } catch (error) {
            console.error('Error completing habit via timer:', error);
            
            // Still emit the custom event as fallback for the useHabits hook to handle
            const habitCompletionData = {
              habitId: event.habitId,
              completedInBackground: event.data.completedInBackground || event.data.completedWhileClosed,
              completionMethod: 'timer',
              timestamp: event.timestamp,
              error: error.message
            };
            // Use React Native's DeviceEventEmitter instead of window events
            DeviceEventEmitter.emit('timerHabitCompletion', habitCompletionData);
          }
        } else {
          // Emit custom event for habit completion (fallback method)
          const habitCompletionData = {
            habitId: event.habitId,
            completedInBackground: event.data.completedInBackground || event.data.completedWhileClosed,
            completionMethod: 'timer',
            timestamp: event.timestamp
          };
          

          // Use React Native's DeviceEventEmitter instead of window events
          DeviceEventEmitter.emit('timerHabitCompletion', habitCompletionData);
        }
      }
    };

    const handleTimerBackgrounded = (event: TimerEvent) => {
    };

    const handleTimerForegrounded = (event: TimerEvent) => {
      if (event.data?.completedTimers && event.data.completedTimers.length > 0) {
      }
    };

    enhancedTimerService.addEventListener('timer_completed', handleTimerCompleted);
    
    // Listen to background timer manager events
    backgroundTimerManager.addEventListener('timer_backgrounded', handleTimerBackgrounded);
    backgroundTimerManager.addEventListener('timer_foregrounded', handleTimerForegrounded);

    return () => {
      enhancedTimerService.removeEventListener('timer_completed', handleTimerCompleted);
      backgroundTimerManager.removeEventListener('timer_backgrounded', handleTimerBackgrounded);
      backgroundTimerManager.removeEventListener('timer_foregrounded', handleTimerForegrounded);
    };
  }, []);

  // Load initial state on mount
  useEffect(() => {
    loadTimerState();
  }, [loadTimerState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      enhancedTimerService.cleanup();
    };
  }, []);

  // Context value
  const contextValue: TimerContextValue = {
    // State
    activeTimers: state.activeTimers,
    timerSessions: state.timerSessions,
    preferences: state.preferences,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeTimer,
    updateTimerProgress,
    loadTimerState,
    saveTimerState,
    clearError
  };

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
}

// Custom hook to use timer context
export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}

// Hook to get timer state for a specific habit
export function useHabitTimer(habitId: string) {
  const { activeTimers, startTimer, pauseTimer, resumeTimer, resetTimer, completeTimer, updateTimerProgress } = useTimer();
  
  const timerState = activeTimers[habitId] || null;
  const isActive = !!timerState?.isActive;
  const isPaused = !!timerState?.isPaused;
  const isRunning = isActive && !isPaused;

  return {
    timerState,
    isActive,
    isPaused,
    isRunning,
    startTimer: (duration: number) => startTimer(habitId, duration),
    pauseTimer: () => pauseTimer(habitId),
    resumeTimer: () => resumeTimer(habitId),
    resetTimer: () => resetTimer(habitId),
    completeTimer: () => completeTimer(habitId),
    updateProgress: () => updateTimerProgress(habitId)
  };
}

// Hook for timer calculations
export function useTimerCalculations(habitId: string) {
  const { timerState } = useHabitTimer(habitId);
  
  if (!timerState) {
    return null;
  }

  return enhancedTimerService.getTimerCalculations(timerState);
}

export default TimerContext;
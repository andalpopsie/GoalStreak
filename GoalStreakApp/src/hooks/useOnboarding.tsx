import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { trackEvent } from '../services/enhancedAnalyticsService';
import { useAuth } from './useAuth';

interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCompletedOnboarding: boolean;
  selectedHabitTemplates: string[];
  onboardingStep: OnboardingStep;
}

type OnboardingStep = 'welcome' | 'habit_suggestions' | 'notification_setup' | 'completed';

interface OnboardingContextType {
  onboardingState: OnboardingState;
  isOnboardingComplete: boolean;
  isLoading: boolean;
  completeWelcome: () => Promise<void>;
  completeHabitSuggestions: (selectedTemplates: string[]) => Promise<void>;
  completeNotificationSetup: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const defaultOnboardingState: OnboardingState = {
  hasSeenWelcome: false,
  hasCompletedOnboarding: false,
  selectedHabitTemplates: [],
  onboardingStep: 'welcome',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'onboarding_state';
/**
 * OnboardingProvider - Manages user onboarding state and flow
 *
 * Handles the complete onboarding experience including:
 * - Welcome carousel completion
 * - Habit suggestions selection
 * - Onboarding skip functionality
 * - First-time user detection (standard mobile app pattern)
 * - Analytics tracking for onboarding events
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(defaultOnboardingState);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from storage
  useEffect(() => {
    loadOnboardingState();
  }, []);

  // Sync onboarding state with database
  useEffect(() => {
    if (isAuthenticated && user) {
      syncOnboardingWithDatabase();
    }
  }, [isAuthenticated, user]);

  const loadOnboardingState = async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        // Validate the parsed state structure
        if (parsedState && typeof parsedState === 'object') {
          setOnboardingState({ ...defaultOnboardingState, ...parsedState });
        }
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
      // Track storage error for monitoring
      trackEvent('onboarding_storage_error', {
        error_type: 'load_failed',
        user_id: user?.id,
      });
      // Fall back to default state
      setOnboardingState(defaultOnboardingState);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOnboardingState = async (newState: OnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
      setOnboardingState(newState);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      // Still update local state even if storage fails
      setOnboardingState(newState);

      // Track storage error for monitoring
      trackEvent('onboarding_storage_error', {
        error_type: 'save_failed',
        user_id: user?.id,
      });
    }
  };

  const syncOnboardingWithDatabase = async () => {
    if (!user?.id) return;

    try {
      // Check if user has completed onboarding (stored in Firestore)
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userData = userDoc.data();
      const hasCompletedOnboardingInDB = userData?.hasCompletedOnboarding || false;

      // If user has completed onboarding in database, update local state
      if (hasCompletedOnboardingInDB && !onboardingState.hasCompletedOnboarding) {
        console.log('User has completed onboarding in database, updating local state');
        const newState: OnboardingState = {
          ...onboardingState,
          hasSeenWelcome: true,
          hasCompletedOnboarding: true,
          onboardingStep: 'completed',
        };
        await saveOnboardingState(newState);
      } else if (!hasCompletedOnboardingInDB && onboardingState.hasCompletedOnboarding) {
        // If local state says completed but database says not completed, reset to show onboarding
        console.log('Database shows onboarding not completed, resetting local state');
        const newState: OnboardingState = {
          ...defaultOnboardingState,
          hasSeenWelcome: false,
          hasCompletedOnboarding: false,
          onboardingStep: 'welcome',
        };
        await saveOnboardingState(newState);
      }
    } catch (error) {
      console.error('Error syncing onboarding with database:', error);

      // Track sync errors for monitoring
      trackEvent('onboarding_sync_error', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_id: user?.id,
      });

      // If we can't check database, rely on local storage
      // Don't reset state on network errors to avoid disrupting user experience
    }
  };

  const completeWelcome = useCallback(async () => {
    const newState: OnboardingState = {
      ...onboardingState,
      hasSeenWelcome: true,
      onboardingStep: 'habit_suggestions',
    };

    await saveOnboardingState(newState);

    // Track welcome completion
    trackEvent('onboarding_welcome_completed', {
      user_id: user?.id,
      completion_time: new Date().toISOString(),
    });
  }, [onboardingState, user?.id]);

  const completeHabitSuggestions = useCallback(
    async (selectedTemplates: string[]) => {
      const newState: OnboardingState = {
        ...onboardingState,
        selectedHabitTemplates: selectedTemplates,
        onboardingStep: 'notification_setup', // Move to notification setup instead of completed
      };

      await saveOnboardingState(newState);

      // Track habit suggestions completion and overall completion
      const completionTime = new Date().toISOString();
      try {
        await Promise.all([
          trackEvent('onboarding_habits_completed', {
            user_id: user?.id,
            selected_templates: selectedTemplates,
            template_count: selectedTemplates.length,
            completion_time: completionTime,
          }),
          trackEvent('onboarding_completed', {
            user_id: user?.id,
            completion_method: 'with_habits',
            selected_habit_count: selectedTemplates.length,
            completion_time: completionTime,
          }),
        ]);
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    },
    [onboardingState, user?.id]
  );

  const completeNotificationSetup = useCallback(async () => {
    const newState: OnboardingState = {
      ...onboardingState,
      onboardingStep: 'completed',
      hasCompletedOnboarding: true,
    };

    await saveOnboardingState(newState);

    // Save completion status to Firestore (standard mobile app pattern)
    if (user?.id) {
      try {
        await setDoc(
          doc(db, 'users', user.id),
          {
            hasCompletedOnboarding: true,
            onboardingCompletedAt: new Date(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error saving onboarding completion to database:', error);
      }
    }

    // Track notification setup completion
    trackEvent('onboarding_notification_setup_completed', {
      user_id: user?.id,
      completion_time: new Date().toISOString(),
    });
  }, [onboardingState, user?.id]);

  const skipOnboarding = useCallback(async () => {
    const newState: OnboardingState = {
      ...onboardingState,
      hasSeenWelcome: true,
      hasCompletedOnboarding: true,
      onboardingStep: 'completed',
    };

    await saveOnboardingState(newState);

    // Save completion status to Firestore (standard mobile app pattern)
    if (user?.id) {
      try {
        await setDoc(
          doc(db, 'users', user.id),
          {
            hasCompletedOnboarding: true,
            onboardingCompletedAt: new Date(),
            onboardingSkipped: true,
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error saving onboarding skip to database:', error);
      }
    }

    // Track onboarding skip and overall completion
    const completionTime = new Date().toISOString();
    try {
      await Promise.all([
        trackEvent('onboarding_skipped', {
          user_id: user?.id,
          skipped_at_step: onboardingState.onboardingStep,
          completion_time: completionTime,
        }),
        trackEvent('onboarding_completed', {
          user_id: user?.id,
          completion_method: 'skipped',
          completion_time: completionTime,
        }),
      ]);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [onboardingState, user?.id]);

  const resetOnboarding = useCallback(async () => {
    await saveOnboardingState(defaultOnboardingState);

    // Reset completion status in Firestore
    if (user?.id) {
      try {
        await setDoc(
          doc(db, 'users', user.id),
          {
            hasCompletedOnboarding: false,
            onboardingCompletedAt: null,
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error resetting onboarding in database:', error);
      }
    }

    // Track onboarding reset
    trackEvent('onboarding_reset', {
      user_id: user?.id,
      reset_time: new Date().toISOString(),
    });
  }, [user?.id]);

  const isOnboardingComplete = onboardingState.hasCompletedOnboarding;

  const value: OnboardingContextType = {
    onboardingState,
    isOnboardingComplete,
    isLoading,
    completeWelcome,
    completeHabitSuggestions,
    completeNotificationSetup,
    skipOnboarding,
    resetOnboarding,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

/**
 * useOnboarding - Hook to access onboarding state and actions
 *
 * @returns OnboardingContextType with state and methods for managing onboarding flow
 * @throws Error if used outside of OnboardingProvider
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

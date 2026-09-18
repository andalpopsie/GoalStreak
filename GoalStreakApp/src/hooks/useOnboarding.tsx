import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
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
 * AsyncStorage key that records whether the FoundingCelebrationScreen has
 * been shown for a given account. Keyed per-uid so the flag resets correctly
 * if the user signs out and a different account signs in on the same device.
 */
export const foundingCelebrationShownKey = (uid: string) => `founding_celebration_shown_${uid}`;
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

// ---------------------------------------------------------------------------
// Founding Celebration Gate
// ---------------------------------------------------------------------------

/**
 * Outcome returned once the gate resolves. The caller (AppNavigator) should
 * navigate based on this value then never re-render this hook for the same
 * session (the `done` flag prevents repeated checks).
 */
export type FoundingCelebrationOutcome = { show: true; foundingNumber: number } | { show: false };

/**
 * useFoundingCelebrationGate
 *
 * Determines whether the FoundingCelebrationScreen should be shown for the
 * current authenticated user after onboarding completes. Encapsulates:
 *
 * - Per-account AsyncStorage flag so the screen shows at most once (R9.1).
 * - A Firestore `onSnapshot` subscription to `userProfiles/{uid}` with a
 *   bounded 15-second wait (R9.4). If `foundingMember === true` resolves
 *   within that window the outcome is `{ show: true, foundingNumber }`.
 * - If the record resolves `foundingMember === false` or the 15-second
 *   window elapses with no founding record, the outcome is `{ show: false }`
 *   and the normal post-signup flow proceeds (R9.3).
 *
 * The hook is a no-op until `enabled` is `true`; callers should pass
 * `enabled={isAuthenticated && isOnboardingComplete}` so it only activates
 * at the right moment.
 *
 * @param uid     Firebase Auth UID of the current user.
 * @param enabled Start the check only when true.
 */
export function useFoundingCelebrationGate(
  uid: string,
  enabled: boolean
): {
  /** True while the gate is still evaluating (waiting for snapshot / storage). */
  checking: boolean;
  /**
   * Set once the check completes. `null` while still `checking`.
   * Once set it never changes for the lifetime of this hook instance.
   */
  outcome: FoundingCelebrationOutcome | null;
} {
  const [checking, setChecking] = useState(true);
  const [outcome, setOutcome] = useState<FoundingCelebrationOutcome | null>(null);

  // Guard against setState after unmount or after outcome is already resolved.
  const isMountedRef = useRef(true);
  const resolvedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !uid) return;

    let unsubscribe: (() => void) | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const resolve = (result: FoundingCelebrationOutcome) => {
      if (resolvedRef.current || !isMountedRef.current) return;
      resolvedRef.current = true;

      // Clean up listener and timer before updating state.
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      if (unsubscribe !== null) {
        unsubscribe();
        unsubscribe = null;
      }

      setOutcome(result);
      setChecking(false);
    };

    const run = async () => {
      // 1. Check the per-account AsyncStorage flag. If the celebration has
      //    already been shown for this uid, skip to Main immediately.
      try {
        const storageKey = foundingCelebrationShownKey(uid);
        const alreadyShown = await AsyncStorage.getItem(storageKey);
        if (alreadyShown === 'true') {
          resolve({ show: false });
          return;
        }
      } catch (err) {
        // AsyncStorage read failure is non-fatal — treat as "not yet shown"
        // and proceed with the founding check.
        console.warn('[useFoundingCelebrationGate] AsyncStorage read failed:', err);
      }

      // 2. Subscribe to userProfiles/{uid} via onSnapshot.
      //    The Cloud Function may not have written the founding record yet, so
      //    we listen for up to 15 seconds (R9.4).
      const profileRef = doc(db, 'userProfiles', uid);

      unsubscribe = onSnapshot(
        profileRef,
        async (snapshot) => {
          if (resolvedRef.current) return;

          const data = snapshot.data();
          const isFoundingMember: boolean = data?.foundingMember === true;
          const record = data?.foundingRecord;
          const foundingNumber: number | null =
            isFoundingMember && typeof record?.number === 'number' && record.number > 0
              ? record.number
              : null;

          if (isFoundingMember && foundingNumber !== null) {
            // Founding record is confirmed — mark as shown in storage so it
            // never fires again for this account, then resolve.
            try {
              const storageKey = foundingCelebrationShownKey(uid);
              await AsyncStorage.setItem(storageKey, 'true');
            } catch (err) {
              // Storage write failure is non-fatal; the screen will still show
              // this session. The next session may show it again but that is a
              // minor edge case; R9 correctness takes priority over the
              // "at-most-once" storage guarantee.
              console.warn('[useFoundingCelebrationGate] AsyncStorage write failed:', err);
            }

            resolve({ show: true, foundingNumber });
          } else if (snapshot.exists() && !isFoundingMember) {
            // Profile doc exists and explicitly says non-founding — skip (R9.3).
            resolve({ show: false });
          }
          // If the doc doesn't exist yet or foundingMember is not set, keep
          // waiting until the 15s timeout.
        },
        (err) => {
          // Firestore read error — fail safe, skip celebration.
          console.error('[useFoundingCelebrationGate] onSnapshot error:', err);
          resolve({ show: false });
        }
      );

      // 3. 15-second bounded wait (R9.4 / R9.3). After this, proceed normally.
      timeoutHandle = setTimeout(() => {
        if (!resolvedRef.current) {
          resolve({ show: false });
        }
      }, 15_000);
    };

    run();

    return () => {
      // Cleanup on unmount / uid change.
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      if (unsubscribe !== null) unsubscribe();
    };
  }, [uid, enabled]);

  return { checking, outcome };
}

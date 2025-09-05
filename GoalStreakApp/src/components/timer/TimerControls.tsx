import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { TimerState } from '../../types/timer';
import { TIMER_ACCESSIBILITY } from '../../constants/timer';

interface TimerControlsProps {
  timerState: TimerState | null;
  onStart: () => Promise<void> | void;
  onPause: () => Promise<void> | void;
  onResume: () => Promise<void> | void;
  onReset: () => Promise<void> | void;
  onComplete?: () => Promise<void> | void;
  compact?: boolean; // For different display contexts
  disabled?: boolean;
  showErrorFeedback?: boolean; // Whether to show visual error feedback
}

export default function TimerControls({
  timerState,
  onStart,
  onPause,
  onResume,
  onReset,
  onComplete,
  compact = false,
  disabled = false,
}: TimerControlsProps) {
  
  // Trigger haptic feedback for timer interactions
  const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    const hapticStyle = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    
    Haptics.impactAsync(hapticStyle[intensity]);
  };

  // Handle start timer action with error handling
  const handleStart = async () => {
    if (disabled) return;
    
    try {
      triggerHapticFeedback('light');
      await onStart();
    } catch (error) {
      console.error('Error starting timer:', error);
      triggerHapticFeedback('heavy'); // Error feedback
      // Error handling is done by the parent component/service
    }
  };

  // Handle pause timer action with error handling
  const handlePause = async () => {
    if (disabled) return;
    
    try {
      triggerHapticFeedback('medium');
      await onPause();
    } catch (error) {
      console.error('Error pausing timer:', error);
      triggerHapticFeedback('heavy'); // Error feedback
      // Error handling is done by the parent component/service
    }
  };

  // Handle resume timer action with error handling
  const handleResume = async () => {
    if (disabled) return;
    
    try {
      triggerHapticFeedback('light');
      await onResume();
    } catch (error) {
      console.error('Error resuming timer:', error);
      triggerHapticFeedback('heavy'); // Error feedback
      // Error handling is done by the parent component/service
    }
  };

  // Handle reset timer action with error handling
  const handleReset = async () => {
    if (disabled) return;
    
    try {
      triggerHapticFeedback('medium');
      await onReset();
    } catch (error) {
      console.error('Error resetting timer:', error);
      triggerHapticFeedback('heavy'); // Error feedback
      // Error handling is done by the parent component/service
    }
  };

  // Handle complete timer action with error handling
  const handleComplete = async () => {
    if (disabled || !onComplete) return;
    
    try {
      triggerHapticFeedback('heavy');
      await onComplete();
    } catch (error) {
      console.error('Error completing timer:', error);
      triggerHapticFeedback('heavy'); // Error feedback
      // Error handling is done by the parent component/service
    }
  };

  // Determine which buttons to show based on timer state
  const getButtonConfig = () => {
    if (!timerState) {
      // No active timer - show start button
      return {
        primary: {
          icon: 'play' as const,
          onPress: handleStart,
          accessibilityLabel: TIMER_ACCESSIBILITY.LABELS.START_TIMER,
          color: Colors.accent1, // Orange for start
        },
        secondary: null,
      };
    }

    // Extract values to avoid worklet issues
    const isActive = timerState.isActive;
    const isPaused = timerState.isPaused;

    if (isActive && !isPaused) {
      // Timer is running - show pause and reset buttons
      return {
        primary: {
          icon: 'pause' as const,
          onPress: handlePause,
          accessibilityLabel: TIMER_ACCESSIBILITY.LABELS.PAUSE_TIMER,
          color: Colors.accent2, // Dark blue for pause
        },
        secondary: {
          icon: 'stop' as const,
          onPress: handleReset,
          accessibilityLabel: TIMER_ACCESSIBILITY.LABELS.RESET_TIMER,
          color: Colors.gray.dark, // Gray for reset
        },
      };
    }

    if (isPaused) {
      // Timer is paused - show resume and reset buttons
      return {
        primary: {
          icon: 'play' as const,
          onPress: handleResume,
          accessibilityLabel: TIMER_ACCESSIBILITY.LABELS.RESUME_TIMER,
          color: Colors.accent1, // Orange for resume
        },
        secondary: {
          icon: 'stop' as const,
          onPress: handleReset,
          accessibilityLabel: TIMER_ACCESSIBILITY.LABELS.RESET_TIMER,
          color: Colors.gray.dark, // Gray for reset
        },
      };
    }

    // Timer completed - show complete and reset buttons (if onComplete provided)
    if (timerState.progress >= 1) {
      return {
        primary: onComplete ? {
          icon: 'checkmark-circle' as const,
          onPress: handleComplete,
          accessibilityLabel: 'Complete habit',
          color: Colors.accent3, // Teal for complete
        } : {
          icon: 'refresh' as const,
          onPress: handleReset,
          accessibilityLabel: TIMER_ACCESSIBILITY.LABELS.RESET_TIMER,
          color: Colors.accent1, // Orange for restart
        },
        secondary: onComplete ? {
          icon: 'refresh' as const,
          onPress: handleReset,
          accessibilityLabel: TIMER_ACCESSIBILITY.LABELS.RESET_TIMER,
          color: Colors.gray.dark, // Gray for reset
        } : null,
      };
    }

    // Fallback - show start button
    return {
      primary: {
        icon: 'play' as const,
        onPress: handleStart,
        accessibilityLabel: TIMER_ACCESSIBILITY.LABELS.START_TIMER,
        color: Colors.accent1,
      },
      secondary: null,
    };
  };

  const buttonConfig = getButtonConfig();
  const buttonSize = compact ? 36 : 44;
  const iconSize = compact ? 18 : 24;

  return (
    <View 
      style={[
        styles.container,
        compact && styles.compactContainer,
      ]}
      testID="timer-controls"
    >
      {/* Primary Action Button */}
      <TouchableOpacity
        style={[
          styles.controlButton,
          compact && styles.compactButton,
          {
            backgroundColor: buttonConfig.primary.color,
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
          disabled && styles.disabledButton,
        ]}
        onPress={buttonConfig.primary.onPress}
        disabled={disabled}
        activeOpacity={0.7}
        testID="timer-primary-button"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={buttonConfig.primary.accessibilityLabel}
        accessibilityState={{
          disabled: disabled,
        }}
      >
        <Ionicons
          name={buttonConfig.primary.icon}
          size={iconSize}
          color={Colors.white}
        />
      </TouchableOpacity>

      {/* Secondary Action Button (if available) */}
      {buttonConfig.secondary && (
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.secondaryButton,
            compact && styles.compactButton,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              borderColor: buttonConfig.secondary.color,
            },
            disabled && styles.disabledButton,
          ]}
          onPress={buttonConfig.secondary.onPress}
          disabled={disabled}
          activeOpacity={0.7}
          testID="timer-secondary-button"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={buttonConfig.secondary.accessibilityLabel}
          accessibilityState={{
            disabled: disabled,
          }}
        >
          <Ionicons
            name={buttonConfig.secondary.icon}
            size={iconSize}
            color={buttonConfig.secondary.color}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  compactContainer: {
    gap: Spacing.sm,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  compactButton: {
    ...Shadows.sm,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
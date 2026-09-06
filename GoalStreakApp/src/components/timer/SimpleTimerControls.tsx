import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/theme';
import { TimerState } from '../../types/timer';

interface SimpleTimerControlsProps {
  timerState: TimerState | null;
  onStart: () => Promise<void> | void;
  onPause: () => Promise<void> | void;
  onResume: () => Promise<void> | void;
  onReset: () => Promise<void> | void;
  onComplete?: () => Promise<void> | void;
  compact?: boolean;
  disabled?: boolean;
}

export default function SimpleTimerControls({
  timerState,
  onStart,
  onPause,
  onResume,
  onReset,
  onComplete,
  compact = false,
  disabled = false,
}: SimpleTimerControlsProps) {
  const buttonSize = compact ? 36 : 44;
  const iconSize = compact ? 18 : 24;

  // Simple button configuration
  const getButtons = () => {
    if (!timerState) {
      return [
        {
          icon: 'play' as const,
          onPress: onStart,
          color: Colors.accent1,
          label: 'Start',
        },
      ];
    }

    if (timerState.isActive && !timerState.isPaused) {
      return [
        {
          icon: 'pause' as const,
          onPress: onPause,
          color: Colors.accent2,
          label: 'Pause',
        },
        {
          icon: 'stop' as const,
          onPress: onReset,
          color: Colors.gray.dark,
          label: 'Stop',
        },
      ];
    }

    if (timerState.isPaused) {
      return [
        {
          icon: 'play' as const,
          onPress: onResume,
          color: Colors.accent1,
          label: 'Resume',
        },
        {
          icon: 'stop' as const,
          onPress: onReset,
          color: Colors.gray.dark,
          label: 'Stop',
        },
      ];
    }

    return [
      {
        icon: 'refresh' as const,
        onPress: onReset,
        color: Colors.accent1,
        label: 'Reset',
      },
    ];
  };

  const buttons = getButtons();

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {buttons.map((button, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.button,
            {
              backgroundColor: button.color,
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
            },
            disabled && styles.disabledButton,
          ]}
          onPress={button.onPress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name={button.icon} size={iconSize} color={Colors.white} />
        </TouchableOpacity>
      ))}
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
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

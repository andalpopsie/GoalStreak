import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/theme';
import { TimerState } from '../../types/timer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimerProgressRingProps {
  habit: {
    id: string;
    name: string;
    timer?: {
      enabled: boolean;
      durationMinutes: number;
      autoComplete: boolean;
    };
  };
  timerState: TimerState | null;
  size: number;
  strokeWidth: number;
}

export default React.memo(function TimerProgressRing({
  habit,
  timerState,
  size,
  strokeWidth,
}: TimerProgressRingProps) {
  // Animation values
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Calculate dimensions (memoized for performance)
  const { radius, circumference, center } = useMemo(() => ({
    radius: (size - strokeWidth) / 2,
    circumference: 2 * Math.PI * ((size - strokeWidth) / 2),
    center: size / 2
  }), [size, strokeWidth]);

  // Update progress animation when timer state changes
  useEffect(() => {
    if (!habit.timer?.enabled) {
      // Hide ring if timer is not enabled
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
      return;
    }

    // Show ring if timer is enabled (always visible when enabled)
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });

    if (timerState) {
      // Extract progress value to avoid worklet issues
      const progressValue = timerState.progress;
      progress.value = withTiming(progressValue, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      // Reset to 0 if no active timer
      progress.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [timerState?.progress, habit.timer?.enabled, progress, opacity]);

  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(
      progress.value,
      [0, 1],
      [circumference, 0]
    );

    return {
      strokeDashoffset,
      opacity: opacity.value,
    };
  });

  // Animated props for the background circle
  const backgroundAnimatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
  }));

  // Don't render if timer is not enabled
  if (!habit.timer?.enabled) {
    return null;
  }

  // Determine ring color based on timer state
  const getRingColor = () => {
    if (!timerState) {
      return Colors.accent2; // Ready state - Dark Blue (more visible than gray)
    }

    // Extract values to avoid worklet issues
    const progressValue = timerState.progress;
    const isActive = timerState.isActive;
    const isPaused = timerState.isPaused;

    if (progressValue >= 1) {
      return Colors.accent3; // Completed - Teal
    }

    if (isActive && !isPaused) {
      return Colors.accent3; // Active - Teal (better than bright yellow)
    }

    return Colors.accent2; // Paused - Dark Blue
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        }
      ]}
      testID="timer-progress-ring"
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.gray.light}
          strokeWidth={strokeWidth}
          fill="transparent"
          animatedProps={backgroundAnimatedProps}
          testID="timer-background-circle"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={getRingColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`} // Start from top
          animatedProps={animatedProps}
          testID="timer-progress-circle"
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  svg: {
    position: 'absolute',
  },
});
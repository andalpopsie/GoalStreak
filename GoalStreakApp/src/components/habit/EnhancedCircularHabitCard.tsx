import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Shadows } from '../../constants/theme';
import { Habit, Streak } from '../../types';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';
import { useHabitTimer } from '../../contexts/TimerContext';
import TimerProgressRing from '../timer/TimerProgressRing';
import TimerControls from '../timer/TimerControls';

const { width: screenWidth } = Dimensions.get('window');
const cardSize = (screenWidth - Spacing.md * 3) / 2; // 2 columns with spacing

interface EnhancedCircularHabitCardProps {
  habit: Habit;
  streak?: Streak | null;
  isCompleted: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

export default function EnhancedCircularHabitCard({
  habit,
  streak,
  isCompleted,
  isLoading = false,
  onToggle,
  onDelete,
}: EnhancedCircularHabitCardProps) {
  // Timer integration
  const {
    timerState,
    isActive: isTimerActive,
    isPaused: isTimerPaused,
    isRunning: isTimerRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeTimer,
  } = useHabitTimer(habit.id);

  // Local state for timer controls visibility
  const [showTimerControls, setShowTimerControls] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const completionProgress = useSharedValue(isCompleted ? 1 : 0);
  const progressRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const bounceScale = useSharedValue(1);

  // Update animations when completion state changes
  useEffect(() => {
    try {
      completionProgress.value = withSpring(isCompleted ? 1 : 0, {
        damping: 15,
        stiffness: 150,
      });

      // Animate progress ring with null safety
      const progressPercentage = getProgressPercentage();
      const targetRotation = progressPercentage * 3.6; // Convert percentage to degrees
      progressRotation.value = withTiming(targetRotation, { duration: 800 });

      // Completion glow effect
      if (isCompleted) {
        glowOpacity.value = withSequence(
          withTiming(0.8, { duration: 300 }),
          withTiming(0.3, { duration: 500 }),
          withTiming(0, { duration: 300 })
        );
        bounceScale.value = withSequence(
          withTiming(1.1, { duration: 200 }),
          withTiming(1, { duration: 300 })
        );
      }
    } catch (error) {
      console.warn('Animation error:', error);
    }
  }, [isCompleted, streak?.currentStreak]);

  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePress = () => {
    try {
      // Scale animation
      scale.value = withSpring(0.92, { damping: 15, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      });

      // Haptic feedback
      runOnJS(triggerHapticFeedback)();

      // If habit has timer and is not completed, show timer controls
      if (habit.timer?.enabled && !isCompleted) {
        runOnJS(setShowTimerControls)(!showTimerControls);
      } else {
        // Call the toggle function for non-timer habits or completed habits
        runOnJS(onToggle)();
      }
    } catch (error) {
      console.warn('Press handler error:', error);
      // Fallback to direct call
      onToggle();
    }
  };

  const handleLongPress = () => {
    if (onDelete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert(
        'Delete Habit',
        `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: onDelete,
          },
        ]
      );
    }
  };

  // Timer control handlers
  const handleTimerStart = async () => {
    if (!habit.timer?.enabled) return;

    try {
      await startTimer(habit.timer.durationMinutes);
      setShowTimerControls(false);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleTimerPause = async () => {
    try {
      await pauseTimer();
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };

  const handleTimerResume = async () => {
    try {
      await resumeTimer();
    } catch (error) {
      console.error('Error resuming timer:', error);
    }
  };

  const handleTimerReset = async () => {
    try {
      await resetTimer();
      setShowTimerControls(false);
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  };

  const handleTimerComplete = async () => {
    try {
      await completeTimer();
      // Auto-complete habit if configured
      if (habit.timer?.autoComplete) {
        onToggle();
      }
      setShowTimerControls(false);
    } catch (error) {
      console.error('Error completing timer:', error);
    }
  };

  const getHabitText = () => {
    if (habit.targetValue && habit.unit) {
      return `${habit.name}\n${habit.targetValue} ${habit.unit}`;
    }
    return habit.name;
  };

  const getCircleColor = () => {
    return getCategoryColor(habit.category);
  };

  const getProgressPercentage = () => {
    if (!streak?.currentStreak || streak.currentStreak <= 0) return 0;
    const percentage = Math.min((streak.currentStreak / 30) * 100, 100);
    return isNaN(percentage) ? 0 : percentage;
  };

  // Format remaining time for display
  const formatRemainingTime = (remainingMs: number): string => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ scale: scale.value }, { scale: bounceScale.value }],
      };
    } catch (error) {
      return {
        transform: [{ scale: 1 }],
      };
    }
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    try {
      const shadowOpacity = isCompleted ? 0.25 : 0.15;
      return {
        shadowOpacity,
      };
    } catch (error) {
      return {};
    }
  });

  const animatedInnerCircleStyle = useAnimatedStyle(() => {
    try {
      const backgroundColor = isCompleted ? getCircleColor() : Colors.white;
      return {
        backgroundColor,
      };
    } catch (error) {
      return {
        backgroundColor: Colors.white,
      };
    }
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ rotate: `${progressRotation.value}deg` }],
      };
    } catch (error) {
      return {
        transform: [{ rotate: '0deg' }],
      };
    }
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    try {
      return {
        opacity: glowOpacity.value,
      };
    } catch (error) {
      return {
        opacity: 0,
      };
    }
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={handleLongPress}
          disabled={isLoading}
          activeOpacity={0.8}
          style={styles.touchable}
          testID="habit-card-button"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${habit.name} habit${isCompleted ? ', completed' : ''}${isLoading ? ', loading' : ''}`}
          accessibilityHint={
            isCompleted ? 'Double tap to mark as incomplete' : 'Double tap to mark as complete'
          }
        >
          {/* Glow Effect for Completion */}
          {isCompleted && (
            <Animated.View
              style={[styles.glowEffect, { backgroundColor: getCircleColor() }, animatedGlowStyle]}
            />
          )}

          {/* Progress Ring with Timer Integration */}
          <View style={styles.progressContainer}>
            {/* Timer Progress Ring (if timer is enabled) */}
            {habit.timer?.enabled && (
              <TimerProgressRing
                habit={habit}
                timerState={timerState}
                size={120} // Adjusted for new card size
                strokeWidth={4}
                onTimerStart={handleTimerStart}
                onTimerPause={handleTimerPause}
                onTimerReset={handleTimerReset}
                onTimerComplete={handleTimerComplete}
              />
            )}

            <View style={[styles.progressRing, { borderColor: getCircleColor() }]}>
              {/* Animated Progress Fill */}
              <Animated.View
                style={[
                  styles.progressFill,
                  { borderTopColor: getCircleColor(), borderRightColor: getCircleColor() },
                  animatedProgressStyle,
                ]}
              />

              {/* Animated Inner Circle */}
              <Animated.View style={[styles.innerCircle, animatedInnerCircleStyle]}>
                {isLoading ? (
                  <Ionicons name="hourglass" size={40} color={Colors.primaryText} />
                ) : (
                  <Ionicons
                    name={getCategoryIcon(habit.category, habit.name, habit.icon) as any}
                    size={isCompleted ? 44 : 40}
                    color={isCompleted ? Colors.white : getCircleColor()}
                  />
                )}
              </Animated.View>
            </View>

            {/* Timer Display - Show remaining time when timer is active */}
            {habit.timer?.enabled && timerState && (
              <View style={styles.timerDisplay}>
                <Text style={styles.timerText}>
                  {formatRemainingTime(timerState.remainingTime)}
                </Text>
              </View>
            )}

            {/* Completion Badge - Small check beside circle */}
            {isCompleted && (
              <Animated.View
                style={styles.completionBadge}
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(200)}
              >
                <Ionicons name="checkmark-circle" size={24} color={Colors.accent1} />
              </Animated.View>
            )}
          </View>

          {/* Habit Text */}
          <Text
            style={[styles.habitText, isCompleted && styles.habitTextCompleted]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getHabitText()}
          </Text>

          {/* Streak Display */}
          {streak && streak.currentStreak > 0 && (
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={14} color={Colors.accent1} />
              <Text style={styles.streakText}>{streak.currentStreak}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Timer Controls - Show when timer is enabled and controls are visible */}
        {habit.timer?.enabled && (showTimerControls || isTimerActive) && !isCompleted && (
          <Animated.View
            style={styles.timerControlsContainer}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
          >
            <TimerControls
              timerState={timerState}
              onStart={handleTimerStart}
              onPause={handleTimerPause}
              onResume={handleTimerResume}
              onReset={handleTimerReset}
              onComplete={handleTimerComplete}
              compact={true}
              disabled={isLoading}
            />
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardSize,
    aspectRatio: 0.85, // Slightly taller than square for better proportions
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    ...Shadows.md,
    shadowColor: Colors.primaryText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    opacity: 0.3,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: 'transparent',
  },
  innerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.3,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  habitTextCompleted: {
    color: Colors.accent3,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  streakText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.accent1,
    marginLeft: 4,
  },
  completionBadge: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timerDisplay: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timerText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  timerControlsContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    alignItems: 'center',
  },
});

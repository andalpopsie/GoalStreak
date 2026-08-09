import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Habit, Streak } from '../../types';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';
import { useHabitTimer } from '../../contexts/TimerContext';
import { TimerProgressRing } from '../timer';
import SimpleTimerControls from '../timer/SimpleTimerControls';

// --- Local timer hook (extracted from component to separate concerns) ---

interface LocalTimerState {
  isActive: boolean;
  remainingTime: number;
  totalDuration: number;
  startTime: number;
}

function useLocalTimer(onComplete: () => void) {
  const [localTimer, setLocalTimer] = useState<LocalTimerState | null>(null);

  // Stable ref for onComplete to avoid stale closures in the interval
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!localTimer?.isActive) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - localTimer.startTime;
      const remaining = Math.max(0, localTimer.totalDuration - elapsed);

      if (remaining <= 0) {
        setLocalTimer(null);
        onCompleteRef.current();
      } else {
        setLocalTimer(prev => prev ? { ...prev, remainingTime: remaining } : null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [localTimer?.isActive, localTimer?.startTime]);

  const start = useCallback((durationMs: number) => {
    setLocalTimer({
      isActive: true,
      remainingTime: durationMs,
      totalDuration: durationMs,
      startTime: Date.now(),
    });
  }, []);

  const reset = useCallback(() => {
    setLocalTimer(null);
  }, []);

  const progress = localTimer && localTimer.totalDuration > 0
    ? (localTimer.totalDuration - localTimer.remainingTime) / localTimer.totalDuration
    : 0;

  return { localTimer, start, reset, progress };
}

interface AnimatedCircularHabitCardProps {
  habit: Habit;
  streak?: Streak | null;
  isCompleted: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

export default function AnimatedCircularHabitCard({
  habit,
  streak,
  isCompleted,
  isLoading = false,
  onToggle,
  onDelete,
}: AnimatedCircularHabitCardProps) {
  
  // Timer integration
  const {
    timerState,
    isActive: isTimerActive,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeTimer,
  } = useHabitTimer(habit.id);

  // Local state for timer controls visibility
  const [showTimerControls, setShowTimerControls] = useState(false);
  
  // Local timer hook (extracted — no side effects in setState)
  const {
    localTimer,
    start: startLocalTimer,
    progress: localTimerProgress,
  } = useLocalTimer(onToggle);
  
  // Animation values
  const scale = useSharedValue(1);
  const completionProgress = useSharedValue(isCompleted ? 1 : 0);
  const progressRotation = useSharedValue(0);
  const timerProgress = useSharedValue(1); // Timer countdown progress (1 = full, 0 = empty)

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
    } catch (error) {
      console.warn('Animation error:', error);
    }
  }, [isCompleted, streak?.currentStreak]);

  // Update timer progress animation
  useEffect(() => {
    // Use local timer if active, otherwise use context timer
    if (localTimer && localTimer.isActive && habit.timer?.enabled) {
      const clampedProgress = Math.max(0, Math.min(1, localTimerProgress));
      timerProgress.value = withTiming(clampedProgress, {
        duration: 1000, // Smooth 1-second transitions
      });
      
    } else if (timerState && habit.timer?.enabled) {
      // Context timer progress (fallback)
      const progress = timerState.progress;
      
      const clampedProgress = Math.max(0, Math.min(1, progress));
      timerProgress.value = withTiming(clampedProgress, {
        duration: 1000,
      });
      
    } else {
      // Reset to full when no timer is active
      timerProgress.value = withTiming(1, { duration: 300 });
    }
  }, [localTimer?.remainingTime, localTimerProgress, timerState?.remainingTime, habit.timer?.enabled, isTimerActive, localTimer?.isActive]);

  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const animatePressScale = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
  };

  const handlePress = () => {
    try {
      animatePressScale();
      triggerHapticFeedback();
      
      if (habit.timer?.enabled && !isCompleted) {
        setShowTimerControls(!showTimerControls);
      } else {
        onToggle();
      }
    } catch (error) {
      console.warn('Press handler error:', error);
      onToggle();
    }
  };

  const handleLongPress = () => {
    if (onDelete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Delete Habit',
        `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: onDelete
          }
        ]
      );
    }
  };

  const handleTimerStart = async () => {
    if (!habit.timer?.enabled) return;
    
    try {
      const duration = habit.timer.durationMinutes || 5;
      const durationMs = duration * 60 * 1000;
      
      startLocalTimer(durationMs);
      setShowTimerControls(false);
    } catch (error) {
      console.error('❌ Error starting timer:', error);
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
      return `${habit.name.toUpperCase()}\n${habit.targetValue} ${habit.unit.toUpperCase()}`;
    }
    return habit.name.toUpperCase();
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
        transform: [{ scale: scale.value }],
      };
    } catch (error) {
      return {
        transform: [{ scale: 1 }],
      };
    }
  });

  const animatedInnerCircleStyle = useAnimatedStyle(() => {
    try {
      const backgroundColor = isCompleted ? getCategoryColor(habit.category) : Colors.white;
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

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
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
        accessibilityHint={isCompleted ? 'Double tap to mark as incomplete' : 'Double tap to mark as complete'}
      >
        {/* Progress Ring with Timer Integration */}
        <View style={styles.progressContainer}>
          {/* Timer Progress Ring - Outer ring that surrounds the habit circle */}
          {habit.timer?.enabled && (
            <TimerProgressRing
              habit={habit}
              timerState={localTimer ? {
                habitId: habit.id,
                isActive: localTimer.isActive,
                isPaused: false,
                startTime: new Date(localTimer.startTime),
                pausedTime: 0,
                remainingTime: localTimer.remainingTime,
                progress: localTimer.totalDuration > 0 ? 
                  (localTimer.totalDuration - localTimer.remainingTime) / localTimer.totalDuration : 0,
                lastUpdate: new Date(),
                originalDuration: localTimer.totalDuration
              } : (timerState ? {
                ...timerState,
                // Calculate progress correctly for the ring (countdown from 1 to 0)
                progress: timerState.remainingTime && habit.timer.durationMinutes 
                  ? Math.max(0, Math.min(1, timerState.remainingTime / (habit.timer.durationMinutes * 60 * 1000)))
                  : 0
              } : null)}
              size={170}
              strokeWidth={6}
            />
          )}
          
          {/* Main Habit Circle */}
          <View style={[styles.progressRing, { borderColor: getCircleColor() }]}>
            {/* Animated Progress Fill */}
            <Animated.View 
              style={[
                styles.progressFill,
                { borderTopColor: getCircleColor(), borderRightColor: getCircleColor() },
                animatedProgressStyle
              ]} 
            />
            
            {/* Animated Inner Circle */}
            <Animated.View style={[styles.innerCircle, animatedInnerCircleStyle]}>
              {isLoading ? (
                <Ionicons name="hourglass" size={80} color={Colors.primaryText} />
              ) : isCompleted ? (
                // Show regular icon when completed (no checkmark inside)
                <Ionicons
                  name={getCategoryIcon(habit.category, habit.name, habit.icon) as any}
                  size={80}
                  color={getCategoryColor(habit.category)}
                />
              ) : (
                <Ionicons
                  name={getCategoryIcon(habit.category, habit.name, habit.icon) as any}
                  size={80}
                  color={getCategoryColor(habit.category)}
                />
              )}
            </Animated.View>
          </View>
          
          {/* Timer Display - Show remaining time when timer is active */}
          {habit.timer?.enabled && (
            <View style={styles.timerDisplay}>
              <Text style={styles.timerText}>
                {localTimer ? formatRemainingTime(localTimer.remainingTime) : 'Ready'}
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
              <Ionicons 
                name="checkmark-circle" 
                size={32} 
                color={Colors.accent1} // Orange for visibility
              />
            </Animated.View>
          )}
        </View>

        {/* Habit Text */}
        <Text style={styles.habitText}>{getHabitText()}</Text>
        
        {/* Timer Controls - Show when timer is enabled and controls are visible */}
        {habit.timer?.enabled && (showTimerControls || isTimerActive || localTimer?.isActive) && !isCompleted && (
          <Animated.View 
            style={styles.timerControlsContainer}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
          >
            <SimpleTimerControls
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
        
        {/* Streak Display */}
        {streak && streak.currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={12} color={Colors.accent1} />
            <Text style={styles.streakText}>{streak.currentStreak}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: Spacing.lg,
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.sm,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 170, // Large enough to contain the timer ring
    height: 170,
  },
  progressRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,  // Increased from 8 to 12 for much thicker border
    borderColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,  // Increased from 8 to 12 to match progressRing
    borderColor: 'transparent',
  },
  innerCircle: {
    width: 115,  // Increased from 100 to 115
    height: 115,
    borderRadius: 57.5,
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
    lineHeight: Typography.fontSize.sm * 1.2,
    maxWidth: '95%',
    paddingHorizontal: Spacing.xs,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  streakText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.accent1,
    marginLeft: 2,
  },
  completionBadge: {
    position: 'absolute',
    bottom: -10,
    right: 12,
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timerDisplay: {
    position: 'absolute',
    bottom: 10,
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  timerControlsContainer: {
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
});

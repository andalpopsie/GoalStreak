import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Habit, Streak } from '../types';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryIcons';

interface AnimatedCircularHabitCardProps {
  habit: Habit;
  streak?: Streak | null;
  isCompleted: boolean;
  isLoading?: boolean;
  onToggle: () => void;
}

export default function AnimatedCircularHabitCard({
  habit,
  streak,
  isCompleted,
  isLoading = false,
  onToggle,
}: AnimatedCircularHabitCardProps) {
  
  // Animation values
  const scale = useSharedValue(1);
  const completionProgress = useSharedValue(isCompleted ? 1 : 0);
  const progressRotation = useSharedValue(0);

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

  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePress = () => {
    try {
      // Scale animation
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      });
      
      // Haptic feedback
      runOnJS(triggerHapticFeedback)();
      
      // Call the toggle function
      runOnJS(onToggle)();
    } catch (error) {
      console.warn('Press handler error:', error);
      // Fallback to direct call
      onToggle();
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
      return {
        backgroundColor: interpolate(
          completionProgress.value,
          [0, 1],
          [Colors.white, getCategoryColor(habit.category)],
          'clamp'
        ),
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
        disabled={isLoading}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {/* Progress Ring */}
        <View style={styles.progressContainer}>
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
    color: Colors.accent1,
    marginLeft: 2,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Add subtle drop shadow for extra visibility
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
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
});

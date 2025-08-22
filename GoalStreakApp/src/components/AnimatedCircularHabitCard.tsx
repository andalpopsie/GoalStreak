import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Habit, Streak } from '../types';

interface AnimatedCircularHabitCardProps {
  habit: Habit;
  streak?: Streak | null;
  isCompleted: boolean;
  isLoading?: boolean;
  onToggle: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  fitness: 'fitness',
  wellness: 'heart',
  nutrition: 'restaurant',
  productivity: 'briefcase',
  mindfulness: 'leaf',
  social: 'people',
  learning: 'book',
  other: 'ellipsis-horizontal',
};

const CATEGORY_COLORS: Record<string, string> = {
  fitness: Colors.accent1,
  wellness: Colors.accent2,
  nutrition: Colors.accent3,
  productivity: Colors.primaryText,
  mindfulness: Colors.accent3,
  social: Colors.accent2,
  learning: Colors.primaryText,
  other: Colors.accent1,
};

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
    completionProgress.value = withSpring(isCompleted ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    
    // Animate progress ring
    const targetRotation = getProgressPercentage() * 3.6; // Convert percentage to degrees
    progressRotation.value = withTiming(targetRotation, { duration: 800 });
  }, [isCompleted, streak?.currentStreak]);

  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePress = () => {
    // Scale animation
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    
    // Haptic feedback
    runOnJS(triggerHapticFeedback)();
    
    // Call the toggle function
    runOnJS(onToggle)();
  };

  const getHabitText = () => {
    if (habit.targetValue && habit.unit) {
      return `${habit.name.toUpperCase()}\n${habit.targetValue} ${habit.unit.toUpperCase()}`;
    }
    return habit.name.toUpperCase();
  };

  const getCircleColor = () => {
    return CATEGORY_COLORS[habit.category] || Colors.accent1;
  };

  const getProgressPercentage = () => {
    if (!streak?.currentStreak) return 0;
    return Math.min((streak.currentStreak / 30) * 100, 100);
  };

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedInnerCircleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolate(
      completionProgress.value,
      [0, 1],
      [Colors.white, Colors.accent3],
      'clamp'
    ),
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progressRotation.value}deg` }],
  }));

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
                <Ionicons name="checkmark" size={80} color={Colors.white} />
              ) : (
                <Ionicons
                  name={CATEGORY_ICONS[habit.category] as any}
                  size={80}
                  color={Colors.primaryText}
                />
              )}
            </Animated.View>
          </View>
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
});

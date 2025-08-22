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

interface AnimatedCircularHabitCardProps {
  habit: Habit;
  streak?: Streak | null;
  isCompleted: boolean;
  isLoading?: boolean;
  onToggle: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  // Fitness & Workout - More specific and aesthetic
  fitness: 'barbell-outline',           // Weightlifting/strength training
  workout: 'fitness-outline',           // General workout
  running: 'walk-outline',              // Running/cardio
  yoga: 'flower-outline',               // Yoga/stretching
  cycling: 'bicycle-outline',           // Cycling
  swimming: 'water-outline',            // Swimming
  
  // Health & Wellness - Beautiful and clear
  wellness: 'heart-outline',            // General wellness
  health: 'medical-outline',            // Health tracking
  sleep: 'moon-outline',                // Sleep habits
  meditation: 'leaf-outline',           // Meditation/mindfulness
  breathing: 'sunny-outline',           // Breathing exercises
  
  // Nutrition - Food and drink related
  nutrition: 'nutrition-outline',       // General nutrition
  water: 'water-outline',               // Water intake
  diet: 'restaurant-outline',           // Diet/eating habits
  vitamins: 'medical-outline',          // Supplements/vitamins
  
  // Productivity & Learning - Clean and professional
  productivity: 'briefcase-outline',    // Work/productivity
  learning: 'library-outline',          // Learning/reading
  writing: 'create-outline',            // Writing/journaling
  coding: 'code-slash-outline',         // Programming
  
  // Social & Personal - Warm and inviting
  social: 'people-outline',             // Social activities
  family: 'home-outline',               // Family time
  friends: 'happy-outline',             // Friends/social
  
  // Creative & Hobbies - Artistic and fun
  creative: 'color-palette-outline',    // Creative activities
  music: 'musical-notes-outline',       // Music practice
  art: 'brush-outline',                 // Art/drawing
  photography: 'camera-outline',        // Photography
  
  // Daily Habits - Essential and clear
  hygiene: 'water-outline',             // Personal hygiene
  cleaning: 'home-outline',             // Cleaning/organizing
  skincare: 'flower-outline',           // Skincare routine
  
  // Default
  other: 'ellipse-outline',             // Other/miscellaneous
};

const CATEGORY_COLORS: Record<string, string> = {
  // Fitness & Workout - Energetic colors
  fitness: Colors.accent1,              // Warm orange
  workout: Colors.accent1,              // Warm orange
  running: Colors.accent1,              // Warm orange
  yoga: Colors.accent3,                 // Teal for calm
  cycling: Colors.accent1,              // Warm orange
  swimming: Colors.accent3,             // Teal for water
  
  // Health & Wellness - Calming colors
  wellness: Colors.accent3,             // Teal
  health: Colors.accent3,               // Teal
  sleep: Colors.primaryText,            // Dark blue for night
  meditation: Colors.accent3,           // Teal for calm
  breathing: Colors.accent3,            // Teal for calm
  
  // Nutrition - Natural colors
  nutrition: Colors.accent1,            // Warm orange
  water: Colors.accent3,                // Teal for water
  diet: Colors.accent1,                 // Warm orange
  vitamins: Colors.accent3,             // Teal
  
  // Productivity & Learning - Professional colors
  productivity: Colors.primaryText,     // Dark blue
  learning: Colors.primaryText,         // Dark blue
  writing: Colors.primaryText,          // Dark blue
  coding: Colors.primaryText,           // Dark blue
  
  // Social & Personal - Warm colors
  social: Colors.accent1,               // Warm orange
  family: Colors.accent1,               // Warm orange
  friends: Colors.accent1,              // Warm orange
  
  // Creative & Hobbies - Vibrant colors
  creative: Colors.accent1,             // Warm orange
  music: Colors.accent1,                // Warm orange
  art: Colors.accent1,                  // Warm orange
  photography: Colors.primaryText,      // Dark blue
  
  // Daily Habits - Neutral colors
  hygiene: Colors.accent3,              // Teal
  cleaning: Colors.primaryText,         // Dark blue
  skincare: Colors.accent3,             // Teal
  
  // Legacy categories (for backward compatibility)
  mindfulness: Colors.accent3,          // Teal
  
  // Default
  other: Colors.primaryText,            // Dark blue
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
                // Show regular icon when completed (no checkmark inside)
                <Ionicons
                  name={CATEGORY_ICONS[habit.category] as any}
                  size={80}
                  color={Colors.primaryText}
                />
              ) : (
                <Ionicons
                  name={CATEGORY_ICONS[habit.category] as any}
                  size={80}
                  color={Colors.primaryText}
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

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Habit, Streak } from '../types';

interface CircularHabitCardProps {
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
  fitness: Colors.accent1,      // Orange
  wellness: Colors.accent2,     // Blue  
  nutrition: Colors.accent3,    // Teal
  productivity: Colors.primaryText, // Navy
  mindfulness: Colors.accent3,  // Teal
  social: Colors.accent2,       // Blue
  learning: Colors.primaryText, // Navy
  other: Colors.accent1,        // Orange
};

export default function CircularHabitCard({
  habit,
  streak,
  isCompleted,
  isLoading = false,
  onToggle,
}: CircularHabitCardProps) {
  
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
    // Simple progress based on current streak (max 30 days for full circle)
    return Math.min((streak.currentStreak / 30) * 100, 100);
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onToggle}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {/* Progress Ring */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressRing, { borderColor: getCircleColor() }]}>
          {/* Progress Fill */}
          <View 
            style={[
              styles.progressFill,
              { 
                borderColor: getCircleColor(),
                transform: [{ rotate: `${(getProgressPercentage() / 100) * 360}deg` }]
              }
            ]} 
          />
          
          {/* Inner Circle */}
          <View style={[styles.innerCircle, isCompleted && styles.completedCircle]}>
            {isLoading ? (
              <Ionicons name="hourglass" size={32} color={Colors.primaryText} />
            ) : isCompleted ? (
              <Ionicons name="checkmark" size={32} color={Colors.white} />
            ) : (
              <Ionicons
                name={CATEGORY_ICONS[habit.category] as any}
                size={32}
                color={Colors.primaryText}
              />
            )}
          </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: Colors.accent1,
    borderRightColor: Colors.accent1,
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCircle: {
    backgroundColor: Colors.accent3,
  },
  habitText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,  // Montserrat_600SemiBold - cleaner look
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.2,
    maxWidth: '90%',
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

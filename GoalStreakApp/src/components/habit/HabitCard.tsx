import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Habit, Streak } from '../../types';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';

interface HabitCardProps {
  habit: Habit;
  streak?: Streak;
  isCompleted: boolean;
  isLoading?: boolean;
  onComplete: () => void;
  onUncomplete: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function HabitCard({
  habit,
  streak,
  isCompleted,
  isLoading = false,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
}: HabitCardProps) {

  const handleToggleComplete = () => {
    if (isLoading) return;

    if (isCompleted) {
      Alert.alert(
        'Undo Completion',
        'Are you sure you want to mark this habit as not completed today?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Undo', style: 'destructive', onPress: onUncomplete },
        ]
      );
    } else {
      onComplete();
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const getFrequencyText = () => {
    switch (habit.frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return 'Daily';
    }
  };

  const getTargetText = () => {
    if (habit.targetValue && habit.unit) {
      return `${habit.targetValue} ${habit.unit}`;
    }
    return null;
  };

  return (
    <View
      style={[styles.container, isCompleted && styles.completedContainer]}
      testID="habit-card-container"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.habitInfo}>
          <View style={styles.categoryIcon}>
            <Ionicons
              name={getCategoryIcon(habit.category, habit.name, habit.icon) as any}
              size={20}
              color={getCategoryColor(habit.category)}
            />
          </View>
          <View style={styles.habitDetails}>
            <Text style={[styles.habitName, isCompleted && styles.completedText]}>
              {habit.name}
            </Text>
            <View style={styles.metaInfo}>
              <Text style={styles.frequency}>{getFrequencyText()}</Text>
              {getTargetText() && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.target}>{getTargetText()}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={styles.actionButton}
              testID="edit-button"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${habit.name} habit`}
            >
              <Ionicons name="pencil" size={16} color={Colors.accent2} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.actionButton}
              testID="delete-button"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${habit.name} habit`}
            >
              <Ionicons name="trash" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Description */}
      {habit.description && (
        <Text style={styles.description}>{habit.description}</Text>
      )}

      {/* Streak Info */}
      {streak && (
        <View style={styles.streakContainer}>
          <View style={styles.streakItem}>
            <Ionicons name="flame" size={16} color={Colors.accent1} />
            <Text style={styles.streakText}>
              {streak.currentStreak} day{streak.currentStreak !== 1 ? 's' : ''}
            </Text>
          </View>
          {streak.longestStreak > 0 && (
            <View style={styles.streakItem}>
              <Ionicons name="trophy" size={16} color={Colors.accent3} />
              <Text style={styles.streakText}>
                Best: {streak.longestStreak}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Complete Button */}
      <TouchableOpacity
        style={[
          styles.completeButton,
          isCompleted && styles.completeButtonCompleted,
          isLoading && styles.completeButtonLoading,
        ]}
        onPress={handleToggleComplete}
        disabled={isLoading}
        testID="complete-button"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${isCompleted ? 'Mark as incomplete' : 'Mark as complete'} ${habit.name} habit${isCompleted ? ', currently completed' : ''}`}
      >
        <View style={styles.completeButtonContent}>
          {isLoading ? (
            <Ionicons name="hourglass" size={20} color={Colors.white} />
          ) : (
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color={Colors.white}
            />
          )}
          <Text style={styles.completeButtonText}>
            {isLoading ? 'Updating...' : isCompleted ? 'Completed!' : 'Mark Complete'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedContainer: {
    backgroundColor: Colors.accent3,
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  habitInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  habitDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  completedText: {
    color: Colors.white,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequency: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
    fontWeight: Typography.fontWeight.medium,
  },
  separator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
    marginHorizontal: Spacing.xs,
  },
  target: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
    fontWeight: Typography.fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  streakText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.xs,
  },
  completeButton: {
    backgroundColor: Colors.accent1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  completeButtonCompleted: {
    backgroundColor: Colors.accent3,
  },
  completeButtonLoading: {
    backgroundColor: Colors.gray.medium,
  },
  completeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
});

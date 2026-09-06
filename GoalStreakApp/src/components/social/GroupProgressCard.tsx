// GroupProgressCard Component - Displays a member's tracked habits with completion indicators
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Typography } from '../../constants/theme';
import { GroupProgress } from '../../types/social';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';

interface GroupProgressCardProps {
  memberProgress: GroupProgress;
}

export default function GroupProgressCard({ memberProgress }: GroupProgressCardProps) {
  const completedCount = memberProgress.habits.filter((h) => h.completedToday).length;
  const totalCount = memberProgress.habits.length;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${memberProgress.userName}: ${completedCount} of ${totalCount} habits completed today`}
    >
      {/* Member Header */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{memberProgress.userName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {memberProgress.userName}
          </Text>
          <Text style={styles.completionSummary}>
            {completedCount}/{totalCount} completed today
          </Text>
        </View>
      </View>

      {/* Habit Indicators */}
      {memberProgress.habits.length > 0 ? (
        <View style={styles.habitsContainer}>
          {memberProgress.habits.map((habit) => (
            <View key={habit.habitId} style={styles.habitRow}>
              <View
                style={[
                  styles.completionDot,
                  habit.completedToday ? styles.completedDot : styles.incompleteDot,
                ]}
              >
                {habit.completedToday && (
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                )}
              </View>
              <Ionicons
                name={getCategoryIcon(habit.habitCategory) as any}
                size={16}
                color={getCategoryColor(habit.habitCategory)}
                style={styles.habitIcon}
              />
              <Text style={styles.habitName} numberOfLines={1}>
                {habit.habitName}
              </Text>
              {habit.currentStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={12} color={Colors.accent1} />
                  <Text style={styles.streakText}>{habit.currentStreak}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noHabitsText}>No habits linked yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16, // Standard card recipe
    padding: 16, // 8 × 2 (base)
    marginBottom: 8, // 8 × 1 (tight)
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // 8 × 2 (base)
  },
  avatar: {
    width: 40, // 8 × 5
    height: 40, // 8 × 5
    borderRadius: 20,
    backgroundColor: Colors.accent3, // Teal
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16, // 8 × 2 (base)
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16, // body
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
  },
  headerInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16, // body
    fontWeight: '600', // semibold
    color: Colors.primaryText,
    marginBottom: 2,
    fontFamily: Typography.fontFamily.semibold,
  },
  completionSummary: {
    fontSize: 14, // caption
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
  },
  habitsContainer: {
    gap: 8, // 8 × 1 (tight)
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32, // 8 × 4
  },
  completionDot: {
    width: 24, // 8 × 3
    height: 24, // 8 × 3
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8, // 8 × 1 (tight)
  },
  completedDot: {
    backgroundColor: Colors.accent3, // Teal (#4A90A4)
  },
  incompleteDot: {
    backgroundColor: Colors.gray.light, // Gray (#E8E8E8)
  },
  habitIcon: {
    marginRight: 8, // 8 × 1 (tight)
  },
  habitName: {
    flex: 1,
    fontSize: 14, // caption
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.regular,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.background,
    paddingHorizontal: 8, // 8 × 1 (tight)
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12, // small
    fontWeight: '600', // semibold
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.semibold,
  },
  noHabitsText: {
    fontSize: 14, // caption
    color: Colors.secondaryText,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8, // 8 × 1 (tight)
    fontFamily: Typography.fontFamily.regular,
  },
});

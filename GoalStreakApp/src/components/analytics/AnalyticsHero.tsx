// AnalyticsHero — Compact merged card: greeting + streak + completion rate
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

interface AnalyticsHeroProps {
  userName?: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompletions: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getEmoji(rate: number, completions: number): string {
  if (completions === 0) return '🌱';
  if (rate >= 90) return '🔥';
  if (rate >= 70) return '💪';
  if (rate >= 50) return '📈';
  return '🎯';
}

function getStreakColor(streak: number): string {
  if (streak >= 30) return '#FF6B35';
  if (streak >= 14) return Colors.accent1;
  if (streak >= 7) return Colors.accent3;
  return Colors.primaryText;
}

export default function AnalyticsHero({
  userName,
  currentStreak,
  longestStreak,
  completionRate,
  totalCompletions,
}: AnalyticsHeroProps) {
  const firstName = userName?.split(' ')[0] || 'there';
  const emoji = getEmoji(completionRate, totalCompletions);
  const streakColor = getStreakColor(currentStreak);

  return (
    <View style={styles.container}>
      {/* Greeting Row */}
      <Text style={styles.greeting}>
        {getGreeting()}, {firstName} {emoji}
      </Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Streak */}
        <View style={styles.statBlock}>
          <View style={styles.statIconRow}>
            <Ionicons name="flame" size={18} color={streakColor} />
            <Text style={[styles.statNumber, { color: streakColor }]}>{currentStreak}</Text>
          </View>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.statDivider} />

        {/* Completion Rate */}
        <View style={styles.statBlock}>
          <View style={styles.statIconRow}>
            <Ionicons name="checkmark-done" size={18} color={Colors.accent3} />
            <Text style={[styles.statNumber, { color: Colors.accent3 }]}>
              {completionRate.toFixed(0)}%
            </Text>
          </View>
          <Text style={styles.statLabel}>This Week</Text>
        </View>

        <View style={styles.statDivider} />

        {/* Best Streak */}
        <View style={styles.statBlock}>
          <View style={styles.statIconRow}>
            <Ionicons name="trophy" size={18} color={Colors.accent1} />
            <Text style={[styles.statNumber, { color: Colors.accent1 }]}>{longestStreak}</Text>
          </View>
          <Text style={styles.statLabel}>Best</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16, // 8 × 2 (base)
    marginTop: 16, // 8 × 2 (base)
    marginBottom: 8, // 8 × 1 (tight)
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20, // 8 × 2.5
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  greeting: {
    fontSize: 20, // subheading
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    marginBottom: 16, // 8 × 2 (base)
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24, // heading
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
  },
  statLabel: {
    fontSize: 12, // small
    color: Colors.secondaryText,
    fontWeight: '500', // medium
    fontFamily: Typography.fontFamily.medium,
  },
  statDivider: {
    width: 1,
    height: 32, // 8 × 4
    backgroundColor: Colors.gray.light,
  },
});

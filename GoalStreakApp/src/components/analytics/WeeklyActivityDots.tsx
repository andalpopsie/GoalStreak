// WeeklyActivityDots — 7-day visual showing daily completion status
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';
import { TrendData } from '../../services/analyticsService';

interface WeeklyActivityDotsProps {
  data: TrendData[];
  totalHabits: number;
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getDotStyle(
  completions: number,
  totalHabits: number
): { color: string; icon: string; opacity: number } {
  if (totalHabits === 0 || completions === 0) {
    return { color: Colors.gray.light, icon: 'ellipse-outline', opacity: 0.5 };
  }

  const rate = completions / totalHabits;

  if (rate >= 0.8) {
    return { color: '#B771E5', icon: 'checkmark-circle', opacity: 1 }; // Purple — excellent
  }
  if (rate >= 0.5) {
    return { color: Colors.accent3, icon: 'checkmark-circle', opacity: 0.85 }; // Teal — good
  }
  if (rate > 0) {
    return { color: Colors.accent1, icon: 'ellipse', opacity: 0.6 }; // Accent — partial
  }
  return { color: Colors.gray.light, icon: 'ellipse-outline', opacity: 0.5 }; // Empty
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export default function WeeklyActivityDots({ data, totalHabits }: WeeklyActivityDotsProps) {
  const last7 = data.slice(-7);

  // Pad to 7 days if less data
  while (last7.length < 7) {
    const prevDate =
      last7.length > 0
        ? new Date(new Date(last7[0].date).getTime() - 86400000)
        : new Date(Date.now() - (7 - last7.length) * 86400000);
    last7.unshift({ date: prevDate.toISOString().split('T')[0], completions: 0, totalHabits: 0 });
  }

  const totalCompleted = last7.reduce((sum, d) => sum + d.completions, 0);
  const totalPossible = totalHabits * 7;
  const weekRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.weekRate}>{weekRate}% complete</Text>
      </View>

      <View style={styles.dotsRow}>
        {last7.map((day, index) => {
          const dot = getDotStyle(day.completions, totalHabits);
          const today = isToday(day.date);

          return (
            <View key={index} style={styles.dayColumn}>
              <Text style={[styles.dayLabel, today && styles.dayLabelToday]}>
                {getDayLabel(day.date)}
              </Text>
              <View style={[styles.dotContainer, today && styles.dotContainerToday]}>
                <Ionicons
                  name={dot.icon as any}
                  size={28}
                  color={dot.color}
                  style={{ opacity: dot.opacity }}
                />
              </View>
              <Text style={styles.countLabel}>{day.completions > 0 ? day.completions : '–'}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16, // 8 × 2 (base)
    marginVertical: 8, // 8 × 1 (tight)
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16, // 8 × 2 (base)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // 8 × 2 (base)
  },
  title: {
    fontSize: 16, // body
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
  },
  weekRate: {
    fontSize: 14, // caption
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.accent1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12, // small
    color: Colors.secondaryText,
    fontWeight: '500', // medium
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 8, // 8 × 1 (tight)
    textTransform: 'uppercase',
  },
  dayLabelToday: {
    color: Colors.accent1,
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
  },
  dotContainer: {
    width: 36, // 8 × 4.5
    height: 36, // 8 × 4.5
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotContainerToday: {
    borderWidth: 2,
    borderColor: Colors.accent1 + '40',
  },
  countLabel: {
    fontSize: 12, // small
    color: Colors.secondaryText,
    marginTop: 4,
    fontWeight: '500', // medium
    fontFamily: Typography.fontFamily.medium,
  },
});

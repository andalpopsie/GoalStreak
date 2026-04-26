// StreakHero — Prominent streak display inspired by Duolingo/Strava
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

interface StreakHeroProps {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

function getStreakTier(streak: number): { label: string; color: string; bgColor: string } {
  if (streak >= 100) return { label: 'Legendary', color: '#FFD700', bgColor: '#FFD700' + '15' };
  if (streak >= 30) return { label: 'On Fire', color: '#FF6B35', bgColor: '#FF6B35' + '15' };
  if (streak >= 14) return { label: 'Committed', color: Colors.accent1, bgColor: Colors.accent1 + '15' };
  if (streak >= 7) return { label: 'Building', color: Colors.accent3, bgColor: Colors.accent3 + '15' };
  if (streak >= 1) return { label: 'Starting', color: Colors.primaryText, bgColor: Colors.primaryText + '10' };
  return { label: 'Begin Today', color: Colors.secondaryText, bgColor: Colors.gray.light };
}

export default function StreakHero({ currentStreak, longestStreak, completionRate }: StreakHeroProps) {
  const tier = getStreakTier(currentStreak);

  return (
    <View style={styles.container}>
      {/* Streak Number — Hero Element */}
      <View style={styles.streakCenter}>
        <View style={[styles.streakCircle, { backgroundColor: tier.bgColor }]}>
          <Ionicons
            name="flame"
            size={32}
            color={tier.color}
          />
          <Text style={[styles.streakNumber, { color: tier.color }]}>
            {currentStreak}
          </Text>
          <Text style={styles.streakUnit}>day streak</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
          <Text style={styles.tierText}>{tier.label}</Text>
        </View>
      </View>

      {/* Supporting Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="trophy-outline" size={18} color={Colors.accent1} />
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="checkmark-done-outline" size={18} color={Colors.accent3} />
          <Text style={styles.statValue}>{completionRate.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,             // 8 × 2 (base)
    marginVertical: 8,                // 8 × 1 (tight)
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,                      // 8 × 3 (comfortable)
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  streakCenter: {
    alignItems: 'center',
    marginBottom: 20,                 // 8 × 2.5
  },
  streakCircle: {
    width: 120,                       // 8 × 15
    height: 120,                      // 8 × 15
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,                 // 8 × 1.5
  },
  streakNumber: {
    fontSize: 36,                     // hero number
    fontWeight: '800',                // extra bold
    marginTop: -2,
  },
  streakUnit: {
    fontSize: 12,                     // small
    color: Colors.secondaryText,
    fontWeight: '500',                // medium
    marginTop: -2,
  },
  tierBadge: {
    paddingHorizontal: 16,            // 8 × 2 (base)
    paddingVertical: 4,
    borderRadius: 12,                 // pill
  },
  tierText: {
    fontSize: 12,                     // small
    fontWeight: '700',                // bold
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 16,                   // 8 × 2 (base)
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,                     // subheading
    fontWeight: '700',                // bold
    color: Colors.primaryText,
  },
  statLabel: {
    fontSize: 12,                     // small
    color: Colors.secondaryText,
    fontWeight: '500',                // medium
  },
  statDivider: {
    width: 1,
    height: 40,                       // 8 × 5
    backgroundColor: Colors.gray.light,
  },
});

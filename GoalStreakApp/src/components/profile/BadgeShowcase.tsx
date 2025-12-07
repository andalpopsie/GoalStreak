// BadgeShowcase Component - Display user's top achievements
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { achievementsService, Achievement } from '../../services/achievementsService';

interface BadgeShowcaseProps {
  onViewAll: () => void;
}

export default function BadgeShowcase({ onViewAll }: BadgeShowcaseProps) {
  const [topBadges, setTopBadges] = useState<Achievement[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    const badges = await achievementsService.getTopAchievements();
    const count = await achievementsService.getUnlockedCount();
    setTopBadges(badges);
    setTotalCount(count);
  };

  if (topBadges.length === 0) {
    return null; // Don't show if no badges
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Achievements</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>View All ({totalCount})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.badgesContainer}>
        {topBadges.map((badge) => (
          <View key={badge.id} style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
            <Ionicons name={badge.icon as any} size={32} color={badge.color} />
            <Text style={styles.badgeTitle} numberOfLines={1}>{badge.title}</Text>
          </View>
        ))}
        
        {/* Show empty slots if less than 3 */}
        {[...Array(3 - topBadges.length)].map((_, i) => (
          <View key={`empty-${i}`} style={styles.emptyBadge}>
            <Ionicons name="lock-closed" size={24} color={Colors.gray.medium} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,              // 8 * 2 (base)
    marginBottom: 16,                   // 8 * 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 16,                   // Modern rounded
    padding: 16,                        // 8 * 2 (base)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,                   // 8 * 2 (base)
  },
  title: {
    fontSize: 18,                       // Large body
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
  },
  viewAll: {
    fontSize: 14,                       // small
    color: Colors.accent1,
    fontWeight: '500',                  // medium
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,                            // 8 * 1.5
  },
  badge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,                // 8 * 2 (base)
    paddingHorizontal: 8,               // 8 * 1 (tight)
    borderRadius: 12,                   // Rounded
  },
  badgeTitle: {
    fontSize: 11,                       // caption
    color: Colors.primaryText,
    marginTop: 8,                       // 8 * 1 (tight)
    textAlign: 'center',
    fontWeight: '500',                  // medium
  },
  emptyBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,                // 8 * 2 (base)
    paddingHorizontal: 8,               // 8 * 1 (tight)
    borderRadius: 12,                   // Rounded
    backgroundColor: Colors.gray.light,
    minHeight: 80,                      // 8 * 10
  },
});

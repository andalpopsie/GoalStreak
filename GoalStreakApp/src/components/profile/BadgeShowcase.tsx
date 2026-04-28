// BadgeShowcase Component - Display user's top achievements
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../../constants/theme';
import { achievementsService, Achievement } from '../../services/achievementsService';

interface BadgeShowcaseProps {
  onViewAll: () => void;
  refreshKey?: number;
}

export default function BadgeShowcase({ onViewAll, refreshKey }: BadgeShowcaseProps) {
  const [topBadges, setTopBadges] = useState<Achievement[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadBadges();
  }, [refreshKey]);

  const loadBadges = async () => {
    const badges = await achievementsService.getTopAchievements();
    const count = await achievementsService.getUnlockedCount();
    setTopBadges(badges);
    setTotalCount(count);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAll}>View All ({totalCount})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.badgesContainer}>
        {topBadges.map((badge) => (
          <View key={badge.id} style={[styles.badge, { backgroundColor: badge.color + '15' }]}>
            <View style={[styles.badgeIconCircle, { backgroundColor: badge.color + '25' }]}>
              <Ionicons name={badge.icon as any} size={28} color={badge.color} />
            </View>
            <Text style={styles.badgeTitle} numberOfLines={2}>{badge.title}</Text>
          </View>
        ))}
        
        {/* Show empty slots if less than 3 */}
        {[...Array(3 - topBadges.length)].map((_, i) => (
          <View key={`empty-${i}`} style={styles.emptyBadge}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="lock-closed" size={24} color={Colors.gray.medium} />
            </View>
            <Text style={styles.emptyBadgeText}>Locked</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.base,     // 16px
    marginBottom: Spacing.base,         // 16px
    backgroundColor: Colors.white,
    borderRadius: 16,                   // 8 × 2
    padding: Spacing.base,             // 16px
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,         // 16px
  },
  title: {
    fontSize: Typography.fontSize.subheading, // 20px
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
  },
  viewAllButton: {
    minHeight: 48,                      // 8 × 6 (touch target)
    justifyContent: 'center',
  },
  viewAll: {
    fontSize: Typography.fontSize.caption, // 14px
    color: Colors.accent1,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: Spacing.tight,                 // 8px (on grid)
  },
  badge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,      // 16px
    paddingHorizontal: Spacing.tight,   // 8px
    borderRadius: 12,                   // 8 × 1.5
  },
  badgeIconCircle: {
    width: 48,                          // 8 × 6
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.tight,        // 8px
  },
  badgeTitle: {
    fontSize: Typography.fontSize.small, // 12px (from type scale)
    color: Colors.primaryText,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.fontSize.small * 1.3,
  },
  emptyBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,      // 16px
    paddingHorizontal: Spacing.tight,   // 8px
    borderRadius: 12,                   // 8 × 1.5
    backgroundColor: Colors.gray.light + '80',
    minHeight: 96,                      // 8 × 12
  },
  emptyIconCircle: {
    width: 48,                          // 8 × 6
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray.light,
    marginBottom: Spacing.tight,        // 8px
  },
  emptyBadgeText: {
    fontSize: Typography.fontSize.small, // 12px
    color: Colors.gray.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
  },
});

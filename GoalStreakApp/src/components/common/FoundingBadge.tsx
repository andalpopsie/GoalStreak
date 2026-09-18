import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../constants/theme';

export interface FoundingBadgeProps {
  foundingNumber: number | null; // null → badge renders without the number (R8.5)
  variant?: 'profile' | 'feed'; // 'profile' = full label; 'feed' = compact pill
}

/**
 * FoundingBadge — permanent visual badge for founding members.
 *
 * Visibility is driven by the caller based on `foundingMember` flag,
 * NOT by `isPro`. Badge and number render independently per R7.6, R8.5, R14.3.
 *
 * variant='profile': "★ Founding Member #42" (or without number if null)
 * variant='feed':    "#42" pill (or "★" if number is null)
 */
export default function FoundingBadge({ foundingNumber, variant = 'profile' }: FoundingBadgeProps) {
  if (variant === 'feed') {
    return (
      <View
        style={styles.feedBadge}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={
          foundingNumber != null ? `Founding Member number ${foundingNumber}` : 'Founding Member'
        }
      >
        <Text style={styles.feedText}>{foundingNumber != null ? `#${foundingNumber}` : '★'}</Text>
      </View>
    );
  }

  // variant === 'profile'
  return (
    <View
      style={styles.profileBadge}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={
        foundingNumber != null ? `Founding Member number ${foundingNumber}` : 'Founding Member'
      }
    >
      <Text style={styles.profileStar}>★</Text>
      <Text style={styles.profileText}>
        {'Founding Member'}
        {foundingNumber != null && (
          <Text style={styles.profileNumber}>{` #${foundingNumber}`}</Text>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Profile variant — full-size badge
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent1, // #B771E5 purple
    borderRadius: BorderRadius.lg, // 12
    paddingVertical: Spacing.tight, // 8 × 1
    paddingHorizontal: Spacing.base, // 8 × 2
    minHeight: Layout.minTouchTarget, // 48 (8 × 6)
    alignSelf: 'flex-start',
  },
  profileStar: {
    color: Colors.white,
    fontSize: Typography.fontSize.subheading, // 20
    fontFamily: Typography.fontFamily.bold,
    marginRight: Spacing.tight, // 8 × 1
  },
  profileText: {
    color: Colors.white,
    fontSize: Typography.fontSize.subheading, // 20
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
  },
  profileNumber: {
    color: Colors.white,
    fontSize: Typography.fontSize.subheading, // 20
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
  },

  // Feed variant — compact pill
  feedBadge: {
    backgroundColor: Colors.accent1, // #B771E5 purple
    borderRadius: BorderRadius.full, // pill shape (9999)
    paddingVertical: 4, // 8 × 0.5 — intentionally small for inline pill
    paddingHorizontal: Spacing.tight, // 8 × 1
    alignSelf: 'flex-start',
  },
  feedText: {
    color: Colors.white,
    fontSize: Typography.fontSize.caption, // 14
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: '600',
  },
});

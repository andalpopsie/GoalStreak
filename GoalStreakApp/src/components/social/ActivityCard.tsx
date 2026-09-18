// ActivityCard Component - Display social activity feed items
import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { SocialActivity } from '../../types/social';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { formatRelativeTime } from '../../utils/timeUtils';
import FoundingBadge from '../common/FoundingBadge';

interface ActivityCardProps {
  activity: SocialActivity;
  /**
   * Optional report handler. When provided, ActivityCard shows a ⋯ (more
   * options) affordance and supports long-press, offering a "Report" action.
   * The PARENT owns the ReportReasonSheet + friendService/useModeration
   * .reportContent call, targeting `contentType: 'activity'` with
   * `reportedUserId: activity.userId` and `contentId: activity.id`.
   *
   * ActivityCard stays surface-agnostic: it does not know the current user, so
   * the parent decides whether to pass this callback (e.g. omit it for the
   * viewer's own activity per the existing own-content convention).
   */
  onReport?: (activity: SocialActivity) => void;
  /**
   * Optional block handler. When provided, the ⋯ menu also offers a
   * destructive "Block user" action. The parent owns the confirmation dialog
   * and friendService/useModeration.blockUser call. Report on activities
   * (Requirement 4.2) does not require block, so this is purely additive.
   */
  onBlock?: (activity: SocialActivity) => void;
}

export default function ActivityCard({ activity, onReport, onBlock }: ActivityCardProps) {
  const hasActions = !!(onReport || onBlock);

  // Present the moderation actions via a native action menu. Report is the
  // primary action (Requirement 4.2); Block is offered only when the parent
  // wires it. Kept lightweight (Jakob's Law — familiar iOS/Android pattern).
  const handleMoreActions = () => {
    if (!hasActions) return;
    const buttons: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }> = [];
    if (onReport) {
      buttons.push({ text: 'Report', onPress: () => onReport(activity) });
    }
    if (onBlock) {
      buttons.push({
        text: 'Block user',
        style: 'destructive',
        onPress: () => onBlock(activity),
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Activity options', undefined, buttons);
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'habit_completed':
        return 'checkmark-circle';
      case 'streak_milestone':
        return 'flame';
      case 'habit_created':
        return 'add-circle';
      case 'goal_achieved':
        return 'trophy';
      case 'weekly_goal_met':
        return 'calendar';
      default:
        return 'checkmark-circle';
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'habit_completed':
        return Colors.accent3;
      case 'streak_milestone':
        return Colors.accent1;
      case 'habit_created':
        return Colors.primaryText;
      case 'goal_achieved':
        return Colors.accent1;
      case 'weekly_goal_met':
        return Colors.accent3;
      default:
        return Colors.accent3;
    }
  };

  const getActivityText = () => {
    const { userName, habitName, type, streakCount, milestone } = activity;

    // Ensure all values are strings
    const safeUserName = userName || 'Someone';
    const safeHabitName = habitName || 'a habit';
    const safeStreakCount = streakCount || 0;
    const safeMilestone = milestone || 'milestone';

    switch (type) {
      case 'habit_completed':
        if (safeStreakCount > 1) {
          return `${safeUserName} completed "${safeHabitName}" (${safeStreakCount} day streak!)`;
        }
        return `${safeUserName} completed "${safeHabitName}"`;

      case 'streak_milestone':
        return `${safeUserName} reached a ${safeMilestone} streak with "${safeHabitName}"! 🔥`;

      case 'habit_created':
        return `${safeUserName} started tracking "${safeHabitName}"`;

      case 'goal_achieved':
        return `${safeUserName} achieved their goal with "${safeHabitName}"!`;

      case 'weekly_goal_met':
        return `${safeUserName} met their weekly goal for "${safeHabitName}"`;

      default:
        return `${safeUserName} updated "${safeHabitName}"`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Pressable
      style={styles.container}
      onLongPress={hasActions ? handleMoreActions : undefined}
      delayLongPress={350}
      // Long-press is a bonus affordance; the ⋯ button is the primary target.
      // Disable ripple/opacity feedback when there are no actions.
      android_disableSound={!hasActions}
    >
      {/* User Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(activity.userName)}</Text>
        </View>

        {/* Activity Type Indicator */}
        <View style={[styles.activityIndicator, { backgroundColor: getActivityColor() }]}>
          <Ionicons name={getActivityIcon() as any} size={12} color={Colors.white} />
        </View>
      </View>

      {/* Activity Content */}
      <View style={styles.contentContainer}>
        {/* Author row — name + founding badge (R8.1–R8.4) */}
        {activity.foundingMember === true && (
          <View style={styles.authorRow}>
            <FoundingBadge variant="feed" foundingNumber={activity.foundingNumber ?? null} />
          </View>
        )}
        <View style={styles.activityHeader}>
          <Text style={styles.activityText}>{getActivityText()}</Text>
          <Text style={styles.timeText}>{formatRelativeTime(activity.timestamp)}</Text>
        </View>

        {/* Habit Category Badge */}
        <View style={styles.habitBadge}>
          <Ionicons
            name={getCategoryIcon(activity.habitCategory) as any}
            size={14}
            color={Colors.gray.dark}
          />
          <Text style={styles.categoryText}>
            {activity.habitCategory.charAt(0).toUpperCase() + activity.habitCategory.slice(1)}
          </Text>
        </View>

        {/* Special Milestone Celebration */}
        {activity.type === 'streak_milestone' && activity.streakCount && (
          <View style={styles.milestoneContainer}>
            <View style={styles.milestoneContent}>
              <Ionicons name="flame" size={16} color={Colors.accent1} />
              <Text style={styles.milestoneText}>{activity.streakCount} Day Streak!</Text>
            </View>
            {activity.streakCount >= 30 && (
              <Text style={styles.celebrationText}>🎉 Amazing dedication!</Text>
            )}
          </View>
        )}
      </View>

      {/* Moderation affordance — only rendered when the parent wires an action */}
      {hasActions && (
        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMoreActions}
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.gray.dark} />
        </TouchableOpacity>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  activityIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  contentContainer: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // tight gap before activity text (8 × 0.5)
  },
  moreButton: {
    width: 48, // 8 × 6 (touch target ≥ 48px)
    height: 48, // 8 × 6
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs, // 8 — separate from content
    marginTop: -Spacing.xs, // pull up to align with the first text line
    marginRight: -Spacing.xs, // absorb into the card's right padding
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  activityText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * 1.4,
    marginRight: Spacing.sm,
  },
  timeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray.medium,
    fontFamily: Typography.fontFamily.regular,
  },
  habitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray.dark,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
  },
  milestoneContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.accent1 + '10', // 10% opacity
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent1,
  },
  milestoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.semibold,
  },
  celebrationText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 4,
  },
});

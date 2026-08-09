// GroupFeedCard Component - Activity card for group feed with reactions
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Typography } from '../../constants/theme';
import { GroupActivity, ReactionType } from '../../types/social';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';
import { formatRelativeTime } from '../../utils/timeUtils';

interface GroupFeedCardProps {
  activity: GroupActivity;
  onReaction: (activityId: string, reactionType: ReactionType) => void;
  currentUserId: string;
  /**
   * Optional report handler. When provided, a `⋯` action appears on activities
   * authored by other users so the viewer can report the item. The PARENT owns
   * the ReportReasonSheet + the `reportContent` write (contentType:
   * 'group_activity', contentId: activity.id, reportedUserId: activity.userId).
   * Omitted → no report affordance (keeps the card usable without moderation).
   */
  onReport?: (activity: GroupActivity) => void;
}

const REACTION_CONFIG: { type: ReactionType; icon: string; label: string }[] = [
  { type: 'heart', icon: 'heart', label: 'Heart' },
  { type: 'flame', icon: 'flame', label: 'Fire' },
  { type: 'medal', icon: 'medal', label: 'Medal' },
];

export default function GroupFeedCard({
  activity,
  onReaction,
  currentUserId,
  onReport,
}: GroupFeedCardProps) {
  const getActivityIcon = (): { name: string; color: string } => {
    switch (activity.type) {
      case 'habit_completed':
        return {
          name: getCategoryIcon(activity.habitCategory || 'other'),
          color: getCategoryColor(activity.habitCategory || 'other'),
        };
      case 'streak_milestone':
        return { name: 'flame', color: Colors.accent1 };
      case 'member_joined':
        return { name: 'person-add', color: Colors.accent3 };
      case 'member_left':
        return { name: 'person-remove', color: Colors.secondaryText };
      default:
        return { name: 'ellipse', color: Colors.secondaryText };
    }
  };

  const getActivityMessage = (): string => {
    switch (activity.type) {
      case 'habit_completed':
        return `completed ${activity.habitName || 'a habit'}`;
      case 'streak_milestone':
        return `reached a ${activity.streakCount}-day streak on ${activity.habitName || 'a habit'} 🔥`;
      case 'member_joined':
        return 'joined the group';
      case 'member_left':
        return 'left the group';
      default:
        return 'did something';
    }
  };

  const getReactionCount = (reactionType: ReactionType): number => {
    if (!activity.reactions) return 0;
    return Object.values(activity.reactions).filter(
      (userReactions: ReactionType[]) =>
        Array.isArray(userReactions) && userReactions.includes(reactionType)
    ).length;
  };

  const hasUserReacted = (reactionType: ReactionType): boolean => {
    if (!activity.reactions || !activity.reactions[currentUserId]) return false;
    return activity.reactions[currentUserId].includes(reactionType);
  };

  const activityIcon = getActivityIcon();
  const isSystemEvent = activity.type === 'member_joined' || activity.type === 'member_left';

  // Only offer reporting on real member content authored by someone else — never
  // on system events (join/leave) or the viewer's own activity.
  const canReport = !!onReport && !isSystemEvent && activity.userId !== currentUserId;

  return (
    <View style={[styles.container, isSystemEvent && styles.systemEventContainer]}>
      {/* Activity Content */}
      <View style={styles.contentRow}>
        <View style={[styles.iconContainer, { backgroundColor: activityIcon.color }]}>
          <Ionicons name={activityIcon.name as any} size={18} color={Colors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.activityText}>
            <Text style={styles.userName}>{activity.userName}</Text>
            {' '}{getActivityMessage()}
          </Text>
          <Text style={styles.timestamp}>{formatRelativeTime(activity.timestamp)}</Text>
        </View>

        {/* Overflow (⋯) — report this activity (contentType: 'group_activity') */}
        {canReport && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => onReport?.(activity)}
            accessibilityLabel={`Report ${activity.userName}'s activity`}
            accessibilityRole="button"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Reactions — only for non-system events */}
      {!isSystemEvent && (
        <View style={styles.reactionsRow}>
          {REACTION_CONFIG.map(({ type, icon, label }) => {
            const count = getReactionCount(type);
            const isActive = hasUserReacted(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.reactionButton, isActive && styles.reactionButtonActive]}
                onPress={() => onReaction(activity.id, type)}
                accessibilityLabel={`${label} reaction, ${count} reactions`}
                accessibilityRole="button"
              >
                <Ionicons
                  name={icon as any}
                  size={16}
                  color={isActive ? Colors.accent1 : Colors.secondaryText}
                />
                {count > 0 && (
                  <Text style={[styles.reactionCount, isActive && styles.reactionCountActive]}>
                    {count}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,                   // Standard card recipe
    padding: 16,                        // 8 × 2 (base)
    marginBottom: 8,                    // 8 × 1 (tight)
    ...Shadows.sm,
  },
  systemEventContainer: {
    backgroundColor: Colors.background,
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,                          // Compact icon
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,                    // 8 × 2 (base)
  },
  textContainer: {
    flex: 1,
  },
  moreButton: {
    width: 48,                          // 8 × 6 (touch target)
    height: 48,                         // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
    // Pull up/right so the 48px target aligns with the row without inflating
    // the card's compact padding.
    marginTop: -8,                      // 8 × 1 (tight)
    marginRight: -8,                    // 8 × 1 (tight)
    marginLeft: 8,                      // 8 × 1 (tight) — gap from text
  },
  activityText: {
    fontSize: 16,                       // body
    color: Colors.primaryText,
    lineHeight: 24,                     // 1.5 line height
    fontFamily: Typography.fontFamily.regular,
  },
  userName: {
    fontWeight: '600',                  // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
  timestamp: {
    fontSize: 12,                       // small
    color: Colors.secondaryText,
    marginTop: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  reactionsRow: {
    flexDirection: 'row',
    marginTop: 16,                      // 8 × 2 (base)
    gap: 8,                             // 8 × 1 (tight)
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,                // 8 × 1 (tight)
    borderRadius: 16,
    backgroundColor: Colors.background,
    minHeight: 36,
    minWidth: 48,                       // 8 × 6 (touch target)
  },
  reactionButtonActive: {
    backgroundColor: '#F5F0FD',        // Light purple background
  },
  reactionCount: {
    fontSize: 12,                       // small
    fontWeight: '600',                  // semibold
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.semibold,
  },
  reactionCountActive: {
    color: Colors.accent1,
  },
});

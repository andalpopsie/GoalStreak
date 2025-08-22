// ActivityCard Component - Display social activity feed items
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { SocialActivity } from '../types/social';

interface ActivityCardProps {
  activity: SocialActivity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
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
    
    switch (type) {
      case 'habit_completed':
        if (streakCount && streakCount > 1) {
          return `${userName} completed "${habitName}" (${streakCount} day streak!)`;
        }
        return `${userName} completed "${habitName}"`;
      
      case 'streak_milestone':
        return `${userName} reached a ${milestone} streak with "${habitName}"! 🔥`;
      
      case 'habit_created':
        return `${userName} started tracking "${habitName}"`;
      
      case 'goal_achieved':
        return `${userName} achieved their goal with "${habitName}"!`;
      
      case 'weekly_goal_met':
        return `${userName} met their weekly goal for "${habitName}"`;
      
      default:
        return `${userName} updated "${habitName}"`;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getCategoryIcon = (category: string) => {
    // Map habit categories to icons (using the same mapping as habit cards)
    const categoryIcons: Record<string, string> = {
      fitness: 'barbell-outline',
      workout: 'fitness-outline',
      running: 'walk-outline',
      yoga: 'flower-outline',
      cycling: 'bicycle-outline',
      swimming: 'water-outline',
      wellness: 'heart-outline',
      health: 'medical-outline',
      sleep: 'moon-outline',
      meditation: 'leaf-outline',
      nutrition: 'nutrition-outline',
      water: 'water-outline',
      productivity: 'briefcase-outline',
      learning: 'library-outline',
      writing: 'create-outline',
      social: 'people-outline',
      creative: 'color-palette-outline',
      music: 'musical-notes-outline',
      other: 'ellipse-outline',
    };
    
    return categoryIcons[category] || 'ellipse-outline';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* User Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(activity.userName)}</Text>
        </View>
        
        {/* Activity Type Indicator */}
        <View style={[styles.activityIndicator, { backgroundColor: getActivityColor() }]}>
          <Ionicons 
            name={getActivityIcon() as any} 
            size={12} 
            color={Colors.white} 
          />
        </View>
      </View>

      {/* Activity Content */}
      <View style={styles.contentContainer}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityText}>
            {getActivityText()}
          </Text>
          <Text style={styles.timeText}>
            {getTimeAgo(activity.timestamp)}
          </Text>
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
              <Text style={styles.milestoneText}>
                {activity.streakCount} Day Streak!
              </Text>
            </View>
            {activity.streakCount >= 30 && (
              <Text style={styles.celebrationText}>🎉 Amazing dedication!</Text>
            )}
          </View>
        )}
      </View>
    </View>
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

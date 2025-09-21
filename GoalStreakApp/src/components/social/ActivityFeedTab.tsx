import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { SocialActivity, ReactionType } from '../../types/social';
import { formatRelativeTime } from '../../utils/timeUtils';
import { photoService } from '../../services/photoService';

interface ActivityFeedTabProps {
  activityFeed: SocialActivity[];
  onReaction: (activityId: string, reactionType: ReactionType) => Promise<void>;
  currentUserId?: string;
}

export default function ActivityFeedTab({
  activityFeed,
  onReaction,
  currentUserId,
}: ActivityFeedTabProps) {
  const [profilePhotos, setProfilePhotos] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadProfilePhotos();
  }, [activityFeed, currentUserId]);

  const loadProfilePhotos = async () => {
    const photos: {[key: string]: string} = {};
    
    for (const activity of activityFeed) {
      if (activity?.userId && !photos[activity.userId]) {
        try {
          const photoUri = await photoService.getProfilePhoto(activity.userId);
          if (photoUri) {
            photos[activity.userId] = photoUri;
          }
        } catch (error) {
          console.error('Error loading profile photo for user:', activity.userId, error);
        }
      }
    }
    
    if (currentUserId && !photos[currentUserId]) {
      try {
        const photoUri = await photoService.getProfilePhoto(currentUserId);
        if (photoUri) {
          photos[currentUserId] = photoUri;
        }
      } catch (error) {
        console.error('Error loading current user photo:', error);
      }
    }
    
    setProfilePhotos(photos);
  };

  const handleReaction = useCallback(async (activityId: string, reactionType: ReactionType) => {
    await onReaction(activityId, reactionType);
  }, [onReaction]);

  const getReactionCount = (activity: SocialActivity, reactionType: ReactionType) => {
    if (!activity.reactions) return 0;
    
    return Object.values(activity.reactions).filter((userReactions: any) => 
      Array.isArray(userReactions) && userReactions.includes(reactionType)
    ).length;
  };

  const hasUserReacted = (activity: SocialActivity, reactionType: ReactionType) => {
    if (!activity.reactions || !currentUserId) return false;
    
    const userReactions = activity.reactions[currentUserId];
    return Array.isArray(userReactions) && userReactions.includes(reactionType);
  };

  const getActivityText = (activity: SocialActivity) => {
    if (activity?.type === 'habit_completed') {
      const habitName = activity?.habitName || 'a habit';
      return 'completed "' + habitName + '"';
    }
    if (activity?.type === 'streak_milestone') {
      const streakCount = activity?.streakCount || 0;
      return 'reached a ' + streakCount + '-day streak!';
    }
    if (activity?.type === 'friend_added') {
      const friendName = activity?.friendName || 'someone';
      return 'is now friends with ' + friendName;
    }
    return 'had some activity';
  };

  return (
    <View>
      {activityFeed.map((activity, index) => (
        <View key={activity?.id || index} style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.profilePhoto}>
              {activity?.userPhotoURL || profilePhotos[activity?.userId || ''] ? (
                <Image 
                  source={{ uri: activity?.userPhotoURL || profilePhotos[activity?.userId || ''] }} 
                  style={styles.profileImage}
                  onError={(error) => console.warn('Image load error:', error.nativeEvent.error)}
                />
              ) : (
                <Text style={styles.initials}>
                  {String(activity?.userName || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.activityContent}>
              <View style={styles.userInfo}>
                <Text style={styles.activityUser}>
                  {String(activity?.userName || 'Unknown User')}
                </Text>
                <Text style={styles.activityTime}>
                  {formatRelativeTime(activity?.timestamp)}
                </Text>
              </View>
              <Text style={styles.activityText}>
                {getActivityText(activity)}
              </Text>

              {/* Reactions */}
              <View style={styles.reactionsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.reactionButton,
                    hasUserReacted(activity, 'heart') && styles.reactionButtonActive
                  ]}
                  onPress={() => handleReaction(activity.id, 'heart')}
                >
                  <Ionicons 
                    name={hasUserReacted(activity, 'heart') ? "heart" : "heart-outline"} 
                    size={18} 
                    color={hasUserReacted(activity, 'heart') ? '#FF6B6B' : Colors.secondaryText} 
                  />
                  {getReactionCount(activity, 'heart') > 0 && (
                    <Text style={[
                      styles.reactionCount,
                      hasUserReacted(activity, 'heart') && styles.reactionCountActive
                    ]}>
                      {getReactionCount(activity, 'heart')}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.reactionButton,
                    hasUserReacted(activity, 'flame') && styles.reactionButtonActive
                  ]}
                  onPress={() => handleReaction(activity.id, 'flame')}
                >
                  <Ionicons 
                    name={hasUserReacted(activity, 'flame') ? "flame" : "flame-outline"} 
                    size={18} 
                    color={hasUserReacted(activity, 'flame') ? '#FF8C00' : Colors.secondaryText} 
                  />
                  {getReactionCount(activity, 'flame') > 0 && (
                    <Text style={[
                      styles.reactionCount,
                      hasUserReacted(activity, 'flame') && styles.reactionCountActive
                    ]}>
                      {getReactionCount(activity, 'flame')}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.reactionButton,
                    hasUserReacted(activity, 'medal') && styles.reactionButtonActive
                  ]}
                  onPress={() => handleReaction(activity.id, 'medal')}
                >
                  <Ionicons 
                    name={hasUserReacted(activity, 'medal') ? "medal" : "medal-outline"} 
                    size={18} 
                    color={hasUserReacted(activity, 'medal') ? '#FFD700' : Colors.secondaryText} 
                  />
                  {getReactionCount(activity, 'medal') > 0 && (
                    <Text style={[
                      styles.reactionCount,
                      hasUserReacted(activity, 'medal') && styles.reactionCountActive
                    ]}>
                      {getReactionCount(activity, 'medal')}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactionButton}>
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  initials: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  activityContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  activityUser: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  activityTime: {
    fontSize: 15,
    color: Colors.secondaryText,
  },
  activityText: {
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: 4,
    lineHeight: 22,
  },
  streakInfo: {
    backgroundColor: '#00BCD415',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#00BCD4',
    fontWeight: '600',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 24,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    gap: 6,
    minWidth: 50,
  },
  reactionButtonActive: {
    backgroundColor: Colors.accent3 + '20',
  },
  reactionCount: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  reactionCountActive: {
    color: Colors.accent3,
  },
});

import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Modal, Alert, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { SocialActivity, ReactionType } from '../../types/social';
import { formatRelativeTime } from '../../utils/timeUtils';
import { photoService } from '../../services/photoService';
import { addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { achievementsService } from '../../services/achievementsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActivityFeedTabProps {
  activityFeed: SocialActivity[];
  onReaction: (activityId: string, reactionType: ReactionType) => Promise<void>;
  onCreatePost?: (habitId: string, habitName: string, habitCategory: string, photoUri: string, caption?: string) => Promise<void>;
  currentUserId?: string;
  currentUserName?: string;
  habits?: { id: string; name: string; category: string }[];
}

export default function ActivityFeedTab({
  activityFeed,
  onReaction,
  onCreatePost,
  currentUserId,
  currentUserName,
  habits = [],
}: ActivityFeedTabProps) {
  const [profilePhotos, setProfilePhotos] = useState<{[key: string]: string}>({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SocialActivity | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCounts, setCommentCounts] = useState<{[activityId: string]: number}>({});
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Progress post creation state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postPhotoUri, setPostPhotoUri] = useState<string | null>(null);
  const [postCaption, setPostCaption] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    loadProfilePhotos();
    loadCommentCounts();
  }, [activityFeed, currentUserId]);

  const loadProfilePhotos = async () => {
    // Don't load if user is not authenticated
    if (!currentUserId) {
      return;
    }

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
    if (activity?.type === 'progress_post') {
      return activity?.caption || 'shared a progress update';
    }
    if (activity?.type === 'habit_completed') {
      const habitName = activity?.habitName || 'a habit';
      return 'completed "' + habitName + '"';
    }
    if (activity?.type === 'streak_milestone') {
      const streakCount = activity?.streakCount || 0;
      return 'reached a ' + streakCount + '-day streak!';
    }
    return 'had some activity';
  };

  const loadCommentCounts = async () => {
    // Don't load if user is not authenticated
    if (!currentUserId) {
      return;
    }

    const counts: {[activityId: string]: number} = {};
    
    for (const activity of activityFeed) {
      try {
        const q = query(
          collection(db, 'comments'),
          where('activityId', '==', activity.id)
        );
        const snapshot = await getDocs(q);
        counts[activity.id] = snapshot.size;
      } catch (error) {
        console.error('Error loading comment count:', error);
      }
    }
    
    setCommentCounts(counts);
  };

  const loadCommentsForActivity = async (activityId: string) => {
    // Don't load if user is not authenticated
    if (!currentUserId) {
      return;
    }

    try {
      setLoadingComments(true);
      const q = query(
        collection(db, 'comments'),
        where('activityId', '==', activityId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const loadedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(loadedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedActivity || !currentUserId) return;

    try {
      setIsSubmitting(true);
      
      // Use the current user's name passed from parent
      const userName = currentUserName || 'User';
      
      await addDoc(collection(db, 'comments'), {
        activityId: selectedActivity.id,
        userId: currentUserId,
        userName: userName,
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      });

      // Send notification to activity owner (if not commenting on own post)
      if (selectedActivity.userId !== currentUserId) {
        try {
          await sendNotification(selectedActivity.userId, {
            title: '💬 New Comment',
            body: `Someone commented on your activity`,
            data: {
              type: 'comment',
              activityId: selectedActivity.id,
            },
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      // Update comment count locally
      setCommentCounts(prev => ({
        ...prev,
        [selectedActivity.id]: (prev[selectedActivity.id] || 0) + 1
      }));

      // Reload comments to show the new one
      await loadCommentsForActivity(selectedActivity.id);

      // Check for conversation starter achievement (5 comments)
      await checkCommentAchievements(currentUserId);

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkCommentAchievements = async (userId: string) => {
    try {
      // Count total comments by user
      const q = query(
        collection(db, 'comments'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.size >= 5) {
        await achievementsService.unlockAchievement('conversation_starter');
      }
    } catch (error) {
      console.error('Error checking comment achievements:', error);
    }
  };

  const sendNotification = async (userId: string, notification: any) => {
    // Check if user has comment notifications enabled
    try {
      const settingsStr = await AsyncStorage.getItem('notificationSettings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (!settings.comments) {
          return; // User has disabled comment notifications
        }
      }

      // Send push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // --- Progress Post Handlers ---

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPostPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPostPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleSubmitPost = async () => {
    if (!postPhotoUri || !selectedHabitId || !onCreatePost) return;

    const habit = habits.find(h => h.id === selectedHabitId);
    if (!habit) return;

    setIsPosting(true);
    try {
      await onCreatePost(habit.id, habit.name, habit.category, postPhotoUri, postCaption.trim() || undefined);
      // Reset and close
      setPostPhotoUri(null);
      setPostCaption('');
      setSelectedHabitId(null);
      setShowPostModal(false);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const resetPostModal = () => {
    setPostPhotoUri(null);
    setPostCaption('');
    setSelectedHabitId(null);
    setShowPostModal(false);
  };

  return (
    <View>
      {/* Create Post Button — Strava-style */}
      {onCreatePost && habits.length > 0 && (
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => setShowPostModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.createPostLeft}>
            <View style={styles.createPostIcon}>
              <Ionicons name="camera" size={20} color={Colors.white} />
            </View>
            <Text style={styles.createPostText}>Share a progress photo...</Text>
          </View>
          <Ionicons name="image-outline" size={24} color={Colors.accent1} />
        </TouchableOpacity>
      )}

      {activityFeed.map((activity, index) => (
        <View key={activity?.id || index} style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.profilePhoto}>
              {profilePhotos[activity?.userId || ''] ? (
                <Image 
                  source={{ uri: profilePhotos[activity?.userId || ''] }} 
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

              {/* Progress Photo — displayed below the text */}
              {activity.photoUrl && (
                <Image
                  source={{ uri: activity.photoUrl }}
                  style={styles.activityPhoto}
                  resizeMode="cover"
                  accessible={true}
                  accessibilityLabel={`Progress photo for ${activity.habitName}`}
                />
              )}

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
                <TouchableOpacity 
                  style={styles.reactionButton}
                  onPress={() => {
                    setSelectedActivity(activity);
                    loadCommentsForActivity(activity.id);
                    setShowCommentModal(true);
                  }}
                >
                  <Ionicons 
                    name={commentCounts[activity.id] > 0 ? "chatbubble" : "chatbubble-outline"} 
                    size={18} 
                    color={commentCounts[activity.id] > 0 ? Colors.accent1 : Colors.secondaryText} 
                  />
                  {commentCounts[activity.id] > 0 && (
                    <Text style={[
                      styles.reactionCount,
                      commentCounts[activity.id] > 0 && styles.reactionCountActive
                    ]}>
                      {commentCounts[activity.id]}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}

      {/* Comment Modal - Instagram/Threads Style */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCommentModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Comments</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Activity Preview */}
            {selectedActivity && (
              <View style={styles.activityPreview}>
                <View style={styles.previewPhoto}>
                  {profilePhotos[selectedActivity.userId] ? (
                    <Image 
                      source={{ uri: profilePhotos[selectedActivity.userId] }} 
                      style={styles.previewImage}
                    />
                  ) : (
                    <Text style={styles.previewInitials}>
                      {selectedActivity.userName?.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.previewContent}>
                  <Text style={styles.previewUser}>{selectedActivity.userName}</Text>
                  <Text style={styles.previewText} numberOfLines={2}>
                    {getActivityText(selectedActivity)}
                  </Text>
                </View>
              </View>
            )}

            {/* Comments List */}
            <ScrollView style={styles.commentsList}>
              {loadingComments ? (
                <ActivityIndicator size="small" color={Colors.accent1} style={{ marginVertical: 20 }} />
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentPhoto}>
                      {profilePhotos[comment.userId] ? (
                        <Image 
                          source={{ uri: profilePhotos[comment.userId] }} 
                          style={styles.commentImage}
                        />
                      ) : (
                        <View style={styles.commentPlaceholder}>
                          <Ionicons name="person" size={16} color={Colors.white} />
                        </View>
                      )}
                    </View>
                    <View style={styles.commentContent}>
                      <Text style={styles.commentText}>
                        <Text style={styles.commentUser}>{comment.userName || 'User'} </Text>
                        {comment.text}
                      </Text>
                      <Text style={styles.commentTime}>
                        {comment.createdAt ? formatRelativeTime(comment.createdAt.toDate()) : 'Just now'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noComments}>No comments yet. Be the first!</Text>
              )}
            </ScrollView>

            {/* Comment Input - Instagram Style */}
            <View style={styles.commentInputContainer}>
              <View style={styles.currentUserPhoto}>
                {profilePhotos[currentUserId || ''] ? (
                  <Image 
                    source={{ uri: profilePhotos[currentUserId || ''] }} 
                    style={styles.currentUserImage}
                  />
                ) : (
                  <View style={styles.currentUserPlaceholder}>
                    <Ionicons name="person" size={20} color={Colors.white} />
                  </View>
                )}
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={Colors.secondaryText}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!commentText.trim() || isSubmitting}
              >
                <Text style={[
                  styles.postButton,
                  (!commentText.trim() || isSubmitting) && styles.postButtonDisabled
                ]}>
                  {isSubmitting ? '...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray.light,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  activityPreview: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray.light,
  },
  previewPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  previewInitials: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  previewContent: {
    flex: 1,
  },
  previewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  previewText: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  currentUserPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  currentUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  currentUserPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.primaryText,
    maxHeight: 100,
    paddingVertical: 8,
  },
  postButton: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent1,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    color: Colors.gray.medium,
  },
  commentsList: {
    maxHeight: 300,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray.light,
  },
  commentPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  commentImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: Colors.primaryText,
    lineHeight: 20,
  },
  commentUser: {
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 4,
  },
  noComments: {
    textAlign: 'center',
    color: Colors.secondaryText,
    fontSize: 14,
    paddingVertical: 32,
  },
});

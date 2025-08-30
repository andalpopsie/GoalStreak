// useFriends Hook - Real Firebase integration
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import friendService from '../services/friendService';
import { 
  Friend, 
  FriendRequest, 
  SocialActivity, 
  SocialSettings,
  ReactionType
} from '../types/social';

interface UseFriendsReturn {
  // State
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  activityFeed: SocialActivity[];
  socialSettings: SocialSettings | null;
  
  // Loading states
  isLoadingFriends: boolean;
  isLoadingActivity: boolean;
  isSendingRequest: boolean;
  isProcessingRequest: boolean;
  
  // Actions
  sendFriendRequest: (email: string, message?: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshActivityFeed: () => Promise<void>;
  loadMoreActivities: () => Promise<void>;
  updateSocialSettings: (settings: Partial<SocialSettings>) => Promise<void>;
  
  // Activity creation
  shareHabitCompletion: (habitId: string, habitName: string, habitCategory: string, streakCount?: number) => Promise<void>;
  shareStreakMilestone: (habitId: string, habitName: string, habitCategory: string, streakCount: number) => Promise<void>;
  
  // Reactions
  addReaction: (activityId: string, reactionType: ReactionType) => Promise<void>;
  
  // Utility
  hasMoreActivities: boolean;
  error: string | null;
}

export const useFriends = (): UseFriendsReturn => {
  const { user } = useAuth();
  
  // State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [activityFeed, setActivityFeed] = useState<SocialActivity[]>([]);
  const [socialSettings, setSocialSettings] = useState<SocialSettings | null>(null);
  
  // Loading states
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  
  // Pagination
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Load friends data
  const loadFriends = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingFriends(true);
    setError(null);
    
    try {
      const friendsData = await friendService.getFriends(user.id);
      setFriends(friendsData.friends);
      setPendingRequests(friendsData.pendingRequests);
      setSentRequests(friendsData.sentRequests);
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends');
    } finally {
      setIsLoadingFriends(false);
    }
  }, [user?.id]);

  // Initialize social settings and load data
  useEffect(() => {
    if (user?.id) {
      // Set default social settings
      setSocialSettings({
        userId: user.id,
        defaultVisibility: 'friends',
        allowFriendRequests: true,
        shareStreakMilestones: true,
        shareHabitCompletions: true,
        shareNewHabits: false,
        notifyOnFriendActivity: true,
        updatedAt: new Date(),
      });

      // Load friends data
      loadFriends();
    }
  }, [user?.id, loadFriends]);

  // Real Firebase functions
  const sendFriendRequest = useCallback(async (email: string, message?: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setIsSendingRequest(true);
    setError(null);
    
    try {
      await friendService.sendFriendRequest(user.id, email, message);
      // Refresh to show sent request
      await loadFriends();
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError('Failed to send friend request');
      throw err;
    } finally {
      setIsSendingRequest(false);
    }
  }, [user?.id, loadFriends]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setIsProcessingRequest(true);
    setError(null);
    
    try {
      await friendService.acceptFriendRequest(requestId);
      await loadFriends();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError('Failed to accept friend request');
      throw err;
    } finally {
      setIsProcessingRequest(false);
    }
  }, [user?.id, loadFriends]);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setIsProcessingRequest(true);
    setError(null);
    
    try {
      await friendService.declineFriendRequest(requestId);
      await loadFriends();
    } catch (err: any) {
      console.error('Error declining friend request:', err);
      setError('Failed to decline friend request');
      throw err;
    } finally {
      setIsProcessingRequest(false);
    }
  }, [user?.id, loadFriends]);

  const removeFriend = useCallback(async (friendId: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setIsProcessingRequest(true);
    setError(null);
    
    try {
      await friendService.removeFriend(user.id, friendId);
      await loadFriends();
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError('Failed to remove friend');
      throw err;
    } finally {
      setIsProcessingRequest(false);
    }
  }, [user?.id, loadFriends]);

  const refreshFriends = useCallback(async () => {
    await loadFriends();
  }, [loadFriends]);

  const refreshActivityFeed = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingActivity(true);
    setError(null);
    
    try {
      const feedData = await friendService.getActivityFeed(user.id, 20);
      setActivityFeed(feedData.activities);
      setHasMoreActivities(feedData.hasMore);
    } catch (err: any) {
      console.error('Error refreshing activity feed:', err);
      setError('Failed to refresh activity feed');
    } finally {
      setIsLoadingActivity(false);
    }
  }, [user?.id]);

  // Real-time activity feed listener
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = friendService.subscribeToActivityFeed(
      user.id,
      (activities) => {
        setActivityFeed(activities);
        setIsLoadingActivity(false);
      },
      (error) => {
        console.error('Activity feed subscription error:', error);
        setError('Failed to load activity feed');
        setIsLoadingActivity(false);
      }
    );

    return unsubscribe;
  }, [user?.id]);

  const loadMoreActivities = useCallback(async () => {
    // Load more activities functionality
  }, []);

  const updateSocialSettings = useCallback(async (settings: Partial<SocialSettings>) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const updatedSettings = { ...socialSettings!, ...settings, updatedAt: new Date() };
      await friendService.updateSocialSettings(updatedSettings);
      setSocialSettings(updatedSettings);
    } catch (err: any) {
      console.error('Error updating social settings:', err);
      throw err;
    }
  }, [user?.id, socialSettings]);

  const shareHabitCompletion = useCallback(async (
    habitId: string, 
    habitName: string, 
    habitCategory: string, 
    streakCount?: number
  ) => {
    if (!user?.id || !socialSettings?.shareHabitCompletions) return;
    
    try {
      await friendService.createActivity(
        user.id,
        'habit_completed',
        habitId,
        habitName,
        habitCategory,
        socialSettings.defaultVisibility,
        { streakCount }
      );
    } catch (err: any) {
      console.error('Error sharing habit completion:', err);
    }
  }, [user?.id, socialSettings]);

  const shareStreakMilestone = useCallback(async (
    habitId: string, 
    habitName: string, 
    habitCategory: string, 
    streakCount: number
  ) => {
    if (!user?.id || !socialSettings?.shareStreakMilestones) return;
    
    try {
      await friendService.createActivity(
        user.id,
        'streak_milestone',
        habitId,
        habitName,
        habitCategory,
        socialSettings.defaultVisibility,
        { streakCount, milestone: `${streakCount} day streak!` }
      );
    } catch (err: any) {
      console.error('Error sharing streak milestone:', err);
    }
  }, [user?.id, socialSettings]);

  // Add reaction to activity (optimized)
  const addReaction = useCallback(async (activityId: string, reactionType: ReactionType) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }
    
    try {
      await friendService.addReaction(activityId, user.id, reactionType);
    } catch (error) {
      console.error('Error adding reaction:', error);
      setError('Failed to add reaction');
    }
  }, [user?.id]);

  return {
    // State
    friends,
    pendingRequests,
    sentRequests,
    activityFeed,
    socialSettings,
    
    // Loading states
    isLoadingFriends,
    isLoadingActivity,
    isSendingRequest,
    isProcessingRequest,
    
    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refreshFriends,
    refreshActivityFeed,
    loadMoreActivities,
    updateSocialSettings,
    
    // Activity sharing
    shareHabitCompletion,
    shareStreakMilestone,
    
    // Reactions
    addReaction,
    
    // Utility
    hasMoreActivities,
    error,
  };
};

export default useFriends;

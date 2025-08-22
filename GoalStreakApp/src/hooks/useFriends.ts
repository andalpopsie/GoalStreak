// useFriends Hook - Social Features State Management
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';
import friendService from '../services/friendService';
import { 
  Friend, 
  FriendRequest, 
  SocialActivity, 
  ActivityVisibility,
  FriendsResponse,
  ActivityFeedResponse,
  SocialSettings 
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
  const [lastActivityId, setLastActivityId] = useState<string | undefined>();
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Load friends data
  const loadFriends = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsLoadingFriends(true);
    setError(null);
    
    try {
      const friendsData = await friendService.getFriends(user.uid);
      setFriends(friendsData.friends);
      setPendingRequests(friendsData.pendingRequests);
      setSentRequests(friendsData.sentRequests);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends');
    } finally {
      setIsLoadingFriends(false);
    }
  }, [user?.uid]);

  // Load activity feed
  const loadActivityFeed = useCallback(async (reset: boolean = false) => {
    if (!user?.uid) return;
    
    setIsLoadingActivity(true);
    if (reset) {
      setError(null);
      setLastActivityId(undefined);
    }
    
    try {
      const feedData = await friendService.getActivityFeed(
        user.uid, 
        reset ? undefined : lastActivityId
      );
      
      if (reset) {
        setActivityFeed(feedData.activities);
      } else {
        setActivityFeed(prev => [...prev, ...feedData.activities]);
      }
      
      setHasMoreActivities(feedData.hasMore);
      setLastActivityId(feedData.lastActivityId);
    } catch (err) {
      console.error('Error loading activity feed:', err);
      setError('Failed to load activity feed');
    } finally {
      setIsLoadingActivity(false);
    }
  }, [user?.uid, lastActivityId]);

  // Load social settings
  const loadSocialSettings = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const settings = await friendService.getSocialSettings(user.uid);
      setSocialSettings(settings);
    } catch (err) {
      console.error('Error loading social settings:', err);
    }
  }, [user?.uid]);

  // Send friend request
  const sendFriendRequest = useCallback(async (email: string, message?: string) => {
    if (!user?.uid) return;
    
    setIsSendingRequest(true);
    setError(null);
    
    try {
      await friendService.sendFriendRequest(user.uid, email, message);
      Alert.alert('Success', 'Friend request sent!');
      await loadFriends(); // Refresh to show sent request
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      const errorMessage = err.message || 'Failed to send friend request';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSendingRequest(false);
    }
  }, [user?.uid, loadFriends]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    setIsProcessingRequest(true);
    setError(null);
    
    try {
      await friendService.acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      await loadFriends(); // Refresh friends list
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      const errorMessage = err.message || 'Failed to accept friend request';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessingRequest(false);
    }
  }, [loadFriends]);

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string) => {
    setIsProcessingRequest(true);
    setError(null);
    
    try {
      await friendService.declineFriendRequest(requestId);
      await loadFriends(); // Refresh to remove from pending
    } catch (err: any) {
      console.error('Error declining friend request:', err);
      const errorMessage = err.message || 'Failed to decline friend request';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessingRequest(false);
    }
  }, [loadFriends]);

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    if (!user?.uid) return;
    
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsProcessingRequest(true);
            setError(null);
            
            try {
              await friendService.removeFriend(user.uid, friendId);
              await loadFriends(); // Refresh friends list
            } catch (err: any) {
              console.error('Error removing friend:', err);
              const errorMessage = err.message || 'Failed to remove friend';
              setError(errorMessage);
              Alert.alert('Error', errorMessage);
            } finally {
              setIsProcessingRequest(false);
            }
          }
        }
      ]
    );
  }, [user?.uid, loadFriends]);

  // Share habit completion
  const shareHabitCompletion = useCallback(async (
    habitId: string, 
    habitName: string, 
    habitCategory: string, 
    streakCount?: number
  ) => {
    if (!user?.uid || !socialSettings?.shareHabitCompletions) return;
    
    try {
      await friendService.createActivity(
        user.uid,
        'habit_completed',
        habitId,
        habitName,
        habitCategory,
        socialSettings.defaultVisibility,
        { streakCount }
      );
      
      // Refresh activity feed to show new activity
      await loadActivityFeed(true);
    } catch (err) {
      console.error('Error sharing habit completion:', err);
    }
  }, [user?.uid, socialSettings, loadActivityFeed]);

  // Share streak milestone
  const shareStreakMilestone = useCallback(async (
    habitId: string, 
    habitName: string, 
    habitCategory: string, 
    streakCount: number
  ) => {
    if (!user?.uid || !socialSettings?.shareStreakMilestones) return;
    
    try {
      const milestone = streakCount === 7 ? '1 week' : 
                      streakCount === 30 ? '1 month' : 
                      streakCount === 100 ? '100 days' : 
                      `${streakCount} days`;
      
      await friendService.createActivity(
        user.uid,
        'streak_milestone',
        habitId,
        habitName,
        habitCategory,
        socialSettings.defaultVisibility,
        { streakCount, milestone }
      );
      
      // Refresh activity feed to show new milestone
      await loadActivityFeed(true);
    } catch (err) {
      console.error('Error sharing streak milestone:', err);
    }
  }, [user?.uid, socialSettings, loadActivityFeed]);

  // Update social settings
  const updateSocialSettings = useCallback(async (settings: Partial<SocialSettings>) => {
    if (!user?.uid) return;
    
    try {
      await friendService.updateSocialSettings(user.uid, settings);
      setSocialSettings(prev => prev ? { ...prev, ...settings } : null);
    } catch (err) {
      console.error('Error updating social settings:', err);
      Alert.alert('Error', 'Failed to update settings');
    }
  }, [user?.uid]);

  // Refresh functions
  const refreshFriends = useCallback(() => loadFriends(), [loadFriends]);
  const refreshActivityFeed = useCallback(() => loadActivityFeed(true), [loadActivityFeed]);
  const loadMoreActivities = useCallback(() => loadActivityFeed(false), [loadActivityFeed]);

  // Initialize data on mount
  useEffect(() => {
    if (user?.uid) {
      loadFriends();
      loadActivityFeed(true);
      loadSocialSettings();
    }
  }, [user?.uid, loadFriends, loadActivityFeed, loadSocialSettings]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribeFriends = friendService.subscribeFriends(user.uid, (friendsData) => {
      setFriends(friendsData.friends);
      setPendingRequests(friendsData.pendingRequests);
      setSentRequests(friendsData.sentRequests);
    });

    const unsubscribeActivity = friendService.subscribeActivityFeed(user.uid, (activities) => {
      setActivityFeed(activities);
    });

    return () => {
      unsubscribeFriends();
      unsubscribeActivity();
    };
  }, [user?.uid]);

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
    
    // Utility
    hasMoreActivities,
    error
  };
};

export default useFriends;

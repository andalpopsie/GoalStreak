import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { mockAuth, mockFirestore } from '../mocks/firebase';
import { createMockUser } from '../factories/userFactory';
import { createMockFriend, createMockFriendRequest, createMockSocialActivity } from '../factories/socialFactory';

// Mock Firebase services
jest.mock('../../services/firebase', () => ({
  auth: mockAuth,
  db: mockFirestore,
  isFirebaseConfigured: jest.fn(() => true)
}));

import { useFriends } from '../../hooks/useFriends';
import { AuthProvider } from '../../hooks/useAuth';
import friendService from '../../services/friendService';

// Get reference to mocked service
const mockFriendService = friendService as jest.Mocked<typeof friendService>;

// Mock friend service
jest.mock('../../services/friendService', () => ({
  default: {
    getFriends: jest.fn(),
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    declineFriendRequest: jest.fn(),
    removeFriend: jest.fn(),
    getActivityFeed: jest.fn(),
    subscribeToActivityFeed: jest.fn(),
    createActivity: jest.fn(),
    updateSocialSettings: jest.fn(),
    addReaction: jest.fn()
  }
}));

describe('useFriends Hook', () => {
  const mockUser = createMockUser();

  // Test wrapper component with authenticated user
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.clearAll();
    
    // Set up authenticated user
    mockAuth.currentUser = {
      uid: mockUser.id,
      email: mockUser.email,
      displayName: mockUser.displayName
    };

    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      setTimeout(() => callback(mockAuth.currentUser), 0);
      return jest.fn();
    });

    mockFirestore.setMockData('users', {
      [mockUser.id]: mockUser
    });

    // Reset mock implementations
    mockFriendService.getFriends.mockResolvedValue({
      friends: [],
      pendingRequests: [],
      sentRequests: []
    });
    mockFriendService.getActivityFeed.mockResolvedValue({
      activities: [],
      hasMore: false
    });
    mockFriendService.subscribeToActivityFeed.mockReturnValue(jest.fn());
  });

  describe('Friend Management and Real-time Updates', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useFriends(), { wrapper });

      expect(result.current.friends).toEqual([]);
      expect(result.current.pendingRequests).toEqual([]);
      expect(result.current.sentRequests).toEqual([]);
      expect(result.current.activityFeed).toEqual([]);
      expect(result.current.isLoadingFriends).toBe(false);
      expect(result.current.isLoadingActivity).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should load friends data on mount', async () => {
      const mockFriends = [createMockFriend(), createMockFriend()];
      const mockPendingRequests = [createMockFriendRequest()];
      const mockSentRequests = [createMockFriendRequest()];

      mockFriendService.getFriends.mockResolvedValue({
        friends: mockFriends,
        pendingRequests: mockPendingRequests,
        sentRequests: mockSentRequests
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.friends).toEqual(mockFriends);
      });

      expect(result.current.pendingRequests).toEqual(mockPendingRequests);
      expect(result.current.sentRequests).toEqual(mockSentRequests);
      expect(mockFriendService.getFriends).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFriendService.getFriends.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load friends');
      });

      expect(result.current.friends).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading friends:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should set up real-time activity feed subscription', async () => {
      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(mockFriendService.subscribeToActivityFeed).toHaveBeenCalledWith(
          mockUser.id,
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it('should update activity feed from real-time subscription', async () => {
      let subscriptionCallback: ((activities: any[]) => void) | null = null;
      
      mockFriendService.subscribeToActivityFeed.mockImplementation((userId, callback) => {
        subscriptionCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(mockFriendService.subscribeToActivityFeed).toHaveBeenCalled();
      });

      // Simulate real-time update
      const mockActivities = [createMockSocialActivity(), createMockSocialActivity()];
      
      act(() => {
        if (subscriptionCallback) {
          subscriptionCallback(mockActivities);
        }
      });

      expect(result.current.activityFeed).toEqual(mockActivities);
      expect(result.current.isLoadingActivity).toBe(false);
    });

    it('should handle subscription errors', async () => {
      let errorCallback: ((error: any) => void) | null = null;
      
      mockFriendService.subscribeToActivityFeed.mockImplementation((userId, callback, errCallback) => {
        errorCallback = errCallback;
        return jest.fn();
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(mockFriendService.subscribeToActivityFeed).toHaveBeenCalled();
      });

      // Simulate subscription error
      act(() => {
        if (errorCallback) {
          errorCallback(new Error('Subscription failed'));
        }
      });

      expect(result.current.error).toBe('Failed to load activity feed');
      expect(result.current.isLoadingActivity).toBe(false);
    });
  });

  describe('Friend Request Management', () => {
    it('should send friend request successfully', async () => {
      const email = 'friend@example.com';
      const message = 'Let\'s be accountability partners!';

      mockFriendService.sendFriendRequest.mockResolvedValue('request-id');
      mockFriendService.getFriends.mockResolvedValue({
        friends: [],
        pendingRequests: [],
        sentRequests: [createMockFriendRequest()]
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await act(async () => {
        await result.current.sendFriendRequest(email, message);
      });

      expect(mockFriendService.sendFriendRequest).toHaveBeenCalledWith(
        mockUser.id,
        email,
        message
      );
      expect(result.current.isSendingRequest).toBe(false);
    });

    it('should handle friend request errors', async () => {
      mockFriendService.sendFriendRequest.mockRejectedValue(new Error('User not found'));

      const { result } = renderHook(() => useFriends(), { wrapper });

      await expect(
        act(async () => {
          await result.current.sendFriendRequest('nonexistent@example.com');
        })
      ).rejects.toThrow('User not found');

      expect(result.current.error).toBe('Failed to send friend request');
      expect(result.current.isSendingRequest).toBe(false);
    });

    it('should accept friend request successfully', async () => {
      const requestId = 'request-123';
      const mockFriend = createMockFriend();

      mockFriendService.getFriends.mockResolvedValue({
        friends: [mockFriend],
        pendingRequests: [],
        sentRequests: []
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await act(async () => {
        await result.current.acceptFriendRequest(requestId);
      });

      expect(mockFriendService.acceptFriendRequest).toHaveBeenCalledWith(requestId);
      expect(result.current.isProcessingRequest).toBe(false);
    });

    it('should decline friend request successfully', async () => {
      const requestId = 'request-123';

      const { result } = renderHook(() => useFriends(), { wrapper });

      await act(async () => {
        await result.current.declineFriendRequest(requestId);
      });

      expect(mockFriendService.declineFriendRequest).toHaveBeenCalledWith(requestId);
      expect(result.current.isProcessingRequest).toBe(false);
    });

    it('should handle unauthenticated user during friend operations', async () => {
      // Set up unauthenticated state
      mockAuth.currentUser = null;
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.friends).toEqual([]);
      });

      await expect(
        act(async () => {
          await result.current.sendFriendRequest('test@example.com');
        })
      ).rejects.toThrow('User not authenticated');

      await expect(
        act(async () => {
          await result.current.acceptFriendRequest('request-id');
        })
      ).rejects.toThrow('User not authenticated');
    });

    it('should remove friend successfully', async () => {
      const friendId = 'friend-123';

      const { result } = renderHook(() => useFriends(), { wrapper });

      await act(async () => {
        await result.current.removeFriend(friendId);
      });

      expect(mockFriendService.removeFriend).toHaveBeenCalledWith(mockUser.id, friendId);
      expect(result.current.isProcessingRequest).toBe(false);
    });
  });

  describe('Activity Feed and Social Interactions', () => {
    it('should refresh activity feed successfully', async () => {
      const mockActivities = [createMockSocialActivity(), createMockSocialActivity()];
      
      mockFriendService.getActivityFeed.mockResolvedValue({
        activities: mockActivities,
        hasMore: true
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await act(async () => {
        await result.current.refreshActivityFeed();
      });

      expect(mockFriendService.getActivityFeed).toHaveBeenCalledWith(mockUser.id, 20);
      expect(result.current.activityFeed).toEqual(mockActivities);
      expect(result.current.hasMoreActivities).toBe(true);
      expect(result.current.isLoadingActivity).toBe(false);
    });

    it('should handle activity feed refresh errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFriendService.getActivityFeed.mockRejectedValue(new Error('Feed error'));

      const { result } = renderHook(() => useFriends(), { wrapper });

      await act(async () => {
        await result.current.refreshActivityFeed();
      });

      expect(result.current.error).toBe('Failed to refresh activity feed');
      expect(result.current.isLoadingActivity).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error refreshing activity feed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should add reaction to activity successfully', async () => {
      const activityId = 'activity-123';
      const reactionType = 'heart';

      mockFriendService.getActivityFeed.mockResolvedValue({
        activities: [],
        hasMore: false
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await act(async () => {
        await result.current.addReaction(activityId, reactionType);
      });

      expect(mockFriendService.addReaction).toHaveBeenCalledWith(
        activityId,
        mockUser.id,
        reactionType
      );
    });

    it('should handle reaction errors', async () => {
      mockFriendService.addReaction.mockRejectedValue(new Error('Reaction failed'));

      const { result } = renderHook(() => useFriends(), { wrapper });

      await act(async () => {
        await result.current.addReaction('activity-123', 'heart');
      });

      expect(result.current.error).toBe('Failed to add reaction');
    });

    it('should handle unauthenticated user during reactions', async () => {
      // Set up unauthenticated state
      mockAuth.currentUser = null;
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.friends).toEqual([]);
      });

      await act(async () => {
        await result.current.addReaction('activity-123', 'heart');
      });

      expect(result.current.error).toBe('User not authenticated');
    });
  });

  describe('Social Settings and Privacy Controls', () => {
    it('should initialize with default social settings', async () => {
      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings).toMatchObject({
          userId: mockUser.id,
          defaultVisibility: 'friends',
          allowFriendRequests: true,
          shareStreakMilestones: true,
          shareHabitCompletions: true,
          shareNewHabits: false,
          notifyOnFriendActivity: true
        });
      });
    });

    it('should update social settings successfully', async () => {
      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings).toBeDefined();
      });

      const updates = {
        defaultVisibility: 'public' as const,
        shareStreakMilestones: false
      };

      await act(async () => {
        await result.current.updateSocialSettings(updates);
      });

      expect(mockFriendService.updateSocialSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          ...result.current.socialSettings,
          ...updates,
          updatedAt: expect.any(Date)
        })
      );

      expect(result.current.socialSettings).toMatchObject(updates);
    });

    it('should handle social settings update errors', async () => {
      mockFriendService.updateSocialSettings.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings).toBeDefined();
      });

      await expect(
        act(async () => {
          await result.current.updateSocialSettings({ shareNewHabits: true });
        })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('Activity Sharing', () => {
    it('should share habit completion when enabled', async () => {
      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings?.shareHabitCompletions).toBe(true);
      });

      await act(async () => {
        await result.current.shareHabitCompletion(
          'habit-123',
          'Morning Run',
          'fitness',
          5
        );
      });

      expect(mockFriendService.createActivity).toHaveBeenCalledWith(
        mockUser.id,
        'habit_completed',
        'habit-123',
        'Morning Run',
        'fitness',
        'friends',
        { streakCount: 5 }
      );
    });

    it('should not share habit completion when disabled', async () => {
      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings).toBeDefined();
      });

      // Disable sharing
      await act(async () => {
        await result.current.updateSocialSettings({ shareHabitCompletions: false });
      });

      await act(async () => {
        await result.current.shareHabitCompletion(
          'habit-123',
          'Morning Run',
          'fitness',
          5
        );
      });

      expect(mockFriendService.createActivity).not.toHaveBeenCalled();
    });

    it('should share streak milestone when enabled', async () => {
      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings?.shareStreakMilestones).toBe(true);
      });

      await act(async () => {
        await result.current.shareStreakMilestone(
          'habit-123',
          'Daily Meditation',
          'mindfulness',
          30
        );
      });

      expect(mockFriendService.createActivity).toHaveBeenCalledWith(
        mockUser.id,
        'streak_milestone',
        'habit-123',
        'Daily Meditation',
        'mindfulness',
        'friends',
        { streakCount: 30, milestone: '30 day streak!' }
      );
    });

    it('should handle sharing errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFriendService.createActivity.mockRejectedValue(new Error('Sharing failed'));

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings?.shareHabitCompletions).toBe(true);
      });

      // Should not throw error
      await act(async () => {
        await result.current.shareHabitCompletion(
          'habit-123',
          'Morning Run',
          'fitness',
          5
        );
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error sharing habit completion:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Data Sharing and Privacy Controls', () => {
    it('should respect privacy settings for activity sharing', async () => {
      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings).toBeDefined();
      });

      // Set visibility to public
      await act(async () => {
        await result.current.updateSocialSettings({ defaultVisibility: 'public' });
      });

      await act(async () => {
        await result.current.shareHabitCompletion(
          'habit-123',
          'Morning Run',
          'fitness',
          5
        );
      });

      expect(mockFriendService.createActivity).toHaveBeenCalledWith(
        mockUser.id,
        'habit_completed',
        'habit-123',
        'Morning Run',
        'fitness',
        'public',
        { streakCount: 5 }
      );
    });

    it('should handle missing user during sharing', async () => {
      // Set up unauthenticated state
      mockAuth.currentUser = null;
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.socialSettings).toBe(null);
      });

      // Should not attempt to share
      await act(async () => {
        await result.current.shareHabitCompletion(
          'habit-123',
          'Morning Run',
          'fitness',
          5
        );
      });

      expect(mockFriendService.createActivity).not.toHaveBeenCalled();
    });
  });

  describe('Loading States and Error Handling', () => {
    it('should maintain loading states during operations', async () => {
      let resolveFriends: (value: any) => void;
      const friendsPromise = new Promise((resolve) => {
        resolveFriends = resolve;
      });

      mockFriendService.getFriends.mockReturnValue(friendsPromise);

      const { result } = renderHook(() => useFriends(), { wrapper });

      expect(result.current.isLoadingFriends).toBe(true);

      // Complete loading
      act(() => {
        resolveFriends!({
          friends: [],
          pendingRequests: [],
          sentRequests: []
        });
      });

      await waitFor(() => {
        expect(result.current.isLoadingFriends).toBe(false);
      });
    });

    it('should clear errors when operations succeed', async () => {
      // First, cause an error
      mockFriendService.getFriends.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load friends');
      });

      // Then succeed
      mockFriendService.getFriends.mockResolvedValue({
        friends: [],
        pendingRequests: [],
        sentRequests: []
      });

      await act(async () => {
        await result.current.refreshFriends();
      });

      expect(result.current.error).toBe(null);
    });
  });
});
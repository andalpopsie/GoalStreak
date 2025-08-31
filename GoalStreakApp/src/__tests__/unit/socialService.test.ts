// Mock Firebase Firestore functions before importing anything else
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockOnSnapshot = jest.fn();
const mockServerTimestamp = jest.fn();
const mockWriteBatch = jest.fn();

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  getDocs: mockGetDocs,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: mockServerTimestamp,
  writeBatch: mockWriteBatch
}));

// Mock Firebase service
jest.mock('../../services/firebase', () => ({
  db: 'mock-db'
}));

import friendService from '../../services/friendService';
import { 
  Friend, 
  FriendRequest, 
  SocialActivity, 
  UserProfile, 
  SocialSettings,
  ActivityType,
  ReactionType
} from '../../types/social';
import { 
  createMockFriend, 
  createMockFriendRequest, 
  createMockSocialActivity, 
  createMockUserProfile,
  createMockSocialSettings
} from '../factories/socialFactory';

describe('FriendService', () => {
  const testUserId = 'test-user-123';
  const testFriendId = 'test-friend-456';
  const testEmail = 'friend@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockCollection.mockReturnValue('mock-collection-ref');
    mockDoc.mockReturnValue({
      id: 'mock-doc-id',
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ id: 'mock-doc-id' }),
        id: 'mock-doc-id'
      })
    });
    
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);
    mockServerTimestamp.mockReturnValue('mock-timestamp');
    
    mockGetDocs.mockResolvedValue({
      docs: [],
      empty: true,
      forEach: jest.fn()
    });
    
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
      id: 'mock-doc-id'
    });
    
    mockQuery.mockReturnValue('mock-query');
    mockWhere.mockReturnValue('mock-where-query');
    mockOrderBy.mockReturnValue('mock-orderby-query');
    mockLimit.mockReturnValue('mock-limit-query');
    mockOnSnapshot.mockReturnValue(() => {});
    
    mockWriteBatch.mockReturnValue({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    });
  });

  describe('sendFriendRequest', () => {
    it('should send friend request successfully', async () => {
      const mockUserProfile = createMockUserProfile({
        id: testFriendId,
        email: testEmail,
        name: 'Friend User'
      });

      const mockSenderProfile = createMockUserProfile({
        id: testUserId,
        email: 'sender@example.com',
        name: 'Sender User'
      });

      // Mock user search by email
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: testFriendId,
          data: () => mockUserProfile
        }],
        empty: false
      });

      // Mock existing friend check (empty)
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
        empty: true
      });

      // Mock existing request check (empty)
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
        empty: true
      });

      // Mock sender profile fetch
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockSenderProfile
      });

      const requestId = await friendService.sendFriendRequest(testUserId, testEmail, 'Hello!');

      expect(requestId).toBe('new-doc-id');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fromUserId: testUserId,
          toUserId: testFriendId,
          fromUserEmail: 'sender@example.com',
          toUserEmail: testEmail,
          fromUserName: 'Sender User',
          status: 'pending',
          message: 'Hello!',
          createdAt: 'mock-timestamp'
        })
      );
    });

    it('should throw error when user not found', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      });

      await expect(
        friendService.sendFriendRequest(testUserId, 'nonexistent@example.com')
      ).rejects.toThrow('User not found with that email address');
    });

    it('should throw error when already friends', async () => {
      const mockUserProfile = createMockUserProfile({
        id: testFriendId,
        email: testEmail
      });

      // Mock user found
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: testFriendId,
          data: () => mockUserProfile
        }],
        empty: false
      });

      // Mock existing friendship found
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ id: 'existing-friendship' }],
        empty: false
      });

      await expect(
        friendService.sendFriendRequest(testUserId, testEmail)
      ).rejects.toThrow('Already friends with this user');
    });

    it('should throw error when friend request already sent', async () => {
      const mockUserProfile = createMockUserProfile({
        id: testFriendId,
        email: testEmail
      });

      // Mock user found
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: testFriendId,
          data: () => mockUserProfile
        }],
        empty: false
      });

      // Mock no existing friendship
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
        empty: true
      });

      // Mock existing request found
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ id: 'existing-request' }],
        empty: false
      });

      await expect(
        friendService.sendFriendRequest(testUserId, testEmail)
      ).rejects.toThrow('Friend request already sent');
    });
  });

  describe('acceptFriendRequest', () => {
    it('should accept friend request successfully', async () => {
      const mockRequest = createMockFriendRequest({
        id: 'request-123',
        fromUserId: testFriendId,
        toUserId: testUserId,
        fromUserEmail: 'friend@example.com',
        toUserEmail: 'user@example.com'
      });

      const mockFromUser = createMockUserProfile({
        id: testFriendId,
        name: 'Friend User',
        email: 'friend@example.com'
      });

      const mockToUser = createMockUserProfile({
        id: testUserId,
        name: 'Test User',
        email: 'user@example.com'
      });

      // Mock request fetch
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockRequest
      });

      // Mock user profile fetches
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockFromUser
      });

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockToUser
      });

      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      await friendService.acceptFriendRequest('request-123');

      expect(mockBatch.set).toHaveBeenCalledTimes(2); // Two friendship records
      expect(mockBatch.update).toHaveBeenCalledTimes(1); // Update request status
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should throw error when friend request not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      await expect(
        friendService.acceptFriendRequest('nonexistent-request')
      ).rejects.toThrow('Friend request not found');
    });
  });

  describe('declineFriendRequest', () => {
    it('should decline friend request successfully', async () => {
      await friendService.declineFriendRequest('request-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          status: 'declined',
          updatedAt: 'mock-timestamp'
        }
      );
    });

    it('should handle decline errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(
        friendService.declineFriendRequest('request-123')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('removeFriend', () => {
    it('should remove friendship successfully', async () => {
      const mockFriendship1 = { ref: 'friendship-1-ref' };
      const mockFriendship2 = { ref: 'friendship-2-ref' };

      // Mock friendship queries
      mockGetDocs.mockResolvedValueOnce({
        docs: [mockFriendship1],
        forEach: jest.fn((callback) => callback(mockFriendship1))
      });

      mockGetDocs.mockResolvedValueOnce({
        docs: [mockFriendship2],
        forEach: jest.fn((callback) => callback(mockFriendship2))
      });

      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      await friendService.removeFriend(testUserId, testFriendId);

      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('getFriends', () => {
    it('should return friends and requests', async () => {
      const mockFriend = createMockFriend({
        id: 'friend-1',
        userId: testUserId,
        friendId: testFriendId
      });

      const mockPendingRequest = createMockFriendRequest({
        id: 'request-1',
        toUserId: testUserId,
        status: 'pending'
      });

      const mockSentRequest = createMockFriendRequest({
        id: 'request-2',
        fromUserId: testUserId,
        status: 'pending'
      });

      // Mock friends query
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'friend-1',
          data: () => mockFriend
        }]
      });

      // Mock pending requests query
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'request-1',
          data: () => mockPendingRequest
        }]
      });

      // Mock sent requests query
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'request-2',
          data: () => mockSentRequest
        }]
      });

      const result = await friendService.getFriends(testUserId);

      expect(result.friends).toHaveLength(1);
      expect(result.pendingRequests).toHaveLength(1);
      expect(result.sentRequests).toHaveLength(1);
      expect(result.friends[0].id).toBe('friend-1');
    });

    it('should handle empty results', async () => {
      // Mock empty results for all queries
      mockGetDocs.mockResolvedValue({
        docs: []
      });

      const result = await friendService.getFriends(testUserId);

      expect(result.friends).toEqual([]);
      expect(result.pendingRequests).toEqual([]);
      expect(result.sentRequests).toEqual([]);
    });
  });

  describe('createActivity', () => {
    it('should create activity successfully', async () => {
      const mockUserProfile = createMockUserProfile({
        id: testUserId,
        name: 'Test User',
        email: 'test@example.com'
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserProfile
      });

      const activityId = await friendService.createActivity(
        testUserId,
        'habit_completed',
        'habit-123',
        'Morning Run',
        'fitness',
        'friends',
        { streakCount: 5 }
      );

      expect(activityId).toBe('new-doc-id');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: testUserId,
          userName: 'Test User',
          type: 'habit_completed',
          habitId: 'habit-123',
          habitName: 'Morning Run',
          habitCategory: 'fitness',
          visibility: 'friends',
          streakCount: 5,
          timestamp: 'mock-timestamp'
        })
      );
    });

    it('should handle user profile not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      const activityId = await friendService.createActivity(
        testUserId,
        'habit_completed',
        'habit-123',
        'Morning Run',
        'fitness'
      );

      expect(activityId).toBe('new-doc-id');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userName: 'Unknown User'
        })
      );
    });

    it('should validate required parameters', async () => {
      await expect(
        friendService.createActivity(testUserId, 'habit_completed', 'habit-123', '', 'fitness')
      ).rejects.toThrow('Invalid habit name provided');

      await expect(
        friendService.createActivity(testUserId, 'habit_completed', 'habit-123', 'Morning Run', '')
      ).rejects.toThrow('Invalid habit category provided');
    });
  });

  describe('getActivityFeed', () => {
    it('should return activity feed', async () => {
      const mockFriend = createMockFriend({
        friendId: testFriendId
      });

      const mockActivity = createMockSocialActivity({
        id: 'activity-1',
        userId: testFriendId,
        habitName: 'Morning Run'
      });

      // Mock getFriends call
      jest.spyOn(friendService, 'getFriends').mockResolvedValue({
        friends: [mockFriend],
        pendingRequests: [],
        sentRequests: []
      });

      // Mock activities query
      mockGetDocs.mockResolvedValue({
        docs: [{
          id: 'activity-1',
          data: () => mockActivity
        }]
      });

      const result = await friendService.getActivityFeed(testUserId);

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].id).toBe('activity-1');
      expect(result.hasMore).toBe(false);
    });

    it('should handle no friends', async () => {
      jest.spyOn(friendService, 'getFriends').mockResolvedValue({
        friends: [],
        pendingRequests: [],
        sentRequests: []
      });

      const result = await friendService.getActivityFeed(testUserId);

      expect(result.activities).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('should handle pagination', async () => {
      const mockFriend = createMockFriend({ friendId: testFriendId });
      
      jest.spyOn(friendService, 'getFriends').mockResolvedValue({
        friends: [mockFriend],
        pendingRequests: [],
        sentRequests: []
      });

      // Mock 6 activities (limit is 5, so hasMore should be true)
      const mockActivities = Array.from({ length: 6 }, (_, i) => ({
        id: `activity-${i}`,
        data: () => createMockSocialActivity({ id: `activity-${i}` })
      }));

      mockGetDocs.mockResolvedValue({
        docs: mockActivities
      });

      const result = await friendService.getActivityFeed(testUserId, undefined, 5);

      expect(result.activities).toHaveLength(5);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile successfully', async () => {
      await friendService.createUserProfile(testUserId, 'test@example.com', 'Test User');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          totalHabits: 0,
          totalCompletions: 0,
          longestStreak: 0,
          isPublic: true,
          joinedAt: 'mock-timestamp'
        })
      );
    });

    it('should handle profile creation errors', async () => {
      mockSetDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(
        friendService.createUserProfile(testUserId, 'test@example.com', 'Test User')
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updates = { name: 'Updated Name', totalHabits: 5 };

      await friendService.updateUserProfile(testUserId, updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        updates
      );
    });
  });

  describe('getSocialSettings', () => {
    it('should return existing social settings', async () => {
      const mockSettings = createMockSocialSettings({
        userId: testUserId,
        defaultVisibility: 'public'
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettings
      });

      const result = await friendService.getSocialSettings(testUserId);

      expect(result.userId).toBe(testUserId);
      expect(result.defaultVisibility).toBe('public');
    });

    it('should create default settings when none exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      const result = await friendService.getSocialSettings(testUserId);

      expect(result.userId).toBe(testUserId);
      expect(result.defaultVisibility).toBe('friends');
      expect(result.allowFriendRequests).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: testUserId,
          defaultVisibility: 'friends',
          allowFriendRequests: true,
          updatedAt: 'mock-timestamp'
        })
      );
    });
  });

  describe('updateSocialSettings', () => {
    it('should update social settings successfully', async () => {
      const updates = { defaultVisibility: 'public' as const, allowFriendRequests: false };

      await friendService.updateSocialSettings(testUserId, updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: 'mock-timestamp'
        })
      );
    });
  });

  describe('addReaction', () => {
    it('should add reaction to activity', async () => {
      const mockActivity = createMockSocialActivity({
        id: 'activity-123',
        reactions: {}
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockActivity
      });

      await friendService.addReaction('activity-123', testUserId, 'heart');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reactions: {
            [testUserId]: ['heart']
          },
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should toggle existing reaction', async () => {
      const mockActivity = createMockSocialActivity({
        id: 'activity-123',
        reactions: {
          [testUserId]: ['heart']
        }
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockActivity
      });

      await friendService.addReaction('activity-123', testUserId, 'heart');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reactions: {},
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should validate parameters', async () => {
      await expect(
        friendService.addReaction('', testUserId, 'heart')
      ).rejects.toThrow('Invalid parameters for adding reaction');

      await expect(
        friendService.addReaction('activity-123', '', 'heart')
      ).rejects.toThrow('Invalid parameters for adding reaction');
    });

    it('should handle activity not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      await expect(
        friendService.addReaction('nonexistent-activity', testUserId, 'heart')
      ).rejects.toThrow('Activity not found');
    });
  });

  describe('getReactionCounts', () => {
    it('should count reactions correctly', () => {
      const reactions = {
        'user1': ['heart' as ReactionType, 'flame' as ReactionType],
        'user2': ['heart' as ReactionType],
        'user3': ['medal' as ReactionType]
      };

      const counts = friendService.getReactionCounts(reactions);

      expect(counts).toEqual({
        heart: 2,
        flame: 1,
        medal: 1
      });
    });

    it('should handle empty reactions', () => {
      const counts = friendService.getReactionCounts();

      expect(counts).toEqual({
        heart: 0,
        flame: 0,
        medal: 0
      });
    });
  });

  describe('hasUserReacted', () => {
    it('should check user reactions correctly', () => {
      const reactions = {
        [testUserId]: ['heart' as ReactionType, 'flame' as ReactionType],
        'other-user': ['medal' as ReactionType]
      };

      expect(friendService.hasUserReacted(reactions, testUserId, 'heart')).toBe(true);
      expect(friendService.hasUserReacted(reactions, testUserId, 'medal')).toBe(false);
      expect(friendService.hasUserReacted(reactions, 'other-user', 'medal')).toBe(true);
    });

    it('should handle missing parameters', () => {
      expect(friendService.hasUserReacted(undefined, testUserId, 'heart')).toBe(false);
      expect(friendService.hasUserReacted({}, undefined, 'heart')).toBe(false);
      expect(friendService.hasUserReacted({}, testUserId, undefined)).toBe(false);
    });
  });

  describe('searchUsers', () => {
    it('should search users by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User'
      };

      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'user-1',
          data: () => mockUser
        }],
        forEach: jest.fn((callback) => callback({
          id: 'user-1',
          data: () => mockUser
        }))
      });

      const results = await friendService.searchUsers('test@example.com');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: undefined,
        mutualFriends: 0,
        isFriend: false,
        hasPendingRequest: false
      });
    });

    it('should search users by name', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com'
      };

      // First query (email) returns empty
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
        forEach: jest.fn()
      });

      // Second query (name) returns user
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'user-1',
          data: () => mockUser
        }],
        forEach: jest.fn((callback) => callback({
          id: 'user-1',
          data: () => mockUser
        }))
      });

      const results = await friendService.searchUsers('John');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Doe');
    });

    it('should handle search errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Search failed'));

      const results = await friendService.searchUsers('test');

      expect(results).toEqual([]);
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should set up friends subscription', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = friendService.subscribeFriends(testUserId, callback);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should set up activity feed subscription', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = friendService.subscribeActivityFeed(testUserId, callback);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should set up activity feed subscription with error callback', () => {
      const callback = jest.fn();
      const errorCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = friendService.subscribeToActivityFeed(testUserId, callback, errorCallback);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});
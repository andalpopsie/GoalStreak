import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SocialScreen from '../../screens/SocialScreen';

// Mock dependencies
jest.mock('../../constants/theme', () => ({
  Colors: {
    background: '#FFF6E9',
    primaryText: '#001BB7',
    primary: '#FF7F3E',
    secondaryText: '#80C4E9',
    white: '#FFFFFF',
    border: '#E8E8E8',
  },
  Typography: {
    h3: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
  },
}));

// Mock hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', displayName: 'Test User' },
  }),
}));

jest.mock('../../hooks/useFriends', () => ({
  useFriends: () => ({
    friends: [],
    pendingRequests: [],
    activityFeed: [],
    isLoadingFriends: false,
    isLoadingActivity: false,
    isSendingRequest: false,
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    declineFriendRequest: jest.fn(),
    removeFriend: jest.fn(),
    refreshFriends: jest.fn(),
    refreshActivityFeed: jest.fn(),
    addReaction: jest.fn(),
  }),
}));

// Mock components
jest.mock('../../components/SearchModal', () => 'SearchModal');
jest.mock('../../components/AddFriendModal', () => 'AddFriendModal');
jest.mock('../../components/ActivityFeedTab', () => 'ActivityFeedTab');
jest.mock('../../components/FriendsTab', () => 'FriendsTab');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('SocialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders social screen with tabs correctly', () => {
      const { getByText, getByTestId } = render(<SocialScreen />);

      expect(getByText('Feed')).toBeTruthy();
      expect(getByText('Friends')).toBeTruthy();
      expect(getByTestId('search-button')).toBeTruthy();
      expect(getByTestId('add-friend-button')).toBeTruthy();
    });

    it('renders feed tab as active by default', () => {
      const { getByTestId } = render(<SocialScreen />);

      const feedTab = getByTestId('feed-tab');
      expect(feedTab.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderBottomColor: expect.any(String)
          })
        ])
      );
    });

    it('renders activity feed component when feed tab is active', () => {
      const { getByTestId } = render(<SocialScreen />);

      expect(getByTestId('activity-feed-tab')).toBeTruthy();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to friends tab when friends tab is pressed', () => {
      const { getByText, getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByText('Friends'));

      expect(getByTestId('friends-tab-content')).toBeTruthy();
    });

    it('switches back to feed tab when feed tab is pressed', () => {
      const { getByText, getByTestId } = render(<SocialScreen />);

      // Switch to friends first
      fireEvent.press(getByText('Friends'));
      expect(getByTestId('friends-tab-content')).toBeTruthy();

      // Switch back to feed
      fireEvent.press(getByText('Feed'));
      expect(getByTestId('activity-feed-tab')).toBeTruthy();
    });

    it('refreshes data when tab changes', () => {
      const mockRefreshActivityFeed = jest.fn();
      const mockRefreshFriends = jest.fn();

      const mockUseFriends = require('../../hooks/useFriends').useFriends;
      mockUseFriends.mockReturnValue({
        friends: [],
        pendingRequests: [],
        activityFeed: [],
        isLoadingFriends: false,
        isLoadingActivity: false,
        isSendingRequest: false,
        sendFriendRequest: jest.fn(),
        acceptFriendRequest: jest.fn(),
        declineFriendRequest: jest.fn(),
        removeFriend: jest.fn(),
        refreshFriends: mockRefreshFriends,
        refreshActivityFeed: mockRefreshActivityFeed,
        addReaction: jest.fn(),
      });

      const { getByText } = render(<SocialScreen />);

      fireEvent.press(getByText('Friends'));

      expect(mockRefreshFriends).toHaveBeenCalled();
    });
  });

  describe('Empty States', () => {
    it('shows empty feed state when no activity', () => {
      const { getByText } = render(<SocialScreen />);

      expect(getByText('No Activity Yet')).toBeTruthy();
      expect(getByText('Add friends to see their habit progress and achievements here.')).toBeTruthy();
    });

    it('shows empty friends state when no friends', () => {
      const { getByText } = render(<SocialScreen />);

      fireEvent.press(getByText('Friends'));

      expect(getByText('No Friends Yet')).toBeTruthy();
      expect(getByText('Add friends to connect and share your habit journey together.')).toBeTruthy();
      expect(getByText('Add Your First Friend')).toBeTruthy();
    });

    it('opens add friend modal from empty friends state', () => {
      const { getByText, getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByText('Friends'));
      fireEvent.press(getByText('Add Your First Friend'));

      expect(getByTestId('add-friend-modal')).toBeTruthy();
    });
  });

  describe('Populated States', () => {
    const mockFriends = [
      { id: 'friend-1', name: 'John Doe', email: 'john@example.com' },
      { id: 'friend-2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    const mockActivityFeed = [
      {
        id: 'activity-1',
        userId: 'friend-1',
        userName: 'John Doe',
        type: 'habit_completed',
        habitName: 'Morning Run',
        timestamp: new Date(),
      },
    ];

    beforeEach(() => {
      const mockUseFriends = require('../../hooks/useFriends').useFriends;
      mockUseFriends.mockReturnValue({
        friends: mockFriends,
        pendingRequests: [],
        activityFeed: mockActivityFeed,
        isLoadingFriends: false,
        isLoadingActivity: false,
        isSendingRequest: false,
        sendFriendRequest: jest.fn(),
        acceptFriendRequest: jest.fn(),
        declineFriendRequest: jest.fn(),
        removeFriend: jest.fn(),
        refreshFriends: jest.fn(),
        refreshActivityFeed: jest.fn(),
        addReaction: jest.fn(),
      });
    });

    it('renders activity feed when there are activities', () => {
      const { getByTestId, queryByText } = render(<SocialScreen />);

      expect(getByTestId('activity-feed-tab')).toBeTruthy();
      expect(queryByText('No Activity Yet')).toBeNull();
    });

    it('renders friends list when there are friends', () => {
      const { getByText, getByTestId, queryByText } = render(<SocialScreen />);

      fireEvent.press(getByText('Friends'));

      expect(getByTestId('friends-tab-content')).toBeTruthy();
      expect(queryByText('No Friends Yet')).toBeNull();
    });
  });

  describe('Modal Interactions', () => {
    it('opens search modal when search button is pressed', () => {
      const { getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByTestId('search-button'));

      expect(getByTestId('search-modal')).toBeTruthy();
    });

    it('opens add friend modal when add friend button is pressed', () => {
      const { getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByTestId('add-friend-button'));

      expect(getByTestId('add-friend-modal')).toBeTruthy();
    });

    it('closes modals when close is called', () => {
      const { getByTestId, queryByTestId } = render(<SocialScreen />);

      // Open search modal
      fireEvent.press(getByTestId('search-button'));
      expect(getByTestId('search-modal')).toBeTruthy();

      // Close search modal
      fireEvent.press(getByTestId('search-modal-close'));
      expect(queryByTestId('search-modal')).toBeNull();
    });
  });

  describe('Friend Request Actions', () => {
    let mockSendFriendRequest: jest.Mock;
    let mockAcceptFriendRequest: jest.Mock;
    let mockDeclineFriendRequest: jest.Mock;
    let mockRemoveFriend: jest.Mock;

    beforeEach(() => {
      mockSendFriendRequest = jest.fn();
      mockAcceptFriendRequest = jest.fn();
      mockDeclineFriendRequest = jest.fn();
      mockRemoveFriend = jest.fn();

      const mockUseFriends = require('../../hooks/useFriends').useFriends;
      mockUseFriends.mockReturnValue({
        friends: [],
        pendingRequests: [],
        activityFeed: [],
        isLoadingFriends: false,
        isLoadingActivity: false,
        isSendingRequest: false,
        sendFriendRequest: mockSendFriendRequest,
        acceptFriendRequest: mockAcceptFriendRequest,
        declineFriendRequest: mockDeclineFriendRequest,
        removeFriend: mockRemoveFriend,
        refreshFriends: jest.fn(),
        refreshActivityFeed: jest.fn(),
        addReaction: jest.fn(),
      });
    });

    it('sends friend request successfully', async () => {
      mockSendFriendRequest.mockResolvedValue(undefined);

      const { getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByTestId('add-friend-button'));
      
      // Simulate sending friend request from modal
      fireEvent.press(getByTestId('send-friend-request'));

      await waitFor(() => {
        expect(mockSendFriendRequest).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Friend request sent successfully!');
      });
    });

    it('handles friend request error', async () => {
      mockSendFriendRequest.mockRejectedValue(new Error('Request failed'));

      const { getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByTestId('add-friend-button'));
      fireEvent.press(getByTestId('send-friend-request'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Request failed');
      });
    });

    it('accepts friend request', async () => {
      const { getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByTestId('accept-friend-request'));

      await waitFor(() => {
        expect(mockAcceptFriendRequest).toHaveBeenCalled();
      });
    });

    it('declines friend request', async () => {
      const { getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByTestId('decline-friend-request'));

      await waitFor(() => {
        expect(mockDeclineFriendRequest).toHaveBeenCalled();
      });
    });

    it('shows confirmation before removing friend', () => {
      const { getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByTestId('remove-friend-button'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Remove Friend',
        'Are you sure you want to remove this friend?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Remove', style: 'destructive' }),
        ])
      );
    });
  });

  describe('Reactions', () => {
    it('adds reaction to activity', async () => {
      const mockAddReaction = jest.fn();

      const mockUseFriends = require('../../hooks/useFriends').useFriends;
      mockUseFriends.mockReturnValue({
        friends: [],
        pendingRequests: [],
        activityFeed: [
          {
            id: 'activity-1',
            userId: 'friend-1',
            userName: 'John Doe',
            type: 'habit_completed',
            habitName: 'Morning Run',
            timestamp: new Date(),
          },
        ],
        isLoadingFriends: false,
        isLoadingActivity: false,
        isSendingRequest: false,
        sendFriendRequest: jest.fn(),
        acceptFriendRequest: jest.fn(),
        declineFriendRequest: jest.fn(),
        removeFriend: jest.fn(),
        refreshFriends: jest.fn(),
        refreshActivityFeed: jest.fn(),
        addReaction: mockAddReaction,
      });

      const { getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByTestId('reaction-button'));

      await waitFor(() => {
        expect(mockAddReaction).toHaveBeenCalledWith('activity-1', expect.any(String));
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('refreshes activity feed when pull to refresh is triggered on feed tab', () => {
      const mockRefreshActivityFeed = jest.fn();

      const mockUseFriends = require('../../hooks/useFriends').useFriends;
      mockUseFriends.mockReturnValue({
        friends: [],
        pendingRequests: [],
        activityFeed: [],
        isLoadingFriends: false,
        isLoadingActivity: false,
        isSendingRequest: false,
        sendFriendRequest: jest.fn(),
        acceptFriendRequest: jest.fn(),
        declineFriendRequest: jest.fn(),
        removeFriend: jest.fn(),
        refreshFriends: jest.fn(),
        refreshActivityFeed: mockRefreshActivityFeed,
        addReaction: jest.fn(),
      });

      const { getByTestId } = render(<SocialScreen />);

      fireEvent(getByTestId('scroll-view'), 'refresh');

      expect(mockRefreshActivityFeed).toHaveBeenCalled();
    });

    it('refreshes friends when pull to refresh is triggered on friends tab', () => {
      const mockRefreshFriends = jest.fn();

      const mockUseFriends = require('../../hooks/useFriends').useFriends;
      mockUseFriends.mockReturnValue({
        friends: [],
        pendingRequests: [],
        activityFeed: [],
        isLoadingFriends: false,
        isLoadingActivity: false,
        isSendingRequest: false,
        sendFriendRequest: jest.fn(),
        acceptFriendRequest: jest.fn(),
        declineFriendRequest: jest.fn(),
        removeFriend: jest.fn(),
        refreshFriends: mockRefreshFriends,
        refreshActivityFeed: jest.fn(),
        addReaction: jest.fn(),
      });

      const { getByText, getByTestId } = render(<SocialScreen />);

      fireEvent.press(getByText('Friends'));
      fireEvent(getByTestId('scroll-view'), 'refresh');

      expect(mockRefreshFriends).toHaveBeenCalled();
    });
  });
});
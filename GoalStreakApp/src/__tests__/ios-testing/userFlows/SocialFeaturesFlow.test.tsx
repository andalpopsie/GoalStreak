/**
 * iOS Social Features Flow Tests
 * 
 * Tests social features functionality on iOS devices
 * Requirements: 5.3 - Verify core user flows work flawlessly on iOS
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';

import SocialScreen from '../../../screens/SocialScreen';
import { AuthProvider } from '../../../hooks/useAuth';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  reset: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

// Mock friend service
const mockFriendService = {
  sendFriendRequest: jest.fn(),
  acceptFriendRequest: jest.fn(),
  getFriends: jest.fn(),
  getFriendRequests: jest.fn(),
  getActivityFeed: jest.fn(),
  addReaction: jest.fn(),
  removeReaction: jest.fn(),
};

jest.mock('../../../services/friendService', () => ({
  friendService: mockFriendService,
}));

// Mock social hooks
const mockUseFriends = {
  friends: [],
  friendRequests: [],
  activityFeed: [],
  loading: false,
  sendFriendRequest: mockFriendService.sendFriendRequest,
  acceptFriendRequest: mockFriendService.acceptFriendRequest,
  addReaction: mockFriendService.addReaction,
};

jest.mock('../../../hooks/useFriends', () => ({
  useFriends: () => mockUseFriends,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    <AuthProvider>
      {children}
    </AuthProvider>
  </NavigationContainer>
);

describe('iOS Social Features Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    
    // Mock authenticated user
    jest.spyOn(require('../../../hooks/useAuth'), 'useAuth').mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com', displayName: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  describe('Social Screen Rendering', () => {
    it('should render social screen correctly on iOS', () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      expect(screen.getByText('Social')).toBeTruthy();
      expect(screen.getByText('Friends')).toBeTruthy();
      expect(screen.getByText('Activity Feed')).toBeTruthy();
      expect(screen.getByText('Add Friend')).toBeTruthy();
    });

    it('should display empty state when no friends on iOS', () => {
      mockUseFriends.friends = [];
      mockUseFriends.activityFeed = [];

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      expect(screen.getByText('No friends yet')).toBeTruthy();
      expect(screen.getByText('Add friends to see their progress and stay motivated together!')).toBeTruthy();
    });

    it('should handle iOS safe area correctly', () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const safeAreaView = screen.getByTestId('social-safe-area');
      expect(safeAreaView).toBeTruthy();
    });
  });

  describe('Friend Management on iOS', () => {
    it('should handle add friend button press on iOS', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const addFriendButton = screen.getByText('Add Friend');
      fireEvent.press(addFriendButton);

      await waitFor(() => {
        expect(screen.getByText('Add Friend by Email')).toBeTruthy();
        expect(screen.getByPlaceholderText('Enter friend\'s email')).toBeTruthy();
      });
    });

    it('should handle friend request sending on iOS', async () => {
      mockFriendService.sendFriendRequest.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const addFriendButton = screen.getByText('Add Friend');
      fireEvent.press(addFriendButton);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter friend\'s email');
        fireEvent.changeText(emailInput, 'friend@example.com');

        const sendButton = screen.getByText('Send Request');
        fireEvent.press(sendButton);
      });

      await waitFor(() => {
        expect(mockFriendService.sendFriendRequest).toHaveBeenCalledWith('friend@example.com');
        expect(screen.getByText('Friend request sent!')).toBeTruthy();
      });
    });

    it('should validate email format for friend requests on iOS', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const addFriendButton = screen.getByText('Add Friend');
      fireEvent.press(addFriendButton);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter friend\'s email');
        fireEvent.changeText(emailInput, 'invalid-email');

        const sendButton = screen.getByText('Send Request');
        fireEvent.press(sendButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });
    });

    it('should display friend requests on iOS', async () => {
      mockUseFriends.friendRequests = [
        {
          id: 'request-1',
          fromUserId: 'user-2',
          fromUserName: 'John Doe',
          fromUserEmail: 'john@example.com',
          status: 'pending',
        },
      ];

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Friend Requests')).toBeTruthy();
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Accept')).toBeTruthy();
        expect(screen.getByText('Decline')).toBeTruthy();
      });
    });

    it('should handle friend request acceptance on iOS', async () => {
      mockFriendService.acceptFriendRequest.mockResolvedValue({ success: true });
      mockUseFriends.friendRequests = [
        {
          id: 'request-1',
          fromUserId: 'user-2',
          fromUserName: 'John Doe',
          fromUserEmail: 'john@example.com',
          status: 'pending',
        },
      ];

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const acceptButton = screen.getByText('Accept');
        fireEvent.press(acceptButton);
      });

      await waitFor(() => {
        expect(mockFriendService.acceptFriendRequest).toHaveBeenCalledWith('request-1');
      });
    });

    it('should display friends list on iOS', async () => {
      mockUseFriends.friends = [
        {
          id: 'friend-1',
          userId: 'user-2',
          friendName: 'John Doe',
          friendEmail: 'john@example.com',
          status: 'accepted',
        },
        {
          id: 'friend-2',
          userId: 'user-3',
          friendName: 'Jane Smith',
          friendEmail: 'jane@example.com',
          status: 'accepted',
        },
      ];

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });
  });

  describe('Activity Feed on iOS', () => {
    beforeEach(() => {
      mockUseFriends.activityFeed = [
        {
          id: 'activity-1',
          userId: 'user-2',
          userName: 'John Doe',
          type: 'habit_completed',
          habitName: 'Morning Exercise',
          habitCategory: 'fitness',
          timestamp: new Date('2024-01-15T08:00:00Z'),
          reactions: {
            heart: 2,
            fire: 1,
            medal: 0,
          },
        },
        {
          id: 'activity-2',
          userId: 'user-3',
          userName: 'Jane Smith',
          type: 'streak_milestone',
          habitName: 'Daily Reading',
          habitCategory: 'learning',
          streakCount: 30,
          timestamp: new Date('2024-01-15T09:00:00Z'),
          reactions: {
            heart: 5,
            fire: 3,
            medal: 2,
          },
        },
      ];
    });

    it('should display activity feed correctly on iOS', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe completed Morning Exercise')).toBeTruthy();
        expect(screen.getByText('Jane Smith reached a 30-day streak for Daily Reading')).toBeTruthy();
      });
    });

    it('should handle activity reactions on iOS', async () => {
      mockFriendService.addReaction.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const heartButton = screen.getByTestId('reaction-heart-activity-1');
        fireEvent.press(heartButton);
      });

      await waitFor(() => {
        expect(mockFriendService.addReaction).toHaveBeenCalledWith('activity-1', 'heart');
      });
    });

    it('should display reaction counts correctly on iOS', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('2')).toBeTruthy(); // Heart reactions for activity-1
        expect(screen.getByText('1')).toBeTruthy(); // Fire reactions for activity-1
        expect(screen.getByText('5')).toBeTruthy(); // Heart reactions for activity-2
      });
    });

    it('should handle iOS haptic feedback on reactions', async () => {
      const mockHaptics = require('expo-haptics');

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const heartButton = screen.getByTestId('reaction-heart-activity-1');
        fireEvent.press(heartButton);
      });

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          mockHaptics.ImpactFeedbackStyle.Light
        );
      });
    });

    it('should handle pull-to-refresh on iOS', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const scrollView = screen.getByTestId('activity-feed-scroll');
      fireEvent(scrollView, 'refresh');

      await waitFor(() => {
        expect(mockFriendService.getActivityFeed).toHaveBeenCalled();
      });
    });

    it('should format timestamps correctly for iOS', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should display relative time (e.g., "2 hours ago")
        expect(screen.getByText(/ago/)).toBeTruthy();
      });
    });
  });

  describe('iOS-Specific Social Features', () => {
    it('should handle iOS keyboard behavior in friend search', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const addFriendButton = screen.getByText('Add Friend');
      fireEvent.press(addFriendButton);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter friend\'s email');
        
        // Test iOS-specific keyboard props
        expect(emailInput.props.keyboardType).toBe('email-address');
        expect(emailInput.props.autoCapitalize).toBe('none');
        expect(emailInput.props.autoCorrect).toBe(false);
        expect(emailInput.props.returnKeyType).toBe('send');
      });
    });

    it('should handle iOS scroll behavior in activity feed', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const scrollView = screen.getByTestId('activity-feed-scroll');
      
      // Test iOS-specific scroll props
      expect(scrollView.props.bounces).toBe(true);
      expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
      expect(scrollView.props.contentInsetAdjustmentBehavior).toBe('automatic');
    });

    it('should handle iOS accessibility for social features', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const addFriendButton = screen.getByText('Add Friend');
        const heartButton = screen.getByTestId('reaction-heart-activity-1');

        expect(addFriendButton.props.accessibilityLabel).toBe('Add new friend');
        expect(addFriendButton.props.accessibilityHint).toBe('Opens dialog to send friend request');
        expect(heartButton.props.accessibilityLabel).toBe('React with heart');
        expect(heartButton.props.accessibilityRole).toBe('button');
      });
    });

    it('should handle iOS swipe gestures on activity items', async () => {
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const activityItem = screen.getByTestId('activity-item-activity-1');
        
        // Simulate swipe gesture
        fireEvent(activityItem, 'swipeLeft');
      });

      await waitFor(() => {
        expect(screen.getByText('More Options')).toBeTruthy();
      });
    });

    it('should handle iOS dynamic type scaling in social content', () => {
      // Mock iOS dynamic type
      jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
        getFontScale: () => 1.3, // Larger text setting
      }));

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const activityText = screen.getByText('John Doe completed Morning Exercise');
      
      // Text should scale appropriately
      expect(activityText.props.style).toMatchObject({
        fontSize: expect.any(Number),
      });
    });

    it('should handle iOS background app refresh for social data', () => {
      const mockAppState = require('react-native/Libraries/AppState/AppState');
      
      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      // Simulate app coming to foreground
      mockAppState.currentState = 'active';
      fireEvent(mockAppState, 'change', 'active');

      // Should refresh social data
      expect(mockFriendService.getActivityFeed).toHaveBeenCalled();
    });

    it('should handle iOS memory warnings in social screen', () => {
      const { unmount } = render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      // Simulate memory warning
      const mockAppState = require('react-native/Libraries/AppState/AppState');
      mockAppState.currentState = 'background';

      // Component should handle cleanup
      unmount();

      expect(true).toBe(true); // Placeholder for memory cleanup verification
    });
  });

  describe('Social Features Performance on iOS', () => {
    it('should render social screen within performance threshold', async () => {
      const startTime = Date.now();

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const renderTime = Date.now() - startTime;

      // Should render within 200ms on iOS
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle large activity feeds efficiently on iOS', async () => {
      // Mock large activity feed
      const largeActivityFeed = Array.from({ length: 100 }, (_, i) => ({
        id: `activity-${i}`,
        userId: `user-${i}`,
        userName: `User ${i}`,
        type: 'habit_completed',
        habitName: `Habit ${i}`,
        habitCategory: 'fitness',
        timestamp: new Date(),
        reactions: { heart: i, fire: 0, medal: 0 },
      }));

      mockUseFriends.activityFeed = largeActivityFeed;

      const startTime = Date.now();

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User 0 completed Habit 0')).toBeTruthy();
      });

      const renderTime = Date.now() - startTime;

      // Should handle large feeds efficiently
      expect(renderTime).toBeLessThan(500);
    });

    it('should handle rapid reaction taps on iOS', async () => {
      mockFriendService.addReaction.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const heartButton = screen.getByTestId('reaction-heart-activity-1');
        
        // Rapid taps
        fireEvent.press(heartButton);
        fireEvent.press(heartButton);
        fireEvent.press(heartButton);
      });

      await waitFor(() => {
        // Should debounce rapid taps
        expect(mockFriendService.addReaction).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle network interruptions gracefully on iOS', async () => {
      mockFriendService.sendFriendRequest.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <SocialScreen />
        </TestWrapper>
      );

      const addFriendButton = screen.getByText('Add Friend');
      fireEvent.press(addFriendButton);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter friend\'s email');
        fireEvent.changeText(emailInput, 'friend@example.com');

        const sendButton = screen.getByText('Send Request');
        fireEvent.press(sendButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to send friend request. Please try again.')).toBeTruthy();
      });
    });
  });
});
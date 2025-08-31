import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AppNavigator from '../../navigation/AppNavigator';

// Mock dependencies
jest.mock('../../constants/theme', () => ({
  Colors: {
    background: '#FFF6E9',
    primaryText: '#001BB7',
    accent1: '#FF7F3E',
    accent2: '#80C4E9',
    white: '#FFFFFF',
    gray: { light: '#E8E8E8', medium: '#CCCCCC', dark: '#666666' },
  },
  Typography: {
    fontSize: { sm: 14, base: 16, md: 16, lg: 18, xl: 20, '2xl': 24 },
    fontWeight: { medium: '500', semibold: '600', bold: '700' },
    fontFamily: {
      regular: 'Montserrat_400Regular',
      medium: 'Montserrat_500Medium',
      semibold: 'Montserrat_600SemiBold',
      bold: 'Montserrat_700Bold',
    },
  },
  Spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
  BorderRadius: { md: 8, sm: 4 },
}));

jest.mock('../../constants/limits', () => ({
  LIMITS: { MAX_HABITS: 6 },
}));

// Mock all hooks with realistic implementations
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

const mockHabitsState = {
  habits: [],
  isLoading: false,
  isCreating: false,
  createHabit: jest.fn(),
  completeHabit: jest.fn(),
  uncompleteHabit: jest.fn(),
  deleteHabit: jest.fn(),
  refreshHabits: jest.fn(),
  isHabitCompletedToday: jest.fn(() => false),
  getHabitStreak: jest.fn(() => ({ currentStreak: 0, longestStreak: 0 })),
};

const mockSocialState = {
  friends: [],
  pendingRequests: [],
  activityFeed: [],
  isLoadingFriends: false,
  isLoadingActivity: false,
  sendFriendRequest: jest.fn(),
  acceptFriendRequest: jest.fn(),
  refreshFriends: jest.fn(),
  refreshActivityFeed: jest.fn(),
};

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('../../hooks/useHabits', () => ({
  useHabits: () => mockHabitsState,
}));

jest.mock('../../hooks/useHabitsWithSocial', () => ({
  useHabitsWithSocial: () => mockHabitsState,
}));

jest.mock('../../hooks/useFriends', () => ({
  useFriends: () => mockSocialState,
}));

jest.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isConnected: true }),
}));

jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    habitAnalytics: [],
    trendData: [],
    insights: [],
    isLoadingAnalytics: false,
    refreshAnalytics: jest.fn(),
    refreshTrends: jest.fn(),
    refreshInsights: jest.fn(),
    selectedPeriod: 'week',
    setSelectedPeriod: jest.fn(),
    getCurrentPeriodAnalytics: () => null,
    error: null,
  }),
}));

// Mock components that might cause issues
jest.mock('../../components/SkeletonHabitCard', () => {
  const { View, Text } = require('react-native');
  return function MockSkeletonHabitCard() {
    return (
      <View testID="skeleton-habit-card">
        <Text>Loading...</Text>
      </View>
    );
  };
});

jest.mock('../../components/EmptyHabitsState', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockEmptyHabitsState({ onCreateHabit }: any) {
    return (
      <View testID="empty-habits-state">
        <Text>No habits yet</Text>
        <TouchableOpacity onPress={onCreateHabit} testID="create-habit-button">
          <Text>Create Habit</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../../components/AnimatedCircularHabitCard', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockAnimatedCircularHabitCard({ habit, onToggle, onDelete }: any) {
    return (
      <View testID="animated-habit-card">
        <Text>{habit.name}</Text>
        <TouchableOpacity onPress={onToggle} testID="habit-toggle-button">
          <Text>Toggle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete?.()} testID="habit-delete-button">
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../../components/Button', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return function MockButton({ title, onPress, loading, disabled, testID }: any) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        disabled={disabled || loading}
        testID={testID || 'button'}
      >
        <Text>{loading ? 'Loading...' : title}</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('../../components/SimpleInput', () => {
  const { TextInput } = require('react-native');
  return function MockSimpleInput({ value, onChangeText, placeholder, testID }: any) {
    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        testID={testID || 'text-input'}
      />
    );
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  Reanimated.FadeIn = { duration: jest.fn(() => ({})) };
  Reanimated.FadeInUp = { delay: jest.fn(() => ({ duration: jest.fn(() => ({})) })) };
  return Reanimated;
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('User Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock states
    Object.assign(mockAuthState, {
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
    
    Object.assign(mockHabitsState, {
      habits: [],
      isLoading: false,
      isCreating: false,
    });
    
    Object.assign(mockSocialState, {
      friends: [],
      pendingRequests: [],
      activityFeed: [],
      isLoadingFriends: false,
      isLoadingActivity: false,
    });
  });

  describe('Authentication Flow', () => {
    it('completes login flow successfully', async () => {
      const { getByTestId, getByPlaceholderText, rerender } = render(<AppNavigator />);

      // Should start on login screen
      expect(getByTestId('login-screen')).toBeTruthy();

      // Fill in login form
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      // Submit login
      fireEvent.press(getByTestId('login-button'));

      // Simulate successful login
      Object.assign(mockAuthState, {
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User' },
      });

      rerender(<AppNavigator />);

      // Should navigate to main app
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('completes signup flow successfully', async () => {
      const { getByTestId, getByText, getByPlaceholderText, rerender } = render(<AppNavigator />);

      // Navigate to signup
      fireEvent.press(getByText('Sign Up'));

      await waitFor(() => {
        expect(getByTestId('signup-screen')).toBeTruthy();
      });

      // Fill in signup form
      fireEvent.changeText(getByPlaceholderText('Display Name'), 'New User');
      fireEvent.changeText(getByPlaceholderText('Email'), 'newuser@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');

      // Submit signup
      fireEvent.press(getByTestId('signup-button'));

      // Simulate successful signup and auto-login
      Object.assign(mockAuthState, {
        isAuthenticated: true,
        user: { id: 'user-2', email: 'newuser@example.com', displayName: 'New User' },
      });

      rerender(<AppNavigator />);

      // Should navigate to main app
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });
  });

  describe('Habit Management Flow', () => {
    beforeEach(() => {
      // Set authenticated state
      Object.assign(mockAuthState, {
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User' },
      });
    });

    it('completes create habit flow successfully', async () => {
      const { getByTestId, getByText, rerender } = render(<AppNavigator />);

      // Should start on home screen with empty state
      expect(getByTestId('empty-habits-state')).toBeTruthy();

      // Click create habit from empty state
      fireEvent.press(getByTestId('create-habit-button'));

      // Should navigate to create habit screen
      await waitFor(() => {
        expect(getByTestId('create-habit-screen')).toBeTruthy();
      });

      // Fill in habit form
      fireEvent.changeText(getByTestId('habit-name-input'), 'Morning Workout');

      // Select category (fitness is default)
      fireEvent.press(getByTestId('category-selector'));
      fireEvent.press(getByText('Fitness'));

      // Select frequency (daily is default)
      fireEvent.press(getByText('Daily'));

      // Submit habit creation
      const mockCreateHabit = mockHabitsState.createHabit as jest.Mock;
      mockCreateHabit.mockResolvedValue(undefined);

      fireEvent.press(getByTestId('create-habit-button'));

      await waitFor(() => {
        expect(mockCreateHabit).toHaveBeenCalledWith({
          name: 'Morning Workout',
          category: 'fitness',
          frequency: 'daily',
          targetValue: undefined,
          unit: '',
          icon: 'checkmark-circle',
          isPublic: false,
        });
      });

      // Simulate successful creation and navigation back
      Object.assign(mockHabitsState, {
        habits: [{
          id: 'habit-1',
          name: 'Morning Workout',
          category: 'fitness',
          frequency: 'daily',
          createdAt: new Date(),
        }],
      });

      // Simulate navigation back to home
      rerender(<AppNavigator />);

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('completes habit completion flow', async () => {
      // Set up with existing habit
      Object.assign(mockHabitsState, {
        habits: [{
          id: 'habit-1',
          name: 'Morning Workout',
          category: 'fitness',
          frequency: 'daily',
          createdAt: new Date(),
        }],
      });

      const { getByTestId, getByText } = render(<AppNavigator />);

      // Should show habit card
      expect(getByText('Morning Workout')).toBeTruthy();

      // Complete the habit
      const mockCompleteHabit = mockHabitsState.completeHabit as jest.Mock;
      mockCompleteHabit.mockResolvedValue(undefined);

      fireEvent.press(getByTestId('habit-toggle-button'));

      await waitFor(() => {
        expect(mockCompleteHabit).toHaveBeenCalledWith('habit-1');
      });
    });

    it('completes habit deletion flow', async () => {
      // Set up with existing habit
      Object.assign(mockHabitsState, {
        habits: [{
          id: 'habit-1',
          name: 'Morning Workout',
          category: 'fitness',
          frequency: 'daily',
          createdAt: new Date(),
        }],
      });

      const { getByTestId, getByText } = render(<AppNavigator />);

      // Should show habit card
      expect(getByText('Morning Workout')).toBeTruthy();

      // Delete the habit
      const mockDeleteHabit = mockHabitsState.deleteHabit as jest.Mock;
      mockDeleteHabit.mockResolvedValue(undefined);

      fireEvent.press(getByTestId('habit-delete-button'));

      await waitFor(() => {
        expect(mockDeleteHabit).toHaveBeenCalledWith('habit-1');
      });
    });
  });

  describe('Social Features Flow', () => {
    beforeEach(() => {
      // Set authenticated state
      Object.assign(mockAuthState, {
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User' },
      });
    });

    it('completes friend request flow', async () => {
      const { getByTestId, getByText } = render(<AppNavigator />);

      // Navigate to social screen
      fireEvent.press(getByText('Social'));

      await waitFor(() => {
        expect(getByTestId('social-screen')).toBeTruthy();
      });

      // Should show empty friends state
      expect(getByText('No Friends Yet')).toBeTruthy();

      // Open add friend modal
      fireEvent.press(getByTestId('add-friend-button'));

      await waitFor(() => {
        expect(getByTestId('add-friend-modal')).toBeTruthy();
      });

      // Send friend request
      const mockSendFriendRequest = mockSocialState.sendFriendRequest as jest.Mock;
      mockSendFriendRequest.mockResolvedValue(undefined);

      fireEvent.press(getByTestId('send-friend-request'));

      await waitFor(() => {
        expect(mockSendFriendRequest).toHaveBeenCalled();
      });
    });

    it('navigates between feed and friends tabs', async () => {
      const { getByTestId, getByText } = render(<AppNavigator />);

      // Navigate to social screen
      fireEvent.press(getByText('Social'));

      await waitFor(() => {
        expect(getByTestId('social-screen')).toBeTruthy();
      });

      // Should start on feed tab
      expect(getByTestId('activity-feed-tab')).toBeTruthy();

      // Switch to friends tab
      fireEvent.press(getByText('Friends'));

      await waitFor(() => {
        expect(getByTestId('friends-tab-content')).toBeTruthy();
      });

      // Switch back to feed tab
      fireEvent.press(getByText('Feed'));

      await waitFor(() => {
        expect(getByTestId('activity-feed-tab')).toBeTruthy();
      });
    });
  });

  describe('Analytics Flow', () => {
    beforeEach(() => {
      // Set authenticated state
      Object.assign(mockAuthState, {
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User' },
      });
    });

    it('navigates to analytics and shows data', async () => {
      const { getByTestId, getByText } = render(<AppNavigator />);

      // Navigate to analytics screen
      fireEvent.press(getByText('Analytics'));

      await waitFor(() => {
        expect(getByTestId('analytics-screen')).toBeTruthy();
      });

      // Should show analytics content
      expect(getByText('Analytics')).toBeTruthy();
    });

    it('refreshes analytics data', async () => {
      const mockRefreshAnalytics = jest.fn();
      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: [],
        trendData: [],
        insights: [],
        isLoadingAnalytics: false,
        refreshAnalytics: mockRefreshAnalytics,
        refreshTrends: jest.fn(),
        refreshInsights: jest.fn(),
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => null,
        error: null,
      });

      const { getByTestId, getByText } = render(<AppNavigator />);

      // Navigate to analytics screen
      fireEvent.press(getByText('Analytics'));

      await waitFor(() => {
        expect(getByTestId('analytics-screen')).toBeTruthy();
      });

      // Refresh analytics
      fireEvent.press(getByTestId('refresh-button'));

      expect(mockRefreshAnalytics).toHaveBeenCalled();
    });
  });

  describe('Cross-Screen Navigation Flow', () => {
    beforeEach(() => {
      // Set authenticated state
      Object.assign(mockAuthState, {
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User' },
      });
    });

    it('navigates through all main tabs', async () => {
      const { getByTestId, getByText } = render(<AppNavigator />);

      // Start on home
      expect(getByTestId('home-screen')).toBeTruthy();

      // Navigate to social
      fireEvent.press(getByText('Social'));
      await waitFor(() => {
        expect(getByTestId('social-screen')).toBeTruthy();
      });

      // Navigate to analytics
      fireEvent.press(getByText('Analytics'));
      await waitFor(() => {
        expect(getByTestId('analytics-screen')).toBeTruthy();
      });

      // Navigate to profile
      fireEvent.press(getByText('Profile'));
      await waitFor(() => {
        expect(getByTestId('profile-screen')).toBeTruthy();
      });

      // Navigate back to home
      fireEvent.press(getByText('Dashboard'));
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('maintains state across tab switches', async () => {
      // Set up with habits
      Object.assign(mockHabitsState, {
        habits: [{
          id: 'habit-1',
          name: 'Morning Workout',
          category: 'fitness',
          frequency: 'daily',
          createdAt: new Date(),
        }],
      });

      const { getByTestId, getByText } = render(<AppNavigator />);

      // Start on home with habits
      expect(getByText('Morning Workout')).toBeTruthy();

      // Navigate to social and back
      fireEvent.press(getByText('Social'));
      await waitFor(() => {
        expect(getByTestId('social-screen')).toBeTruthy();
      });

      fireEvent.press(getByText('Dashboard'));
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Habits should still be there
      expect(getByText('Morning Workout')).toBeTruthy();
    });
  });

  describe('Error Handling in Flows', () => {
    beforeEach(() => {
      // Set authenticated state
      Object.assign(mockAuthState, {
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User' },
      });
    });

    it('handles habit creation errors gracefully', async () => {
      const { getByTestId } = render(<AppNavigator />);

      // Navigate to create habit
      fireEvent.press(getByTestId('create-habit-button'));

      await waitFor(() => {
        expect(getByTestId('create-habit-screen')).toBeTruthy();
      });

      // Fill form and submit with error
      fireEvent.changeText(getByTestId('habit-name-input'), 'Test Habit');

      const mockCreateHabit = mockHabitsState.createHabit as jest.Mock;
      mockCreateHabit.mockRejectedValue(new Error('Creation failed'));

      fireEvent.press(getByTestId('create-habit-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Creation failed');
      });
    });

    it('handles network errors gracefully', async () => {
      // Mock network error
      const mockRefreshHabits = mockHabitsState.refreshHabits as jest.Mock;
      mockRefreshHabits.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(<AppNavigator />);

      // Trigger refresh
      fireEvent(getByTestId('scroll-view'), 'refresh');

      // Should not crash the app
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });
});
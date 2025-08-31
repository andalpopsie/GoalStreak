import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CleanHomeScreen from '../../screens/CleanHomeScreen';

// Mock all the dependencies
jest.mock('../../constants/theme', () => ({
  Colors: {
    background: '#FFF6E9',
    primaryText: '#001BB7',
    accent1: '#FF7F3E',
    accent2: '#80C4E9',
    accent3: '#37B5B6',
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      light: '#E8E8E8',
      medium: '#CCCCCC',
      dark: '#666666',
    },
  },
  Typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    fontFamily: {
      regular: 'Montserrat_400Regular',
      medium: 'Montserrat_500Medium',
      semibold: 'Montserrat_600SemiBold',
      bold: 'Montserrat_700Bold',
    },
  },
  Spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
}));

jest.mock('../../constants/limits', () => ({
  LIMITS: {
    MAX_HABITS: 6,
  },
}));

// Mock hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', displayName: 'Test User' },
  }),
}));

jest.mock('../../hooks/useHabitsWithSocial', () => ({
  useHabitsWithSocial: () => ({
    habits: [],
    isLoading: false,
    isCompleting: false,
    completeHabit: jest.fn(),
    uncompleteHabit: jest.fn(),
    isHabitCompletedToday: jest.fn(() => false),
    getHabitStreak: jest.fn(() => ({ currentStreak: 0, longestStreak: 0 })),
    refreshHabits: jest.fn(),
    deleteHabit: jest.fn(),
  }),
}));

jest.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isConnected: true,
  }),
}));

// Mock components
jest.mock('../../components/SkeletonHabitCard', () => 'SkeletonHabitCard');
jest.mock('../../components/AnimatedCircularHabitCard', () => 'AnimatedCircularHabitCard');
jest.mock('../../components/OfflineBanner', () => 'OfflineBanner');
jest.mock('../../components/EmptyHabitsState', () => 'EmptyHabitsState');

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

describe('CleanHomeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders empty state when no habits exist', () => {
      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      expect(getByTestId('empty-habits-state')).toBeTruthy();
    });

    it('calls navigation to create habit from empty state', () => {
      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('create-habit-button'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateHabit');
    });
  });

  describe('Loading State', () => {
    it('renders skeleton cards when loading', () => {
      // Mock loading state
      const mockUseHabitsWithSocial = require('../../hooks/useHabitsWithSocial').useHabitsWithSocial;
      mockUseHabitsWithSocial.mockReturnValue({
        habits: [],
        isLoading: true,
        isCompleting: false,
        completeHabit: jest.fn(),
        uncompleteHabit: jest.fn(),
        isHabitCompletedToday: jest.fn(() => false),
        getHabitStreak: jest.fn(() => ({ currentStreak: 0, longestStreak: 0 })),
        refreshHabits: jest.fn(),
        deleteHabit: jest.fn(),
      });

      const { getAllByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      // Should render skeleton cards
      expect(getAllByTestId('skeleton-habit-card')).toHaveLength(4);
    });
  });

  describe('Populated State', () => {
    const mockHabits = [
      {
        id: 'habit-1',
        name: 'Morning Workout',
        category: 'fitness',
        frequency: 'daily',
        createdAt: new Date('2025-01-01'),
      },
      {
        id: 'habit-2',
        name: 'Read Book',
        category: 'learning',
        frequency: 'daily',
        createdAt: new Date('2025-01-02'),
      },
    ];

    beforeEach(() => {
      const mockUseHabitsWithSocial = require('../../hooks/useHabitsWithSocial').useHabitsWithSocial;
      mockUseHabitsWithSocial.mockReturnValue({
        habits: mockHabits,
        isLoading: false,
        isCompleting: false,
        completeHabit: jest.fn(),
        uncompleteHabit: jest.fn(),
        isHabitCompletedToday: jest.fn(() => false),
        getHabitStreak: jest.fn(() => ({ currentStreak: 5, longestStreak: 10 })),
        refreshHabits: jest.fn(),
        deleteHabit: jest.fn(),
      });
    });

    it('renders progress section with habit count', () => {
      const { getByText } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      expect(getByText('0 of 2 habits completed today')).toBeTruthy();
    });

    it('renders habit cards for each habit', () => {
      const { getAllByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      expect(getAllByTestId('animated-habit-card')).toHaveLength(2);
    });

    it('renders add habit button when under limit', () => {
      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      expect(getByTestId('add-habit-button')).toBeTruthy();
    });

    it('navigates to create habit when add button is pressed', () => {
      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('add-habit-button'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateHabit');
    });
  });

  describe('Habit Limit', () => {
    it('shows limit reached message when at max habits', () => {
      const maxHabits = Array.from({ length: 6 }, (_, i) => ({
        id: `habit-${i + 1}`,
        name: `Habit ${i + 1}`,
        category: 'fitness',
        frequency: 'daily',
        createdAt: new Date(`2025-01-0${i + 1}`),
      }));

      const mockUseHabitsWithSocial = require('../../hooks/useHabitsWithSocial').useHabitsWithSocial;
      mockUseHabitsWithSocial.mockReturnValue({
        habits: maxHabits,
        isLoading: false,
        isCompleting: false,
        completeHabit: jest.fn(),
        uncompleteHabit: jest.fn(),
        isHabitCompletedToday: jest.fn(() => false),
        getHabitStreak: jest.fn(() => ({ currentStreak: 5, longestStreak: 10 })),
        refreshHabits: jest.fn(),
        deleteHabit: jest.fn(),
      });

      const { getByText, queryByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      expect(getByText('All Set! 🎯')).toBeTruthy();
      expect(getByText('Focus on your 6 habits')).toBeTruthy();
      expect(queryByTestId('add-habit-button')).toBeNull();
    });

    it('shows alert when trying to create habit at limit', () => {
      const maxHabits = Array.from({ length: 6 }, (_, i) => ({
        id: `habit-${i + 1}`,
        name: `Habit ${i + 1}`,
        category: 'fitness',
        frequency: 'daily',
        createdAt: new Date(`2025-01-0${i + 1}`),
      }));

      const mockUseHabitsWithSocial = require('../../hooks/useHabitsWithSocial').useHabitsWithSocial;
      mockUseHabitsWithSocial.mockReturnValue({
        habits: maxHabits,
        isLoading: false,
        isCompleting: false,
        completeHabit: jest.fn(),
        uncompleteHabit: jest.fn(),
        isHabitCompletedToday: jest.fn(() => false),
        getHabitStreak: jest.fn(() => ({ currentStreak: 5, longestStreak: 10 })),
        refreshHabits: jest.fn(),
        deleteHabit: jest.fn(),
      });

      const screen = render(<CleanHomeScreen navigation={mockNavigation} />);
      
      // Simulate trying to navigate to create habit (this would be called internally)
      const component = screen.UNSAFE_getByType(CleanHomeScreen);
      
      // This would trigger the limit check
      expect(Alert.alert).toHaveBeenCalledWith(
        'Habit Limit Reached',
        expect.stringContaining('You can create up to 6 habits'),
        expect.any(Array)
      );
    });
  });

  describe('Offline State', () => {
    it('shows offline banner when not connected', () => {
      const mockUseNetworkStatus = require('../../hooks/useNetworkStatus').useNetworkStatus;
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
      });

      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      expect(getByTestId('offline-banner')).toBeTruthy();
    });
  });

  describe('Habit Actions', () => {
    const mockHabits = [
      {
        id: 'habit-1',
        name: 'Morning Workout',
        category: 'fitness',
        frequency: 'daily',
        createdAt: new Date('2025-01-01'),
      },
    ];

    let mockCompleteHabit: jest.Mock;
    let mockUncompleteHabit: jest.Mock;
    let mockDeleteHabit: jest.Mock;

    beforeEach(() => {
      mockCompleteHabit = jest.fn();
      mockUncompleteHabit = jest.fn();
      mockDeleteHabit = jest.fn();

      const mockUseHabitsWithSocial = require('../../hooks/useHabitsWithSocial').useHabitsWithSocial;
      mockUseHabitsWithSocial.mockReturnValue({
        habits: mockHabits,
        isLoading: false,
        isCompleting: false,
        completeHabit: mockCompleteHabit,
        uncompleteHabit: mockUncompleteHabit,
        isHabitCompletedToday: jest.fn(() => false),
        getHabitStreak: jest.fn(() => ({ currentStreak: 5, longestStreak: 10 })),
        refreshHabits: jest.fn(),
        deleteHabit: mockDeleteHabit,
      });
    });

    it('calls completeHabit when habit is toggled and not completed', async () => {
      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('habit-toggle-button'));

      await waitFor(() => {
        expect(mockCompleteHabit).toHaveBeenCalledWith('habit-1');
      });
    });

    it('calls uncompleteHabit when habit is toggled and completed', async () => {
      const mockUseHabitsWithSocial = require('../../hooks/useHabitsWithSocial').useHabitsWithSocial;
      mockUseHabitsWithSocial.mockReturnValue({
        habits: mockHabits,
        isLoading: false,
        isCompleting: false,
        completeHabit: mockCompleteHabit,
        uncompleteHabit: mockUncompleteHabit,
        isHabitCompletedToday: jest.fn(() => true), // Habit is completed
        getHabitStreak: jest.fn(() => ({ currentStreak: 5, longestStreak: 10 })),
        refreshHabits: jest.fn(),
        deleteHabit: mockDeleteHabit,
      });

      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('habit-toggle-button'));

      await waitFor(() => {
        expect(mockUncompleteHabit).toHaveBeenCalledWith('habit-1');
      });
    });

    it('calls deleteHabit when habit is deleted', async () => {
      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('habit-delete-button'));

      await waitFor(() => {
        expect(mockDeleteHabit).toHaveBeenCalledWith('habit-1');
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refreshHabits when pull to refresh is triggered', async () => {
      const mockRefreshHabits = jest.fn();
      
      const mockUseHabitsWithSocial = require('../../hooks/useHabitsWithSocial').useHabitsWithSocial;
      mockUseHabitsWithSocial.mockReturnValue({
        habits: [],
        isLoading: false,
        isCompleting: false,
        completeHabit: jest.fn(),
        uncompleteHabit: jest.fn(),
        isHabitCompletedToday: jest.fn(() => false),
        getHabitStreak: jest.fn(() => ({ currentStreak: 0, longestStreak: 0 })),
        refreshHabits: mockRefreshHabits,
        deleteHabit: jest.fn(),
      });

      const { getByTestId } = render(
        <CleanHomeScreen navigation={mockNavigation} />
      );

      fireEvent(getByTestId('scroll-view'), 'refresh');

      await waitFor(() => {
        expect(mockRefreshHabits).toHaveBeenCalled();
      });
    });
  });
});
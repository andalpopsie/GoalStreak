import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AnalyticsScreen from '../../screens/AnalyticsScreen';

// Mock dependencies
jest.mock('../../constants/theme', () => ({
  Colors: {
    background: '#FFF6E9',
    primaryText: '#001BB7',
    accent1: '#FF7F3E',
    accent3: '#37B5B6',
    white: '#FFFFFF',
    black: '#000000',
    error: '#FF0000',
    gray: { light: '#E8E8E8', medium: '#CCCCCC', dark: '#666666' },
  },
  Typography: {
    fontSize: { sm: 14, md: 16, lg: 18, xl: 20, '2xl': 24, xs: 12 },
    fontWeight: { medium: '500', semibold: '600', bold: '700' },
    fontFamily: {
      regular: 'Montserrat_400Regular',
      medium: 'Montserrat_500Medium',
      semibold: 'Montserrat_600SemiBold',
      bold: 'Montserrat_700Bold',
    },
  },
  Spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
}));

// Mock hooks
jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    habitAnalytics: [],
    trendData: [],
    insights: [],
    isLoadingAnalytics: false,
    isLoadingTrends: false,
    isLoadingInsights: false,
    refreshAnalytics: jest.fn(),
    refreshTrends: jest.fn(),
    refreshInsights: jest.fn(),
    selectedPeriod: 'week',
    setSelectedPeriod: jest.fn(),
    getCurrentPeriodAnalytics: () => null,
    error: null,
  }),
}));

// Mock components
jest.mock('../../components/StatsOverview', () => 'StatsOverview');
jest.mock('../../components/ProgressChart', () => 'ProgressChart');
jest.mock('../../components/InsightsCard', () => 'InsightsCard');

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

describe('AnalyticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders analytics screen correctly', () => {
      const { getByText, getByTestId } = render(<AnalyticsScreen />);

      expect(getByText('Analytics')).toBeTruthy();
      expect(getByTestId('refresh-button')).toBeTruthy();
    });

    it('renders progress chart', () => {
      const { getByTestId } = render(<AnalyticsScreen />);

      expect(getByTestId('progress-chart')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('shows empty analytics state when no data', () => {
      const { getByText } = render(<AnalyticsScreen />);

      expect(getByText('No Analytics Yet')).toBeTruthy();
      expect(getByText('Create and complete some habits to see your detailed analytics and insights!')).toBeTruthy();
      expect(getByText('Refresh Analytics')).toBeTruthy();
    });

    it('shows loading message when analytics are loading', () => {
      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: [],
        trendData: [],
        insights: [],
        isLoadingAnalytics: true,
        isLoadingTrends: false,
        isLoadingInsights: false,
        refreshAnalytics: jest.fn(),
        refreshTrends: jest.fn(),
        refreshInsights: jest.fn(),
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => null,
        error: null,
      });

      const { getByText } = render(<AnalyticsScreen />);

      expect(getByText('Loading your habit analytics...')).toBeTruthy();
      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  describe('Populated State', () => {
    const mockHabitAnalytics = [
      {
        habitId: 'habit-1',
        habitName: 'Morning Workout',
        category: 'fitness',
        totalCompletions: 25,
        completionRate: 83.3,
        currentStreak: 5,
        longestStreak: 12,
      },
      {
        habitId: 'habit-2',
        habitName: 'Read Book',
        category: 'learning',
        totalCompletions: 18,
        completionRate: 60.0,
        currentStreak: 3,
        longestStreak: 8,
      },
    ];

    const mockInsights = [
      {
        id: 'insight-1',
        type: 'streak_milestone',
        title: 'Great Progress!',
        description: 'You\'ve maintained a 5-day streak on Morning Workout',
        icon: 'flame',
      },
    ];

    const mockCurrentPeriodAnalytics = {
      totalCompletions: 43,
      completionRate: 71.7,
      activeHabits: 2,
      longestStreak: 12,
    };

    beforeEach(() => {
      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: mockHabitAnalytics,
        trendData: [
          { date: '2025-01-01', completions: 2 },
          { date: '2025-01-02', completions: 1 },
        ],
        insights: mockInsights,
        isLoadingAnalytics: false,
        isLoadingTrends: false,
        isLoadingInsights: false,
        refreshAnalytics: jest.fn(),
        refreshTrends: jest.fn(),
        refreshInsights: jest.fn(),
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => mockCurrentPeriodAnalytics,
        error: null,
      });
    });

    it('renders stats overview when analytics are available', () => {
      const { getByTestId } = render(<AnalyticsScreen />);

      expect(getByTestId('stats-overview')).toBeTruthy();
    });

    it('renders habit analytics cards', () => {
      const { getByText } = render(<AnalyticsScreen />);

      expect(getByText('Habit Performance')).toBeTruthy();
      expect(getByText('Morning Workout')).toBeTruthy();
      expect(getByText('Read Book')).toBeTruthy();
      expect(getByText('25')).toBeTruthy(); // Total completions
      expect(getByText('83.3%')).toBeTruthy(); // Completion rate
      expect(getByText('5')).toBeTruthy(); // Current streak
    });

    it('shows habit categories correctly', () => {
      const { getByText } = render(<AnalyticsScreen />);

      expect(getByText('Fitness')).toBeTruthy();
      expect(getByText('Learning')).toBeTruthy();
    });

    it('shows best streak when different from current', () => {
      const { getByText } = render(<AnalyticsScreen />);

      expect(getByText('Best streak: 12 days')).toBeTruthy();
      expect(getByText('Best streak: 8 days')).toBeTruthy();
    });

    it('renders insights section', () => {
      const { getByText, getByTestId } = render(<AnalyticsScreen />);

      expect(getByText('Personal Insights')).toBeTruthy();
      expect(getByTestId('insights-card')).toBeTruthy();
    });

    it('shows view more button when more than 5 habits', () => {
      const manyHabits = Array.from({ length: 7 }, (_, i) => ({
        habitId: `habit-${i + 1}`,
        habitName: `Habit ${i + 1}`,
        category: 'fitness',
        totalCompletions: 10,
        completionRate: 80,
        currentStreak: 3,
        longestStreak: 5,
      }));

      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: manyHabits,
        trendData: [],
        insights: [],
        isLoadingAnalytics: false,
        isLoadingTrends: false,
        isLoadingInsights: false,
        refreshAnalytics: jest.fn(),
        refreshTrends: jest.fn(),
        refreshInsights: jest.fn(),
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => mockCurrentPeriodAnalytics,
        error: null,
      });

      const { getByText } = render(<AnalyticsScreen />);

      expect(getByText('View All Habits')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('shows error message when there is an error', () => {
      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: [],
        trendData: [],
        insights: [],
        isLoadingAnalytics: false,
        isLoadingTrends: false,
        isLoadingInsights: false,
        refreshAnalytics: jest.fn(),
        refreshTrends: jest.fn(),
        refreshInsights: jest.fn(),
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => null,
        error: 'Failed to load analytics data',
      });

      const { getByText, getByTestId } = render(<AnalyticsScreen />);

      expect(getByText('Failed to load analytics data')).toBeTruthy();
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    it('calls refresh when retry button is pressed', () => {
      const mockRefreshAnalytics = jest.fn();
      const mockRefreshTrends = jest.fn();
      const mockRefreshInsights = jest.fn();

      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: [],
        trendData: [],
        insights: [],
        isLoadingAnalytics: false,
        isLoadingTrends: false,
        isLoadingInsights: false,
        refreshAnalytics: mockRefreshAnalytics,
        refreshTrends: mockRefreshTrends,
        refreshInsights: mockRefreshInsights,
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => null,
        error: 'Failed to load analytics data',
      });

      const { getByTestId } = render(<AnalyticsScreen />);

      fireEvent.press(getByTestId('retry-button'));

      expect(mockRefreshAnalytics).toHaveBeenCalled();
      expect(mockRefreshTrends).toHaveBeenCalled();
      expect(mockRefreshInsights).toHaveBeenCalled();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refresh functions when refresh button is pressed', () => {
      const mockRefreshAnalytics = jest.fn();
      const mockRefreshTrends = jest.fn();
      const mockRefreshInsights = jest.fn();

      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: [],
        trendData: [],
        insights: [],
        isLoadingAnalytics: false,
        isLoadingTrends: false,
        isLoadingInsights: false,
        refreshAnalytics: mockRefreshAnalytics,
        refreshTrends: mockRefreshTrends,
        refreshInsights: mockRefreshInsights,
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => null,
        error: null,
      });

      const { getByTestId } = render(<AnalyticsScreen />);

      fireEvent.press(getByTestId('refresh-button'));

      expect(mockRefreshAnalytics).toHaveBeenCalled();
      expect(mockRefreshTrends).toHaveBeenCalled();
      expect(mockRefreshInsights).toHaveBeenCalled();
    });

    it('calls refresh functions when pull to refresh is triggered', () => {
      const mockRefreshAnalytics = jest.fn();
      const mockRefreshTrends = jest.fn();
      const mockRefreshInsights = jest.fn();

      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: [],
        trendData: [],
        insights: [],
        isLoadingAnalytics: false,
        isLoadingTrends: false,
        isLoadingInsights: false,
        refreshAnalytics: mockRefreshAnalytics,
        refreshTrends: mockRefreshTrends,
        refreshInsights: mockRefreshInsights,
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => null,
        error: null,
      });

      const { getByTestId } = render(<AnalyticsScreen />);

      fireEvent(getByTestId('scroll-view'), 'refresh');

      expect(mockRefreshAnalytics).toHaveBeenCalled();
      expect(mockRefreshTrends).toHaveBeenCalled();
      expect(mockRefreshInsights).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when refreshing', () => {
      const mockUseAnalytics = require('../../hooks/useAnalytics').useAnalytics;
      mockUseAnalytics.mockReturnValue({
        habitAnalytics: [],
        trendData: [],
        insights: [],
        isLoadingAnalytics: true,
        isLoadingTrends: true,
        isLoadingInsights: true,
        refreshAnalytics: jest.fn(),
        refreshTrends: jest.fn(),
        refreshInsights: jest.fn(),
        selectedPeriod: 'week',
        setSelectedPeriod: jest.fn(),
        getCurrentPeriodAnalytics: () => null,
        error: null,
      });

      const { getByTestId } = render(<AnalyticsScreen />);

      const refreshControl = getByTestId('scroll-view').props.refreshControl;
      expect(refreshControl.props.refreshing).toBe(true);
    });
  });
});
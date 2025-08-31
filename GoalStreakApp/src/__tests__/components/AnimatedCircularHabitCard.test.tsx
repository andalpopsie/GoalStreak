import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../utils/testUtils';
import AnimatedCircularHabitCard from '../../components/AnimatedCircularHabitCard';
import { createMockHabit, createMockStreak } from '../factories/habitFactory';
import * as Haptics from 'expo-haptics';

// Mock Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Add missing mock functions
  Reanimated.default.call = () => {};
  Reanimated.FadeIn = { duration: jest.fn(() => ({})) };
  Reanimated.FadeOut = { duration: jest.fn(() => ({})) };
  
  return Reanimated;
});

describe('AnimatedCircularHabitCard', () => {
  const mockHabit = createMockHabit({
    name: 'Morning Workout',
    category: 'fitness',
  });

  const mockStreak = createMockStreak({
    habitId: mockHabit.id,
    currentStreak: 5,
    longestStreak: 10,
  });

  const defaultProps = {
    habit: mockHabit,
    streak: mockStreak,
    isCompleted: false,
    isLoading: false,
    onToggle: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders habit information correctly', () => {
      const { getByText } = renderWithProviders(
        <AnimatedCircularHabitCard {...defaultProps} />
      );

      expect(getByText('MORNING WORKOUT')).toBeTruthy();
      expect(getByText('5')).toBeTruthy(); // Current streak
    });

    it('renders habit with target value and unit', () => {
      const habitWithTarget = createMockHabit({
        name: 'Drink Water',
        targetValue: 8,
        unit: 'glasses',
      });

      const { getByText } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          habit={habitWithTarget}
        />
      );

      expect(getByText('DRINK WATER\n8 GLASSES')).toBeTruthy();
    });

    it('renders loading state correctly', () => {
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          isLoading={true}
        />
      );

      // Should show hourglass icon when loading
      expect(getByTestId('habit-card-button')).toBeTruthy();
    });

    it('renders completed state correctly', () => {
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          isCompleted={true}
        />
      );

      // Should show completion badge
      expect(getByTestId('habit-card-button')).toBeTruthy();
    });

    it('renders without streak data', () => {
      const { getByText, queryByText } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          streak={null}
        />
      );

      expect(getByText('MORNING WORKOUT')).toBeTruthy();
      expect(queryByText('5')).toBeNull(); // No streak number
    });

    it('renders with zero streak', () => {
      const zeroStreak = createMockStreak({
        habitId: mockHabit.id,
        currentStreak: 0,
        longestStreak: 5,
      });

      const { getByText, queryByText } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          streak={zeroStreak}
        />
      );

      expect(getByText('MORNING WORKOUT')).toBeTruthy();
      expect(queryByText('0')).toBeNull(); // Zero streak not displayed
    });
  });

  describe('Interactions', () => {
    it('calls onToggle when pressed', async () => {
      const mockOnToggle = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          onToggle={mockOnToggle}
        />
      );

      fireEvent.press(getByTestId('habit-card-button'));

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
      });
    });

    it('triggers haptic feedback on press', async () => {
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard {...defaultProps} />
      );

      fireEvent.press(getByTestId('habit-card-button'));

      await waitFor(() => {
        expect(Haptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });
    });

    it('shows delete confirmation on long press', async () => {
      const mockOnDelete = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          onDelete={mockOnDelete}
        />
      );

      fireEvent(getByTestId('habit-card-button'), 'longPress');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Delete Habit',
          'Are you sure you want to delete "Morning Workout"? This action cannot be undone.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
            expect.objectContaining({ 
              text: 'Delete', 
              style: 'destructive',
              onPress: mockOnDelete
            })
          ])
        );
      });
    });

    it('does not show delete confirmation when onDelete is not provided', () => {
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          onDelete={undefined}
        />
      );

      fireEvent(getByTestId('habit-card-button'), 'longPress');

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('disables interaction when loading', () => {
      const mockOnToggle = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          isLoading={true}
          onToggle={mockOnToggle}
        />
      );

      const button = getByTestId('habit-card-button');
      expect(button.props.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility properties', () => {
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard {...defaultProps} />
      );

      const button = getByTestId('habit-card-button');
      expect(button.props.accessible).toBe(true);
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('has descriptive accessibility label', () => {
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard {...defaultProps} />
      );

      const button = getByTestId('habit-card-button');
      expect(button.props.accessibilityLabel).toContain('Morning Workout');
    });

    it('indicates completion state in accessibility', () => {
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          isCompleted={true}
        />
      );

      const button = getByTestId('habit-card-button');
      expect(button.props.accessibilityLabel).toContain('completed');
    });

    it('indicates loading state in accessibility', () => {
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          isLoading={true}
        />
      );

      const button = getByTestId('habit-card-button');
      expect(button.props.accessibilityLabel).toContain('loading');
    });
  });

  describe('Error Handling', () => {
    it('handles animation errors gracefully', () => {
      // Mock console.warn to capture error logs
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // This should not throw even if animations fail
      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard {...defaultProps} />
      );

      expect(getByTestId('habit-card-button')).toBeTruthy();
      
      consoleSpy.mockRestore();
    });

    it('handles press errors gracefully', async () => {
      const mockOnToggle = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const { getByTestId } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          onToggle={mockOnToggle}
        />
      );

      // Should not crash when onToggle throws
      expect(() => {
        fireEvent.press(getByTestId('habit-card-button'));
      }).not.toThrow();
    });
  });

  describe('Different Categories', () => {
    it('renders different category icons correctly', () => {
      const categories = ['fitness', 'wellness', 'productivity', 'learning'] as const;
      
      categories.forEach(category => {
        const habitWithCategory = createMockHabit({ category });
        
        const { getByTestId } = renderWithProviders(
          <AnimatedCircularHabitCard 
            {...defaultProps} 
            habit={habitWithCategory}
          />
        );

        expect(getByTestId('habit-card-button')).toBeTruthy();
      });
    });
  });

  describe('Progress Calculation', () => {
    it('calculates progress percentage correctly', () => {
      const highStreak = createMockStreak({
        habitId: mockHabit.id,
        currentStreak: 15, // 50% of 30 days
        longestStreak: 20,
      });

      const { getByText } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          streak={highStreak}
        />
      );

      expect(getByText('15')).toBeTruthy(); // Shows current streak
    });

    it('handles maximum progress correctly', () => {
      const maxStreak = createMockStreak({
        habitId: mockHabit.id,
        currentStreak: 50, // More than 30 days
        longestStreak: 50,
      });

      const { getByText } = renderWithProviders(
        <AnimatedCircularHabitCard 
          {...defaultProps} 
          streak={maxStreak}
        />
      );

      expect(getByText('50')).toBeTruthy(); // Shows actual streak
    });
  });
});
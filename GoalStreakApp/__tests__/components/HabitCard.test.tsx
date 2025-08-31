import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../utils/testUtils';
import HabitCard from '../../components/HabitCard';
import { createMockHabit, createMockStreak } from '../factories/habitFactory';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('HabitCard', () => {
  const mockHabit = createMockHabit({
    name: 'Morning Workout',
    category: 'fitness',
    frequency: 'daily',
    description: 'Start the day with energy',
  });

  const mockStreak = createMockStreak({
    habitId: mockHabit.id,
    currentStreak: 7,
    longestStreak: 15,
  });

  const defaultProps = {
    habit: mockHabit,
    streak: mockStreak,
    isCompleted: false,
    isLoading: false,
    onComplete: jest.fn(),
    onUncomplete: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders habit information correctly', () => {
      const { getByText } = renderWithProviders(
        <HabitCard {...defaultProps} />
      );

      expect(getByText('Morning Workout')).toBeTruthy();
      expect(getByText('Daily')).toBeTruthy();
      expect(getByText('Start the day with energy')).toBeTruthy();
    });

    it('renders streak information correctly', () => {
      const { getByText } = renderWithProviders(
        <HabitCard {...defaultProps} />
      );

      expect(getByText('7 days')).toBeTruthy();
      expect(getByText('Best: 15')).toBeTruthy();
    });

    it('renders singular day for streak of 1', () => {
      const singleDayStreak = createMockStreak({
        habitId: mockHabit.id,
        currentStreak: 1,
        longestStreak: 5,
      });

      const { getByText } = renderWithProviders(
        <HabitCard {...defaultProps} streak={singleDayStreak} />
      );

      expect(getByText('1 day')).toBeTruthy(); // Singular form
    });

    it('renders habit with target value and unit', () => {
      const habitWithTarget = createMockHabit({
        name: 'Drink Water',
        targetValue: 8,
        unit: 'glasses',
      });

      const { getByText } = renderWithProviders(
        <HabitCard {...defaultProps} habit={habitWithTarget} />
      );

      expect(getByText('8 glasses')).toBeTruthy();
    });

    it('renders different frequency types correctly', () => {
      const weeklyHabit = createMockHabit({
        name: 'Gym Session',
        frequency: 'weekly',
      });

      const { getByText } = renderWithProviders(
        <HabitCard {...defaultProps} habit={weeklyHabit} />
      );

      expect(getByText('Weekly')).toBeTruthy();
    });

    it('renders completed state correctly', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} isCompleted={true} />
      );

      expect(getByText('Completed!')).toBeTruthy();
      expect(getByTestId('complete-button')).toBeTruthy();
    });

    it('renders loading state correctly', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} isLoading={true} />
      );

      expect(getByText('Updating...')).toBeTruthy();
      const button = getByTestId('complete-button');
      expect(button.props.disabled).toBe(true);
    });

    it('renders without description when not provided', () => {
      const habitWithoutDescription = createMockHabit({
        name: 'Simple Habit',
        description: undefined,
      });

      const { queryByText } = renderWithProviders(
        <HabitCard {...defaultProps} habit={habitWithoutDescription} />
      );

      expect(queryByText('Start the day with energy')).toBeNull();
    });

    it('renders without streak when not provided', () => {
      const { queryByText } = renderWithProviders(
        <HabitCard {...defaultProps} streak={undefined} />
      );

      expect(queryByText('7 days')).toBeNull();
      expect(queryByText('Best: 15')).toBeNull();
    });

    it('does not render best streak when longest streak is 0', () => {
      const noLongestStreak = createMockStreak({
        habitId: mockHabit.id,
        currentStreak: 3,
        longestStreak: 0,
      });

      const { getByText, queryByText } = renderWithProviders(
        <HabitCard {...defaultProps} streak={noLongestStreak} />
      );

      expect(getByText('3 days')).toBeTruthy();
      expect(queryByText('Best: 0')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('calls onComplete when complete button is pressed and habit is not completed', async () => {
      const mockOnComplete = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <HabitCard 
          {...defaultProps} 
          isCompleted={false}
          onComplete={mockOnComplete}
        />
      );

      fireEvent.press(getByTestId('complete-button'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('shows confirmation dialog when trying to uncomplete', async () => {
      const mockOnUncomplete = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <HabitCard 
          {...defaultProps} 
          isCompleted={true}
          onUncomplete={mockOnUncomplete}
        />
      );

      fireEvent.press(getByTestId('complete-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Undo Completion',
          'Are you sure you want to mark this habit as not completed today?',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
            expect.objectContaining({ 
              text: 'Undo', 
              style: 'destructive',
              onPress: mockOnUncomplete
            })
          ])
        );
      });
    });

    it('calls onEdit when edit button is pressed', async () => {
      const mockOnEdit = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} onEdit={mockOnEdit} />
      );

      fireEvent.press(getByTestId('edit-button'));

      await waitFor(() => {
        expect(mockOnEdit).toHaveBeenCalledTimes(1);
      });
    });

    it('shows delete confirmation when delete button is pressed', async () => {
      const mockOnDelete = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} onDelete={mockOnDelete} />
      );

      fireEvent.press(getByTestId('delete-button'));

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

    it('does not render edit button when onEdit is not provided', () => {
      const { queryByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} onEdit={undefined} />
      );

      expect(queryByTestId('edit-button')).toBeNull();
    });

    it('does not render delete button when onDelete is not provided', () => {
      const { queryByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} onDelete={undefined} />
      );

      expect(queryByTestId('delete-button')).toBeNull();
    });

    it('does not trigger actions when loading', () => {
      const mockOnComplete = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <HabitCard 
          {...defaultProps} 
          isLoading={true}
          onComplete={mockOnComplete}
        />
      );

      fireEvent.press(getByTestId('complete-button'));

      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility properties for complete button', () => {
      const { getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} />
      );

      const button = getByTestId('complete-button');
      expect(button.props.accessible).toBe(true);
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('has descriptive accessibility labels for action buttons', () => {
      const { getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} />
      );

      const editButton = getByTestId('edit-button');
      const deleteButton = getByTestId('delete-button');

      expect(editButton.props.accessibilityLabel).toContain('Edit');
      expect(deleteButton.props.accessibilityLabel).toContain('Delete');
    });

    it('indicates completion state in accessibility', () => {
      const { getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} isCompleted={true} />
      );

      const button = getByTestId('complete-button');
      expect(button.props.accessibilityLabel).toContain('completed');
    });
  });

  describe('Visual States', () => {
    it('applies completed styling when habit is completed', () => {
      const { getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} isCompleted={true} />
      );

      const container = getByTestId('habit-card-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String)
          })
        ])
      );
    });

    it('applies loading styling when loading', () => {
      const { getByTestId } = renderWithProviders(
        <HabitCard {...defaultProps} isLoading={true} />
      );

      const button = getByTestId('complete-button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String)
          })
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('handles missing habit properties gracefully', () => {
      const incompleteHabit = {
        ...mockHabit,
        description: undefined,
        targetValue: undefined,
        unit: undefined,
      };

      expect(() => {
        renderWithProviders(
          <HabitCard {...defaultProps} habit={incompleteHabit} />
        );
      }).not.toThrow();
    });

    it('handles invalid frequency values gracefully', () => {
      const habitWithInvalidFrequency = {
        ...mockHabit,
        frequency: 'invalid' as any,
      };

      const { getByText } = renderWithProviders(
        <HabitCard {...defaultProps} habit={habitWithInvalidFrequency} />
      );

      expect(getByText('Daily')).toBeTruthy(); // Falls back to daily
    });
  });
});
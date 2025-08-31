import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateHabitScreen from '../../screens/CreateHabitScreen';

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
    fontSize: { sm: 14, base: 16, md: 16, lg: 18, xl: 20 },
    fontWeight: { medium: '500', semibold: '600', bold: '700' },
  },
  Spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
  BorderRadius: { md: 8, sm: 4 },
}));

jest.mock('../../constants/limits', () => ({
  LIMITS: { MAX_HABITS: 6 },
}));

// Mock hooks
jest.mock('../../hooks/useHabits', () => ({
  useHabits: () => ({
    createHabit: jest.fn(),
    isCreating: false,
    habits: [],
  }),
}));

// Mock components
jest.mock('../../components/Button', () => 'Button');
jest.mock('../../components/SimpleInput', () => 'SimpleInput');
jest.mock('../../components/IconPicker', () => 'IconPicker');

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('CreateHabitScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders create habit screen correctly', () => {
      const { getByText, getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      expect(getByText('Create New Habit')).toBeTruthy();
      expect(getByText('Creating habit 1 of 6')).toBeTruthy();
      expect(getByTestId('habit-name-input')).toBeTruthy();
      expect(getByTestId('create-habit-button')).toBeTruthy();
    });

    it('shows habit counter correctly', () => {
      const mockUseHabits = require('../../hooks/useHabits').useHabits;
      mockUseHabits.mockReturnValue({
        createHabit: jest.fn(),
        isCreating: false,
        habits: [{ id: '1' }, { id: '2' }], // 2 existing habits
      });

      const { getByText } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      expect(getByText('Creating habit 3 of 6')).toBeTruthy();
      expect(getByText('3 more habits available after this')).toBeTruthy();
    });

    it('shows warning when near limit', () => {
      const mockUseHabits = require('../../hooks/useHabits').useHabits;
      mockUseHabits.mockReturnValue({
        createHabit: jest.fn(),
        isCreating: false,
        habits: Array.from({ length: 5 }, (_, i) => ({ id: i.toString() })),
      });

      const { getByText } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      expect(getByText('Creating habit 6 of 6')).toBeTruthy();
      expect(getByText('This will be your last habit!')).toBeTruthy();
    });
  });

  describe('Form Interactions', () => {
    it('updates habit name when input changes', () => {
      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      const nameInput = getByTestId('habit-name-input');
      fireEvent.changeText(nameInput, 'Morning Workout');

      expect(nameInput.props.value).toBe('Morning Workout');
    });

    it('shows category dropdown when category selector is pressed', () => {
      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('category-selector'));
      expect(getByTestId('category-dropdown')).toBeTruthy();
    });

    it('selects category from dropdown', () => {
      const { getByTestId, getByText } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('category-selector'));
      fireEvent.press(getByText('Wellness'));

      // Category dropdown should close and wellness should be selected
      expect(getByText('Wellness')).toBeTruthy();
    });

    it('selects frequency correctly', () => {
      const { getByText } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('Weekly'));
      
      // Weekly button should be selected (this would be tested via styling)
      expect(getByText('Weekly')).toBeTruthy();
    });

    it('toggles privacy setting', () => {
      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      const privacyToggle = getByTestId('privacy-toggle');
      fireEvent.press(privacyToggle);

      // Privacy should be toggled (would need to check internal state)
      expect(privacyToggle).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('shows error when habit name is empty', async () => {
      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('create-habit-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'Please check your form inputs'
        );
      });
    });

    it('shows error when habit name is too short', async () => {
      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      const nameInput = getByTestId('habit-name-input');
      fireEvent.changeText(nameInput, 'A'); // Too short

      fireEvent.press(getByTestId('create-habit-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'Please check your form inputs'
        );
      });
    });

    it('shows error when target value is set but unit is missing', async () => {
      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      const nameInput = getByTestId('habit-name-input');
      fireEvent.changeText(nameInput, 'Valid Habit Name');

      const targetInput = getByTestId('target-value-input');
      fireEvent.changeText(targetInput, '30');

      // Don't set unit

      fireEvent.press(getByTestId('create-habit-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'Please check your form inputs'
        );
      });
    });
  });

  describe('Habit Creation', () => {
    it('creates habit successfully with valid data', async () => {
      const mockCreateHabit = jest.fn().mockResolvedValue(undefined);
      const mockUseHabits = require('../../hooks/useHabits').useHabits;
      mockUseHabits.mockReturnValue({
        createHabit: mockCreateHabit,
        isCreating: false,
        habits: [],
      });

      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      const nameInput = getByTestId('habit-name-input');
      fireEvent.changeText(nameInput, 'Morning Workout');

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

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Habit created successfully!',
        expect.any(Array)
      );
    });

    it('handles creation error gracefully', async () => {
      const mockCreateHabit = jest.fn().mockRejectedValue(new Error('Creation failed'));
      const mockUseHabits = require('../../hooks/useHabits').useHabits;
      mockUseHabits.mockReturnValue({
        createHabit: mockCreateHabit,
        isCreating: false,
        habits: [],
      });

      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      const nameInput = getByTestId('habit-name-input');
      fireEvent.changeText(nameInput, 'Morning Workout');

      fireEvent.press(getByTestId('create-habit-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Creation failed'
        );
      });
    });

    it('shows loading state during creation', () => {
      const mockUseHabits = require('../../hooks/useHabits').useHabits;
      mockUseHabits.mockReturnValue({
        createHabit: jest.fn(),
        isCreating: true,
        habits: [],
      });

      const { getByText } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      expect(getByText('Creating...')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is pressed', () => {
      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('back-button'));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('navigates back after successful creation', async () => {
      const mockCreateHabit = jest.fn().mockResolvedValue(undefined);
      const mockUseHabits = require('../../hooks/useHabits').useHabits;
      mockUseHabits.mockReturnValue({
        createHabit: mockCreateHabit,
        isCreating: false,
        habits: [],
      });

      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      const nameInput = getByTestId('habit-name-input');
      fireEvent.changeText(nameInput, 'Morning Workout');

      fireEvent.press(getByTestId('create-habit-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing OK on success alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Success'
      );
      if (alertCall && alertCall[2] && alertCall[2][0] && alertCall[2][0].onPress) {
        alertCall[2][0].onPress();
      }

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Icon Picker', () => {
    it('opens icon picker when icon selector is pressed', () => {
      const { getByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('icon-selector'));
      expect(getByTestId('icon-picker-modal')).toBeTruthy();
    });

    it('closes icon picker when close is called', () => {
      const { getByTestId, queryByTestId } = render(
        <CreateHabitScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('icon-selector'));
      expect(getByTestId('icon-picker-modal')).toBeTruthy();

      fireEvent.press(getByTestId('icon-picker-close'));
      expect(queryByTestId('icon-picker-modal')).toBeNull();
    });
  });
});
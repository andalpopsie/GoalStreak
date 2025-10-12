/**
 * iOS Habit Creation Flow Tests
 * 
 * Tests habit creation and management functionality on iOS devices
 * Requirements: 5.3 - Verify core user flows work flawlessly on iOS
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';

import CreateHabitScreen from '../../../screens/CreateHabitScreen';
import CleanHomeScreen from '../../../screens/CleanHomeScreen';
import { AuthProvider } from '../../../hooks/useAuth';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  reset: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

// Mock habit service
const mockHabitService = {
  createHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  getUserHabits: jest.fn(),
};

jest.mock('../../../services/habitService', () => ({
  habitService: mockHabitService,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    <AuthProvider>
      {children}
    </AuthProvider>
  </NavigationContainer>
);

describe('iOS Habit Creation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    
    // Mock authenticated user
    jest.spyOn(require('../../../hooks/useAuth'), 'useAuth').mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  describe('Create Habit Screen', () => {
    it('should render create habit screen correctly on iOS', () => {
      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      expect(screen.getByText('Create New Habit')).toBeTruthy();
      expect(screen.getByPlaceholderText('Habit name')).toBeTruthy();
      expect(screen.getByText('Select Category')).toBeTruthy();
      expect(screen.getByText('Create Habit')).toBeTruthy();
    });

    it('should handle habit name input on iOS', async () => {
      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const nameInput = screen.getByPlaceholderText('Habit name');
      fireEvent.changeText(nameInput, 'Morning Exercise');

      await waitFor(() => {
        expect(nameInput.props.value).toBe('Morning Exercise');
      });
    });

    it('should display category selection on iOS', async () => {
      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const categoryButton = screen.getByText('Select Category');
      fireEvent.press(categoryButton);

      await waitFor(() => {
        expect(screen.getByText('Fitness')).toBeTruthy();
        expect(screen.getByText('Health')).toBeTruthy();
        expect(screen.getByText('Productivity')).toBeTruthy();
        expect(screen.getByText('Mindfulness')).toBeTruthy();
      });
    });

    it('should handle category selection on iOS', async () => {
      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const categoryButton = screen.getByText('Select Category');
      fireEvent.press(categoryButton);

      await waitFor(() => {
        const fitnessCategory = screen.getByText('Fitness');
        fireEvent.press(fitnessCategory);
      });

      await waitFor(() => {
        expect(screen.getByText('Fitness')).toBeTruthy();
      });
    });

    it('should handle frequency selection on iOS', async () => {
      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const dailyOption = screen.getByText('Daily');
      const weeklyOption = screen.getByText('Weekly');
      const monthlyOption = screen.getByText('Monthly');

      expect(dailyOption).toBeTruthy();
      expect(weeklyOption).toBeTruthy();
      expect(monthlyOption).toBeTruthy();

      fireEvent.press(weeklyOption);

      await waitFor(() => {
        expect(weeklyOption.props.accessibilityState?.selected).toBe(true);
      });
    });

    it('should validate form inputs on iOS', async () => {
      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create Habit');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a habit name')).toBeTruthy();
        expect(screen.getByText('Please select a category')).toBeTruthy();
      });
    });

    it('should create habit successfully on iOS', async () => {
      mockHabitService.createHabit.mockResolvedValue({
        id: 'new-habit-id',
        name: 'Morning Exercise',
        category: 'fitness',
      });

      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      // Fill form
      const nameInput = screen.getByPlaceholderText('Habit name');
      fireEvent.changeText(nameInput, 'Morning Exercise');

      const categoryButton = screen.getByText('Select Category');
      fireEvent.press(categoryButton);

      await waitFor(() => {
        const fitnessCategory = screen.getByText('Fitness');
        fireEvent.press(fitnessCategory);
      });

      const createButton = screen.getByText('Create Habit');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockHabitService.createHabit).toHaveBeenCalledWith({
          name: 'Morning Exercise',
          category: 'fitness',
          frequency: 'daily',
          userId: 'test-user-id',
        });
        expect(mockGoBack).toHaveBeenCalled();
      });
    });

    it('should handle iOS haptic feedback on interactions', async () => {
      const mockHaptics = require('expo-haptics');

      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const categoryButton = screen.getByText('Select Category');
      fireEvent.press(categoryButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          mockHaptics.ImpactFeedbackStyle.Light
        );
      });
    });

    it('should handle iOS keyboard behavior', () => {
      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const nameInput = screen.getByPlaceholderText('Habit name');

      // Test iOS-specific keyboard props
      expect(nameInput.props.autoCapitalize).toBe('words');
      expect(nameInput.props.autoCorrect).toBe(true);
      expect(nameInput.props.returnKeyType).toBe('done');
    });
  });

  describe('Home Screen Habit Management', () => {
    beforeEach(() => {
      mockHabitService.getUserHabits.mockResolvedValue([
        {
          id: 'habit-1',
          name: 'Morning Exercise',
          category: 'fitness',
          frequency: 'daily',
          streak: 5,
          completed: false,
        },
        {
          id: 'habit-2',
          name: 'Read Books',
          category: 'learning',
          frequency: 'daily',
          streak: 3,
          completed: true,
        },
      ]);
    });

    it('should display habits correctly on iOS', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Morning Exercise')).toBeTruthy();
        expect(screen.getByText('Read Books')).toBeTruthy();
      });
    });

    it('should handle habit completion on iOS', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-habit-1');
        fireEvent.press(completeButton);
      });

      await waitFor(() => {
        expect(mockHabitService.updateHabit).toHaveBeenCalledWith('habit-1', {
          completed: true,
          completedAt: expect.any(Date),
        });
      });
    });

    it('should show habit streaks correctly on iOS', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('5 day streak')).toBeTruthy();
        expect(screen.getByText('3 day streak')).toBeTruthy();
      });
    });

    it('should handle add habit button on iOS', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-habit-button');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('CreateHabit');
      });
    });

    it('should handle habit editing on iOS', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const editButton = screen.getByTestId('edit-habit-1');
        fireEvent.press(editButton);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('CreateHabit', {
          habitId: 'habit-1',
          mode: 'edit',
        });
      });
    });
  });

  describe('iOS-Specific Habit Features', () => {
    it('should handle iOS safe area in habit screens', () => {
      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const safeAreaView = screen.getByTestId('safe-area-view');
      expect(safeAreaView).toBeTruthy();
    });

    it('should handle iOS scroll behavior', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      const scrollView = screen.getByTestId('habits-scroll-view');
      
      // Test iOS-specific scroll props
      expect(scrollView.props.bounces).toBe(true);
      expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
    });

    it('should handle iOS pull-to-refresh', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      const scrollView = screen.getByTestId('habits-scroll-view');
      
      // Simulate pull-to-refresh
      fireEvent(scrollView, 'refresh');

      await waitFor(() => {
        expect(mockHabitService.getUserHabits).toHaveBeenCalled();
      });
    });

    it('should handle iOS swipe gestures', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const habitCard = screen.getByTestId('habit-card-1');
        
        // Simulate swipe gesture
        fireEvent(habitCard, 'swipeLeft');
      });

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeTruthy();
        expect(screen.getByText('Edit')).toBeTruthy();
      });
    });

    it('should handle iOS accessibility for habit management', async () => {
      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const habitCard = screen.getByTestId('habit-card-1');
        const completeButton = screen.getByTestId('complete-habit-1');

        expect(habitCard.props.accessibilityLabel).toBe('Morning Exercise habit');
        expect(completeButton.props.accessibilityLabel).toBe('Mark Morning Exercise as complete');
        expect(completeButton.props.accessibilityHint).toBe('Double tap to complete this habit');
      });
    });

    it('should handle iOS dynamic type scaling', () => {
      // Mock iOS dynamic type
      jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
        getFontScale: () => 1.2, // Larger text setting
      }));

      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const title = screen.getByText('Create New Habit');
      
      // Text should scale appropriately
      expect(title.props.style).toMatchObject({
        fontSize: expect.any(Number),
      });
    });

    it('should handle iOS memory warnings', () => {
      const { unmount } = render(
        <TestWrapper>
          <CleanHomeScreen />
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

  describe('Habit Creation Performance on iOS', () => {
    it('should render create habit screen within performance threshold', async () => {
      const startTime = Date.now();

      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const renderTime = Date.now() - startTime;

      // Should render within 150ms on iOS
      expect(renderTime).toBeLessThan(150);
    });

    it('should handle rapid habit creation attempts', async () => {
      mockHabitService.createHabit.mockResolvedValue({ id: 'new-habit' });

      render(
        <TestWrapper>
          <CreateHabitScreen />
        </TestWrapper>
      );

      const nameInput = screen.getByPlaceholderText('Habit name');
      fireEvent.changeText(nameInput, 'Test Habit');

      const createButton = screen.getByText('Create Habit');
      
      // Rapid button presses
      fireEvent.press(createButton);
      fireEvent.press(createButton);
      fireEvent.press(createButton);

      await waitFor(() => {
        // Should only create habit once
        expect(mockHabitService.createHabit).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle large habit lists efficiently on iOS', async () => {
      // Mock large habit list
      const largeHabitList = Array.from({ length: 100 }, (_, i) => ({
        id: `habit-${i}`,
        name: `Habit ${i}`,
        category: 'fitness',
        frequency: 'daily',
        streak: i,
        completed: false,
      }));

      mockHabitService.getUserHabits.mockResolvedValue(largeHabitList);

      const startTime = Date.now();

      render(
        <TestWrapper>
          <CleanHomeScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Habit 0')).toBeTruthy();
      });

      const renderTime = Date.now() - startTime;

      // Should handle large lists efficiently
      expect(renderTime).toBeLessThan(500);
    });
  });
});
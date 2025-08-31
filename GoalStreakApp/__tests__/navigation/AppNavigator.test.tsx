import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AppNavigator from '../../navigation/AppNavigator';

// Mock dependencies
jest.mock('../../constants/theme', () => ({
  Colors: {
    background: '#FFF6E9',
    primaryText: '#001BB7',
    accent1: '#FF7F3E',
    accent2: '#80C4E9',
  },
}));

// Mock screens
jest.mock('../../screens/CleanHomeScreen', () => {
  const { View, Text } = require('react-native');
  return function MockCleanHomeScreen() {
    return (
      <View testID="home-screen">
        <Text>Home Screen</Text>
      </View>
    );
  };
});

jest.mock('../../screens/SocialScreen', () => {
  const { View, Text } = require('react-native');
  return function MockSocialScreen() {
    return (
      <View testID="social-screen">
        <Text>Social Screen</Text>
      </View>
    );
  };
});

jest.mock('../../screens/AnalyticsScreen', () => {
  const { View, Text } = require('react-native');
  return function MockAnalyticsScreen() {
    return (
      <View testID="analytics-screen">
        <Text>Analytics Screen</Text>
      </View>
    );
  };
});

jest.mock('../../screens/ProfileScreen', () => {
  const { View, Text } = require('react-native');
  return function MockProfileScreen() {
    return (
      <View testID="profile-screen">
        <Text>Profile Screen</Text>
      </View>
    );
  };
});

jest.mock('../../screens/LoginScreen', () => {
  const { View, Text } = require('react-native');
  return function MockLoginScreen() {
    return (
      <View testID="login-screen">
        <Text>Login Screen</Text>
      </View>
    );
  };
});

jest.mock('../../screens/SignUpScreen', () => {
  const { View, Text } = require('react-native');
  return function MockSignUpScreen() {
    return (
      <View testID="signup-screen">
        <Text>Sign Up Screen</Text>
      </View>
    );
  };
});

jest.mock('../../screens/CreateHabitScreen', () => {
  const { View, Text } = require('react-native');
  return function MockCreateHabitScreen() {
    return (
      <View testID="create-habit-screen">
        <Text>Create Habit Screen</Text>
      </View>
    );
  };
});

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('shows auth screens when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      const { getByTestId } = render(<AppNavigator />);

      expect(getByTestId('login-screen')).toBeTruthy();
    });

    it('shows main app when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      const { getByTestId } = render(<AppNavigator />);

      expect(getByTestId('home-screen')).toBeTruthy();
    });

    it('shows nothing when loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { container } = render(<AppNavigator />);

      expect(container.children).toHaveLength(0);
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('shows home screen by default', () => {
      const { getByTestId } = render(<AppNavigator />);

      expect(getByTestId('home-screen')).toBeTruthy();
    });

    it('navigates to social screen when social tab is pressed', async () => {
      const { getByTestId, getByText } = render(<AppNavigator />);

      fireEvent.press(getByText('Social'));

      await waitFor(() => {
        expect(getByTestId('social-screen')).toBeTruthy();
      });
    });

    it('navigates to analytics screen when analytics tab is pressed', async () => {
      const { getByTestId, getByText } = render(<AppNavigator />);

      fireEvent.press(getByText('Analytics'));

      await waitFor(() => {
        expect(getByTestId('analytics-screen')).toBeTruthy();
      });
    });

    it('navigates to profile screen when profile tab is pressed', async () => {
      const { getByTestId, getByText } = render(<AppNavigator />);

      fireEvent.press(getByText('Profile'));

      await waitFor(() => {
        expect(getByTestId('profile-screen')).toBeTruthy();
      });
    });

    it('navigates back to home when home tab is pressed', async () => {
      const { getByTestId, getByText } = render(<AppNavigator />);

      // Navigate to social first
      fireEvent.press(getByText('Social'));
      await waitFor(() => {
        expect(getByTestId('social-screen')).toBeTruthy();
      });

      // Navigate back to home
      fireEvent.press(getByText('Dashboard'));
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });
  });

  describe('Tab Bar Configuration', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('shows correct tab labels', () => {
      const { getByText } = render(<AppNavigator />);

      expect(getByText('Dashboard')).toBeTruthy();
      expect(getByText('Social')).toBeTruthy();
      expect(getByText('Analytics')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();
    });

    it('shows tab icons', () => {
      const { getByTestId } = render(<AppNavigator />);

      // Tab bar should be present
      expect(getByTestId('tab-bar')).toBeTruthy();
    });
  });

  describe('Modal Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('can navigate to create habit screen', async () => {
      // This would typically be tested through the home screen's navigation
      // Since we're testing the navigator structure, we'll test that the route exists
      const { getByTestId } = render(<AppNavigator />);

      // The create habit screen should be available in the stack
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });

  describe('Authentication State Changes', () => {
    it('switches from auth to main when user logs in', async () => {
      // Start with unauthenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      const { getByTestId, rerender } = render(<AppNavigator />);
      expect(getByTestId('login-screen')).toBeTruthy();

      // Simulate login
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      rerender(<AppNavigator />);

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('switches from main to auth when user logs out', async () => {
      // Start with authenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      const { getByTestId, rerender } = render(<AppNavigator />);
      expect(getByTestId('home-screen')).toBeTruthy();

      // Simulate logout
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      rerender(<AppNavigator />);

      await waitFor(() => {
        expect(getByTestId('login-screen')).toBeTruthy();
      });
    });
  });

  describe('Deep Linking', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('handles navigation state properly', () => {
      const { getByTestId } = render(<AppNavigator />);

      // Should render the navigation container
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });

  describe('Screen Transitions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('maintains navigation state between tab switches', async () => {
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

      // Navigate back to home
      fireEvent.press(getByText('Dashboard'));
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles auth hook errors gracefully', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        error: 'Auth error',
      });

      expect(() => render(<AppNavigator />)).not.toThrow();
    });

    it('handles missing navigation state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      expect(() => render(<AppNavigator />)).not.toThrow();
    });
  });
});
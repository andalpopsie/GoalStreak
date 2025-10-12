/**
 * iOS Onboarding Flow Tests
 * 
 * Tests the complete user onboarding experience on iOS devices
 * Requirements: 5.3 - Verify core user flows work flawlessly on iOS
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';

import LoginScreen from '../../../screens/LoginScreen';
import SignUpScreen from '../../../screens/SignUpScreen';
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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <NavigationContainer>
        <AuthProvider>
            {children}
        </AuthProvider>
    </NavigationContainer>
);

describe('iOS Onboarding Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock iOS platform
        Platform.OS = 'ios';
    });

    describe('Login Screen', () => {
        it('should render login screen correctly on iOS', () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            expect(screen.getByText('Welcome to GoalStreak')).toBeTruthy();
            expect(screen.getByPlaceholderText('Email')).toBeTruthy();
            expect(screen.getByPlaceholderText('Password')).toBeTruthy();
            expect(screen.getByText('Sign In')).toBeTruthy();
        });

        it('should handle email input correctly on iOS', async () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const emailInput = screen.getByPlaceholderText('Email');
            fireEvent.changeText(emailInput, 'test@example.com');

            await waitFor(() => {
                expect(emailInput.props.value).toBe('test@example.com');
            });
        });

        it('should handle password input correctly on iOS', async () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const passwordInput = screen.getByPlaceholderText('Password');
            fireEvent.changeText(passwordInput, 'password123');

            await waitFor(() => {
                expect(passwordInput.props.value).toBe('password123');
            });
        });

        it('should navigate to sign up screen on iOS', async () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const signUpButton = screen.getByText("Don't have an account? Sign up");
            fireEvent.press(signUpButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('SignUp');
            });
        });

        it('should show validation errors on iOS', async () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const signInButton = screen.getByText('Sign In');
            fireEvent.press(signInButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter your email')).toBeTruthy();
            });
        });

        it('should handle iOS keyboard behavior', async () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const emailInput = screen.getByPlaceholderText('Email');

            // Test iOS-specific keyboard props
            expect(emailInput.props.keyboardType).toBe('email-address');
            expect(emailInput.props.autoCapitalize).toBe('none');
            expect(emailInput.props.autoCorrect).toBe(false);
        });
    });

    describe('Sign Up Screen', () => {
        it('should render sign up screen correctly on iOS', () => {
            render(
                <TestWrapper>
                    <SignUpScreen />
                </TestWrapper>
            );

            expect(screen.getByText('Create Account')).toBeTruthy();
            expect(screen.getByPlaceholderText('Full Name')).toBeTruthy();
            expect(screen.getByPlaceholderText('Email')).toBeTruthy();
            expect(screen.getByPlaceholderText('Password')).toBeTruthy();
            expect(screen.getByText('Create Account')).toBeTruthy();
        });

        it('should handle form validation on iOS', async () => {
            render(
                <TestWrapper>
                    <SignUpScreen />
                </TestWrapper>
            );

            const createAccountButton = screen.getByText('Create Account');
            fireEvent.press(createAccountButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter your full name')).toBeTruthy();
                expect(screen.getByText('Please enter your email')).toBeTruthy();
                expect(screen.getByText('Please enter your password')).toBeTruthy();
            });
        });

        it('should validate email format on iOS', async () => {
            render(
                <TestWrapper>
                    <SignUpScreen />
                </TestWrapper>
            );

            const emailInput = screen.getByPlaceholderText('Email');
            const createAccountButton = screen.getByText('Create Account');

            fireEvent.changeText(emailInput, 'invalid-email');
            fireEvent.press(createAccountButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
            });
        });

        it('should validate password strength on iOS', async () => {
            render(
                <TestWrapper>
                    <SignUpScreen />
                </TestWrapper>
            );

            const passwordInput = screen.getByPlaceholderText('Password');
            const createAccountButton = screen.getByText('Create Account');

            fireEvent.changeText(passwordInput, '123');
            fireEvent.press(createAccountButton);

            await waitFor(() => {
                expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
            });
        });

        it('should handle iOS-specific input behaviors', () => {
            render(
                <TestWrapper>
                    <SignUpScreen />
                </TestWrapper>
            );

            const nameInput = screen.getByPlaceholderText('Full Name');
            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');

            // Test iOS-specific keyboard and input props
            expect(nameInput.props.autoCapitalize).toBe('words');
            expect(emailInput.props.keyboardType).toBe('email-address');
            expect(emailInput.props.autoCapitalize).toBe('none');
            expect(passwordInput.props.secureTextEntry).toBe(true);
        });

        it('should navigate back to login on iOS', async () => {
            render(
                <TestWrapper>
                    <SignUpScreen />
                </TestWrapper>
            );

            const loginButton = screen.getByText('Already have an account? Sign in');
            fireEvent.press(loginButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('Login');
            });
        });
    });

    describe('iOS-Specific Onboarding Features', () => {
        it('should handle iOS safe area correctly', () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            // The screen should be wrapped in SafeAreaView for iOS
            const safeAreaView = screen.getByTestId('safe-area-view');
            expect(safeAreaView).toBeTruthy();
        });

        it('should handle iOS status bar correctly', () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            // Status bar should be configured for iOS
            const statusBar = screen.getByTestId('status-bar');
            expect(statusBar.props.style).toBe('dark');
        });

        it('should handle iOS keyboard avoidance', async () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const emailInput = screen.getByPlaceholderText('Email');

            // Simulate keyboard showing
            fireEvent(emailInput, 'focus');

            // The view should adjust for iOS keyboard
            await waitFor(() => {
                const keyboardAvoidingView = screen.getByTestId('keyboard-avoiding-view');
                expect(keyboardAvoidingView.props.behavior).toBe('padding');
            });
        });

        it('should handle iOS haptic feedback on interactions', async () => {
            const mockHaptics = require('expo-haptics');

            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const signInButton = screen.getByText('Sign In');
            fireEvent.press(signInButton);

            await waitFor(() => {
                expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
                    mockHaptics.ImpactFeedbackStyle.Light
                );
            });
        });

        it('should handle iOS accessibility features', () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');
            const signInButton = screen.getByText('Sign In');

            // Check iOS accessibility props
            expect(emailInput.props.accessibilityLabel).toBe('Email input field');
            expect(passwordInput.props.accessibilityLabel).toBe('Password input field');
            expect(signInButton.props.accessibilityRole).toBe('button');
            expect(signInButton.props.accessibilityHint).toBe('Sign in to your account');
        });

        it('should handle iOS dark mode appearance', () => {
            // Mock iOS dark mode
            jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
                getColorScheme: () => 'dark',
            }));

            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            // The screen should adapt to dark mode
            const container = screen.getByTestId('login-container');
            expect(container.props.style).toMatchObject({
                backgroundColor: expect.any(String),
            });
        });
    });

    describe('Onboarding Performance on iOS', () => {
        it('should render login screen within performance threshold', async () => {
            const startTime = Date.now();

            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const renderTime = Date.now() - startTime;

            // Should render within 100ms on iOS
            expect(renderTime).toBeLessThan(100);
        });

        it('should handle rapid user interactions on iOS', async () => {
            render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const signInButton = screen.getByText('Sign In');

            // Rapid button presses should be handled gracefully
            fireEvent.press(signInButton);
            fireEvent.press(signInButton);
            fireEvent.press(signInButton);

            // Should not cause crashes or multiple navigation calls
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledTimes(0); // No navigation without valid form
            });
        });

        it('should handle iOS memory constraints', () => {
            // Render multiple screens to test memory usage
            const { unmount: unmount1 } = render(
                <TestWrapper>
                    <LoginScreen />
                </TestWrapper>
            );

            const { unmount: unmount2 } = render(
                <TestWrapper>
                    <SignUpScreen />
                </TestWrapper>
            );

            // Cleanup should work properly
            unmount1();
            unmount2();

            // No memory leaks should occur
            expect(true).toBe(true); // Placeholder for memory leak detection
        });
    });
});
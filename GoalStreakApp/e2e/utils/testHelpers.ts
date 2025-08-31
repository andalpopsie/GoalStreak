/**
 * E2E Test Helper Functions
 * Provides reusable utilities for Detox end-to-end testing
 */

import { element, by, waitFor, expect as detoxExpect } from 'detox';

// Test timeouts
export const TIMEOUTS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
  EXTRA_LONG: 15000,
};

// Common test IDs used across the app
export const TEST_IDS = {
  // Authentication
  LOGIN_SCREEN: 'login-screen',
  SIGNUP_SCREEN: 'signup-screen',
  EMAIL_INPUT: 'email-input',
  PASSWORD_INPUT: 'password-input',
  LOGIN_BUTTON: 'login-button',
  SIGNUP_BUTTON: 'signup-button',
  
  // Navigation
  HOME_TAB: 'home-tab',
  SOCIAL_TAB: 'social-tab',
  ANALYTICS_TAB: 'analytics-tab',
  PROFILE_TAB: 'profile-tab',
  
  // Home Screen
  HOME_SCREEN: 'home-screen',
  ADD_HABIT_BUTTON: 'add-habit-button',
  HABITS_GRID: 'habits-grid',
  EMPTY_HABITS_STATE: 'empty-habits-state',
  
  // Habit Creation
  CREATE_HABIT_SCREEN: 'create-habit-screen',
  HABIT_NAME_INPUT: 'habit-name-input',
  CATEGORY_PICKER: 'category-picker',
  FREQUENCY_PICKER: 'frequency-picker',
  SAVE_HABIT_BUTTON: 'save-habit-button',
  
  // Habit Card
  HABIT_CARD: 'habit-card',
  HABIT_COMPLETION_BUTTON: 'habit-completion-button',
  STREAK_COUNTER: 'streak-counter',
  
  // Social Features
  SOCIAL_SCREEN: 'social-screen',
  ADD_FRIEND_BUTTON: 'add-friend-button',
  FRIEND_EMAIL_INPUT: 'friend-email-input',
  SEND_REQUEST_BUTTON: 'send-request-button',
  ACTIVITY_FEED: 'activity-feed',
  FRIENDS_LIST: 'friends-list',
  
  // Analytics
  ANALYTICS_SCREEN: 'analytics-screen',
  PROGRESS_CHART: 'progress-chart',
  STATS_OVERVIEW: 'stats-overview',
  
  // Common UI Elements
  LOADING_INDICATOR: 'loading-indicator',
  ERROR_MESSAGE: 'error-message',
  SUCCESS_MESSAGE: 'success-message',
  MODAL_BACKDROP: 'modal-backdrop',
  CLOSE_BUTTON: 'close-button',
};

/**
 * Wait for an element to be visible with custom timeout
 */
export const waitForElement = async (
  elementMatcher: Detox.NativeMatcher,
  timeout: number = TIMEOUTS.MEDIUM
) => {
  await waitFor(element(elementMatcher))
    .toBeVisible()
    .withTimeout(timeout);
};

/**
 * Wait for an element to disappear
 */
export const waitForElementToDisappear = async (
  elementMatcher: Detox.NativeMatcher,
  timeout: number = TIMEOUTS.MEDIUM
) => {
  await waitFor(element(elementMatcher))
    .not.toBeVisible()
    .withTimeout(timeout);
};

/**
 * Type text into an input field
 */
export const typeText = async (testId: string, text: string) => {
  await element(by.id(testId)).typeText(text);
};

/**
 * Clear text from an input field and type new text
 */
export const replaceText = async (testId: string, text: string) => {
  await element(by.id(testId)).replaceText(text);
};

/**
 * Tap an element by test ID
 */
export const tapElement = async (testId: string) => {
  await element(by.id(testId)).tap();
};

/**
 * Tap an element by text
 */
export const tapElementByText = async (text: string) => {
  await element(by.text(text)).tap();
};

/**
 * Scroll to an element and tap it
 */
export const scrollToAndTap = async (
  testId: string,
  scrollViewTestId?: string
) => {
  if (scrollViewTestId) {
    await element(by.id(testId)).scrollTo('bottom');
  }
  await element(by.id(testId)).tap();
};

/**
 * Verify element is visible
 */
export const expectElementToBeVisible = async (testId: string) => {
  await detoxExpect(element(by.id(testId))).toBeVisible();
};

/**
 * Verify element contains text
 */
export const expectElementToHaveText = async (testId: string, text: string) => {
  await detoxExpect(element(by.id(testId))).toHaveText(text);
};

/**
 * Verify element is not visible
 */
export const expectElementNotToBeVisible = async (testId: string) => {
  await detoxExpect(element(by.id(testId))).not.toBeVisible();
};

/**
 * Wait for loading to complete
 */
export const waitForLoadingToComplete = async (timeout: number = TIMEOUTS.LONG) => {
  try {
    await waitForElementToDisappear(by.id(TEST_IDS.LOADING_INDICATOR), timeout);
  } catch (error) {
    // Loading indicator might not be present, which is fine
    console.log('Loading indicator not found or already disappeared');
  }
};

/**
 * Handle potential modals or overlays
 */
export const dismissModalIfPresent = async () => {
  try {
    await element(by.id(TEST_IDS.MODAL_BACKDROP)).tap();
  } catch (error) {
    // Modal not present, continue
  }
  
  try {
    await element(by.id(TEST_IDS.CLOSE_BUTTON)).tap();
  } catch (error) {
    // Close button not present, continue
  }
};

/**
 * Swipe gestures
 */
export const swipeUp = async (testId: string) => {
  await element(by.id(testId)).swipe('up');
};

export const swipeDown = async (testId: string) => {
  await element(by.id(testId)).swipe('down');
};

export const swipeLeft = async (testId: string) => {
  await element(by.id(testId)).swipe('left');
};

export const swipeRight = async (testId: string) => {
  await element(by.id(testId)).swipe('right');
};

/**
 * Device-specific actions
 */
export const reloadApp = async () => {
  await device.reloadReactNative();
};

export const launchApp = async (params?: any) => {
  await device.launchApp(params);
};

export const terminateApp = async () => {
  await device.terminateApp();
};

/**
 * Platform-specific helpers
 */
export const isIOS = () => device.getPlatform() === 'ios';
export const isAndroid = () => device.getPlatform() === 'android';

/**
 * Screenshot utilities
 */
export const takeScreenshot = async (name: string) => {
  await device.takeScreenshot(name);
};

/**
 * Network simulation
 */
export const simulateSlowNetwork = async () => {
  // This would require additional setup for network simulation
  console.log('Network simulation not implemented yet');
};

export const resetNetworkConditions = async () => {
  // This would require additional setup for network simulation
  console.log('Network reset not implemented yet');
};

/**
 * Accessibility helpers
 */
export const enableAccessibility = async () => {
  if (isIOS()) {
    // iOS accessibility enabling would go here
  } else {
    // Android accessibility enabling would go here
  }
};

/**
 * Performance measurement helpers
 */
export const measurePerformance = async (action: () => Promise<void>) => {
  const startTime = Date.now();
  await action();
  const endTime = Date.now();
  return endTime - startTime;
};

/**
 * Random data generators for testing
 */
export const generateRandomEmail = () => {
  const timestamp = Date.now();
  return `test${timestamp}@example.com`;
};

export const generateRandomHabitName = () => {
  const habits = [
    'Morning Meditation',
    'Evening Walk',
    'Read 30 Minutes',
    'Drink Water',
    'Exercise',
    'Journal Writing',
    'Healthy Breakfast',
    'Stretch',
  ];
  const randomIndex = Math.floor(Math.random() * habits.length);
  const timestamp = Date.now().toString().slice(-4);
  return `${habits[randomIndex]} ${timestamp}`;
};

/**
 * Test data cleanup helpers
 */
export const cleanupTestData = async () => {
  // This would connect to Firebase and clean up test data
  console.log('Test data cleanup not implemented yet');
};

/**
 * Error handling helpers
 */
export const handleTestError = (error: any, context: string) => {
  console.error(`E2E Test Error in ${context}:`, error);
  throw error;
};

/**
 * Retry mechanism for flaky operations
 */
export const retryOperation = async (
  operation: () => Promise<void>,
  maxRetries: number = 3,
  delay: number = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
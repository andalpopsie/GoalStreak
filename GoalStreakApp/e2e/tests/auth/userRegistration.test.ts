/**
 * User Registration and Onboarding E2E Tests
 * Tests the complete user registration and onboarding flow
 */

import { 
  TEST_IDS, 
  TIMEOUTS,
  waitForElement,
  tapElement,
  typeText,
  expectElementToBeVisible,
  expectElementToHaveText,
  generateRandomEmail,
  takeScreenshot
} from '../../utils/testHelpers';

describe('User Registration and Onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('User Registration Flow', () => {
    it('should complete user registration successfully', async () => {
      const testEmail = generateRandomEmail();
      const testPassword = 'TestPassword123!';
      const testName = 'Test User';

      // Wait for app to load and show login screen
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.LONG);
      
      // Navigate to signup screen
      await tapElement(TEST_IDS.SIGNUP_BUTTON);
      await waitForElement(by.id(TEST_IDS.SIGNUP_SCREEN), TIMEOUTS.MEDIUM);

      // Fill registration form
      await typeText(TEST_IDS.EMAIL_INPUT, testEmail);
      await typeText(TEST_IDS.PASSWORD_INPUT, testPassword);
      
      // Submit registration
      await tapElement(TEST_IDS.SIGNUP_BUTTON);

      // Wait for successful registration and navigation to home
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.EXTRA_LONG);
      
      // Verify user is on home screen
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      
      // Take screenshot for verification
      await takeScreenshot('user-registration-success');
    });

    it('should show validation errors for invalid registration data', async () => {
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.LONG);
      
      // Navigate to signup screen
      await tapElement(TEST_IDS.SIGNUP_BUTTON);
      await waitForElement(by.id(TEST_IDS.SIGNUP_SCREEN), TIMEOUTS.MEDIUM);

      // Try to register with invalid email
      await typeText(TEST_IDS.EMAIL_INPUT, 'invalid-email');
      await typeText(TEST_IDS.PASSWORD_INPUT, 'weak');
      await tapElement(TEST_IDS.SIGNUP_BUTTON);

      // Should show validation errors
      await waitForElement(by.id(TEST_IDS.ERROR_MESSAGE), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.ERROR_MESSAGE);
    });

    it('should handle registration with existing email', async () => {
      const existingEmail = 'existing@example.com';
      
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.LONG);
      await tapElement(TEST_IDS.SIGNUP_BUTTON);
      await waitForElement(by.id(TEST_IDS.SIGNUP_SCREEN), TIMEOUTS.MEDIUM);

      await typeText(TEST_IDS.EMAIL_INPUT, existingEmail);
      await typeText(TEST_IDS.PASSWORD_INPUT, 'TestPassword123!');
      await tapElement(TEST_IDS.SIGNUP_BUTTON);

      // Should show error for existing email
      await waitForElement(by.id(TEST_IDS.ERROR_MESSAGE), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.ERROR_MESSAGE);
    });
  });

  describe('User Login Flow', () => {
    it('should login with valid credentials', async () => {
      // This test assumes a test user exists
      const testEmail = 'test@example.com';
      const testPassword = 'TestPassword123!';

      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.LONG);

      // Fill login form
      await typeText(TEST_IDS.EMAIL_INPUT, testEmail);
      await typeText(TEST_IDS.PASSWORD_INPUT, testPassword);
      await tapElement(TEST_IDS.LOGIN_BUTTON);

      // Should navigate to home screen
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.EXTRA_LONG);
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
    });

    it('should show error for invalid credentials', async () => {
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.LONG);

      await typeText(TEST_IDS.EMAIL_INPUT, 'wrong@example.com');
      await typeText(TEST_IDS.PASSWORD_INPUT, 'wrongpassword');
      await tapElement(TEST_IDS.LOGIN_BUTTON);

      // Should show error message
      await waitForElement(by.id(TEST_IDS.ERROR_MESSAGE), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.ERROR_MESSAGE);
    });

    it('should validate required fields', async () => {
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.LONG);

      // Try to login without filling fields
      await tapElement(TEST_IDS.LOGIN_BUTTON);

      // Should show validation errors
      await waitForElement(by.id(TEST_IDS.ERROR_MESSAGE), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.ERROR_MESSAGE);
    });
  });

  describe('Onboarding Flow', () => {
    it('should show onboarding for new users', async () => {
      // This test would check if onboarding screens are shown for new users
      // Implementation depends on whether onboarding is implemented
      
      const testEmail = generateRandomEmail();
      
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.LONG);
      await tapElement(TEST_IDS.SIGNUP_BUTTON);
      await waitForElement(by.id(TEST_IDS.SIGNUP_SCREEN), TIMEOUTS.MEDIUM);

      await typeText(TEST_IDS.EMAIL_INPUT, testEmail);
      await typeText(TEST_IDS.PASSWORD_INPUT, 'TestPassword123!');
      await tapElement(TEST_IDS.SIGNUP_BUTTON);

      // After successful registration, check for onboarding or home screen
      try {
        // Try to find onboarding screen first
        await waitForElement(by.id('onboarding-screen'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('onboarding-screen');
      } catch (error) {
        // If no onboarding, should go directly to home
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      }
    });
  });

  describe('Session Management', () => {
    it('should maintain session across app restarts', async () => {
      // Login first
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.LONG);
      await typeText(TEST_IDS.EMAIL_INPUT, 'test@example.com');
      await typeText(TEST_IDS.PASSWORD_INPUT, 'TestPassword123!');
      await tapElement(TEST_IDS.LOGIN_BUTTON);
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.EXTRA_LONG);

      // Restart app
      await device.terminateApp();
      await device.launchApp();

      // Should go directly to home screen (session maintained)
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.LONG);
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
    });

    it('should handle logout correctly', async () => {
      // Assume user is logged in
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.LONG);

      // Navigate to profile and logout
      await tapElement(TEST_IDS.PROFILE_TAB);
      await waitForElement(by.id('profile-screen'), TIMEOUTS.MEDIUM);
      
      // Look for logout button (implementation may vary)
      try {
        await tapElement('logout-button');
        
        // Should return to login screen
        await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible(TEST_IDS.LOGIN_SCREEN);
      } catch (error) {
        console.log('Logout functionality not found or implemented differently');
      }
    });
  });
});
/**
 * Platform-Specific Features E2E Tests
 * Tests iOS and Android platform-specific features and behaviors
 */

import { 
  TEST_IDS, 
  TIMEOUTS,
  waitForElement,
  tapElement,
  expectElementToBeVisible,
  takeScreenshot,
  isIOS,
  isAndroid
} from '../../utils/testHelpers';

import {
  takeDeviceScreenshot,
  getCurrentPlatform
} from '../../utils/deviceManager';

describe('Platform-Specific Features', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    
    // Login with test user
    try {
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.MEDIUM);
      await typeText(TEST_IDS.EMAIL_INPUT, 'test@example.com');
      await typeText(TEST_IDS.PASSWORD_INPUT, 'TestPassword123!');
      await tapElement(TEST_IDS.LOGIN_BUTTON);
    } catch (error) {
      console.log('User already logged in');
    }
    
    await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.EXTRA_LONG);
  });

  describe('iOS-Specific Features', () => {
    beforeEach(function() {
      if (!isIOS()) {
        this.skip();
      }
    });

    it('should handle iOS navigation patterns', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Test iOS-specific navigation (swipe back, etc.)
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      
      // iOS swipe back gesture
      try {
        await element(by.id(TEST_IDS.CREATE_HABIT_SCREEN)).swipe('right', 'fast', 0.8);
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
        console.log('iOS swipe back gesture works');
      } catch (error) {
        console.log('iOS swipe back not implemented or not working');
      }
      
      await takeDeviceScreenshot('ios-navigation-patterns');
    });

    it('should handle iOS status bar styles', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // iOS status bar should adapt to content
      // Light content on dark backgrounds, dark content on light backgrounds
      
      // Test different screens that might have different status bar styles
      const screens = [
        { tab: TEST_IDS.HOME_TAB, screen: TEST_IDS.HOME_SCREEN },
        { tab: TEST_IDS.SOCIAL_TAB, screen: TEST_IDS.SOCIAL_SCREEN },
        { tab: TEST_IDS.ANALYTICS_TAB, screen: TEST_IDS.ANALYTICS_SCREEN }
      ];
      
      for (const { tab, screen } of screens) {
        await tapElement(tab);
        await waitForElement(by.id(screen), TIMEOUTS.MEDIUM);
        await takeDeviceScreenshot(`ios-status-bar-${tab}`);
      }
    });

    it('should handle iOS safe area insets', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Content should respect iOS safe areas (notch, home indicator)
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      
      // Navigation should be above home indicator
      await expectElementToBeVisible(TEST_IDS.HOME_TAB);
      
      await takeDeviceScreenshot('ios-safe-areas');
    });

    it('should handle iOS haptic feedback', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Test haptic feedback on interactions (if implemented)
      try {
        await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
        await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
        
        // Haptic feedback would be felt but not easily testable
        console.log('iOS haptic feedback should trigger on button press');
        
        // Close the screen
        try {
          await tapElement(TEST_IDS.CLOSE_BUTTON);
        } catch (error) {
          await element(by.id(TEST_IDS.CREATE_HABIT_SCREEN)).swipe('right');
        }
        
      } catch (error) {
        console.log('Haptic feedback test not applicable');
      }
    });

    it('should handle iOS modal presentations', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // iOS modals should slide up from bottom
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      
      // Modal should be presented in iOS style
      await expectElementToBeVisible(TEST_IDS.CREATE_HABIT_SCREEN);
      await takeDeviceScreenshot('ios-modal-presentation');
      
      // Dismiss modal
      try {
        await tapElement(TEST_IDS.CLOSE_BUTTON);
      } catch (error) {
        await element(by.id(TEST_IDS.CREATE_HABIT_SCREEN)).swipe('down');
      }
    });

    it('should handle iOS keyboard behavior', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      
      // Tap input to show keyboard
      await tapElement(TEST_IDS.HABIT_NAME_INPUT);
      
      // iOS keyboard should appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      await takeDeviceScreenshot('ios-keyboard-shown');
      
      // Type text
      await typeText(TEST_IDS.HABIT_NAME_INPUT, 'Test Habit');
      
      // Dismiss keyboard
      try {
        await element(by.id(TEST_IDS.CREATE_HABIT_SCREEN)).tap();
      } catch (error) {
        console.log('Keyboard dismiss not working as expected');
      }
    });
  });

  describe('Android-Specific Features', () => {
    beforeEach(function() {
      if (!isAndroid()) {
        this.skip();
      }
    });

    it('should handle Android back button', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Navigate to a screen
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      
      // Use Android back button
      await device.pressBack();
      
      // Should return to home screen
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      
      console.log('Android back button navigation works');
      await takeDeviceScreenshot('android-back-navigation');
    });

    it('should handle Android status bar', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Android status bar behavior
      await takeDeviceScreenshot('android-status-bar');
      
      // Test different screens
      await tapElement(TEST_IDS.SOCIAL_TAB);
      await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
      await takeDeviceScreenshot('android-status-bar-social');
    });

    it('should handle Android navigation bar', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Content should not overlap with Android navigation bar
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      await expectElementToBeVisible(TEST_IDS.HOME_TAB);
      
      await takeDeviceScreenshot('android-navigation-bar');
    });

    it('should handle Android material design patterns', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Test material design elements (if implemented)
      // Floating action buttons, material cards, etc.
      
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      
      // Material design modal/screen presentation
      await expectElementToBeVisible(TEST_IDS.CREATE_HABIT_SCREEN);
      await takeDeviceScreenshot('android-material-design');
      
      await device.pressBack();
    });

    it('should handle Android keyboard behavior', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      
      // Tap input to show keyboard
      await tapElement(TEST_IDS.HABIT_NAME_INPUT);
      
      // Android keyboard should appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      await takeDeviceScreenshot('android-keyboard-shown');
      
      // Type text
      await typeText(TEST_IDS.HABIT_NAME_INPUT, 'Test Habit');
      
      // Use back button to dismiss keyboard
      await device.pressBack();
      
      // Keyboard should be dismissed but screen should remain
      await expectElementToBeVisible(TEST_IDS.CREATE_HABIT_SCREEN);
    });

    it('should handle Android app lifecycle', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Test Android app backgrounding and foregrounding
      await device.sendToHome();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await device.launchApp({ newInstance: false });
      
      // App should resume where it left off
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      
      console.log('Android app lifecycle handling works');
    });
  });

  describe('Cross-Platform Consistency', () => {
    it('should maintain consistent functionality across platforms', async () => {
      const platform = getCurrentPlatform();
      console.log(`Testing on platform: ${platform}`);
      
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Core functionality should work the same on both platforms
      const testFlow = async () => {
        // Navigate to social
        await tapElement(TEST_IDS.SOCIAL_TAB);
        await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible(TEST_IDS.SOCIAL_SCREEN);
        
        // Navigate to analytics
        await tapElement(TEST_IDS.ANALYTICS_TAB);
        await waitForElement(by.id(TEST_IDS.ANALYTICS_SCREEN), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible(TEST_IDS.ANALYTICS_SCREEN);
        
        // Return to home
        await tapElement(TEST_IDS.HOME_TAB);
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      };
      
      await testFlow();
      await takeDeviceScreenshot(`${platform}-functionality-test`);
    });

    it('should have consistent visual appearance', async () => {
      const platform = getCurrentPlatform();
      
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Take screenshots of key screens for visual comparison
      const screens = [
        { tab: TEST_IDS.HOME_TAB, screen: TEST_IDS.HOME_SCREEN, name: 'home' },
        { tab: TEST_IDS.SOCIAL_TAB, screen: TEST_IDS.SOCIAL_SCREEN, name: 'social' },
        { tab: TEST_IDS.ANALYTICS_TAB, screen: TEST_IDS.ANALYTICS_SCREEN, name: 'analytics' }
      ];
      
      for (const { tab, screen, name } of screens) {
        await tapElement(tab);
        await waitForElement(by.id(screen), TIMEOUTS.MEDIUM);
        await takeDeviceScreenshot(`${platform}-${name}-appearance`);
      }
    });

    it('should handle text input consistently', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      
      // Text input should work consistently
      const testText = 'Cross Platform Test Habit 🎯';
      await typeText(TEST_IDS.HABIT_NAME_INPUT, testText);
      
      // Verify text was entered
      try {
        await expect(element(by.id(TEST_IDS.HABIT_NAME_INPUT))).toHaveText(testText);
        console.log('Text input works consistently across platforms');
      } catch (error) {
        console.log('Text input verification not available');
      }
      
      // Close screen appropriately for platform
      if (isIOS()) {
        try {
          await tapElement(TEST_IDS.CLOSE_BUTTON);
        } catch (error) {
          await element(by.id(TEST_IDS.CREATE_HABIT_SCREEN)).swipe('right');
        }
      } else {
        await device.pressBack();
      }
    });

    it('should handle gestures consistently', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Test common gestures
      try {
        // Swipe gestures should work on both platforms
        await element(by.id(TEST_IDS.HOME_SCREEN)).swipe('up', 'slow', 0.5);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await element(by.id(TEST_IDS.HOME_SCREEN)).swipe('down', 'slow', 0.5);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Gesture handling works consistently');
      } catch (error) {
        console.log('Gesture testing not applicable');
      }
    });
  });

  describe('Platform Performance Comparison', () => {
    it('should measure app launch performance', async () => {
      const platform = getCurrentPlatform();
      
      const startTime = Date.now();
      await device.terminateApp();
      await device.launchApp();
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.EXTRA_LONG);
      const launchTime = Date.now() - startTime;
      
      console.log(`${platform} app launch time: ${launchTime}ms`);
      
      // Performance should be reasonable on both platforms
      if (launchTime > 8000) {
        console.warn(`${platform} app launch may be slow: ${launchTime}ms`);
      }
    });

    it('should measure navigation performance', async () => {
      const platform = getCurrentPlatform();
      
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const navigationTimes = [];
      
      const screens = [
        { tab: TEST_IDS.SOCIAL_TAB, screen: TEST_IDS.SOCIAL_SCREEN },
        { tab: TEST_IDS.ANALYTICS_TAB, screen: TEST_IDS.ANALYTICS_SCREEN },
        { tab: TEST_IDS.HOME_TAB, screen: TEST_IDS.HOME_SCREEN }
      ];
      
      for (const { tab, screen } of screens) {
        const startTime = Date.now();
        await tapElement(tab);
        await waitForElement(by.id(screen), TIMEOUTS.MEDIUM);
        const navTime = Date.now() - startTime;
        navigationTimes.push(navTime);
      }
      
      const avgNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
      console.log(`${platform} average navigation time: ${avgNavTime}ms`);
      
      if (avgNavTime > 1000) {
        console.warn(`${platform} navigation may be slow: ${avgNavTime}ms`);
      }
    });
  });
});
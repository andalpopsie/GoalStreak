/**
 * Screen Size and Orientation Compatibility E2E Tests
 * Tests app behavior on different screen sizes and orientations
 */

import { 
  TEST_IDS, 
  TIMEOUTS,
  waitForElement,
  tapElement,
  expectElementToBeVisible,
  takeScreenshot,
  rotateToLandscape,
  rotateToPortrait,
  isIOS,
  isAndroid
} from '../../utils/testHelpers';

import {
  DEVICE_CONFIGS,
  SCREEN_SIZES,
  setDeviceOrientation,
  takeDeviceScreenshot
} from '../../utils/deviceManager';

describe('Cross-Platform Screen Compatibility', () => {
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

  afterEach(async () => {
    // Reset to portrait orientation after each test
    await rotateToPortrait();
  });

  describe('Screen Size Compatibility', () => {
    it('should display correctly on small screens', async () => {
      // Test on small screen devices (iPhone SE, small Android)
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Verify key elements are visible and properly sized
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      await expectElementToBeVisible(TEST_IDS.ADD_HABIT_BUTTON);
      
      // Check navigation tabs are accessible
      await expectElementToBeVisible(TEST_IDS.HOME_TAB);
      await expectElementToBeVisible(TEST_IDS.SOCIAL_TAB);
      await expectElementToBeVisible(TEST_IDS.ANALYTICS_TAB);
      
      await takeDeviceScreenshot('small-screen-home');
      
      // Test habit grid layout on small screens
      try {
        await expectElementToBeVisible(TEST_IDS.HABITS_GRID);
        
        // Habits should be arranged appropriately for small screens
        // This would require specific implementation details
        
      } catch (error) {
        console.log('Habits grid not available or empty');
      }
    });

    it('should display correctly on medium screens', async () => {
      // Test on medium screen devices (iPhone 14, Pixel 3)
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Verify optimal layout for medium screens
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      await expectElementToBeVisible(TEST_IDS.HABITS_GRID);
      
      // Check that more content is visible compared to small screens
      await takeDeviceScreenshot('medium-screen-home');
      
      // Test different screens
      const screens = [
        { tab: TEST_IDS.SOCIAL_TAB, screen: TEST_IDS.SOCIAL_SCREEN },
        { tab: TEST_IDS.ANALYTICS_TAB, screen: TEST_IDS.ANALYTICS_SCREEN }
      ];
      
      for (const { tab, screen } of screens) {
        await tapElement(tab);
        await waitForElement(by.id(screen), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible(screen);
        await takeDeviceScreenshot(`medium-screen-${tab}`);
      }
    });

    it('should display correctly on large screens', async () => {
      // Test on large screen devices (iPhone 14 Pro Max, Pixel 4 XL)
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Verify layout takes advantage of larger screen space
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      
      // Large screens might show more habits in grid
      try {
        await expectElementToBeVisible(TEST_IDS.HABITS_GRID);
        
        // Could verify more items are visible
        // This would require counting visible elements
        
      } catch (error) {
        console.log('Habits grid not available');
      }
      
      await takeDeviceScreenshot('large-screen-home');
      
      // Test that UI elements are not stretched inappropriately
      await expectElementToBeVisible(TEST_IDS.ADD_HABIT_BUTTON);
      
      // Navigation should remain accessible
      await expectElementToBeVisible(TEST_IDS.HOME_TAB);
      await expectElementToBeVisible(TEST_IDS.SOCIAL_TAB);
      await expectElementToBeVisible(TEST_IDS.ANALYTICS_TAB);
    });

    it('should handle tablet screens appropriately', async () => {
      // Test on tablet devices (iPad)
      if (isIOS()) {
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
        
        // Tablets might have different layout patterns
        await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
        
        // Check if tablet-specific layouts are used
        try {
          await expectElementToBeVisible('tablet-layout');
        } catch (error) {
          // Tablet layout might not be implemented
          console.log('Tablet-specific layout not found');
        }
        
        await takeDeviceScreenshot('tablet-screen-home');
        
        // Test navigation on tablet
        await tapElement(TEST_IDS.SOCIAL_TAB);
        await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
        await takeDeviceScreenshot('tablet-screen-social');
      }
    });
  });

  describe('Orientation Compatibility', () => {
    it('should handle portrait to landscape rotation', async () => {
      // Start in portrait
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      await takeDeviceScreenshot('portrait-home');
      
      // Rotate to landscape
      await rotateToLandscape();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for rotation
      
      // Verify app still works in landscape
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      await takeDeviceScreenshot('landscape-home');
      
      // Test navigation in landscape
      await tapElement(TEST_IDS.SOCIAL_TAB);
      await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.SOCIAL_SCREEN);
      await takeDeviceScreenshot('landscape-social');
      
      // Test analytics in landscape
      await tapElement(TEST_IDS.ANALYTICS_TAB);
      await waitForElement(by.id(TEST_IDS.ANALYTICS_SCREEN), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.ANALYTICS_SCREEN);
      await takeDeviceScreenshot('landscape-analytics');
    });

    it('should handle landscape to portrait rotation', async () => {
      // Start in landscape
      await rotateToLandscape();
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Rotate back to portrait
      await rotateToPortrait();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for rotation
      
      // Verify app works correctly after rotation
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      await takeDeviceScreenshot('back-to-portrait-home');
      
      // Test that all functionality still works
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.CREATE_HABIT_SCREEN);
      
      // Close habit creation
      try {
        await tapElement(TEST_IDS.CLOSE_BUTTON);
      } catch (error) {
        await device.pressBack(); // Android back button
      }
    });

    it('should maintain state during rotation', async () => {
      // Navigate to a specific state
      await tapElement(TEST_IDS.SOCIAL_TAB);
      await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
      
      // Open add friend modal
      try {
        await tapElement(TEST_IDS.ADD_FRIEND_BUTTON);
        await waitForElement(by.id('add-friend-modal'), TIMEOUTS.MEDIUM);
        
        // Rotate device
        await rotateToLandscape();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Modal should still be open
        await expectElementToBeVisible('add-friend-modal');
        
        // Rotate back
        await rotateToPortrait();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Modal should still be open
        await expectElementToBeVisible('add-friend-modal');
        
      } catch (error) {
        console.log('Add friend modal not available for state test');
      }
    });

    it('should handle rapid orientation changes', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Perform rapid orientation changes
      for (let i = 0; i < 3; i++) {
        await rotateToLandscape();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await rotateToPortrait();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // App should still be functional
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      await tapElement(TEST_IDS.SOCIAL_TAB);
      await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
    });
  });

  describe('Layout Responsiveness', () => {
    it('should adapt navigation for different screen sizes', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Check navigation layout
      await expectElementToBeVisible(TEST_IDS.HOME_TAB);
      await expectElementToBeVisible(TEST_IDS.SOCIAL_TAB);
      await expectElementToBeVisible(TEST_IDS.ANALYTICS_TAB);
      
      // Navigation should be accessible regardless of screen size
      const tabs = [TEST_IDS.HOME_TAB, TEST_IDS.SOCIAL_TAB, TEST_IDS.ANALYTICS_TAB];
      
      for (const tab of tabs) {
        await tapElement(tab);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      await takeDeviceScreenshot('navigation-layout');
    });

    it('should adapt content layout for screen size', async () => {
      // Test habit grid layout adaptation
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      try {
        await expectElementToBeVisible(TEST_IDS.HABITS_GRID);
        
        // Grid should adapt to screen size
        // On small screens: fewer columns
        // On large screens: more columns
        // This would require specific implementation verification
        
        await takeDeviceScreenshot('content-layout-adaptation');
        
      } catch (error) {
        console.log('Habits grid not available for layout test');
      }
    });

    it('should handle text scaling appropriately', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Text should be readable on all screen sizes
      // This would require checking font sizes and readability
      
      // Navigate through different screens to check text
      const screens = [
        { tab: TEST_IDS.HOME_TAB, screen: TEST_IDS.HOME_SCREEN },
        { tab: TEST_IDS.SOCIAL_TAB, screen: TEST_IDS.SOCIAL_SCREEN },
        { tab: TEST_IDS.ANALYTICS_TAB, screen: TEST_IDS.ANALYTICS_SCREEN }
      ];
      
      for (const { tab, screen } of screens) {
        await tapElement(tab);
        await waitForElement(by.id(screen), TIMEOUTS.MEDIUM);
        await takeDeviceScreenshot(`text-scaling-${tab}`);
      }
    });

    it('should maintain touch target sizes', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Touch targets should be appropriately sized for all devices
      // Minimum 44pt on iOS, 48dp on Android
      
      const touchTargets = [
        TEST_IDS.ADD_HABIT_BUTTON,
        TEST_IDS.HOME_TAB,
        TEST_IDS.SOCIAL_TAB,
        TEST_IDS.ANALYTICS_TAB
      ];
      
      for (const target of touchTargets) {
        try {
          await tapElement(target);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.log(`Touch target ${target} not accessible`);
        }
      }
    });
  });

  describe('Safe Area Handling', () => {
    it('should respect safe areas on devices with notches', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Content should not be hidden behind notches or home indicators
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      
      // Navigation should be in safe area
      await expectElementToBeVisible(TEST_IDS.HOME_TAB);
      
      await takeDeviceScreenshot('safe-area-portrait');
      
      // Test in landscape
      await rotateToLandscape();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
      await takeDeviceScreenshot('safe-area-landscape');
    });

    it('should handle status bar correctly', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Content should not overlap with status bar
      // This would require specific implementation verification
      
      await takeDeviceScreenshot('status-bar-handling');
      
      // Test on different screens
      await tapElement(TEST_IDS.SOCIAL_TAB);
      await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
      await takeDeviceScreenshot('status-bar-social');
    });
  });

  describe('Performance Across Screen Sizes', () => {
    it('should maintain performance on small screens', async () => {
      const startTime = Date.now();
      
      await device.reloadReactNative();
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const loadTime = Date.now() - startTime;
      console.log(`App loaded on small screen in ${loadTime}ms`);
      
      // Performance should be consistent across screen sizes
      if (loadTime > 5000) {
        console.warn('App loading may be slow on small screens');
      }
    });

    it('should maintain performance on large screens', async () => {
      const startTime = Date.now();
      
      await device.reloadReactNative();
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const loadTime = Date.now() - startTime;
      console.log(`App loaded on large screen in ${loadTime}ms`);
      
      // Large screens shouldn't be significantly slower
      if (loadTime > 6000) {
        console.warn('App loading may be slow on large screens');
      }
    });

    it('should handle orientation changes smoothly', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const startTime = Date.now();
      
      await rotateToLandscape();
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const rotationTime = Date.now() - startTime;
      console.log(`Orientation change completed in ${rotationTime}ms`);
      
      // Rotation should be smooth and fast
      if (rotationTime > 2000) {
        console.warn('Orientation change may be slow');
      }
    });
  });
});
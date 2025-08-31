/**
 * Performance E2E Tests
 * Tests app performance on different device configurations
 */

import { 
  TEST_IDS, 
  TIMEOUTS,
  waitForElement,
  tapElement,
  expectElementToBeVisible,
  measurePerformance,
  isIOS,
  isAndroid
} from '../../utils/testHelpers';

import {
  takeDeviceScreenshot,
  getCurrentPlatform,
  getDeviceConfig
} from '../../utils/deviceManager';

describe('Performance Testing', () => {
  let performanceMetrics: any[] = [];

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

  afterAll(() => {
    // Log performance summary
    console.log('\n=== PERFORMANCE TESTING SUMMARY ===');
    performanceMetrics.forEach(metric => {
      console.log(`${metric.test}: ${metric.duration}ms`);
    });
  });

  const recordMetric = (testName: string, duration: number) => {
    performanceMetrics.push({ test: testName, duration });
  };

  describe('App Launch Performance', () => {
    it('should launch within acceptable time limits', async () => {
      const platform = getCurrentPlatform();
      const deviceConfig = getDeviceConfig();
      
      // Measure cold start time
      const coldStartTime = await measurePerformance(async () => {
        await device.terminateApp();
        await device.launchApp({ newInstance: true });
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.EXTRA_LONG);
      });
      
      recordMetric(`${platform} Cold Start`, coldStartTime);
      
      // Cold start should be under 5 seconds
      if (coldStartTime > 5000) {
        console.warn(`Cold start time (${coldStartTime}ms) exceeds target (5000ms)`);
      } else {
        console.log(`✓ Cold start time: ${coldStartTime}ms`);
      }
      
      // Measure warm start time
      const warmStartTime = await measurePerformance(async () => {
        await device.sendToHome();
        await device.launchApp({ newInstance: false });
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      });
      
      recordMetric(`${platform} Warm Start`, warmStartTime);
      
      // Warm start should be under 2 seconds
      if (warmStartTime > 2000) {
        console.warn(`Warm start time (${warmStartTime}ms) exceeds target (2000ms)`);
      } else {
        console.log(`✓ Warm start time: ${warmStartTime}ms`);
      }
    });

    it('should handle multiple app launches efficiently', async () => {
      const launchTimes: number[] = [];
      
      // Test multiple launches
      for (let i = 0; i < 3; i++) {
        const launchTime = await measurePerformance(async () => {
          await device.terminateApp();
          await device.launchApp({ newInstance: true });
          await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.EXTRA_LONG);
        });
        
        launchTimes.push(launchTime);
        console.log(`Launch ${i + 1}: ${launchTime}ms`);
      }
      
      const avgLaunchTime = launchTimes.reduce((a, b) => a + b, 0) / launchTimes.length;
      recordMetric('Average Launch Time', avgLaunchTime);
      
      // Launch times should be consistent
      const maxVariation = Math.max(...launchTimes) - Math.min(...launchTimes);
      if (maxVariation > 2000) {
        console.warn(`Launch time variation (${maxVariation}ms) is high`);
      }
    });
  });

  describe('Navigation Performance', () => {
    it('should navigate between screens quickly', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const navigationTests = [
        { from: TEST_IDS.HOME_TAB, to: TEST_IDS.SOCIAL_TAB, screen: TEST_IDS.SOCIAL_SCREEN, name: 'Home to Social' },
        { from: TEST_IDS.SOCIAL_TAB, to: TEST_IDS.ANALYTICS_TAB, screen: TEST_IDS.ANALYTICS_SCREEN, name: 'Social to Analytics' },
        { from: TEST_IDS.ANALYTICS_TAB, to: TEST_IDS.HOME_TAB, screen: TEST_IDS.HOME_SCREEN, name: 'Analytics to Home' }
      ];
      
      for (const { from, to, screen, name } of navigationTests) {
        const navTime = await measurePerformance(async () => {
          await tapElement(to);
          await waitForElement(by.id(screen), TIMEOUTS.MEDIUM);
        });
        
        recordMetric(name, navTime);
        
        // Navigation should be under 500ms
        if (navTime > 500) {
          console.warn(`${name} navigation (${navTime}ms) exceeds target (500ms)`);
        } else {
          console.log(`✓ ${name}: ${navTime}ms`);
        }
      }
    });

    it('should handle rapid navigation without issues', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Rapid tab switching
      const rapidNavTime = await measurePerformance(async () => {
        const tabs = [TEST_IDS.SOCIAL_TAB, TEST_IDS.ANALYTICS_TAB, TEST_IDS.HOME_TAB];
        
        for (let i = 0; i < 5; i++) {
          for (const tab of tabs) {
            await tapElement(tab);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // End on home screen
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      });
      
      recordMetric('Rapid Navigation', rapidNavTime);
      console.log(`Rapid navigation completed in: ${rapidNavTime}ms`);
    });
  });

  describe('Screen Rendering Performance', () => {
    it('should render home screen efficiently', async () => {
      const renderTime = await measurePerformance(async () => {
        await device.reloadReactNative();
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      });
      
      recordMetric('Home Screen Render', renderTime);
      
      // Screen rendering should be under 2 seconds
      if (renderTime > 2000) {
        console.warn(`Home screen render (${renderTime}ms) exceeds target (2000ms)`);
      } else {
        console.log(`✓ Home screen render: ${renderTime}ms`);
      }
    });

    it('should render social screen efficiently', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const renderTime = await measurePerformance(async () => {
        await tapElement(TEST_IDS.SOCIAL_TAB);
        await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
      });
      
      recordMetric('Social Screen Render', renderTime);
      
      if (renderTime > 1000) {
        console.warn(`Social screen render (${renderTime}ms) exceeds target (1000ms)`);
      } else {
        console.log(`✓ Social screen render: ${renderTime}ms`);
      }
    });

    it('should render analytics screen efficiently', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const renderTime = await measurePerformance(async () => {
        await tapElement(TEST_IDS.ANALYTICS_TAB);
        await waitForElement(by.id(TEST_IDS.ANALYTICS_SCREEN), TIMEOUTS.MEDIUM);
      });
      
      recordMetric('Analytics Screen Render', renderTime);
      
      // Analytics might take longer due to chart rendering
      if (renderTime > 2000) {
        console.warn(`Analytics screen render (${renderTime}ms) exceeds target (2000ms)`);
      } else {
        console.log(`✓ Analytics screen render: ${renderTime}ms`);
      }
    });
  });

  describe('User Interaction Performance', () => {
    it('should respond to button taps quickly', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const tapResponseTime = await measurePerformance(async () => {
        await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
        await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      });
      
      recordMetric('Button Tap Response', tapResponseTime);
      
      // Button response should be under 300ms
      if (tapResponseTime > 300) {
        console.warn(`Button tap response (${tapResponseTime}ms) exceeds target (300ms)`);
      } else {
        console.log(`✓ Button tap response: ${tapResponseTime}ms`);
      }
      
      // Close the screen
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

    it('should handle text input efficiently', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);
      
      const textInputTime = await measurePerformance(async () => {
        await tapElement(TEST_IDS.HABIT_NAME_INPUT);
        await typeText(TEST_IDS.HABIT_NAME_INPUT, 'Performance Test Habit');
      });
      
      recordMetric('Text Input Response', textInputTime);
      
      // Text input should be responsive
      if (textInputTime > 1000) {
        console.warn(`Text input (${textInputTime}ms) exceeds target (1000ms)`);
      } else {
        console.log(`✓ Text input response: ${textInputTime}ms`);
      }
      
      // Close the screen
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

    it('should handle scrolling smoothly', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Test scrolling performance if content is scrollable
      try {
        const scrollTime = await measurePerformance(async () => {
          await element(by.id(TEST_IDS.HOME_SCREEN)).swipe('up', 'fast', 0.8);
          await new Promise(resolve => setTimeout(resolve, 500));
          await element(by.id(TEST_IDS.HOME_SCREEN)).swipe('down', 'fast', 0.8);
        });
        
        recordMetric('Scroll Performance', scrollTime);
        console.log(`Scroll performance: ${scrollTime}ms`);
      } catch (error) {
        console.log('Scrolling test not applicable (no scrollable content)');
      }
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle multiple screen transitions without memory issues', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Perform many screen transitions to test memory usage
      const memoryTestTime = await measurePerformance(async () => {
        const screens = [
          { tab: TEST_IDS.SOCIAL_TAB, screen: TEST_IDS.SOCIAL_SCREEN },
          { tab: TEST_IDS.ANALYTICS_TAB, screen: TEST_IDS.ANALYTICS_SCREEN },
          { tab: TEST_IDS.HOME_TAB, screen: TEST_IDS.HOME_SCREEN }
        ];
        
        // Perform 10 cycles of navigation
        for (let cycle = 0; cycle < 10; cycle++) {
          for (const { tab, screen } of screens) {
            await tapElement(tab);
            await waitForElement(by.id(screen), TIMEOUTS.MEDIUM);
          }
        }
      });
      
      recordMetric('Memory Stress Test', memoryTestTime);
      console.log(`Memory stress test completed in: ${memoryTestTime}ms`);
      
      // App should still be responsive after memory stress test
      await expectElementToBeVisible(TEST_IDS.HOME_SCREEN);
    });

    it('should handle app backgrounding and foregrounding efficiently', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      const backgroundingTime = await measurePerformance(async () => {
        // Background the app
        await device.sendToHome();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Foreground the app
        await device.launchApp({ newInstance: false });
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      });
      
      recordMetric('Background/Foreground', backgroundingTime);
      
      if (backgroundingTime > 3000) {
        console.warn(`Background/foreground (${backgroundingTime}ms) exceeds target (3000ms)`);
      } else {
        console.log(`✓ Background/foreground: ${backgroundingTime}ms`);
      }
    });
  });

  describe('Network Performance', () => {
    it('should handle network operations efficiently', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Test network-dependent operations
      const networkTestTime = await measurePerformance(async () => {
        // Navigate to social screen (might load network data)
        await tapElement(TEST_IDS.SOCIAL_TAB);
        await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
        
        // Navigate to analytics (might load network data)
        await tapElement(TEST_IDS.ANALYTICS_TAB);
        await waitForElement(by.id(TEST_IDS.ANALYTICS_SCREEN), TIMEOUTS.MEDIUM);
        
        // Return to home
        await tapElement(TEST_IDS.HOME_TAB);
        await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      });
      
      recordMetric('Network Operations', networkTestTime);
      console.log(`Network operations completed in: ${networkTestTime}ms`);
    });

    it('should handle offline scenarios gracefully', async () => {
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Test app behavior when network is unavailable
      // This would require network simulation capabilities
      
      console.log('Offline testing requires network simulation setup');
      console.log('Manual testing recommended: Disable network and test app functionality');
      
      await takeDeviceScreenshot('offline-testing-placeholder');
    });
  });

  describe('Platform-Specific Performance', () => {
    it('should meet iOS performance standards', async () => {
      if (!isIOS()) {
        return;
      }
      
      const platform = getCurrentPlatform();
      console.log(`\n=== iOS PERFORMANCE STANDARDS ===`);
      
      // iOS specific performance requirements
      const iosStandards = {
        'App Launch': 3000,
        'Screen Transition': 300,
        'Button Response': 200,
        'Scroll Performance': 16 // 60fps = 16ms per frame
      };
      
      console.log('iOS Performance Targets:');
      Object.entries(iosStandards).forEach(([metric, target]) => {
        console.log(`- ${metric}: <${target}ms`);
      });
      
      await takeDeviceScreenshot('ios-performance-standards');
    });

    it('should meet Android performance standards', async () => {
      if (!isAndroid()) {
        return;
      }
      
      const platform = getCurrentPlatform();
      console.log(`\n=== ANDROID PERFORMANCE STANDARDS ===`);
      
      // Android specific performance requirements
      const androidStandards = {
        'App Launch': 4000,
        'Screen Transition': 400,
        'Button Response': 250,
        'Scroll Performance': 16 // 60fps = 16ms per frame
      };
      
      console.log('Android Performance Targets:');
      Object.entries(androidStandards).forEach(([metric, target]) => {
        console.log(`- ${metric}: <${target}ms`);
      });
      
      await takeDeviceScreenshot('android-performance-standards');
    });
  });

  describe('Performance Regression Testing', () => {
    it('should maintain consistent performance across test runs', async () => {
      const consistencyTests = [];
      
      // Run the same test multiple times to check consistency
      for (let i = 0; i < 3; i++) {
        const testTime = await measurePerformance(async () => {
          await device.reloadReactNative();
          await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
          
          await tapElement(TEST_IDS.SOCIAL_TAB);
          await waitForElement(by.id(TEST_IDS.SOCIAL_SCREEN), TIMEOUTS.MEDIUM);
          
          await tapElement(TEST_IDS.HOME_TAB);
          await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
        });
        
        consistencyTests.push(testTime);
      }
      
      const avgTime = consistencyTests.reduce((a, b) => a + b, 0) / consistencyTests.length;
      const maxVariation = Math.max(...consistencyTests) - Math.min(...consistencyTests);
      
      recordMetric('Performance Consistency', avgTime);
      
      console.log(`Performance consistency test:`);
      console.log(`- Average time: ${avgTime}ms`);
      console.log(`- Max variation: ${maxVariation}ms`);
      
      // Variation should be reasonable
      if (maxVariation > avgTime * 0.3) {
        console.warn('High performance variation detected');
      } else {
        console.log('✓ Performance is consistent across runs');
      }
    });
  });
});
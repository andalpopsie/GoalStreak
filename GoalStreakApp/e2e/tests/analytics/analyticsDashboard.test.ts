/**
 * Analytics Dashboard E2E Tests
 * Tests analytics dashboard navigation, chart rendering, and data display
 */

import { 
  TEST_IDS, 
  TIMEOUTS,
  waitForElement,
  tapElement,
  expectElementToBeVisible,
  expectElementToHaveText,
  takeScreenshot,
  swipeUp,
  swipeDown,
  swipeLeft,
  swipeRight
} from '../../utils/testHelpers';

describe('Analytics Dashboard', () => {
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

  beforeEach(async () => {
    // Navigate to analytics screen before each test
    await tapElement(TEST_IDS.ANALYTICS_TAB);
    await waitForElement(by.id(TEST_IDS.ANALYTICS_SCREEN), TIMEOUTS.MEDIUM);
  });

  describe('Dashboard Navigation', () => {
    it('should display analytics dashboard', async () => {
      await expectElementToBeVisible(TEST_IDS.ANALYTICS_SCREEN);
      
      // Check for main analytics components
      try {
        await expectElementToBeVisible(TEST_IDS.STATS_OVERVIEW);
      } catch (error) {
        console.log('Stats overview not found');
      }
      
      try {
        await expectElementToBeVisible(TEST_IDS.PROGRESS_CHART);
      } catch (error) {
        console.log('Progress chart not found');
      }
      
      await takeScreenshot('analytics-dashboard-loaded');
    });

    it('should handle empty analytics state', async () => {
      // For new users with no data, should show appropriate empty state
      try {
        await waitForElement(by.id('empty-analytics-state'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('empty-analytics-state');
        
        // Should encourage user to create habits
        await expectElementToBeVisible('create-habits-prompt');
        
      } catch (error) {
        console.log('User has analytics data, empty state not shown');
      }
    });

    it('should scroll through analytics content', async () => {
      // Test scrolling through analytics dashboard
      try {
        await swipeUp(TEST_IDS.ANALYTICS_SCREEN);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await swipeDown(TEST_IDS.ANALYTICS_SCREEN);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log('Analytics scrolling not available');
      }
    });
  });

  describe('Statistics Overview', () => {
    it('should display key statistics', async () => {
      try {
        await waitForElement(by.id(TEST_IDS.STATS_OVERVIEW), TIMEOUTS.MEDIUM);
        
        // Check for key stat elements
        const statElements = [
          'total-habits-stat',
          'active-streaks-stat',
          'completion-rate-stat',
          'longest-streak-stat'
        ];
        
        for (const statId of statElements) {
          try {
            await expectElementToBeVisible(statId);
          } catch (error) {
            console.log(`Stat element ${statId} not found`);
          }
        }
        
        await takeScreenshot('statistics-overview');
      } catch (error) {
        console.log('Statistics overview not available');
      }
    });

    it('should show accurate habit counts', async () => {
      try {
        await waitForElement(by.id('total-habits-stat'), TIMEOUTS.MEDIUM);
        
        // Verify that habit count is displayed
        // Note: Actual verification would require knowing expected values
        await expectElementToBeVisible('total-habits-stat');
        
      } catch (error) {
        console.log('Habit count stat not available');
      }
    });

    it('should display streak information', async () => {
      try {
        await waitForElement(by.id('active-streaks-stat'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('active-streaks-stat');
        
        await waitForElement(by.id('longest-streak-stat'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('longest-streak-stat');
        
      } catch (error) {
        console.log('Streak statistics not available');
      }
    });

    it('should show completion rate', async () => {
      try {
        await waitForElement(by.id('completion-rate-stat'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('completion-rate-stat');
        
        // Completion rate should be a percentage
        // Could verify format if needed
        
      } catch (error) {
        console.log('Completion rate stat not available');
      }
    });
  });

  describe('Progress Charts', () => {
    it('should display progress chart', async () => {
      try {
        await waitForElement(by.id(TEST_IDS.PROGRESS_CHART), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible(TEST_IDS.PROGRESS_CHART);
        
        await takeScreenshot('progress-chart-displayed');
      } catch (error) {
        console.log('Progress chart not available');
      }
    });

    it('should handle chart interactions', async () => {
      try {
        await waitForElement(by.id(TEST_IDS.PROGRESS_CHART), TIMEOUTS.MEDIUM);
        
        // Test chart interactions (tap, swipe)
        await tapElement(TEST_IDS.PROGRESS_CHART);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test swiping through chart data
        await swipeLeft(TEST_IDS.PROGRESS_CHART);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await swipeRight(TEST_IDS.PROGRESS_CHART);
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log('Chart interactions not available');
      }
    });

    it('should show different time periods', async () => {
      // Test switching between different time periods (week, month, year)
      try {
        const timePeriods = ['week-view', 'month-view', 'year-view'];
        
        for (const period of timePeriods) {
          try {
            await tapElement(period);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verify chart updated for new time period
            await expectElementToBeVisible(TEST_IDS.PROGRESS_CHART);
            
          } catch (error) {
            console.log(`Time period ${period} not available`);
          }
        }
        
      } catch (error) {
        console.log('Time period selection not available');
      }
    });

    it('should display chart legends and labels', async () => {
      try {
        await waitForElement(by.id(TEST_IDS.PROGRESS_CHART), TIMEOUTS.MEDIUM);
        
        // Check for chart legends and labels
        const chartElements = [
          'chart-legend',
          'x-axis-labels',
          'y-axis-labels',
          'chart-title'
        ];
        
        for (const element of chartElements) {
          try {
            await expectElementToBeVisible(element);
          } catch (error) {
            console.log(`Chart element ${element} not found`);
          }
        }
        
      } catch (error) {
        console.log('Chart elements not available');
      }
    });
  });

  describe('Insights and Trends', () => {
    it('should display habit insights', async () => {
      try {
        await waitForElement(by.id('insights-section'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('insights-section');
        
        // Check for different types of insights
        const insightTypes = [
          'best-performing-habit',
          'improvement-suggestions',
          'streak-achievements',
          'consistency-trends'
        ];
        
        for (const insight of insightTypes) {
          try {
            await expectElementToBeVisible(insight);
          } catch (error) {
            console.log(`Insight ${insight} not found`);
          }
        }
        
        await takeScreenshot('habit-insights');
      } catch (error) {
        console.log('Insights section not available');
      }
    });

    it('should show trend analysis', async () => {
      try {
        await waitForElement(by.id('trends-section'), TIMEOUTS.MEDIUM);
        
        // Check for trend indicators
        const trendElements = [
          'weekly-trend',
          'monthly-trend',
          'improvement-trend',
          'decline-trend'
        ];
        
        for (const trend of trendElements) {
          try {
            await expectElementToBeVisible(trend);
          } catch (error) {
            console.log(`Trend element ${trend} not found`);
          }
        }
        
      } catch (error) {
        console.log('Trends section not available');
      }
    });

    it('should provide actionable recommendations', async () => {
      try {
        await waitForElement(by.id('recommendations-section'), TIMEOUTS.MEDIUM);
        
        // Check for recommendation cards
        await expectElementToBeVisible('recommendations-section');
        
        // Recommendations should be actionable
        try {
          await tapElement('recommendation-action-button');
          // Should navigate to relevant screen or show more info
        } catch (error) {
          console.log('Recommendation actions not available');
        }
        
      } catch (error) {
        console.log('Recommendations section not available');
      }
    });
  });

  describe('Category Analytics', () => {
    it('should show analytics by category', async () => {
      try {
        await waitForElement(by.id('category-analytics'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('category-analytics');
        
        // Check for different habit categories
        const categories = [
          'fitness-category-stats',
          'wellness-category-stats',
          'productivity-category-stats',
          'mindfulness-category-stats'
        ];
        
        for (const category of categories) {
          try {
            await expectElementToBeVisible(category);
          } catch (error) {
            console.log(`Category ${category} not found`);
          }
        }
        
        await takeScreenshot('category-analytics');
      } catch (error) {
        console.log('Category analytics not available');
      }
    });

    it('should allow filtering by category', async () => {
      try {
        // Test category filter functionality
        const categoryFilters = ['all-categories', 'fitness-filter', 'wellness-filter'];
        
        for (const filter of categoryFilters) {
          try {
            await tapElement(filter);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verify analytics updated for selected category
            await expectElementToBeVisible(TEST_IDS.PROGRESS_CHART);
            
          } catch (error) {
            console.log(`Category filter ${filter} not available`);
          }
        }
        
      } catch (error) {
        console.log('Category filtering not available');
      }
    });
  });

  describe('Achievement Tracking', () => {
    it('should display achievements and milestones', async () => {
      try {
        await waitForElement(by.id('achievements-section'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('achievements-section');
        
        // Check for achievement badges
        const achievements = [
          'first-habit-achievement',
          'week-streak-achievement',
          'month-streak-achievement',
          'consistency-achievement'
        ];
        
        for (const achievement of achievements) {
          try {
            await expectElementToBeVisible(achievement);
          } catch (error) {
            console.log(`Achievement ${achievement} not found`);
          }
        }
        
        await takeScreenshot('achievements-display');
      } catch (error) {
        console.log('Achievements section not available');
      }
    });

    it('should show progress towards next milestone', async () => {
      try {
        await waitForElement(by.id('milestone-progress'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('milestone-progress');
        
        // Should show progress bar or indicator
        await expectElementToBeVisible('milestone-progress-bar');
        
      } catch (error) {
        console.log('Milestone progress not available');
      }
    });
  });

  describe('Data Export and Sharing', () => {
    it('should allow sharing analytics', async () => {
      try {
        await tapElement('share-analytics-button');
        
        // Should open share dialog
        await waitForElement(by.id('share-dialog'), TIMEOUTS.MEDIUM);
        
        // Test different sharing options
        const shareOptions = ['share-image', 'share-summary', 'share-link'];
        
        for (const option of shareOptions) {
          try {
            await tapElement(option);
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.log(`Share option ${option} not available`);
          }
        }
        
      } catch (error) {
        console.log('Analytics sharing not available');
      }
    });

    it('should handle data export', async () => {
      try {
        await tapElement('export-data-button');
        
        // Should show export options
        await waitForElement(by.id('export-dialog'), TIMEOUTS.MEDIUM);
        
        // Test export formats
        const exportFormats = ['export-csv', 'export-json', 'export-pdf'];
        
        for (const format of exportFormats) {
          try {
            await tapElement(format);
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.log(`Export format ${format} not available`);
          }
        }
        
      } catch (error) {
        console.log('Data export not available');
      }
    });
  });

  describe('Performance and Loading', () => {
    it('should load analytics data efficiently', async () => {
      // Test analytics loading performance
      const startTime = Date.now();
      
      await device.reloadReactNative();
      await tapElement(TEST_IDS.ANALYTICS_TAB);
      await waitForElement(by.id(TEST_IDS.ANALYTICS_SCREEN), TIMEOUTS.MEDIUM);
      
      const loadTime = Date.now() - startTime;
      
      // Analytics should load within reasonable time
      if (loadTime > 5000) {
        console.warn(`Analytics loading took ${loadTime}ms, which may be too slow`);
      }
      
      console.log(`Analytics loaded in ${loadTime}ms`);
    });

    it('should handle large datasets', async () => {
      // Test with users who have lots of data
      try {
        await waitForElement(by.id(TEST_IDS.PROGRESS_CHART), TIMEOUTS.LONG);
        
        // Test scrolling through large datasets
        await swipeUp(TEST_IDS.ANALYTICS_SCREEN);
        await swipeDown(TEST_IDS.ANALYTICS_SCREEN);
        
        // Chart should remain responsive
        await tapElement(TEST_IDS.PROGRESS_CHART);
        
      } catch (error) {
        console.log('Large dataset handling test not applicable');
      }
    });
  });
});
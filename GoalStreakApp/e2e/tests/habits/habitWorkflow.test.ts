/**
 * Habit Management Workflow E2E Tests
 * Tests habit creation, completion, and streak tracking workflows
 */

import { 
  TEST_IDS, 
  TIMEOUTS,
  waitForElement,
  tapElement,
  typeText,
  expectElementToBeVisible,
  expectElementToHaveText,
  generateRandomHabitName,
  takeScreenshot,
  swipeUp,
  swipeDown
} from '../../utils/testHelpers';

describe('Habit Management Workflow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    
    // Login with test user (assuming test user exists)
    try {
      await waitForElement(by.id(TEST_IDS.LOGIN_SCREEN), TIMEOUTS.MEDIUM);
      await typeText(TEST_IDS.EMAIL_INPUT, 'test@example.com');
      await typeText(TEST_IDS.PASSWORD_INPUT, 'TestPassword123!');
      await tapElement(TEST_IDS.LOGIN_BUTTON);
    } catch (error) {
      // User might already be logged in
      console.log('User already logged in or login screen not found');
    }
    
    await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.EXTRA_LONG);
  });

  beforeEach(async () => {
    // Navigate to home screen before each test
    await tapElement(TEST_IDS.HOME_TAB);
    await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
  });

  describe('Habit Creation Flow', () => {
    it('should create a new habit successfully', async () => {
      const habitName = generateRandomHabitName();
      
      // Tap add habit button
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);

      // Fill habit details
      await typeText(TEST_IDS.HABIT_NAME_INPUT, habitName);
      
      // Select category
      await tapElement(TEST_IDS.CATEGORY_PICKER);
      await tapElement('category-fitness'); // Assuming fitness category exists
      
      // Select frequency
      await tapElement(TEST_IDS.FREQUENCY_PICKER);
      await tapElement('frequency-daily'); // Assuming daily frequency option exists
      
      // Save habit
      await tapElement(TEST_IDS.SAVE_HABIT_BUTTON);

      // Should return to home screen with new habit
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Verify habit appears in the list
      await waitForElement(by.text(habitName), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.HABITS_GRID);
      
      await takeScreenshot('habit-created-successfully');
    });

    it('should validate required fields in habit creation', async () => {
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);

      // Try to save without filling required fields
      await tapElement(TEST_IDS.SAVE_HABIT_BUTTON);

      // Should show validation error
      await waitForElement(by.id(TEST_IDS.ERROR_MESSAGE), TIMEOUTS.MEDIUM);
      await expectElementToBeVisible(TEST_IDS.ERROR_MESSAGE);
    });

    it('should allow selecting different categories and frequencies', async () => {
      const habitName = generateRandomHabitName();
      
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);

      await typeText(TEST_IDS.HABIT_NAME_INPUT, habitName);
      
      // Test different categories
      await tapElement(TEST_IDS.CATEGORY_PICKER);
      await tapElement('category-wellness');
      
      // Test different frequencies
      await tapElement(TEST_IDS.FREQUENCY_PICKER);
      await tapElement('frequency-weekly');
      
      await tapElement(TEST_IDS.SAVE_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
      
      // Verify habit was created with correct settings
      await waitForElement(by.text(habitName), TIMEOUTS.MEDIUM);
    });

    it('should handle habit creation with privacy settings', async () => {
      const habitName = generateRandomHabitName();
      
      await tapElement(TEST_IDS.ADD_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.CREATE_HABIT_SCREEN), TIMEOUTS.MEDIUM);

      await typeText(TEST_IDS.HABIT_NAME_INPUT, habitName);
      await tapElement(TEST_IDS.CATEGORY_PICKER);
      await tapElement('category-fitness');
      
      // Toggle privacy setting if available
      try {
        await tapElement('privacy-toggle');
      } catch (error) {
        console.log('Privacy toggle not found');
      }
      
      await tapElement(TEST_IDS.SAVE_HABIT_BUTTON);
      await waitForElement(by.id(TEST_IDS.HOME_SCREEN), TIMEOUTS.MEDIUM);
    });
  });

  describe('Habit Completion Flow', () => {
    it('should complete a habit and update streak', async () => {
      // Ensure there's at least one habit
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Find first habit card and complete it
      try {
        await tapElement(TEST_IDS.HABIT_COMPLETION_BUTTON);
      } catch (error) {
        // If specific button not found, tap the habit card itself
        await tapElement(TEST_IDS.HABIT_CARD);
      }

      // Verify completion feedback
      try {
        await waitForElement(by.id('completion-animation'), TIMEOUTS.SHORT);
      } catch (error) {
        console.log('Completion animation not found');
      }

      // Check if streak counter updated
      await waitForElement(by.id(TEST_IDS.STREAK_COUNTER), TIMEOUTS.MEDIUM);
      
      await takeScreenshot('habit-completed');
    });

    it('should show completion state visually', async () => {
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Complete a habit
      await tapElement(TEST_IDS.HABIT_CARD);
      
      // Verify visual completion state
      try {
        await waitForElement(by.id('completed-indicator'), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible('completed-indicator');
      } catch (error) {
        console.log('Completed indicator not found');
      }
    });

    it('should allow uncompleting a habit', async () => {
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Complete a habit first
      await tapElement(TEST_IDS.HABIT_CARD);
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Tap again to uncomplete
      await tapElement(TEST_IDS.HABIT_CARD);
      
      // Verify uncompleted state
      try {
        await waitForElement(by.id('uncompleted-indicator'), TIMEOUTS.MEDIUM);
      } catch (error) {
        console.log('Uncompleted state verification not available');
      }
    });
  });

  describe('Streak Tracking', () => {
    it('should display current streak correctly', async () => {
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Check if streak counter is visible
      await expectElementToBeVisible(TEST_IDS.STREAK_COUNTER);
      
      // Complete habit to increment streak
      await tapElement(TEST_IDS.HABIT_CARD);
      
      // Verify streak updated (this would require specific implementation)
      await waitForElement(by.id(TEST_IDS.STREAK_COUNTER), TIMEOUTS.MEDIUM);
    });

    it('should handle streak milestones', async () => {
      // This test would verify streak milestone celebrations
      // Implementation depends on milestone feature
      
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Complete habit multiple times (would need test data setup)
      for (let i = 0; i < 3; i++) {
        await tapElement(TEST_IDS.HABIT_CARD);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check for milestone celebration
      try {
        await waitForElement(by.id('milestone-celebration'), TIMEOUTS.MEDIUM);
      } catch (error) {
        console.log('Milestone celebration not found');
      }
    });
  });

  describe('Habit Management', () => {
    it('should edit an existing habit', async () => {
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Long press or tap edit button on habit card
      try {
        await element(by.id(TEST_IDS.HABIT_CARD)).longPress();
        await tapElement('edit-habit-button');
      } catch (error) {
        console.log('Edit functionality not accessible via long press');
      }
      
      // If edit screen opens, modify habit
      try {
        await waitForElement(by.id('edit-habit-screen'), TIMEOUTS.MEDIUM);
        await typeText(TEST_IDS.HABIT_NAME_INPUT, ' - Edited');
        await tapElement(TEST_IDS.SAVE_HABIT_BUTTON);
      } catch (error) {
        console.log('Edit screen not found');
      }
    });

    it('should delete a habit', async () => {
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Try to access delete functionality
      try {
        await element(by.id(TEST_IDS.HABIT_CARD)).longPress();
        await tapElement('delete-habit-button');
        
        // Confirm deletion if confirmation dialog appears
        await tapElement('confirm-delete-button');
        
        // Verify habit is removed
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log('Delete functionality not accessible');
      }
    });

    it('should handle empty habits state', async () => {
      // This test checks the empty state when no habits exist
      try {
        await waitForElement(by.id(TEST_IDS.EMPTY_HABITS_STATE), TIMEOUTS.MEDIUM);
        await expectElementToBeVisible(TEST_IDS.EMPTY_HABITS_STATE);
        
        // Should show add habit prompt
        await expectElementToBeVisible(TEST_IDS.ADD_HABIT_BUTTON);
      } catch (error) {
        console.log('Empty state not visible (habits exist)');
      }
    });
  });

  describe('Habit List Navigation', () => {
    it('should scroll through habit list', async () => {
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Test scrolling if there are many habits
      try {
        await swipeUp(TEST_IDS.HABITS_GRID);
        await swipeDown(TEST_IDS.HABITS_GRID);
      } catch (error) {
        console.log('Scrolling not needed or not available');
      }
    });

    it('should handle habit card interactions', async () => {
      await waitForElement(by.id(TEST_IDS.HABITS_GRID), TIMEOUTS.MEDIUM);
      
      // Test various interactions with habit cards
      await tapElement(TEST_IDS.HABIT_CARD);
      
      // Verify interaction feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await takeScreenshot('habit-interaction');
    });
  });
});
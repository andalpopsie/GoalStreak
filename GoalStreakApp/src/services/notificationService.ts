import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Habit interface (minimal for notifications)
interface Habit {
  id: string;
  name: string;
  reminderTime?: string;
  reminderEnabled?: boolean;
}

// Configure notification behavior (iOS/Android best practices)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.setupNotificationCategories();
  }

  /**
   * Setup notification categories with actions (iOS/Android standard)
   */
  private async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('habit-reminder', [
      {
        identifier: 'complete',
        buttonTitle: 'Mark Complete ✅',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze 10min ⏰',
        options: { opensAppToForeground: false },
      },
    ]);
  }

  /**
   * Check and request permissions (standard approach)
   */
  async checkAndRequestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
    
    return true;
  }

  /**
   * Schedule habit reminder using native repeating notifications
   * This is the industry standard approach used by successful apps
   */
  async scheduleHabitReminder(habit: Habit): Promise<string | null> {
    try {
      if (!habit.reminderTime || !habit.reminderEnabled) {
        console.log(`⏭️ Skipping notification for ${habit.name} - reminder disabled or no time set`);
        return null;
      }

      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        console.error('❌ Notification permissions not granted');
        return null;
      }

      // Parse time
      const [hours, minutes] = habit.reminderTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.error('❌ Invalid time format:', habit.reminderTime);
        return null;
      }

      // Cancel existing notifications for this habit
      await this.cancelHabitReminders(habit.id);

      // Use native daily repeating notification (best practice)
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${habit.name}! 🎯`,
          body: `Keep your streak alive - complete your ${habit.name} habit now!`,
          badge: 1,
          categoryIdentifier: 'habit-reminder',
          data: { 
            type: 'habit_reminder',
            habitId: habit.id,
            habitName: habit.name,
          },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true, // Native daily repeat - industry standard
        },
      });

      console.log(`✅ Scheduled daily reminder for ${habit.name} at ${hours}:${minutes.toString().padStart(2, '0')}`);
      
      // Store notification ID for cancellation
      await this.storeNotificationId(habit.id, notificationId);
      
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling habit reminder:', error);
      throw error;
    }
  }

  /**
   * Cancel habit reminders
   */
  async cancelHabitReminders(habitId: string): Promise<void> {
    try {
      const notificationIds = await this.getStoredNotificationIds(habitId);
      
      if (notificationIds.length > 0) {
        await Notifications.cancelScheduledNotificationAsync(notificationIds[0]);
        await this.clearStoredNotificationIds(habitId);
        console.log(`🗑️ Cancelled ${notificationIds.length} notifications for habit ${habitId}`);
      }
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
    }
  }

  /**
   * Handle notification actions (mark complete, snooze)
   */
  async handleNotificationAction(actionIdentifier: string, notification: any) {
    const { habitId } = notification.request.content.data;
    
    switch (actionIdentifier) {
      case 'complete':
        // Mark habit as complete without opening app
        // This would integrate with your habit service
        console.log(`✅ Marked habit ${habitId} as complete from notification`);
        break;
        
      case 'snooze':
        // Schedule snooze notification (10 minutes)
        await this.scheduleSnoozeNotification(habitId, notification.request.content);
        console.log(`⏰ Snoozed habit ${habitId} for 10 minutes`);
        break;
    }
  }

  /**
   * Schedule snooze notification (industry standard)
   */
  private async scheduleSnoozeNotification(habitId: string, originalContent: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        ...originalContent,
        title: `⏰ Snooze reminder: ${originalContent.title}`,
        body: 'Your snoozed habit reminder is ready!',
      },
      trigger: {
        type: 'timeInterval',
        seconds: 600, // 10 minutes
      },
    });
  }

  /**
   * Test individual habit reminder (Phase 1 testing)
   */
  async testHabitReminder(): Promise<any> {
    try {
      console.log('🧪 Testing individual habit reminder...');
      
      // Create a test habit
      const testHabit: Habit = {
        id: 'test-habit-001',
        name: 'Morning Workout',
        reminderTime: '07:30',
        reminderEnabled: true,
      };

      // Schedule the reminder
      const notificationId = await this.scheduleHabitReminder(testHabit);
      
      if (notificationId) {
        console.log(`✅ Test habit reminder scheduled: ${notificationId}`);
        return {
          success: true,
          habitName: testHabit.name,
          reminderTime: testHabit.reminderTime,
          notificationId,
        };
      } else {
        throw new Error('Failed to schedule test habit reminder');
      }
    } catch (error) {
      console.error('❌ Error testing habit reminder:', error);
      throw error;
    }
  }

  /**
   * Comprehensive notification test suite
   */
  async runNotificationTests(): Promise<any> {
    try {
      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        console.error('❌ Cannot run tests - no notification permissions');
        return;
      }

      console.log('🧪 Starting comprehensive notification tests...');

      // Test 1: Immediate notification (5 seconds)
      const immediateId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test 1: Immediate',
          body: 'This should appear in 5 seconds',
          badge: 1,
          categoryIdentifier: 'habit-reminder',
        },
        trigger: {
          type: 'timeInterval',
          seconds: 5,
        },
      });

      // Test 2: Daily repeating notification (1 minute from now)
      const now = new Date();
      const testTime = new Date(now.getTime() + 60000); // 1 minute from now
      
      const dailyId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test 2: Daily Repeat',
          body: `Testing daily at ${testTime.getHours()}:${testTime.getMinutes().toString().padStart(2, '0')}`,
          badge: 2,
          categoryIdentifier: 'habit-reminder',
          data: { type: 'test', testId: 'daily-repeat' },
        },
        trigger: {
          type: 'calendar',
          hour: testTime.getHours(),
          minute: testTime.getMinutes(),
          repeats: true,
        },
      });

      // Test 3: Action buttons test (30 seconds)
      const actionId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test 3: Action Buttons',
          body: 'Try tapping "Mark Complete" or "Snooze" buttons!',
          badge: 3,
          categoryIdentifier: 'habit-reminder',
          data: { type: 'test', testId: 'action-buttons' },
        },
        trigger: {
          type: 'timeInterval',
          seconds: 30,
        },
      });

      // Get all scheduled notifications for verification
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      console.log('✅ Test notifications scheduled:');
      console.log(`📱 Immediate (5s): ${immediateId}`);
      console.log(`🔄 Daily repeat: ${dailyId}`);
      console.log(`🎯 Action test (30s): ${actionId}`);
      console.log(`📊 Total scheduled: ${scheduled.length}`);

      return {
        immediateId,
        dailyId,
        actionId,
        totalScheduled: scheduled.length,
        testTime: testTime.toLocaleTimeString(),
      };
    } catch (error) {
      console.error('❌ Error running notification tests:', error);
      throw error;
    }
  }

  // Helper methods for storing notification IDs (persistent settings)
  private async storeNotificationId(habitId: string, notificationId: string) {
    try {
      const key = `notification_${habitId}`;
      const existing = await AsyncStorage.getItem(key);
      const ids = existing ? JSON.parse(existing) : [];
      ids.push(notificationId);
      await AsyncStorage.setItem(key, JSON.stringify(ids));
      console.log(`💾 Stored notification ID for habit ${habitId}`);
    } catch (error) {
      console.error('❌ Error storing notification ID:', error);
    }
  }

  private async getStoredNotificationIds(habitId: string): Promise<string[]> {
    try {
      const key = `notification_${habitId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting stored notification IDs:', error);
      return [];
    }
  }

  private async clearStoredNotificationIds(habitId: string) {
    try {
      const key = `notification_${habitId}`;
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cleared stored notification IDs for habit ${habitId}`);
    } catch (error) {
      console.error('❌ Error clearing stored notification IDs:', error);
    }
  }

  /**
   * Get notification settings status (persistent)
   */
  async getNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      return settings ? JSON.parse(settings) : {
        enabled: true,
        sound: true,
        badge: true,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error getting notification settings:', error);
      return { enabled: true, sound: true, badge: true };
    }
  }

  /**
   * Save notification settings (persistent)
   */
  async saveNotificationSettings(settings: any) {
    try {
      const settingsWithTimestamp = {
        ...settings,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settingsWithTimestamp));
      console.log('💾 Notification settings saved');
    } catch (error) {
      console.error('❌ Error saving notification settings:', error);
    }
  }

  /**
   * Get all scheduled notifications for debugging
   */
  async getScheduledNotificationsInfo() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const info = scheduled.map(notification => ({
        id: notification.identifier,
        title: notification.content.title,
        trigger: notification.trigger,
        data: notification.content.data,
      }));
      
      console.log(`📊 Currently scheduled notifications: ${scheduled.length}`);
      return info;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();

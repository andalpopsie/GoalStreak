// Motivational Notification Service - Daily motivational push notifications
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_SETTINGS_KEY = '@goalstreak_motivational_notifications';

interface NotificationSettings {
  enabled: boolean;
  time: { hour: number; minute: number }; // 24-hour format
  lastScheduledDate: string;
}

// Motivational messages for notifications
const MOTIVATIONAL_MESSAGES = [
  {
    title: '🌟 Good Morning!',
    body: 'Today is a new opportunity to build great habits. Let\'s make it count!',
  },
  {
    title: '💪 You\'ve Got This!',
    body: 'Small steps every day lead to big changes. Keep going!',
  },
  {
    title: '🔥 Stay Consistent!',
    body: 'Your habits are shaping your future. Make today count!',
  },
  {
    title: '⭐ Believe in Yourself!',
    body: 'You\'re capable of amazing things. Start with one habit today!',
  },
  {
    title: '🎯 Focus on Progress!',
    body: 'Every completion brings you closer to your goals. You\'re doing great!',
  },
  {
    title: '🚀 Keep Moving Forward!',
    body: 'Consistency beats perfection. Just show up today!',
  },
  {
    title: '💚 Take Care of Yourself!',
    body: 'Your habits are investments in your future self. Keep it up!',
  },
  {
    title: '🌈 Make Today Great!',
    body: 'Your daily habits are building the life you want. Let\'s go!',
  },
  {
    title: '✨ You\'re Making Progress!',
    body: 'Every day you show up is a win. Keep building those habits!',
  },
  {
    title: '🎊 Celebrate Small Wins!',
    body: 'Each habit completed is a step forward. You\'re doing amazing!',
  },
];

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const motivationalNotificationService = {
  /**
   * Initialize and request notification permissions
   */
  async initialize(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('motivational', {
          name: 'Daily Motivation',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF894F',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Error initializing motivational notifications:', error);
      return false;
    }
  },

  /**
   * Schedule daily motivational notification
   */
  async scheduleDailyNotification(hour: number = 9, minute: number = 0): Promise<void> {
    try {
      // Cancel existing notifications first
      await this.cancelDailyNotification();

      // Get a random motivational message
      const message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

      // Schedule notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: { type: 'motivational' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      // Save settings
      const settings: NotificationSettings = {
        enabled: true,
        time: { hour, minute },
        lastScheduledDate: new Date().toISOString(),
      };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));

      console.log(`✅ Daily motivational notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
      console.log(`📱 Notification ID: ${notificationId}`);
    } catch (error) {
      console.error('Error scheduling daily notification:', error);
      throw error;
    }
  },

  /**
   * Cancel daily motivational notification
   */
  async cancelDailyNotification(): Promise<void> {
    try {
      // Cancel all scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Update settings
      const settingsStr = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settingsStr) {
        const settings: NotificationSettings = JSON.parse(settingsStr);
        settings.enabled = false;
        await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      }

      console.log('✅ Daily motivational notifications cancelled');
    } catch (error) {
      console.error('Error cancelling daily notification:', error);
      throw error;
    }
  },

  /**
   * Get current notification settings
   */
  async getSettings(): Promise<NotificationSettings | null> {
    try {
      const settingsStr = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  },

  /**
   * Update notification time
   */
  async updateNotificationTime(hour: number, minute: number): Promise<void> {
    await this.scheduleDailyNotification(hour, minute);
  },

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings?.enabled ?? false;
  },

  /**
   * Send immediate test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      const message = MOTIVATIONAL_MESSAGES[0]; // Use first message for testing

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title + ' (Test)',
          body: message.body,
          sound: 'default',
          data: { type: 'motivational_test' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });

      console.log('✅ Test notification scheduled for 2 seconds from now');
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  },

  /**
   * Get all scheduled notifications (for debugging)
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },
};

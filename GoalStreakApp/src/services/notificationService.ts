// Notification Service - Habit reminders and notifications
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@goalstreak_notifications';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  streakMilestones: boolean;
  friendActivity: boolean;
  weeklyReports: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  dailyReminder: true,
  reminderTime: '20:00', // 8 PM
  streakMilestones: true,
  friendActivity: true,
  weeklyReports: true,
};

class NotificationService {
  private settings: NotificationSettings = defaultSettings;

  async initialize(): Promise<boolean> {
    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Request permissions
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

      // Load saved settings
      await this.loadSettings();

      // Set up default notifications if enabled
      if (this.settings.enabled && this.settings.dailyReminder) {
        await this.scheduleDailyReminder();
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async loadSettings(): Promise<NotificationSettings> {
    try {
      const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
      }
      return this.settings;
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return defaultSettings;
    }
  }

  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
      
      // Update scheduled notifications based on new settings
      if (settings.dailyReminder !== undefined || settings.reminderTime !== undefined) {
        await this.updateDailyReminder();
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  async scheduleDailyReminder(): Promise<void> {
    try {
      // Cancel existing daily reminder
      await Notifications.cancelScheduledNotificationAsync('daily-reminder');

      if (!this.settings.enabled || !this.settings.dailyReminder) {
        return;
      }

      const [hours, minutes] = this.settings.reminderTime.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        identifier: 'daily-reminder',
        content: {
          title: 'Time to build your habits! 🎯',
          body: 'Check in with your daily habits and keep your streaks going strong.',
          data: { type: 'daily_reminder' },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  async updateDailyReminder(): Promise<void> {
    await this.scheduleDailyReminder();
  }

  async sendStreakMilestone(habitName: string, streakCount: number): Promise<void> {
    try {
      if (!this.settings.enabled || !this.settings.streakMilestones) {
        return;
      }

      let title = '';
      let body = '';

      if (streakCount === 7) {
        title = '🔥 One Week Streak!';
        body = `Amazing! You've completed "${habitName}" for 7 days straight!`;
      } else if (streakCount === 30) {
        title = '🏆 One Month Streak!';
        body = `Incredible! You've built a 30-day streak with "${habitName}"!`;
      } else if (streakCount === 100) {
        title = '🎉 100 Day Streak!';
        body = `Legendary! You've achieved 100 days with "${habitName}"!`;
      } else if (streakCount % 50 === 0) {
        title = `🌟 ${streakCount} Day Streak!`;
        body = `Outstanding dedication with "${habitName}"! Keep it up!`;
      } else {
        return; // Don't send notification for other milestones
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'streak_milestone', habitName, streakCount },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending streak milestone notification:', error);
    }
  }

  async sendFriendActivity(friendName: string, habitName: string): Promise<void> {
    try {
      if (!this.settings.enabled || !this.settings.friendActivity) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '👥 Friend Activity',
          body: `${friendName} just completed "${habitName}"! Keep each other motivated!`,
          data: { type: 'friend_activity', friendName, habitName },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending friend activity notification:', error);
    }
  }

  async sendWeeklyReport(completions: number, streaks: number): Promise<void> {
    try {
      if (!this.settings.enabled || !this.settings.weeklyReports) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Weekly Report',
          body: `This week: ${completions} completions and ${streaks} active streaks! Great progress!`,
          data: { type: 'weekly_report', completions, streaks },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending weekly report:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Test notification (for development)
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification 🧪',
          body: 'GoalStreak notifications are working perfectly!',
          data: { type: 'test' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

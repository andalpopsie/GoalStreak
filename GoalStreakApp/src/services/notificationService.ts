import * as Notifications from 'expo-notifications';
import { Habit } from '../types';

export class NotificationService {
  /**
   * Check notification permissions and request if needed
   */
  async checkAndRequestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      console.log('📱 Notification permission status:', finalStatus);
      return finalStatus === 'granted';
    } catch (error) {
      console.error('❌ Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule multiple daily reminders (best practice approach)
   * Schedule 7 days in advance to ensure continuity
   */
  async scheduleHabitReminder(habit: Habit): Promise<string | null> {
    try {
      if (!habit.reminderTime || !habit.reminderEnabled) {
        console.log('⚠️ Reminder not enabled or no time set');
        return null;
      }

      // Check permissions first
      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        console.error('❌ Notification permissions not granted');
        return null;
      }

      // Parse time in 24-hour format
      const [hours, minutes] = habit.reminderTime.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error('❌ Invalid time format:', habit.reminderTime);
        return null;
      }

      console.log(`⏰ Scheduling notifications for ${hours}:${minutes.toString().padStart(2, '0')}`);

      // Cancel any existing notifications for this habit
      await this.cancelHabitReminders(habit.id);

      const notificationIds: string[] = [];

      // Schedule notifications for the next 7 days (best practice)
      for (let day = 0; day < 7; day++) {
        const notificationDate = new Date();
        notificationDate.setDate(notificationDate.getDate() + day);
        notificationDate.setHours(hours, minutes, 0, 0);

        // Skip if the time has already passed today (for day 0)
        if (day === 0 && notificationDate <= new Date()) {
          continue;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${habit.name}! 🎯`,
            body: `Don't break your streak - complete your ${habit.name} habit now!`,
            badge: 1,
            categoryIdentifier: 'habit-reminder',
            data: { 
              type: 'habit_reminder',
              habitId: habit.id,
              habitName: habit.name,
              scheduledFor: notificationDate.toISOString()
            },
          },
          trigger: {
            date: notificationDate,
          },
        });

        notificationIds.push(notificationId);
        console.log(`📅 Scheduled for ${notificationDate.toLocaleString()}, ID: ${notificationId}`);
      }

      // Store notification IDs for this habit (for cancellation)
      await this.storeNotificationIds(habit.id, notificationIds);

      console.log(`✅ Scheduled ${notificationIds.length} notifications for ${habit.name}`);
      
      return notificationIds[0] || null;
    } catch (error) {
      console.error('❌ Error scheduling habit reminder:', error);
      return null;
    }
  }

  /**
   * Store notification IDs for a habit (for later cancellation)
   */
  private async storeNotificationIds(habitId: string, notificationIds: string[]): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(`notifications_${habitId}`, JSON.stringify(notificationIds));
    } catch (error) {
      console.error('Error storing notification IDs:', error);
    }
  }

  /**
   * Cancel all notifications for a habit
   */
  async cancelHabitReminders(habitId: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedIds = await AsyncStorage.getItem(`notifications_${habitId}`);
      
      if (storedIds) {
        const notificationIds: string[] = JSON.parse(storedIds);
        
        for (const id of notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
        
        await AsyncStorage.removeItem(`notifications_${habitId}`);
        console.log(`✅ Cancelled ${notificationIds.length} notifications for habit ${habitId}`);
      }
    } catch (error) {
      console.error('Error cancelling habit reminders:', error);
    }
  }

  /**
   * Update all habit reminders for a user
   */
  async updateHabitReminders(habits: Habit[]): Promise<void> {
    try {
      console.log('🔄 Updating all habit reminders...');
      
      for (const habit of habits) {
        if (habit.reminderEnabled && habit.reminderTime) {
          await this.scheduleHabitReminder(habit);
        } else {
          await this.cancelHabitReminders(habit.id);
        }
      }

      console.log(`✅ Updated reminders for ${habits.length} habits`);
    } catch (error) {
      console.error('Error updating habit reminders:', error);
    }
  }

  /**
   * Format time for display
   */
  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

export const notificationService = new NotificationService();

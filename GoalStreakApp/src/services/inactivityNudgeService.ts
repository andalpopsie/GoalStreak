// Inactivity Nudge Service - Playful reminders when user is inactive (Duolingo-style)
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const NUDGE_SETTINGS_KEY = '@goalstreak_inactivity_nudge';
const LAST_ACTIVITY_KEY = '@goalstreak_last_activity';

interface NudgeSettings {
  enabled: boolean;
  lastNudgeDate: string | null;
  nudgeLevel: number; // 0-4 (escalation level)
}

// Playful nudge messages - Escalating intensity like Duolingo
const NUDGE_MESSAGES = {
  day3: [
    {
      title: '🥺 We Miss You!',
      body: 'Your habits are wondering where you went. Come back and keep your streak alive!',
    },
    {
      title: '👋 Hey There, Stranger!',
      body: 'It\'s been 3 days! Your future self is waiting for you to show up.',
    },
    {
      title: '🌱 Your Habits Need Water!',
      body: 'Don\'t let your progress wilt. Come back and tend to your goals!',
    },
  ],
  day5: [
    {
      title: '😢 Your Habits Are Lonely',
      body: 'They\'ve been sitting here for 5 days... wondering if you still care.',
    },
    {
      title: '🎭 The Drama Begins',
      body: 'Your streak is having an existential crisis. Only you can save it!',
    },
    {
      title: '📉 Houston, We Have a Problem',
      body: '5 days without progress. Your goals are starting to worry...',
    },
  ],
  day7: [
    {
      title: '🍕 Your Streak Is Getting Hungry!',
      body: 'A whole week without progress? Feed your habits before they disappear!',
    },
    {
      title: '⚠️ This Is Your Final Warning',
      body: 'A whole week?! Your habits are plotting their revenge. Come back NOW!',
    },
    {
      title: '🚨 Red Alert! Red Alert!',
      body: '7 days of silence. Your goals are filing a missing person report.',
    },
  ],
  day10: [
    {
      title: '😭 Your Streak Is Crying',
      body: 'It\'s been 10 days. Your habits are in the corner, sobbing uncontrollably.',
    },
    {
      title: '💔 Heartbreak Hotel',
      body: 'Your goals checked in 10 days ago and haven\'t checked out. They miss you!',
    },
    {
      title: '🎪 The Circus Left Town',
      body: 'Your motivation packed up and left. Time to bring it back with one small habit!',
    },
  ],
  day14: [
    {
      title: '👻 Your Habits Are Ghosts Now',
      body: '2 weeks of haunting silence. They\'re officially haunting your phone.',
    },
    {
      title: '🏚️ Abandoned Dreams',
      body: 'Your goal house is collecting cobwebs. Time for a comeback story!',
    },
    {
      title: '⏰ Wake Up Call',
      body: '14 days! This is your sign to restart. One habit. Right now. Let\'s go!',
    },
  ],
};

export const inactivityNudgeService = {
  /**
   * Initialize nudge service
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
        console.log('Notification permissions not granted for nudges');
        return false;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('inactivity-nudge', {
          name: 'Activity Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#B771E5',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Error initializing inactivity nudge service:', error);
      return false;
    }
  },

  /**
   * Update last activity timestamp
   */
  async recordActivity(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, new Date().toISOString());
      
      // Reset nudge level when user is active
      const settings = await this.getSettings();
      if (settings) {
        settings.nudgeLevel = 0;
        await AsyncStorage.setItem(NUDGE_SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  },

  /**
   * Get days since last activity
   */
  async getDaysSinceLastActivity(userId: string): Promise<number> {
    try {
      // Query last completion from Firebase
      const q = query(
        collection(db, 'completions'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 0; // No completions yet
      }

      const lastCompletion = querySnapshot.docs[0].data();
      const lastDate = lastCompletion.completedAt.toDate();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.error('Error getting days since last activity:', error);
      return 0;
    }
  },

  /**
   * Check if user needs a nudge and send it
   */
  async checkAndSendNudge(userId: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings?.enabled) {
        return; // Nudges disabled
      }

      const daysSinceActivity = await this.getDaysSinceLastActivity(userId);
      
      // Determine if we should send a nudge
      let shouldNudge = false;
      let messageCategory: keyof typeof NUDGE_MESSAGES | null = null;

      if (daysSinceActivity >= 14) {
        shouldNudge = true;
        messageCategory = 'day14';
      } else if (daysSinceActivity >= 10) {
        shouldNudge = true;
        messageCategory = 'day10';
      } else if (daysSinceActivity >= 7) {
        shouldNudge = true;
        messageCategory = 'day7';
      } else if (daysSinceActivity >= 5) {
        shouldNudge = true;
        messageCategory = 'day5';
      } else if (daysSinceActivity >= 3) {
        shouldNudge = true;
        messageCategory = 'day3';
      }

      if (!shouldNudge || !messageCategory) {
        return; // Not time to nudge yet
      }

      // Check if we already sent a nudge today
      if (settings.lastNudgeDate) {
        const lastNudge = new Date(settings.lastNudgeDate);
        const now = new Date();
        const hoursSinceLastNudge = (now.getTime() - lastNudge.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastNudge < 24) {
          return; // Don't spam - wait 24 hours between nudges
        }
      }

      // Send the nudge
      await this.sendNudge(messageCategory);

      // Update settings
      settings.lastNudgeDate = new Date().toISOString();
      settings.nudgeLevel = Math.min(settings.nudgeLevel + 1, 4);
      await AsyncStorage.setItem(NUDGE_SETTINGS_KEY, JSON.stringify(settings));

    } catch (error) {
      console.error('Error checking and sending nudge:', error);
    }
  },

  /**
   * Send a nudge notification
   */
  async sendNudge(category: keyof typeof NUDGE_MESSAGES): Promise<void> {
    try {
      const messages = NUDGE_MESSAGES[category];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: randomMessage.title,
          body: randomMessage.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { 
            type: 'inactivity_nudge',
            category,
          },
        },
        trigger: null, // Send immediately
      });

      console.log(`✅ Inactivity nudge sent: ${category}`);
    } catch (error) {
      console.error('Error sending nudge:', error);
      throw error;
    }
  },

  /**
   * Enable/disable nudges
   */
  async setEnabled(enabled: boolean): Promise<void> {
    try {
      const settings = await this.getSettings() || {
        enabled: false,
        lastNudgeDate: null,
        nudgeLevel: 0,
      };

      settings.enabled = enabled;
      await AsyncStorage.setItem(NUDGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error setting nudge enabled state:', error);
    }
  },

  /**
   * Get current nudge settings
   */
  async getSettings(): Promise<NudgeSettings | null> {
    try {
      const settingsStr = await AsyncStorage.getItem(NUDGE_SETTINGS_KEY);
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
      
      // Return default settings
      return {
        enabled: true, // Enabled by default
        lastNudgeDate: null,
        nudgeLevel: 0,
      };
    } catch (error) {
      console.error('Error getting nudge settings:', error);
      return null;
    }
  },

  /**
   * Send test nudge (for debugging)
   */
  async sendTestNudge(): Promise<void> {
    await this.sendNudge('day7'); // Send the owl warning 🦉
  },
};

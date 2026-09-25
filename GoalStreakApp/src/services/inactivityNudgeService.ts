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

// Inactivity nudge messages — escalating accountability tiers
// Themes: Atomic Habits, Huberman neuroscience, direct accountability
const NUDGE_MESSAGES = {
  // Tier 1 — gentle science-backed check-in
  day3: [
    {
      title: '📈 Streak Pause Detected',
      body: 'Three days since your last check-in. Rule #1: never miss twice. You missed once — today is your recovery rep.',
    },
    {
      title: '🧠 Your Neural Pathways Are Waiting',
      body: 'Neural pathways weaken without reps. Three days of absence starts the fade. One habit today stops the drift.',
    },
    {
      title: '⏱️ Two Minutes Is All It Takes',
      body: "Three days away. Scale your habit to its two-minute version. Don't rebuild from scratch — just restart the chain.",
    },
  ],
  // Tier 2 — direct, momentum-focused
  day5: [
    {
      title: '⚠️ Momentum Is Slipping',
      body: "Five days. This is the plateau where most people quietly quit. You chose this habit for a reason. That reason hasn't changed.",
    },
    {
      title: '🔗 The Chain Is Broken. Reforge It.',
      body: 'Five days without a rep. Every completion from here is a vote for who you\'re becoming. Cast one today.',
    },
    {
      title: '🎯 Systems Need Reps to Survive',
      body: 'Systems only work when you run them. Five days of absence is five missed reps. The system doesn\'t judge — it just needs you back.',
    },
  ],
  // Tier 3 — honest, Huberman angle, no softening
  day7: [
    {
      title: '⏳ One Week. Time for a Real Reset.',
      body: 'A full week away. Your neural pathways have started reorganizing around the absence of this habit. Reorganize them back. Today.',
    },
    {
      title: '🔥 Seven Days Is Its Own Habit Now',
      body: "Seven days of skipping is becoming a pattern — and patterns become identity. You're building a habit you don't want. Change it now.",
    },
    {
      title: '📣 Accountability Check: Day 7',
      body: 'No performance reviews, no judgment — just a fact: one week without your habit. One rep right now changes the trajectory.',
    },
  ],
  // Tier 4 — stark, direct, future-self framing
  day10: [
    {
      title: '🧱 Ten Days. Time for Honesty.',
      body: 'Something got in the way — that\'s real. But ten days means the absence is becoming the default. Change the default. Today.',
    },
    {
      title: '⚡ Your Future Self Sent This',
      body: 'The version of you six months from now is watching this decision. Ten days of absence. One rep away from a comeback. Write it.',
    },
    {
      title: '📊 The Data Is Clear',
      body: 'Ten days. Streaks gone. But your system is still here — waiting. One rep restarts everything. That rep costs two minutes.',
    },
  ],
  // Tier 5 — honest final push, comeback framing
  day14: [
    {
      title: '🗓️ Two Weeks. Let\'s Be Real.',
      body: 'Fourteen days. This habit has moved from "paused" to "abandoned" territory. The reason you built it hasn\'t changed. Come back.',
    },
    {
      title: '🔁 The Reset Is Always Available',
      body: 'You don\'t have to be a victim of lost momentum. You can choose to restart right now. One rep. That\'s the whole barrier.',
    },
    {
      title: '🌱 It\'s Not Too Late. It\'s Just Hard.',
      body: 'Two weeks away means restarting is uncomfortable. That discomfort is the price of the gap — and it\'s worth paying. Open the app. Go.',
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
      const settings = (await this.getSettings()) || {
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

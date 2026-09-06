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

// Motivational messages for notifications - Rotates daily for variety
const MOTIVATIONAL_MESSAGES = [
  {
    title: '🌅 Rise and Shine!',
    body: 'Your future self will thank you for the habits you build today. Start now!',
  },
  {
    title: "💪 You're Unstoppable!",
    body: 'Every small action compounds into extraordinary results. Take the first step!',
  },
  {
    title: '🔥 Ignite Your Day!',
    body: 'Champions are built one habit at a time. Show up and make it happen!',
  },
  {
    title: '⚡ Power Up Your Morning!',
    body: 'The best time to start was yesterday. The next best time is right now!',
  },
  {
    title: '🎯 Hit Your Targets!',
    body: "Success is the sum of small efforts repeated daily. You've got this!",
  },
  {
    title: '🚀 Launch Into Action!',
    body: "Don't wait for motivation—create momentum with one habit at a time!",
  },
  {
    title: '💎 Build Your Best Self!',
    body: "Your habits are sculpting your future. Make today's choices count!",
  },
  {
    title: '🌟 Shine Bright Today!',
    body: 'Greatness is built in the daily grind. Check off your habits and level up!',
  },
  {
    title: '⭐ Own Your Day!',
    body: 'Small wins create big victories. Start with one habit and dominate!',
  },
  {
    title: '🎊 Make Magic Happen!',
    body: 'Your consistency is your superpower. Use it to transform your life today!',
  },
  {
    title: '🏆 Chase Excellence!',
    body: "Winners don't wait—they act. Complete your habits and claim your day!",
  },
  {
    title: '🌈 Create Your Rainbow!',
    body: 'Every habit is a color in your masterpiece. Paint your day with purpose!',
  },
  {
    title: '💫 Spark Your Potential!',
    body: "You're one habit away from a breakthrough. Take action now!",
  },
  {
    title: '🔆 Radiate Positivity!',
    body: 'Your habits shape your destiny. Choose wisely and act boldly today!',
  },
  {
    title: '🎪 Perform at Your Peak!',
    body: "Excellence is a habit, not an act. Show the world what you're made of!",
  },
  {
    title: '🌺 Bloom Where You Are!',
    body: 'Growth happens in the daily routine. Water your habits and watch yourself flourish!',
  },
  {
    title: '⚔️ Conquer Your Goals!',
    body: 'Warriors win battles one day at a time. Suit up and complete your habits!',
  },
  {
    title: '🎨 Paint Your Success!',
    body: 'Your life is your canvas. Each habit is a brushstroke toward your masterpiece!',
  },
  {
    title: '🌊 Ride the Wave!',
    body: 'Momentum builds with consistency. Catch the wave and keep your streak alive!',
  },
  {
    title: '🎭 Be Your Best Character!',
    body: "You're the author of your story. Write today's chapter with powerful habits!",
  },
  {
    title: '🦅 Soar Higher Today!',
    body: "Eagles don't fly with sparrows. Elevate your game with your habits!",
  },
  {
    title: '🌙 Dream Big, Act Now!',
    body: 'Your dreams need daily action. Turn aspirations into achievements today!',
  },
  {
    title: '🎯 Lock In and Execute!',
    body: 'Focus + Action = Results. Complete your habits and win the day!',
  },
  {
    title: '🔱 Unleash Your Power!',
    body: 'You have everything you need to succeed. Start with one habit right now!',
  },
  {
    title: '🌻 Grow Stronger Daily!',
    body: 'Like a seed becoming a tree, your habits are growing your future. Keep going!',
  },
  {
    title: '⚡ Electrify Your Routine!',
    body: 'Ordinary days + Extraordinary habits = Exceptional life. Make it happen!',
  },
  {
    title: '🎪 Step Into Greatness!',
    body: 'The spotlight is on you. Perform your habits and take center stage!',
  },
  {
    title: '🌠 Reach for the Stars!',
    body: "Your potential is limitless. Start with today's habits and aim higher!",
  },
  {
    title: '🏅 Earn Your Victory!',
    body: 'Champions are made in the morning routine. Complete your habits and win!',
  },
  {
    title: '🎁 Gift Yourself Success!',
    body: 'The best investment is in yourself. Complete your habits and reap the rewards!',
  },
  {
    title: '🌋 Erupt With Energy!',
    body: 'Your potential is volcanic. Let your habits be the force that changes everything!',
  },
  {
    title: '🎬 Action! Take One!',
    body: 'Life is happening now. Direct your day with intention and complete your habits!',
  },
  {
    title: '🔮 Shape Your Future!',
    body: "Today's habits are tomorrow's reality. Create the future you want right now!",
  },
  {
    title: '🎸 Rock Your Routine!',
    body: 'Legends are made in the practice room. Tune up your habits and perform!',
  },
  {
    title: '🌪️ Create Your Storm!',
    body: 'Be the force of nature in your own life. Unleash your habits and dominate!',
  },
  {
    title: '🎓 Master Your Craft!',
    body: 'Mastery is built through daily practice. Study your habits and graduate to greatness!',
  },
  {
    title: '🏔️ Climb Your Mountain!',
    body: "Every peak is reached one step at a time. Take today's step with your habits!",
  },
  {
    title: '🎤 Speak Your Success!',
    body: 'Your actions speak louder than words. Let your habits do the talking today!',
  },
  {
    title: '🌍 Change Your World!',
    body: 'World-changers start with self-change. Transform yourself through your habits!',
  },
  {
    title: '🎮 Level Up Your Life!',
    body: "You're the player, life is the game. Complete your habits and unlock new levels!",
  },
  {
    title: '🔬 Experiment With Excellence!',
    body: 'Success is a science. Test your limits and prove your potential with habits!',
  },
  {
    title: '🎺 Sound Your Victory!',
    body: 'Champions announce themselves through action. Trumpet your habits today!',
  },
  {
    title: '🌿 Cultivate Greatness!',
    body: "You're the gardener of your life. Plant habits today, harvest success tomorrow!",
  },
  {
    title: '🎯 Bullseye Your Goals!',
    body: 'Precision comes from practice. Aim true and hit your habit targets today!',
  },
  {
    title: '🔥 Fuel Your Fire!',
    body: 'Your passion needs action to burn bright. Feed the flames with your habits!',
  },
  {
    title: '🎪 Center Stage Awaits!',
    body: 'The world is watching. Give them a show with your incredible habits today!',
  },
  {
    title: '🌌 Explore Your Universe!',
    body: 'Your potential is infinite. Navigate toward greatness with your daily habits!',
  },
  {
    title: '🎵 Compose Your Symphony!',
    body: 'Life is music, habits are the notes. Create your masterpiece one day at a time!',
  },
  {
    title: '⚡ Charge Your Battery!',
    body: 'Energy comes from action, not rest. Power up with your habits and stay charged!',
  },
  {
    title: '🎯 Strike While Hot!',
    body: 'Opportunity favors the prepared. Forge your future with red-hot habits today!',
  },
];

/**
 * Returns the motivational message for today based on day-of-year rotation.
 */
function getMessageForToday(): { title: string; body: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_MESSAGES[dayOfYear % MOTIVATIONAL_MESSAGES.length];
}

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

      const message = getMessageForToday();

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

      console.log(
        `✅ Daily motivational notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`
      );
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
      const message = getMessageForToday();

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

// --- App-wide notification preferences (single source of truth) ---

const APP_NOTIFICATION_PREFS_KEY = '@goalstreak_notification_preferences';

export interface AppNotificationPreferences {
  enabled: boolean;
  sound: boolean;
  badge: boolean;
  dailyReminder: boolean;
  streakAlerts: boolean;
  dailyMotivation: boolean;
  inactivityNudges: boolean;
  friendRequests: boolean;
  comments: boolean;
  reactions: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: AppNotificationPreferences = {
  enabled: true,
  sound: true,
  badge: true,
  dailyReminder: true,
  streakAlerts: true,
  dailyMotivation: false,
  inactivityNudges: true,
  friendRequests: true,
  comments: true,
  reactions: true,
};

export const notificationPreferencesService = {
  async load(): Promise<AppNotificationPreferences> {
    try {
      // Try new key first, fall back to legacy key for migration
      let saved = await AsyncStorage.getItem(APP_NOTIFICATION_PREFS_KEY);
      if (!saved) {
        saved = await AsyncStorage.getItem('notificationSettings');
        if (saved) {
          // Migrate legacy data to new key
          await AsyncStorage.setItem(APP_NOTIFICATION_PREFS_KEY, saved);
          await AsyncStorage.removeItem('notificationSettings');
        }
      }
      if (saved) {
        return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) };
      }
      return DEFAULT_NOTIFICATION_PREFS;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return DEFAULT_NOTIFICATION_PREFS;
    }
  },

  async save(prefs: AppNotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(APP_NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));

      // Sync daily motivation toggle with the scheduling service
      if (prefs.dailyMotivation) {
        await motivationalNotificationService.scheduleDailyNotification(9, 0);
      } else {
        await motivationalNotificationService.cancelDailyNotification();
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      throw error;
    }
  },
};

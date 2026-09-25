// Motivational Notification Service - Daily motivational push notifications
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_SETTINGS_KEY = '@goalstreak_motivational_notifications';

interface NotificationSettings {
  enabled: boolean;
  time: { hour: number; minute: number }; // 24-hour format
  lastScheduledDate: string;
  notificationId?: string; // stored so cancelDailyNotification cancels only this one
}

// Motivational messages for notifications - Rotates daily for variety
// Themes: Atomic Habits (James Clear), Andrew Huberman neuroscience protocols, accountability
const MOTIVATIONAL_MESSAGES = [
  // — Huberman neuroscience —
  {
    title: '🌅 Start Your Morning Protocol',
    body: '10 minutes of sunlight within an hour of waking anchors your circadian clock and boosts alertness. Light first, then your habit.',
  },
  {
    title: '🧠 Your Focus Window Is Open',
    body: 'The 90-minute block after waking is peak neurological focus. No phone — just you and your most important habit.',
  },
  {
    title: '⚡ Dopamine Is Earned, Not Given',
    body: 'The dopamine from real effort feels different than the dopamine from shortcuts. Complete your habit and earn the real thing.',
  },
  {
    title: '🧬 Exercise Grows Your Brain',
    body: 'Even a 10-minute walk triggers BDNF — your brain\'s growth factor. Move first. Everything else gets easier after.',
  },
  {
    title: '🧊 Voluntary Discomfort Is Training',
    body: 'Doing hard things on purpose trains your stress-response system. If your habit feels uncomfortable — good. That\'s the point.',
  },
  {
    title: '😴 Tonight\'s Habits = Tomorrow\'s Edge',
    body: 'Poor sleep tanks willpower, mood, and focus. The evening habit you do now directly funds your performance tomorrow.',
  },
  {
    title: '🔬 Neuroplasticity Requires Reps',
    body: 'Your brain rewires through repetition, not intention. One habit rep today is a literal change in neural circuitry.',
  },
  {
    title: '⏰ You\'re in a 90-Minute Focus Block',
    body: 'Your brain cycles through ultradian focus rhythms. You\'re in a peak window right now. Close the apps. Complete your habit.',
  },
  {
    title: '🌡️ Resistance Is the Adaptation',
    body: 'The discomfort of cold exposure fades — the adaptation lasts. Same with habits. The resistance you feel right now is the training.',
  },
  {
    title: '🎯 Move First, Feel Ready Second',
    body: 'You won\'t feel energized before you start — you\'ll feel it after. Adrenaline is triggered by action, not anticipation.',
  },
  {
    title: '🧠 Low Dopamine Baseline = More Drive',
    body: 'Resist the easy dopamine hits early in the day. A lower baseline makes your real habits — the ones that matter — more rewarding.',
  },
  {
    title: '💤 NSDR Unlocks Skill Consolidation',
    body: 'A 10-20 minute non-sleep rest after learning accelerates neuroplasticity. Your habit + rest after = compounding faster.',
  },
  {
    title: '🌊 Stress Inoculation Protocol',
    body: 'Deliberately facing stress in controlled doses builds resilience. Your hard habit today is your stress inoculation session.',
  },
  {
    title: '🔋 Epinephrine Follows Action',
    body: 'Waiting to feel ready is a trap. Epinephrine — the fuel you need — is released by the act of starting, not before it.',
  },
  {
    title: '🏋️ BDNF: The Miracle Molecule',
    body: 'Exercise produces BDNF, which builds new neural connections. Every movement-based habit is a neurological upgrade. Do it.',
  },
  {
    title: '🌞 Circadian Anchor Point',
    body: 'Your body runs on a 24-hour clock that needs daily anchoring. Morning light + a consistent first habit locks in your rhythm.',
  },
  {
    title: '🎯 Attention Is a Trainable Skill',
    body: 'Every time you override distraction to complete your habit, you strengthen your focus circuits. Rep by rep, you\'re becoming sharper.',
  },

  // — Atomic Habits (James Clear concepts, paraphrased) —
  {
    title: '📈 1% Better Today',
    body: '1% improvement each day compounds to 37× better in a year. Today\'s habit rep is not small — it is the entire strategy.',
  },
  {
    title: '🗳️ Cast Your Vote',
    body: 'Every habit completion is a vote for the identity you\'re building. Each small action says: this is who I am.',
  },
  {
    title: '⏱️ The Two-Minute Rule',
    body: 'Scale your habit down to two minutes. Not to stay there — to make starting frictionless. Start. The rest follows.',
  },
  {
    title: '🔗 Habit Stack It',
    body: 'Pair your habit with something you already do. "After I pour my coffee, I will ___." Attach new to existing — it sticks.',
  },
  {
    title: '🏔️ The Plateau of Latent Potential',
    body: 'Results hide beneath the surface until a tipping point. You\'re not failing — you\'re building. The breakthrough is closer than it feels.',
  },
  {
    title: '🌱 Systems Beat Goals',
    body: 'Goals get you started. Systems keep you going. Your habit IS the system. Run it today — results take care of themselves.',
  },
  {
    title: '🔄 Never Miss Twice',
    body: 'Miss a day? Human. Miss two in a row? That\'s the start of a different identity. Today is always your reset.',
  },
  {
    title: '👀 Make It Obvious',
    body: 'Your environment matters more than willpower. Is your habit visible, easy to start, hard to skip? Set the environment. Then act.',
  },
  {
    title: '🎯 Identity First, Results Second',
    body: 'Stop chasing outcomes. Start asking: who am I becoming? Your habit is the answer — one rep at a time.',
  },
  {
    title: '📊 Track It, See It, Feel It',
    body: 'Measurement is motivation. Mark off today\'s completion and watch the chain grow. Progress is visual — let it pull you forward.',
  },
  {
    title: '🔧 Remove One Obstacle',
    body: 'Friction is the enemy of consistency. Lay out your equipment. Pre-fill the bottle. Remove the first barrier — the rest collapses.',
  },
  {
    title: '🏅 The Aggregation of Marginal Gains',
    body: '1% better in every area compounds into mastery. Your habit today is one of those 1%s. Never underestimate the rep in front of you.',
  },
  {
    title: '🌀 Compounding Rewards the Consistent',
    body: 'Compounding doesn\'t reward the motivated — it rewards the consistent. Show up today even if you\'re not inspired. Especially then.',
  },
  {
    title: '🧱 Build Identity With Reps',
    body: 'The most powerful question isn\'t "what do I want?" — it\'s "who do I want to become?" Your habit today is one more rep toward that person.',
  },
  {
    title: '📍 Process Over Outcome',
    body: 'You can\'t control results. You can control the process. Your habit IS the process. Focus there. Results are a downstream effect.',
  },
  {
    title: '🌱 Small Is Never Just Small',
    body: '10 minutes of your habit today seems trivial. 10 minutes × 365 days = 60+ hours of deliberate practice. Small is never just small.',
  },
  {
    title: '🏁 Every Finish Is a New Start Line',
    body: 'Completing your habit today makes tomorrow\'s start easier. Each rep is both a finish and a launching pad for the next one.',
  },
  {
    title: '🔐 Commitment Devices Work',
    body: 'Tell someone you\'ll complete your habit today. External accountability triggers an immediate internal shift. Send the text. Then move.',
  },

  // — Accountability & discipline —
  {
    title: '📋 You Made a Commitment',
    body: 'You chose this habit for a reason that hasn\'t changed. Your habit today is the daily test of that decision. Show up.',
  },
  {
    title: '⏳ Time Passes Either Way',
    body: 'A year from now, you\'ll either be glad you started today — or wish you had. The clock is running. Which story do you want?',
  },
  {
    title: '🤝 Build Trust With Yourself',
    body: 'Every time you follow through, you build self-trust. Every skip erodes it. Your inner reputation is the most important one you have.',
  },
  {
    title: '🗓️ Show Up on the Hard Days',
    body: 'Anyone can show up when it\'s easy. The identity-defining moments are the hard days. Today might be one. That makes it matter more.',
  },
  {
    title: '💡 Clarity Over Motivation',
    body: 'Motivation is unreliable. Clarity is durable. You know exactly why this habit exists. That reason is always enough to start.',
  },
  {
    title: '🎖️ You Are Your Decisions',
    body: 'No tool, no reminder, no coach closes the gap. Only you deciding to show up does. This is that moment.',
  },
  {
    title: '🔥 Earned, Not Granted',
    body: 'Health, focus, discipline, confidence — none of it is given. All of it is built, rep by rep. Go earn today\'s version.',
  },
  {
    title: '⚖️ The True Cost of Skipping',
    body: 'Skipping today doesn\'t save energy — it costs it. Broken momentum, guilt, a harder restart. The easy path is always the harder path.',
  },
  {
    title: '🛡️ Protect Your Streak',
    body: 'Your streak is a record of decisions made even when you didn\'t feel like it. It\'s worth more than any one day of rest.',
  },
  {
    title: '🌟 Be the Exception',
    body: 'Most people quit when it gets uncomfortable. You built this habit to be different. The discomfort is where the differentiation happens.',
  },
  {
    title: '📌 Your Future Self Is Watching',
    body: 'The version of you in 6 months is shaped by what you do in the next 10 minutes. What will you show them today?',
  },
  {
    title: '🧭 Direction Over Perfection',
    body: 'You don\'t need to do your habit perfectly. You need to do it. An imperfect rep beats a perfect plan that stays in your head.',
  },
  {
    title: '🔭 Zoom Out. Then Act.',
    body: 'Look at the person you\'re becoming, not just the single task. Each habit rep is one pixel in a much larger portrait.',
  },
  {
    title: '🌊 Motion Builds Momentum',
    body: 'Momentum doesn\'t wait for the right mood. You build it by moving — even slightly, even imperfectly. Add to the wave.',
  },
  {
    title: '📍 Right Now Is the Only Moment',
    body: 'Not tomorrow. Not when conditions are perfect. Not after you feel ready. Right now is the only moment where action is possible.',
  },
  {
    title: '💪 The Reps Are the Point',
    body: 'The result is nice. But the person built by 1,000 reps? That\'s the real prize. You\'re not just tracking habits — you\'re building yourself.',
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

      // Save settings — persist the notification ID so cancel targets only this notification
      const settings: NotificationSettings = {
        enabled: true,
        time: { hour, minute },
        lastScheduledDate: new Date().toISOString(),
        notificationId,
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
      const settingsStr = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settingsStr) {
        const settings: NotificationSettings = JSON.parse(settingsStr);
        if (settings.notificationId) {
          // Cancel only the motivational notification — leave habit reminders untouched
          await Notifications.cancelScheduledNotificationAsync(settings.notificationId);
        }
        settings.enabled = false;
        settings.notificationId = undefined;
        await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      }

      console.log('✅ Daily motivational notification cancelled');
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

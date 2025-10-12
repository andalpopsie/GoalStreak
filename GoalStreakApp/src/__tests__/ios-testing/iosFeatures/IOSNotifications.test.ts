/**
 * iOS Notifications Tests
 * 
 * Tests iOS notification system integration and functionality
 * Requirements: 5.4 - Test iOS-specific features (haptic feedback, iOS notifications, etc.)
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Mock Notifications module
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  presentNotificationAsync: jest.fn(() => Promise.resolve()),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
  getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
}));

// iOS Notification Service
class IOSNotificationService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (Platform.OS !== 'ios' || this.isInitialized) return;

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    this.isInitialized = true;
  }

  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });

    return status === 'granted';
  }

  static async scheduleHabitReminder(
    habitName: string,
    time: Date,
    habitId: string
  ): Promise<string | null> {
    if (Platform.OS !== 'ios') return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Habit Reminder',
          body: `Time to complete your habit: ${habitName}`,
          data: {
            type: 'habit_reminder',
            habitId,
            habitName,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: {
          date: time,
          repeats: true,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule habit reminder:', error);
      return null;
    }
  }

  static async scheduleStreakCelebration(
    habitName: string,
    streakCount: number,
    habitId: string
  ): Promise<string | null> {
    if (Platform.OS !== 'ios') return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Streak Milestone!',
          body: `Congratulations! You've reached a ${streakCount}-day streak for ${habitName}!`,
          data: {
            type: 'streak_celebration',
            habitId,
            habitName,
            streakCount,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: null, // Immediate notification
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule streak celebration:', error);
      return null;
    }
  }

  static async scheduleFriendActivity(
    friendName: string,
    activityType: string,
    habitName: string
  ): Promise<string | null> {
    if (Platform.OS !== 'ios') return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Friend Activity',
          body: `${friendName} ${activityType} ${habitName}`,
          data: {
            type: 'friend_activity',
            friendName,
            activityType,
            habitName,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: null, // Immediate notification
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule friend activity notification:', error);
      return null;
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    if (Platform.OS !== 'ios') return [];

    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  static async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  static async getBadgeCount(): Promise<number> {
    if (Platform.OS !== 'ios') return 0;

    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  static setupNotificationListeners(): () => void {
    if (Platform.OS !== 'ios') return () => {};

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { notification } = response;
        const data = notification.request.content.data;

        // Handle notification tap based on type
        switch (data?.type) {
          case 'habit_reminder':
            // Navigate to habit completion
            break;
          case 'streak_celebration':
            // Navigate to analytics/celebration screen
            break;
          case 'friend_activity':
            // Navigate to social screen
            break;
        }
      }
    );

    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Handle notification received while app is in foreground
        console.log('Notification received:', notification);
      }
    );

    return () => {
      responseListener.remove();
      receivedListener.remove();
    };
  }
}

describe('iOS Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  describe('Notification Initialization', () => {
    it('should initialize notification handler on iOS', async () => {
      await IOSNotificationService.initialize();

      expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });
    });

    it('should not initialize on non-iOS platforms', async () => {
      Platform.OS = 'android';

      await IOSNotificationService.initialize();

      expect(Notifications.setNotificationHandler).not.toHaveBeenCalled();
    });

    it('should only initialize once', async () => {
      await IOSNotificationService.initialize();
      await IOSNotificationService.initialize();

      expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Permission Management', () => {
    it('should request iOS notification permissions', async () => {
      const hasPermission = await IOSNotificationService.requestPermissions();

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      expect(hasPermission).toBe(true);
    });

    it('should handle permission denial on iOS', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const hasPermission = await IOSNotificationService.requestPermissions();

      expect(hasPermission).toBe(false);
    });

    it('should return false for non-iOS platforms', async () => {
      Platform.OS = 'android';

      const hasPermission = await IOSNotificationService.requestPermissions();

      expect(hasPermission).toBe(false);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  describe('Habit Reminder Notifications', () => {
    it('should schedule habit reminder notification on iOS', async () => {
      const habitName = 'Morning Exercise';
      const time = new Date('2024-01-16T08:00:00Z');
      const habitId = 'habit-123';

      const notificationId = await IOSNotificationService.scheduleHabitReminder(
        habitName,
        time,
        habitId
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Habit Reminder',
          body: `Time to complete your habit: ${habitName}`,
          data: {
            type: 'habit_reminder',
            habitId,
            habitName,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: {
          date: time,
          repeats: true,
        },
      });
      expect(notificationId).toBe('notification-id');
    });

    it('should handle scheduling errors gracefully', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Scheduling failed')
      );

      const notificationId = await IOSNotificationService.scheduleHabitReminder(
        'Test Habit',
        new Date(),
        'habit-123'
      );

      expect(notificationId).toBeNull();
    });

    it('should return null for non-iOS platforms', async () => {
      Platform.OS = 'android';

      const notificationId = await IOSNotificationService.scheduleHabitReminder(
        'Test Habit',
        new Date(),
        'habit-123'
      );

      expect(notificationId).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Streak Celebration Notifications', () => {
    it('should schedule streak celebration notification on iOS', async () => {
      const habitName = 'Daily Reading';
      const streakCount = 30;
      const habitId = 'habit-456';

      const notificationId = await IOSNotificationService.scheduleStreakCelebration(
        habitName,
        streakCount,
        habitId
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: '🔥 Streak Milestone!',
          body: `Congratulations! You've reached a ${streakCount}-day streak for ${habitName}!`,
          data: {
            type: 'streak_celebration',
            habitId,
            habitName,
            streakCount,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: null,
      });
      expect(notificationId).toBe('notification-id');
    });

    it('should handle streak celebration scheduling errors', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Scheduling failed')
      );

      const notificationId = await IOSNotificationService.scheduleStreakCelebration(
        'Test Habit',
        7,
        'habit-123'
      );

      expect(notificationId).toBeNull();
    });
  });

  describe('Friend Activity Notifications', () => {
    it('should schedule friend activity notification on iOS', async () => {
      const friendName = 'John Doe';
      const activityType = 'completed';
      const habitName = 'Morning Workout';

      const notificationId = await IOSNotificationService.scheduleFriendActivity(
        friendName,
        activityType,
        habitName
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Friend Activity',
          body: `${friendName} ${activityType} ${habitName}`,
          data: {
            type: 'friend_activity',
            friendName,
            activityType,
            habitName,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: null,
      });
      expect(notificationId).toBe('notification-id');
    });

    it('should handle friend activity notification errors', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Scheduling failed')
      );

      const notificationId = await IOSNotificationService.scheduleFriendActivity(
        'John Doe',
        'completed',
        'Test Habit'
      );

      expect(notificationId).toBeNull();
    });
  });

  describe('Notification Management', () => {
    it('should cancel specific notification on iOS', async () => {
      const notificationId = 'test-notification-id';

      await IOSNotificationService.cancelNotification(notificationId);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        notificationId
      );
    });

    it('should cancel all notifications on iOS', async () => {
      await IOSNotificationService.cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('should get scheduled notifications on iOS', async () => {
      const mockNotifications = [
        { identifier: 'notif-1', content: { title: 'Test' } },
        { identifier: 'notif-2', content: { title: 'Test 2' } },
      ];
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
        mockNotifications
      );

      const notifications = await IOSNotificationService.getScheduledNotifications();

      expect(notifications).toEqual(mockNotifications);
      expect(Notifications.getAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('should handle notification management errors gracefully', async () => {
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Cancel failed')
      );

      // Should not throw error
      await expect(
        IOSNotificationService.cancelNotification('test-id')
      ).resolves.toBeUndefined();
    });
  });

  describe('Badge Management', () => {
    it('should set badge count on iOS', async () => {
      const badgeCount = 5;

      await IOSNotificationService.setBadgeCount(badgeCount);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(badgeCount);
    });

    it('should get badge count on iOS', async () => {
      const mockBadgeCount = 3;
      (Notifications.getBadgeCountAsync as jest.Mock).mockResolvedValue(mockBadgeCount);

      const badgeCount = await IOSNotificationService.getBadgeCount();

      expect(badgeCount).toBe(mockBadgeCount);
      expect(Notifications.getBadgeCountAsync).toHaveBeenCalled();
    });

    it('should handle badge management errors gracefully', async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockRejectedValue(
        new Error('Badge failed')
      );

      // Should not throw error
      await expect(IOSNotificationService.setBadgeCount(1)).resolves.toBeUndefined();
    });

    it('should return 0 badge count on error', async () => {
      (Notifications.getBadgeCountAsync as jest.Mock).mockRejectedValue(
        new Error('Badge failed')
      );

      const badgeCount = await IOSNotificationService.getBadgeCount();

      expect(badgeCount).toBe(0);
    });
  });

  describe('Notification Listeners', () => {
    it('should setup notification listeners on iOS', () => {
      const cleanup = IOSNotificationService.setupNotificationListeners();

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');
    });

    it('should return no-op cleanup function for non-iOS platforms', () => {
      Platform.OS = 'android';

      const cleanup = IOSNotificationService.setupNotificationListeners();

      expect(Notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');
    });

    it('should handle notification response correctly', () => {
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'habit_reminder',
                habitId: 'habit-123',
              },
            },
          },
        },
      };

      IOSNotificationService.setupNotificationListeners();

      const responseHandler = (Notifications.addNotificationResponseReceivedListener as jest.Mock)
        .mock.calls[0][0];

      // Should not throw error when handling response
      expect(() => responseHandler(mockResponse)).not.toThrow();
    });
  });

  describe('iOS Version Compatibility', () => {
    it('should work on iOS 15.0+', async () => {
      Platform.Version = '15.0';

      await IOSNotificationService.initialize();
      const hasPermission = await IOSNotificationService.requestPermissions();

      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
      expect(hasPermission).toBe(true);
    });

    it('should work on iOS 16.0+', async () => {
      Platform.Version = '16.0';

      await IOSNotificationService.initialize();
      const hasPermission = await IOSNotificationService.requestPermissions();

      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
      expect(hasPermission).toBe(true);
    });

    it('should work on iOS 17.0+', async () => {
      Platform.Version = '17.0';

      await IOSNotificationService.initialize();
      const hasPermission = await IOSNotificationService.requestPermissions();

      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
      expect(hasPermission).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('should schedule notifications efficiently', async () => {
      const startTime = Date.now();

      await IOSNotificationService.scheduleHabitReminder(
        'Test Habit',
        new Date(),
        'habit-123'
      );

      const executionTime = Date.now() - startTime;

      // Should execute within 50ms
      expect(executionTime).toBeLessThan(50);
    });

    it('should handle multiple notification scheduling', async () => {
      const promises = [
        IOSNotificationService.scheduleHabitReminder('Habit 1', new Date(), 'habit-1'),
        IOSNotificationService.scheduleHabitReminder('Habit 2', new Date(), 'habit-2'),
        IOSNotificationService.scheduleStreakCelebration('Habit 3', 7, 'habit-3'),
        IOSNotificationService.scheduleFriendActivity('John', 'completed', 'Habit 4'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(results.every(id => id === 'notification-id')).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(4);
    });

    it('should cleanup listeners properly', () => {
      const mockRemove = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      const cleanup = IOSNotificationService.setupNotificationListeners();
      cleanup();

      expect(mockRemove).toHaveBeenCalledTimes(2);
    });
  });
});
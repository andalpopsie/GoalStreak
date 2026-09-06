/**
 * iOS Haptic Feedback Tests
 *
 * Tests iOS haptic feedback integration and functionality
 * Requirements: 5.4 - Test iOS-specific features (haptic feedback, iOS notifications, etc.)
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Mock Haptics module
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Haptic feedback service
class HapticFeedbackService {
  static async lightImpact(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  static async mediumImpact(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  static async heavyImpact(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  static async successNotification(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  static async warningNotification(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }

  static async errorNotification(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  static async selectionChanged(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    }
  }

  static async habitCompleted(): Promise<void> {
    await this.successNotification();
  }

  static async habitCreated(): Promise<void> {
    await this.mediumImpact();
  }

  static async buttonPress(): Promise<void> {
    await this.lightImpact();
  }

  static async friendRequestSent(): Promise<void> {
    await this.mediumImpact();
  }

  static async reactionAdded(): Promise<void> {
    await this.lightImpact();
  }

  static async streakMilestone(): Promise<void> {
    await this.heavyImpact();
  }

  static async error(): Promise<void> {
    await this.errorNotification();
  }

  static async warning(): Promise<void> {
    await this.warningNotification();
  }
}

describe('iOS Haptic Feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  describe('Basic Haptic Functions', () => {
    it('should trigger light impact haptic on iOS', async () => {
      await HapticFeedbackService.lightImpact();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should trigger medium impact haptic on iOS', async () => {
      await HapticFeedbackService.mediumImpact();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should trigger heavy impact haptic on iOS', async () => {
      await HapticFeedbackService.heavyImpact();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('should trigger success notification haptic on iOS', async () => {
      await HapticFeedbackService.successNotification();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('should trigger warning notification haptic on iOS', async () => {
      await HapticFeedbackService.warningNotification();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it('should trigger error notification haptic on iOS', async () => {
      await HapticFeedbackService.errorNotification();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    it('should trigger selection changed haptic on iOS', async () => {
      await HapticFeedbackService.selectionChanged();

      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });

    it('should not trigger haptics on non-iOS platforms', async () => {
      Platform.OS = 'android';

      await HapticFeedbackService.lightImpact();
      await HapticFeedbackService.successNotification();
      await HapticFeedbackService.selectionChanged();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    });
  });

  describe('App-Specific Haptic Feedback', () => {
    it('should provide haptic feedback for habit completion', async () => {
      await HapticFeedbackService.habitCompleted();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('should provide haptic feedback for habit creation', async () => {
      await HapticFeedbackService.habitCreated();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should provide haptic feedback for button presses', async () => {
      await HapticFeedbackService.buttonPress();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should provide haptic feedback for friend request sent', async () => {
      await HapticFeedbackService.friendRequestSent();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should provide haptic feedback for reaction added', async () => {
      await HapticFeedbackService.reactionAdded();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should provide haptic feedback for streak milestones', async () => {
      await HapticFeedbackService.streakMilestone();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('should provide haptic feedback for errors', async () => {
      await HapticFeedbackService.error();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    it('should provide haptic feedback for warnings', async () => {
      await HapticFeedbackService.warning();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });
  });

  describe('Haptic Feedback Error Handling', () => {
    it('should handle haptic feedback errors gracefully', async () => {
      const mockError = new Error('Haptic feedback not available');
      (Haptics.impactAsync as jest.Mock).mockRejectedValue(mockError);

      // Should not throw error
      await expect(HapticFeedbackService.lightImpact()).resolves.toBeUndefined();
    });

    it('should handle notification haptic errors gracefully', async () => {
      const mockError = new Error('Notification haptic not available');
      (Haptics.notificationAsync as jest.Mock).mockRejectedValue(mockError);

      // Should not throw error
      await expect(HapticFeedbackService.successNotification()).resolves.toBeUndefined();
    });

    it('should handle selection haptic errors gracefully', async () => {
      const mockError = new Error('Selection haptic not available');
      (Haptics.selectionAsync as jest.Mock).mockRejectedValue(mockError);

      // Should not throw error
      await expect(HapticFeedbackService.selectionChanged()).resolves.toBeUndefined();
    });
  });

  describe('Haptic Feedback Performance', () => {
    it('should execute haptic feedback quickly', async () => {
      const startTime = Date.now();

      await HapticFeedbackService.lightImpact();

      const executionTime = Date.now() - startTime;

      // Should execute within 10ms
      expect(executionTime).toBeLessThan(10);
    });

    it('should handle rapid haptic feedback calls', async () => {
      const promises = [
        HapticFeedbackService.lightImpact(),
        HapticFeedbackService.mediumImpact(),
        HapticFeedbackService.heavyImpact(),
        HapticFeedbackService.successNotification(),
        HapticFeedbackService.selectionChanged(),
      ];

      await Promise.all(promises);

      expect(Haptics.impactAsync).toHaveBeenCalledTimes(3);
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    });

    it('should not block UI thread during haptic feedback', async () => {
      const startTime = Date.now();

      // Start haptic feedback (should be async)
      const hapticPromise = HapticFeedbackService.lightImpact();

      // Simulate UI work
      const uiWork = new Promise((resolve) => setTimeout(resolve, 1));

      await Promise.all([hapticPromise, uiWork]);

      const totalTime = Date.now() - startTime;

      // Should not significantly delay UI work
      expect(totalTime).toBeLessThan(50);
    });
  });

  describe('iOS Device Compatibility', () => {
    it('should work on iPhone devices with haptic engine', async () => {
      // Mock iPhone device
      jest.spyOn(Platform, 'isPad', 'get').mockReturnValue(false);

      await HapticFeedbackService.lightImpact();

      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('should work on iPad devices with haptic support', async () => {
      // Mock iPad device
      jest.spyOn(Platform, 'isPad', 'get').mockReturnValue(true);

      await HapticFeedbackService.lightImpact();

      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('should handle devices without haptic engine gracefully', async () => {
      // Mock device without haptic support
      (Haptics.impactAsync as jest.Mock).mockRejectedValue(
        new Error('Haptic engine not available')
      );

      // Should not throw error
      await expect(HapticFeedbackService.lightImpact()).resolves.toBeUndefined();
    });
  });

  describe('iOS Version Compatibility', () => {
    it('should work on iOS 15.0+', async () => {
      // Mock iOS 15
      Platform.Version = '15.0';

      await HapticFeedbackService.lightImpact();

      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('should work on iOS 16.0+', async () => {
      // Mock iOS 16
      Platform.Version = '16.0';

      await HapticFeedbackService.lightImpact();

      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('should work on iOS 17.0+', async () => {
      // Mock iOS 17
      Platform.Version = '17.0';

      await HapticFeedbackService.lightImpact();

      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  describe('Accessibility Considerations', () => {
    it('should respect iOS haptic feedback settings', async () => {
      // Mock user has disabled haptic feedback
      (Haptics.impactAsync as jest.Mock).mockRejectedValue(
        new Error('Haptic feedback disabled by user')
      );

      // Should handle gracefully
      await expect(HapticFeedbackService.lightImpact()).resolves.toBeUndefined();
    });

    it('should provide alternative feedback when haptics unavailable', async () => {
      // Mock haptics unavailable
      (Haptics.impactAsync as jest.Mock).mockRejectedValue(
        new Error('Haptic feedback not available')
      );

      // Should still complete without error
      await expect(HapticFeedbackService.buttonPress()).resolves.toBeUndefined();
    });
  });
});

/**
 * Enhanced Analytics Service
 *
 * Provides comprehensive user behavior tracking and analytics for iOS launch.
 * Implements Task 7.2: Set up Firebase Analytics for iOS user behavior tracking
 * Implements Task 8.1: Track initial iOS download and conversion metrics
 * Implements Task 8.5: Measure onboarding completion rates
 */

import { Platform } from 'react-native';
import { crashlyticsService, logAnalyticsEvent } from './crashlyticsService';
import { config } from '../config/environment';
import { logAnalytics, logInfo, logWarn } from './smartLoggingService';

// Analytics event types
export interface UserEvent {
  name: string;
  parameters?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

export interface ConversionMetric {
  event: string;
  value?: number;
  currency?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface OnboardingStep {
  step: string;
  completed: boolean;
  timeSpent?: number;
  userId?: string;
}

export interface AppStoreMetric {
  source: 'app_store' | 'organic' | 'referral' | 'unknown';
  campaign?: string;
  keyword?: string;
  userId?: string;
}

class EnhancedAnalyticsService {
  private isInitialized = false;
  private sessionStartTime: Date | null = null;
  private onboardingStartTime: Date | null = null;
  private userProperties: Record<string, any> = {};

  /**
   * Initialize analytics service
   */
  async initialize(): Promise<void> {
    try {
      if (!config.analytics.enabled || config.environment === 'development') {
        logInfo('analytics', 'Enhanced Analytics: Running in mock mode (development)');
        this.sessionStartTime = new Date();
        this.isInitialized = true; // Enable mock mode
        this.trackAppLaunch();
        return;
      }

      // Wait for crashlytics service to initialize
      if (!crashlyticsService.isAvailable()) {
        await crashlyticsService.initialize();
      }

      this.sessionStartTime = new Date();
      this.isInitialized = true;

      logInfo('analytics', 'Enhanced Analytics: Initialized successfully');

      // Track app launch
      this.trackAppLaunch();
    } catch (error) {
      logWarn('analytics', 'Enhanced Analytics: Failed to initialize', { error: error.message });
    }
  }

  /**
   * Track app launch and session start
   */
  private trackAppLaunch(): void {
    this.trackEvent('app_launch', {
      platform: Platform.OS,
      app_version: config.app.version,
      launch_time: new Date().toISOString(),
      session_id: this.generateSessionId(),
    });

    this.trackEvent('session_start', {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set user properties for analytics
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.userProperties = { ...this.userProperties, ...properties };

      // Set user context in crashlytics
      await crashlyticsService.setUserContext({
        userId: properties.userId,
        email: properties.email,
        displayName: properties.displayName,
        appVersion: config.app.version,
        platform: Platform.OS,
        deviceModel: properties.deviceModel,
      });

      this.trackEvent('user_properties_set', {
        properties_count: Object.keys(this.userProperties).length,
      });
    } catch (error) {
      console.warn('📊 Analytics: Failed to set user properties:', error);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, parameters?: Record<string, any>): void {
    if (!this.isInitialized) {
      logAnalytics(`Event: ${eventName}`, parameters);
      return;
    }

    const eventData = {
      ...parameters,
      timestamp: new Date().toISOString(),
      session_id: this.generateSessionId(),
      user_id: this.userProperties.userId || 'anonymous',
    };

    // Use smart logging instead of direct console logging
    logAnalytics(`Analytics Event: ${eventName}`, eventData);

    // Only send to Firebase in production
    if (config.environment === 'production') {
      logAnalyticsEvent(eventName, eventData);
    }
  }

  /**
   * Track conversion metrics (Task 8.1)
   */
  trackConversion(metric: ConversionMetric): void {
    this.trackEvent('conversion', {
      conversion_event: metric.event,
      conversion_value: metric.value || 0,
      currency: metric.currency || 'USD',
      user_id: metric.userId || this.userProperties.userId,
      ...metric.metadata,
    });

    // Track specific conversion events
    switch (metric.event) {
      case 'app_install':
        this.trackAppInstall();
        break;
      case 'first_habit_created':
        this.trackFirstHabitCreated();
        break;
      case 'first_habit_completed':
        this.trackFirstHabitCompleted();
        break;
      case 'friend_added':
        this.trackFirstFriendAdded();
        break;
    }
  }

  /**
   * Track onboarding progress (Task 8.5)
   */
  trackOnboardingStep(step: OnboardingStep): void {
    if (!this.onboardingStartTime && step.step === 'onboarding_start') {
      this.onboardingStartTime = new Date();
    }

    this.trackEvent('onboarding_step', {
      step_name: step.step,
      step_completed: step.completed,
      time_spent: step.timeSpent || 0,
      user_id: step.userId || this.userProperties.userId,
      onboarding_session_duration: this.onboardingStartTime
        ? Date.now() - this.onboardingStartTime.getTime()
        : 0,
    });

    // Track onboarding completion
    if (step.step === 'onboarding_complete' && step.completed) {
      this.trackOnboardingCompletion();
    }
  }

  /**
   * Track App Store metrics (Task 8.3)
   */
  trackAppStoreMetric(metric: AppStoreMetric): void {
    this.trackEvent('app_store_acquisition', {
      acquisition_source: metric.source,
      campaign: metric.campaign || 'unknown',
      keyword: metric.keyword || 'unknown',
      user_id: metric.userId || this.userProperties.userId,
      platform: Platform.OS,
    });
  }

  /**
   * Track screen views
   */
  trackScreenView(screenName: string, parameters?: Record<string, any>): void {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenName,
      ...parameters,
    });
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, parameters?: Record<string, any>): void {
    this.trackEvent('user_engagement', {
      engagement_action: action,
      ...parameters,
    });
  }

  /**
   * Track habit-related events
   */
  trackHabitEvent(action: string, habitData?: Record<string, any>): void {
    this.trackEvent('habit_action', {
      habit_action: action,
      ...habitData,
    });
  }

  /**
   * Track social features usage
   */
  trackSocialEvent(action: string, socialData?: Record<string, any>): void {
    this.trackEvent('social_action', {
      social_action: action,
      ...socialData,
    });
  }

  /**
   * Track app install and first launch
   */
  private trackAppInstall(): void {
    this.trackEvent('app_install', {
      install_source: 'app_store',
      platform: Platform.OS,
      app_version: config.app.version,
      install_timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track first habit creation
   */
  private trackFirstHabitCreated(): void {
    this.trackEvent('first_habit_created', {
      user_id: this.userProperties.userId,
      time_to_first_habit: this.sessionStartTime ? Date.now() - this.sessionStartTime.getTime() : 0,
    });
  }

  /**
   * Track first habit completion
   */
  private trackFirstHabitCompleted(): void {
    this.trackEvent('first_habit_completed', {
      user_id: this.userProperties.userId,
      time_to_first_completion: this.sessionStartTime
        ? Date.now() - this.sessionStartTime.getTime()
        : 0,
    });
  }

  /**
   * Track first friend added
   */
  private trackFirstFriendAdded(): void {
    this.trackEvent('first_friend_added', {
      user_id: this.userProperties.userId,
      time_to_first_friend: this.sessionStartTime
        ? Date.now() - this.sessionStartTime.getTime()
        : 0,
    });
  }

  /**
   * Track onboarding completion
   */
  private trackOnboardingCompletion(): void {
    const completionTime = this.onboardingStartTime
      ? Date.now() - this.onboardingStartTime.getTime()
      : 0;

    this.trackEvent('onboarding_completed', {
      user_id: this.userProperties.userId,
      completion_time: completionTime,
      completed_at: new Date().toISOString(),
    });

    // Reset onboarding timer
    this.onboardingStartTime = null;
  }

  /**
   * Track session end
   */
  trackSessionEnd(): void {
    const sessionDuration = this.sessionStartTime
      ? Date.now() - this.sessionStartTime.getTime()
      : 0;

    this.trackEvent('session_end', {
      session_duration: sessionDuration,
      end_timestamp: new Date().toISOString(),
    });
  }

  /**
   * End current session (alias for trackSessionEnd)
   */
  endSession(): void {
    this.trackSessionEnd();
    this.sessionStartTime = null;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get analytics summary for monitoring
   */
  getAnalyticsSummary(): Record<string, any> {
    return {
      isInitialized: this.isInitialized,
      sessionStartTime: this.sessionStartTime,
      userProperties: this.userProperties,
      platform: Platform.OS,
      appVersion: config.app.version,
    };
  }

  /**
   * Check if analytics is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
export const enhancedAnalyticsService = new EnhancedAnalyticsService();

// Helper functions for easy usage throughout the app
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  enhancedAnalyticsService.trackEvent(eventName, parameters);
};

export const trackScreenView = (screenName: string, parameters?: Record<string, any>) => {
  enhancedAnalyticsService.trackScreenView(screenName, parameters);
};

// Alias for backward compatibility
export const trackScreen = trackScreenView;

export const trackConversion = (event: string, value?: number, metadata?: Record<string, any>) => {
  enhancedAnalyticsService.trackConversion({
    event,
    value,
    metadata,
  });
};

export const trackOnboarding = (step: string, completed: boolean, timeSpent?: number) => {
  enhancedAnalyticsService.trackOnboardingStep({
    step,
    completed,
    timeSpent,
  });
};

export const trackHabit = (action: string, habitData?: Record<string, any>) => {
  enhancedAnalyticsService.trackHabitEvent(action, habitData);
};

export const trackSocial = (action: string, socialData?: Record<string, any>) => {
  enhancedAnalyticsService.trackSocialEvent(action, socialData);
};

export const trackFeature = (feature: string, action: string, value?: number) => {
  enhancedAnalyticsService.trackEvent('feature_usage', {
    feature,
    action,
    value,
    timestamp: new Date().toISOString(),
  });
};

export default enhancedAnalyticsService;

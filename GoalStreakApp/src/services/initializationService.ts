/**
 * Initialization Service
 *
 * Coordinates the initialization of all monitoring and analytics services.
 * Ensures proper startup sequence and error handling.
 */

import { Platform } from 'react-native';
import { crashlyticsService } from './crashlyticsService';
import { enhancedAnalyticsService } from './enhancedAnalyticsService';
import monitoringDashboardService from './monitoringDashboardService';
import appStoreOptimizationService from './appStoreOptimizationService';
import { config, logConfig } from '../config/environment';

export interface InitializationStatus {
  crashlytics: boolean;
  analytics: boolean;
  monitoring: boolean;
  appStoreOptimization: boolean;
  overall: boolean;
  errors: string[];
  startupTime: number;
}

class InitializationService {
  private isInitialized = false;
  private initializationStatus: InitializationStatus = {
    crashlytics: false,
    analytics: false,
    monitoring: false,
    appStoreOptimization: false,
    overall: false,
    errors: [],
    startupTime: 0,
  };
  private startTime: number = 0;

  /**
   * Initialize all services in the correct order
   */
  async initialize(): Promise<InitializationStatus> {
    this.startTime = Date.now();
    console.log('🚀 Initializing GoalStreak monitoring and analytics services...');

    // Log configuration in debug mode
    logConfig();

    try {
      // Step 1: Initialize Crashlytics (foundation for error reporting)
      await this.initializeCrashlytics();

      // Step 2: Initialize Enhanced Analytics (depends on crashlytics)
      await this.initializeAnalytics();

      // Step 3: Initialize Monitoring Dashboard (depends on analytics)
      await this.initializeMonitoring();

      // Step 4: Initialize App Store Optimization (depends on analytics)
      await this.initializeAppStoreOptimization();

      // Calculate startup time
      this.initializationStatus.startupTime = Date.now() - this.startTime;

      // Check overall status
      this.initializationStatus.overall = this.checkOverallStatus();

      if (this.initializationStatus.overall) {
        this.isInitialized = true;
        console.log('✅ All services initialized successfully');

        // Track successful initialization
        enhancedAnalyticsService.trackEvent('services_initialization_complete', {
          startup_time: this.initializationStatus.startupTime,
          platform: Platform.OS,
          version: config.app.version,
          environment: config.environment,
        });

        // Set up user context
        await this.setupInitialUserContext();
      } else {
        console.warn('⚠️ Some services failed to initialize:', this.initializationStatus.errors);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationStatus.errors.push(`Initialization failed: ${errorMessage}`);
      console.error('❌ Service initialization failed:', error);
    }

    return this.initializationStatus;
  }

  /**
   * Initialize Crashlytics service
   */
  private async initializeCrashlytics(): Promise<void> {
    try {
      console.log('📊 Initializing Crashlytics...');
      await crashlyticsService.initialize();
      this.initializationStatus.crashlytics = true;
      console.log('✅ Crashlytics initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationStatus.errors.push(`Crashlytics: ${errorMessage}`);
      console.warn('⚠️ Crashlytics initialization failed:', error);
    }
  }

  /**
   * Initialize Enhanced Analytics service
   */
  private async initializeAnalytics(): Promise<void> {
    try {
      console.log('📈 Initializing Enhanced Analytics...');
      await enhancedAnalyticsService.initialize();
      this.initializationStatus.analytics = true;
      console.log('✅ Enhanced Analytics initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationStatus.errors.push(`Analytics: ${errorMessage}`);
      console.warn('⚠️ Analytics initialization failed:', error);
    }
  }

  /**
   * Initialize Monitoring Dashboard service
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      console.log('📊 Initializing Monitoring Dashboard...');
      await monitoringDashboardService.initialize();
      this.initializationStatus.monitoring = true;
      console.log('✅ Monitoring Dashboard initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationStatus.errors.push(`Monitoring: ${errorMessage}`);
      console.warn('⚠️ Monitoring initialization failed:', error);
    }
  }

  /**
   * Initialize App Store Optimization service
   */
  private async initializeAppStoreOptimization(): Promise<void> {
    try {
      console.log('🏪 Initializing App Store Optimization...');
      await appStoreOptimizationService.initialize();
      this.initializationStatus.appStoreOptimization = true;
      console.log('✅ App Store Optimization initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationStatus.errors.push(`App Store Optimization: ${errorMessage}`);
      console.warn('⚠️ App Store Optimization initialization failed:', error);
    }
  }

  /**
   * Set up initial user context and tracking
   */
  private async setupInitialUserContext(): Promise<void> {
    try {
      // Track app launch with comprehensive context
      enhancedAnalyticsService.trackEvent('app_launch_complete', {
        platform: Platform.OS,
        version: config.app.version,
        environment: config.environment,
        initialization_time: this.initializationStatus.startupTime,
        services_initialized: {
          crashlytics: this.initializationStatus.crashlytics,
          analytics: this.initializationStatus.analytics,
          monitoring: this.initializationStatus.monitoring,
          app_store_optimization: this.initializationStatus.appStoreOptimization,
        },
      });

      // Set up performance monitoring for app startup
      monitoringDashboardService.recordPerformanceMetric(
        'app_startup_time',
        this.initializationStatus.startupTime,
        'startup'
      );

      console.log('✅ Initial user context set up');
    } catch (error) {
      console.warn('⚠️ Failed to set up initial user context:', error);
    }
  }

  /**
   * Check if overall initialization was successful
   */
  private checkOverallStatus(): boolean {
    // At minimum, we need crashlytics and analytics
    const criticalServices =
      this.initializationStatus.crashlytics && this.initializationStatus.analytics;

    // Monitoring and App Store optimization are nice-to-have but not critical
    return criticalServices;
  }

  /**
   * Get current initialization status
   */
  getInitializationStatus(): InitializationStatus {
    return { ...this.initializationStatus };
  }

  /**
   * Check if services are initialized
   */
  isServicesInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reinitialize failed services
   */
  async reinitializeFailedServices(): Promise<InitializationStatus> {
    console.log('🔄 Reinitializing failed services...');

    if (!this.initializationStatus.crashlytics) {
      await this.initializeCrashlytics();
    }

    if (!this.initializationStatus.analytics) {
      await this.initializeAnalytics();
    }

    if (!this.initializationStatus.monitoring) {
      await this.initializeMonitoring();
    }

    if (!this.initializationStatus.appStoreOptimization) {
      await this.initializeAppStoreOptimization();
    }

    this.initializationStatus.overall = this.checkOverallStatus();

    if (this.initializationStatus.overall) {
      this.isInitialized = true;
      console.log('✅ Failed services reinitialized successfully');
    }

    return this.initializationStatus;
  }

  /**
   * Generate initialization report
   */
  generateInitializationReport(): string {
    const timestamp = new Date().toISOString();

    return `
# GoalStreak Services Initialization Report

**Generated**: ${timestamp}
**Platform**: ${Platform.OS}
**Version**: ${config.app.version}
**Environment**: ${config.environment}

## Initialization Status
- **Overall Status**: ${this.initializationStatus.overall ? '✅ SUCCESS' : '❌ FAILED'}
- **Startup Time**: ${this.initializationStatus.startupTime}ms

## Service Status
- **Crashlytics**: ${this.initializationStatus.crashlytics ? '✅' : '❌'}
- **Enhanced Analytics**: ${this.initializationStatus.analytics ? '✅' : '❌'}
- **Monitoring Dashboard**: ${this.initializationStatus.monitoring ? '✅' : '❌'}
- **App Store Optimization**: ${this.initializationStatus.appStoreOptimization ? '✅' : '❌'}

## Errors
${
  this.initializationStatus.errors.length > 0
    ? this.initializationStatus.errors.map((error) => `- ${error}`).join('\n')
    : '- No errors detected'
}

## Recommendations
${this.generateRecommendations()
  .map((rec) => `- ${rec}`)
  .join('\n')}

---
*Report generated by GoalStreak Initialization Service*
`;
  }

  /**
   * Generate recommendations based on initialization status
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.initializationStatus.crashlytics) {
      recommendations.push('Fix Crashlytics configuration - critical for error reporting');
    }

    if (!this.initializationStatus.analytics) {
      recommendations.push('Fix Analytics configuration - critical for user behavior tracking');
    }

    if (!this.initializationStatus.monitoring) {
      recommendations.push('Fix Monitoring Dashboard - important for performance tracking');
    }

    if (!this.initializationStatus.appStoreOptimization) {
      recommendations.push('Fix App Store Optimization - important for launch success');
    }

    if (this.initializationStatus.startupTime > 3000) {
      recommendations.push('Optimize startup time - currently above 3 second target');
    }

    if (this.initializationStatus.errors.length > 0) {
      recommendations.push('Review and fix initialization errors');
    }

    if (recommendations.length === 0) {
      recommendations.push('All services initialized successfully - ready for launch!');
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.isInitialized) {
      monitoringDashboardService.destroy();
      enhancedAnalyticsService.endSession();
      console.log('🧹 Initialization Service: Cleaned up resources');
    }
  }
}

// Create singleton instance
export const initializationService = new InitializationService();

// Helper functions
export const initializeAllServices = async (): Promise<InitializationStatus> => {
  return await initializationService.initialize();
};

export const getInitializationStatus = (): InitializationStatus => {
  return initializationService.getInitializationStatus();
};

export const isServicesReady = (): boolean => {
  return initializationService.isServicesInitialized();
};

export const generateInitializationReport = (): string => {
  return initializationService.generateInitializationReport();
};

export default initializationService;

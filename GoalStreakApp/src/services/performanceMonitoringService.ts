import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from './enhancedAnalyticsService';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface AppStartupMetrics {
  appLaunchTime: number;
  splashScreenDuration: number;
  initialScreenRenderTime: number;
  authCheckTime: number;
  dataLoadTime: number;
}

// NavigationMetrics interface removed - not currently used
// Can be re-added when navigation metrics tracking is implemented

interface MemoryMetrics {
  usedMemory: number;
  totalMemory: number;
  timestamp: number;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private startupMetrics: Partial<AppStartupMetrics> = {};
  private navigationStartTime: number = 0;
  private isMonitoring: boolean = false;

  // Initialize performance monitoring
  initialize() {
    this.isMonitoring = true;
    this.startupMetrics.appLaunchTime = Date.now();
    
    // Track app startup performance
    this.trackAppStartup();
    
    // Set up periodic memory monitoring
    this.startMemoryMonitoring();
    
    console.log('📊 Performance monitoring initialized');
  }

  // Track app startup performance
  private trackAppStartup() {
    const startTime = Date.now();
    
    // Track splash screen duration
    setTimeout(() => {
      this.startupMetrics.splashScreenDuration = Date.now() - startTime;
      this.recordMetric('app_splash_duration', this.startupMetrics.splashScreenDuration);
    }, 100);

    // Track initial screen render
    setTimeout(() => {
      this.startupMetrics.initialScreenRenderTime = Date.now() - startTime;
      this.recordMetric('initial_screen_render', this.startupMetrics.initialScreenRenderTime);
    }, 500);
  }

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.isMonitoring) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Track significant performance issues
    this.checkPerformanceThresholds(metric);

    // Limit stored metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  // Track navigation performance
  startNavigationTracking(screenName: string) {
    this.navigationStartTime = Date.now();
  }

  endNavigationTracking(screenName: string) {
    if (this.navigationStartTime === 0) return;

    const navigationTime = Date.now() - this.navigationStartTime;
    this.recordMetric('navigation_time', navigationTime, { screenName });

    // Track in analytics
    trackEvent('navigation_performance', {
      screen_name: screenName,
      navigation_time: navigationTime,
      performance_category: this.getPerformanceCategory(navigationTime, 'navigation'),
    });

    this.navigationStartTime = 0;
  }

  // Track API call performance
  trackAPICall(endpoint: string, duration: number, success: boolean) {
    this.recordMetric('api_call_duration', duration, {
      endpoint,
      success,
      platform: Platform.OS,
    });

    // Track in analytics
    trackEvent('api_performance', {
      endpoint,
      duration,
      success,
      performance_category: this.getPerformanceCategory(duration, 'api'),
    });
  }

  // Track screen render performance
  trackScreenRender(screenName: string, renderTime: number) {
    this.recordMetric('screen_render_time', renderTime, { screenName });

    // Track in analytics if render time is concerning
    if (renderTime > 1000) {
      trackEvent('slow_screen_render', {
        screen_name: screenName,
        render_time: renderTime,
        performance_category: this.getPerformanceCategory(renderTime, 'navigation'),
      });
    }
  }

  // Track habit completion performance
  trackHabitCompletion(duration: number, success: boolean) {
    this.recordMetric('habit_completion_time', duration, { success });

    if (duration > 3000) {
      trackEvent('slow_habit_completion', {
        duration,
        success,
      });
    }
  }

  // Start memory monitoring
  private startMemoryMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
  }

  // Check memory usage (simplified for React Native)
  private async checkMemoryUsage() {
    try {
      // This is a simplified memory check
      // In a real implementation, you might use a native module
      const memoryInfo = await this.getMemoryInfo();
      
      if (memoryInfo.usedMemory > memoryInfo.totalMemory * 0.8) {
        trackEvent('high_memory_usage', {
          used_memory: memoryInfo.usedMemory,
          total_memory: memoryInfo.totalMemory,
          usage_percentage: (memoryInfo.usedMemory / memoryInfo.totalMemory) * 100,
        });
      }
    } catch (error) {
      console.warn('Memory monitoring error:', error);
    }
  }

  // Get memory information (simplified)
  private async getMemoryInfo(): Promise<MemoryMetrics> {
    // This is a placeholder - in a real app, you'd use a native module
    // or a library like react-native-device-info
    return {
      usedMemory: 0,
      totalMemory: 0,
      timestamp: Date.now(),
    };
  }

  // Check performance thresholds and alert if needed
  private checkPerformanceThresholds(metric: PerformanceMetric) {
    const thresholds = {
      navigation_time: 1000, // 1 second
      api_call_duration: 5000, // 5 seconds
      screen_render_time: 1000, // 1 second
      habit_completion_time: 3000, // 3 seconds
      app_splash_duration: 3000, // 3 seconds
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      // Track performance issue
      trackEvent('performance_issue', {
        metric_name: metric.name,
        value: metric.value,
        threshold,
        metadata: metric.metadata,
      });

      console.warn(`⚠️ Performance issue: ${metric.name} took ${metric.value}ms (threshold: ${threshold}ms)`);
    }
  }

  // Get performance category for analytics
  private getPerformanceCategory(value: number, type: 'navigation' | 'api'): string {
    const thresholds = {
      navigation: { fast: 300, medium: 1000 },
      api: { fast: 1000, medium: 3000 },
    };

    const threshold = thresholds[type];
    if (value < threshold.fast) return 'fast';
    if (value < threshold.medium) return 'medium';
    return 'slow';
  }

  // Get performance summary
  getPerformanceSummary() {
    const now = Date.now();
    const last24Hours = this.metrics.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000);

    const summary = {
      totalMetrics: last24Hours.length,
      averageNavigationTime: this.getAverageMetric(last24Hours, 'navigation_time'),
      averageAPITime: this.getAverageMetric(last24Hours, 'api_call_duration'),
      averageRenderTime: this.getAverageMetric(last24Hours, 'screen_render_time'),
      slowOperations: last24Hours.filter(m => 
        (m.name === 'navigation_time' && m.value > 1000) ||
        (m.name === 'api_call_duration' && m.value > 5000) ||
        (m.name === 'screen_render_time' && m.value > 1000)
      ).length,
    };

    return summary;
  }

  // Get average metric value
  private getAverageMetric(metrics: PerformanceMetric[], metricName: string): number {
    const relevantMetrics = metrics.filter(m => m.name === metricName);
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round(sum / relevantMetrics.length);
  }

  // Export performance data for debugging
  async exportPerformanceData() {
    const data = {
      metrics: this.metrics,
      startupMetrics: this.startupMetrics,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now(),
      platform: Platform.OS,
    };

    try {
      await AsyncStorage.setItem('performance_data', JSON.stringify(data));
      console.log('📊 Performance data exported to AsyncStorage');
      return data;
    } catch (error) {
      console.error('Failed to export performance data:', error);
      return null;
    }
  }

  // Clear performance data
  clearMetrics() {
    this.metrics = [];
    console.log('📊 Performance metrics cleared');
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();

// Convenience functions for common performance tracking
export const trackNavigation = (screenName: string) => {
  performanceMonitoringService.startNavigationTracking(screenName);
  
  return () => {
    performanceMonitoringService.endNavigationTracking(screenName);
  };
};

export const trackAPICall = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  let success = false;
  
  try {
    const result = await apiCall();
    success = true;
    return result;
  } catch (error) {
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    performanceMonitoringService.trackAPICall(endpoint, duration, success);
  }
};

export const trackScreenRender = (screenName: string) => {
  const startTime = Date.now();
  
  return () => {
    const renderTime = Date.now() - startTime;
    performanceMonitoringService.trackScreenRender(screenName, renderTime);
  };
};

export default performanceMonitoringService;
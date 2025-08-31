/**
 * Performance Testing Setup
 * Utilities and configuration for performance testing
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  renderCount?: number;
  networkRequests?: number;
}

export interface PerformanceThresholds {
  appStartup: number; // milliseconds
  screenTransition: number; // milliseconds
  scrollPerformance: number; // fps
  memoryUsage: number; // MB
  networkTimeout: number; // milliseconds
}

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  appStartup: 3000, // 3 seconds
  screenTransition: 300, // 300ms
  scrollPerformance: 60, // 60 fps
  memoryUsage: 200, // 200MB
  networkTimeout: 5000, // 5 seconds
};

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private renderCounts: Map<string, number> = new Map();

  startMeasurement(testName: string): void {
    const startTime = performance.now();
    this.metrics.set(testName, {
      startTime,
      endTime: 0,
      duration: 0,
    });
  }

  endMeasurement(testName: string): PerformanceMetrics {
    const metric = this.metrics.get(testName);
    if (!metric) {
      throw new Error(`No measurement started for test: ${testName}`);
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const finalMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      memoryUsage: this.getMemoryUsage(),
      renderCount: this.renderCounts.get(testName) || 0,
    };

    this.metrics.set(testName, finalMetric);
    return finalMetric;
  }

  incrementRenderCount(testName: string): void {
    const current = this.renderCounts.get(testName) || 0;
    this.renderCounts.set(testName, current + 1);
  }

  getMemoryUsage(): { used: number; total: number; percentage: number } {
    // Mock memory usage for testing environment
    // In real app, this would use actual memory APIs
    const mockUsed = Math.random() * 150 + 50; // 50-200MB
    const mockTotal = 512; // 512MB total
    
    return {
      used: mockUsed,
      total: mockTotal,
      percentage: (mockUsed / mockTotal) * 100,
    };
  }

  getMetrics(testName: string): PerformanceMetrics | undefined {
    return this.metrics.get(testName);
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  reset(): void {
    this.metrics.clear();
    this.renderCounts.clear();
  }

  assertPerformance(testName: string, threshold: number): void {
    const metric = this.metrics.get(testName);
    if (!metric) {
      throw new Error(`No metrics found for test: ${testName}`);
    }

    if (metric.duration > threshold) {
      throw new Error(
        `Performance threshold exceeded for ${testName}: ${metric.duration}ms > ${threshold}ms`
      );
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Mock network performance utilities
export class NetworkPerformanceMonitor {
  private requestTimes: Map<string, number> = new Map();
  private requestCount = 0;

  startRequest(requestId: string): void {
    this.requestTimes.set(requestId, performance.now());
    this.requestCount++;
  }

  endRequest(requestId: string): number {
    const startTime = this.requestTimes.get(requestId);
    if (!startTime) {
      throw new Error(`No request started for ID: ${requestId}`);
    }

    const duration = performance.now() - startTime;
    this.requestTimes.delete(requestId);
    return duration;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  reset(): void {
    this.requestTimes.clear();
    this.requestCount = 0;
  }
}

export const networkMonitor = new NetworkPerformanceMonitor();

// Utility functions for performance testing
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

export const measureAsyncOperation = async <T>(
  operation: () => Promise<T>,
  testName: string
): Promise<{ result: T; metrics: PerformanceMetrics }> => {
  performanceMonitor.startMeasurement(testName);
  
  try {
    const result = await operation();
    const metrics = performanceMonitor.endMeasurement(testName);
    return { result, metrics };
  } catch (error) {
    performanceMonitor.endMeasurement(testName);
    throw error;
  }
};

export const createLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, index) => ({
    id: `item-${index}`,
    name: `Test Item ${index}`,
    description: `Description for test item ${index}`,
    category: `category-${index % 10}`,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Random date within 30 days
    data: Array.from({ length: 10 }, (_, i) => `data-${i}`), // Additional data to increase size
  }));
};
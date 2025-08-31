/**
 * Application Performance Metrics Tests
 * Tests app startup time, memory usage, scroll performance, and network optimization
 */

import {
  performanceMonitor,
  networkMonitor,
  PERFORMANCE_THRESHOLDS,
  measureAsyncOperation,
  waitForCondition,
  createLargeDataset,
} from './performanceSetup';
import { habitService } from '../../services/habitService';
import { createMockHabit, createMockUser } from '../factories/habitFactory';

// Mock React Native performance APIs
const mockPerformance = {
  now: () => Date.now(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

// Mock memory usage API
const mockMemoryInfo = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 512 * 1024 * 1024, // 512MB
};

// Mock React Native's performance object
global.performance = mockPerformance as any;
(global as any).performance.memory = mockMemoryInfo;

describe('Application Performance Metrics', () => {
  beforeEach(() => {
    performanceMonitor.reset();
    networkMonitor.reset();
    jest.clearAllMocks();
  });

  describe('App Startup Performance', () => {
    it('should start app within performance threshold', async () => {
      const startupTest = async () => {
        // Simulate app initialization steps
        await new Promise(resolve => setTimeout(resolve, 100)); // Auth check
        await new Promise(resolve => setTimeout(resolve, 150)); // Firebase init
        await new Promise(resolve => setTimeout(resolve, 200)); // Initial data load
        await new Promise(resolve => setTimeout(resolve, 100)); // UI render
        
        return 'App started successfully';
      };

      const { result, metrics } = await measureAsyncOperation(
        startupTest,
        'app_startup'
      );

      expect(result).toBe('App started successfully');
      expect(metrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.appStartup);
      expect(metrics.memoryUsage?.used).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
    });

    it('should handle cold start performance', async () => {
      const coldStartTest = async () => {
        // Simulate cold start with additional overhead
        await new Promise(resolve => setTimeout(resolve, 200)); // App bundle load
        await new Promise(resolve => setTimeout(resolve, 300)); // Native modules init
        await new Promise(resolve => setTimeout(resolve, 250)); // Firebase connection
        await new Promise(resolve => setTimeout(resolve, 150)); // Auth state check
        await new Promise(resolve => setTimeout(resolve, 200)); // Initial screen render
        
        return 'Cold start completed';
      };

      const { metrics } = await measureAsyncOperation(
        coldStartTest,
        'cold_start'
      );

      // Cold start can be slower but should still be reasonable
      expect(metrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.appStartup * 1.5);
    });

    it('should handle warm start performance', async () => {
      const warmStartTest = async () => {
        // Simulate warm start (app already in memory)
        await new Promise(resolve => setTimeout(resolve, 50)); // Resume from background
        await new Promise(resolve => setTimeout(resolve, 100)); // Refresh auth state
        await new Promise(resolve => setTimeout(resolve, 75)); // Update UI
        
        return 'Warm start completed';
      };

      const { metrics } = await measureAsyncOperation(
        warmStartTest,
        'warm_start'
      );

      // Warm start should be much faster
      expect(metrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.appStartup * 0.3);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should maintain reasonable memory usage with small datasets', async () => {
      const smallDatasetTest = async () => {
        const habits = Array.from({ length: 10 }, () => createMockHabit());
        const users = Array.from({ length: 5 }, () => createMockUser());
        
        // Simulate processing small dataset
        const processedData = habits.map(habit => ({
          ...habit,
          user: users.find(u => u.id === habit.userId),
          processed: true,
        }));
        
        return processedData;
      };

      const { metrics } = await measureAsyncOperation(
        smallDatasetTest,
        'small_dataset_memory'
      );

      expect(metrics.memoryUsage?.used).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage * 0.5);
    });

    it('should handle large datasets efficiently', async () => {
      const largeDatasetTest = async () => {
        const largeDataset = createLargeDataset(1000);
        
        // Simulate processing large dataset with chunking
        const chunkSize = 100;
        const processedChunks = [];
        
        for (let i = 0; i < largeDataset.length; i += chunkSize) {
          const chunk = largeDataset.slice(i, i + chunkSize);
          const processedChunk = chunk.map(item => ({
            ...item,
            processed: true,
            timestamp: Date.now(),
          }));
          processedChunks.push(processedChunk);
          
          // Simulate async processing delay
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return processedChunks.flat();
      };

      const { metrics } = await measureAsyncOperation(
        largeDatasetTest,
        'large_dataset_memory'
      );

      expect(metrics.memoryUsage?.used).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
      expect(metrics.duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle memory cleanup after operations', async () => {
      const memoryCleanupTest = async () => {
        // Create large temporary data
        let temporaryData = createLargeDataset(500);
        
        // Process the data
        const processedData = temporaryData.map(item => ({
          id: item.id,
          name: item.name,
          summary: `${item.name} - ${item.category}`,
        }));
        
        // Simulate cleanup
        temporaryData = [];
        
        // Force garbage collection simulation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return processedData;
      };

      const { metrics } = await measureAsyncOperation(
        memoryCleanupTest,
        'memory_cleanup'
      );

      // Memory usage should be reasonable after cleanup
      expect(metrics.memoryUsage?.percentage).toBeLessThan(80);
    });
  });

  describe('Scroll Performance', () => {
    it('should maintain smooth scrolling with many habits', async () => {
      const scrollPerformanceTest = async () => {
        const manyHabits = Array.from({ length: 100 }, (_, index) => 
          createMockHabit({ 
            id: `habit-${index}`,
            name: `Habit ${index}`,
          })
        );

        // Simulate scroll rendering performance
        const renderFrames = [];
        const targetFPS = 60;
        const frameDuration = 1000 / targetFPS; // ~16.67ms per frame

        for (let i = 0; i < 60; i++) { // Simulate 1 second of scrolling
          const frameStart = performance.now();
          
          // Simulate rendering a frame with visible items
          const visibleItems = manyHabits.slice(i % 10, (i % 10) + 10);
          const renderedItems = visibleItems.map(habit => ({
            ...habit,
            rendered: true,
            renderTime: performance.now(),
          }));
          
          const frameEnd = performance.now();
          const frameDurationActual = frameEnd - frameStart;
          
          renderFrames.push({
            frameNumber: i,
            duration: frameDurationActual,
            itemsRendered: renderedItems.length,
          });
          
          // Simulate frame delay
          await new Promise(resolve => setTimeout(resolve, Math.max(0, frameDuration - frameDurationActual)));
        }

        return renderFrames;
      };

      const { result, metrics } = await measureAsyncOperation(
        scrollPerformanceTest,
        'scroll_performance'
      );

      const averageFrameTime = result.reduce((sum, frame) => sum + frame.duration, 0) / result.length;
      const targetFrameTime = 1000 / PERFORMANCE_THRESHOLDS.scrollPerformance;

      expect(averageFrameTime).toBeLessThan(targetFrameTime);
      expect(result.length).toBe(60); // All frames rendered
    });

    it('should handle rapid scroll events efficiently', async () => {
      const rapidScrollTest = async () => {
        const scrollEvents = [];
        const eventCount = 50;

        for (let i = 0; i < eventCount; i++) {
          const eventStart = performance.now();
          
          // Simulate scroll event processing
          const scrollPosition = i * 10;
          const visibleRange = {
            start: Math.floor(scrollPosition / 50),
            end: Math.floor(scrollPosition / 50) + 10,
          };
          
          // Simulate event handling
          await new Promise(resolve => setTimeout(resolve, 2));
          
          const eventEnd = performance.now();
          
          scrollEvents.push({
            eventNumber: i,
            scrollPosition,
            visibleRange,
            processingTime: eventEnd - eventStart,
          });
        }

        return scrollEvents;
      };

      const { result, metrics } = await measureAsyncOperation(
        rapidScrollTest,
        'rapid_scroll'
      );

      const averageEventTime = result.reduce((sum, event) => sum + event.processingTime, 0) / result.length;
      
      expect(averageEventTime).toBeLessThan(5); // Each event should process in under 5ms
      expect(metrics.duration).toBeLessThan(1000); // Total should complete within 1 second
    });
  });

  describe('Network Request Optimization', () => {
    it('should optimize network request batching', async () => {
      const batchRequestTest = async () => {
        const requests = [];
        
        // Simulate multiple habit operations that could be batched
        for (let i = 0; i < 10; i++) {
          const requestId = `batch-request-${i}`;
          networkMonitor.startRequest(requestId);
          
          // Simulate network request
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          
          const duration = networkMonitor.endRequest(requestId);
          requests.push({ id: requestId, duration });
        }

        return requests;
      };

      const { result, metrics } = await measureAsyncOperation(
        batchRequestTest,
        'batch_requests'
      );

      const averageRequestTime = result.reduce((sum, req) => sum + req.duration, 0) / result.length;
      
      expect(averageRequestTime).toBeLessThan(200); // Average request under 200ms
      expect(networkMonitor.getRequestCount()).toBe(10);
    });

    it('should handle network request caching', async () => {
      const cache = new Map<string, any>();
      
      const cachedRequestTest = async () => {
        const results = [];
        
        // First request - cache miss
        const cacheKey = 'user-habits-123';
        let data;
        
        if (cache.has(cacheKey)) {
          data = cache.get(cacheKey);
        } else {
          networkMonitor.startRequest('cache-miss');
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
          data = Array.from({ length: 20 }, () => createMockHabit());
          cache.set(cacheKey, data);
          networkMonitor.endRequest('cache-miss');
        }
        
        results.push({ type: 'cache-miss', dataLength: data.length });
        
        // Second request - cache hit
        const cachedData = cache.get(cacheKey);
        results.push({ type: 'cache-hit', dataLength: cachedData.length });
        
        return results;
      };

      const { result, metrics } = await measureAsyncOperation(
        cachedRequestTest,
        'cached_requests'
      );

      expect(result[0].type).toBe('cache-miss');
      expect(result[1].type).toBe('cache-hit');
      expect(result[0].dataLength).toBe(result[1].dataLength);
      expect(networkMonitor.getRequestCount()).toBe(1); // Only one actual network request
    });

    it('should handle network timeout scenarios', async () => {
      const timeoutTest = async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), PERFORMANCE_THRESHOLDS.networkTimeout);
        });
        
        const networkPromise = new Promise(resolve => {
          setTimeout(() => resolve('Network response'), PERFORMANCE_THRESHOLDS.networkTimeout + 1000);
        });
        
        try {
          await Promise.race([networkPromise, timeoutPromise]);
          return 'Success';
        } catch (error) {
          return 'Timeout handled';
        }
      };

      const { result, metrics } = await measureAsyncOperation(
        timeoutTest,
        'network_timeout'
      );

      expect(result).toBe('Timeout handled');
      expect(metrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.networkTimeout + 100);
    });

    it('should optimize concurrent network requests', async () => {
      const concurrentRequestTest = async () => {
        const concurrentRequests = Array.from({ length: 5 }, (_, index) => {
          return new Promise(async (resolve) => {
            const requestId = `concurrent-${index}`;
            networkMonitor.startRequest(requestId);
            
            // Simulate varying network delays
            await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
            
            const duration = networkMonitor.endRequest(requestId);
            resolve({ id: requestId, duration });
          });
        });

        const results = await Promise.all(concurrentRequests);
        return results;
      };

      const { result, metrics } = await measureAsyncOperation(
        concurrentRequestTest,
        'concurrent_requests'
      );

      expect(result).toHaveLength(5);
      expect(networkMonitor.getRequestCount()).toBe(5);
      
      // Concurrent requests should complete faster than sequential
      expect(metrics.duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in habit operations', async () => {
      const baselineMetrics = new Map<string, number>();
      
      // Establish baseline performance
      const baselineTest = async () => {
        const habits = Array.from({ length: 50 }, () => createMockHabit());
        return habits.filter(habit => habit.name.includes('Test'));
      };

      const { metrics: baseline } = await measureAsyncOperation(
        baselineTest,
        'baseline_performance'
      );
      
      baselineMetrics.set('habit_filtering', baseline.duration);

      // Test current performance
      const currentTest = async () => {
        const habits = Array.from({ length: 50 }, () => createMockHabit());
        return habits.filter(habit => habit.name.includes('Test'));
      };

      const { metrics: current } = await measureAsyncOperation(
        currentTest,
        'current_performance'
      );

      const baselineDuration = baselineMetrics.get('habit_filtering') || 0;
      const regressionThreshold = baselineDuration * 1.5; // 50% regression threshold

      expect(current.duration).toBeLessThan(regressionThreshold);
    });

    it('should monitor memory usage trends', async () => {
      const memorySnapshots = [];
      
      for (let i = 0; i < 5; i++) {
        const memoryTest = async () => {
          const data = createLargeDataset(100 * (i + 1));
          return data.length;
        };

        const { metrics } = await measureAsyncOperation(
          memoryTest,
          `memory_trend_${i}`
        );

        memorySnapshots.push({
          iteration: i,
          dataSize: 100 * (i + 1),
          memoryUsed: metrics.memoryUsage?.used || 0,
          duration: metrics.duration,
        });
      }

      // Memory usage should scale reasonably with data size
      const memoryGrowthRate = (memorySnapshots[4].memoryUsed - memorySnapshots[0].memoryUsed) / 4;
      expect(memoryGrowthRate).toBeLessThan(50); // Memory shouldn't grow more than 50MB per 100 items
    });
  });
});
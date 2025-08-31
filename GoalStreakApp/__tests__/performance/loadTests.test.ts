/**
 * Load Testing Suite
 * Comprehensive load tests using the load testing utilities
 */

import {
  loadTestRunner,
  stressTestRunner,
  networkSimulator,
  LoadTestConfig,
} from './loadTestingUtils';
import {
  performanceMonitor,
  PERFORMANCE_THRESHOLDS,
  measureAsyncOperation,
} from './performanceSetup';
import { createMockHabit, createMockUser } from '../factories/habitFactory';

describe('Load Testing Suite', () => {
  beforeEach(() => {
    performanceMonitor.reset();
    jest.clearAllMocks();
  });

  describe('User Load Tests', () => {
    it('should handle moderate user load efficiently', async () => {
      const config: LoadTestConfig = {
        userCount: 50,
        duration: 10000, // 10 seconds
        operationsPerSecond: 100,
        rampUpTime: 2000, // 2 seconds
        rampDownTime: 2000, // 2 seconds
      };

      const operationFactory = async (userId: string) => {
        // Simulate typical user operations
        const operations = [
          () => simulateHabitCompletion(userId),
          () => simulateHabitCreation(userId),
          () => simulateActivityFeedLoad(userId),
          () => simulateFriendInteraction(userId),
        ];

        const randomOperation = operations[Math.floor(Math.random() * operations.length)];
        return await randomOperation();
      };

      const { result } = await measureAsyncOperation(
        () => loadTestRunner.runLoadTest(config, operationFactory),
        'moderate_load_test'
      );

      expect(result.metrics.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(result.metrics.averageResponseTime).toBeLessThan(500); // Average response under 500ms
      expect(result.metrics.operationsPerSecond).toBeGreaterThan(80); // At least 80% of target throughput
    });

    it('should handle high user load with graceful degradation', async () => {
      const config: LoadTestConfig = {
        userCount: 200,
        duration: 15000, // 15 seconds
        operationsPerSecond: 500,
        rampUpTime: 3000, // 3 seconds
        rampDownTime: 3000, // 3 seconds
      };

      const operationFactory = async (userId: string) => {
        // Simulate high-load operations
        const heavyOperations = [
          () => simulateComplexQuery(userId),
          () => simulateBatchOperation(userId),
          () => simulateDataAggregation(userId),
        ];

        const randomOperation = heavyOperations[Math.floor(Math.random() * heavyOperations.length)];
        return await randomOperation();
      };

      const { result } = await measureAsyncOperation(
        () => loadTestRunner.runLoadTest(config, operationFactory),
        'high_load_test'
      );

      expect(result.metrics.errorRate).toBeLessThan(0.15); // Less than 15% error rate under high load
      expect(result.metrics.averageResponseTime).toBeLessThan(2000); // Average response under 2 seconds
      expect(result.metrics.operationsPerSecond).toBeGreaterThan(300); // At least 60% of target throughput
    });

    it('should handle peak load with circuit breaker patterns', async () => {
      const config: LoadTestConfig = {
        userCount: 500,
        duration: 20000, // 20 seconds
        operationsPerSecond: 1000,
        rampUpTime: 5000, // 5 seconds
        rampDownTime: 5000, // 5 seconds
      };

      let circuitBreakerOpen = false;
      let failureCount = 0;
      const failureThreshold = 10;

      const operationFactory = async (userId: string) => {
        // Implement circuit breaker pattern
        if (circuitBreakerOpen) {
          throw new Error('Circuit breaker open');
        }

        try {
          await simulateIntensiveOperation(userId);
          failureCount = 0; // Reset failure count on success
        } catch (error) {
          failureCount++;
          if (failureCount >= failureThreshold) {
            circuitBreakerOpen = true;
            setTimeout(() => {
              circuitBreakerOpen = false;
              failureCount = 0;
            }, 5000); // Reset circuit breaker after 5 seconds
          }
          throw error;
        }
      };

      const { result } = await measureAsyncOperation(
        () => loadTestRunner.runLoadTest(config, operationFactory),
        'peak_load_test'
      );

      // Circuit breaker should prevent complete system failure
      expect(result.metrics.errorRate).toBeLessThan(0.5); // Less than 50% error rate
      expect(result.metrics.successfulOperations).toBeGreaterThan(100); // Some operations should succeed
    });
  });

  describe('Stress Tests', () => {
    it('should handle CPU stress efficiently', async () => {
      const stressDuration = 5000; // 5 seconds

      const { result } = await measureAsyncOperation(
        () => stressTestRunner.runCPUStressTest(stressDuration),
        'cpu_stress_test'
      );

      expect(result.duration).toBeLessThan(stressDuration * 1.1); // Within 10% of target
      expect(result.operationsPerSecond).toBeGreaterThan(100); // Reasonable throughput
    });

    it('should handle memory stress without crashes', async () => {
      const targetMemoryMB = 100; // 100MB

      const { result } = await measureAsyncOperation(
        () => stressTestRunner.runMemoryStressTest(targetMemoryMB),
        'memory_stress_test'
      );

      expect(result.success).toBe(true);
      expect(result.actualMemoryMB).toBeGreaterThan(targetMemoryMB * 0.8); // At least 80% allocated
      expect(result.allocationTime).toBeLessThan(5000); // Should allocate within 5 seconds
    });

    it('should handle combined CPU and memory stress', async () => {
      const combinedStressTest = async () => {
        // Run CPU and memory stress simultaneously
        const cpuPromise = stressTestRunner.runCPUStressTest(3000);
        const memoryPromise = stressTestRunner.runMemoryStressTest(50);

        const [cpuResult, memoryResult] = await Promise.all([cpuPromise, memoryPromise]);

        return {
          cpu: cpuResult,
          memory: memoryResult,
          bothSuccessful: cpuResult.operationsPerSecond > 50 && memoryResult.success,
        };
      };

      const { result } = await measureAsyncOperation(
        combinedStressTest,
        'combined_stress_test'
      );

      expect(result.bothSuccessful).toBe(true);
      expect(result.cpu.operationsPerSecond).toBeGreaterThan(50); // Reduced but still functional
      expect(result.memory.success).toBe(true);
    });
  });

  describe('Network Condition Tests', () => {
    it('should handle slow network conditions', async () => {
      // Simulate 3G network conditions
      networkSimulator.setNetworkConditions(300, 1000000, 0.01); // 300ms latency, 1MB/s, 1% packet loss

      const networkTest = async () => {
        const requests = Array.from({ length: 20 }, () => Math.random() * 100000 + 10000); // 10KB-110KB requests
        return await networkSimulator.simulateBatchRequests(requests, 5);
      };

      const { result } = await measureAsyncOperation(
        networkTest,
        'slow_network_test'
      );

      expect(result.successfulRequests).toBeGreaterThan(result.totalRequests * 0.95); // 95% success rate
      expect(result.averageResponseTime).toBeGreaterThan(300); // Should reflect network latency
      expect(result.averageResponseTime).toBeLessThan(2000); // But not excessively slow
    });

    it('should handle unreliable network conditions', async () => {
      // Simulate unreliable network
      networkSimulator.setNetworkConditions(500, 500000, 0.1); // 500ms latency, 500KB/s, 10% packet loss

      const unreliableNetworkTest = async () => {
        const requests = Array.from({ length: 30 }, () => 50000); // 50KB requests
        return await networkSimulator.simulateBatchRequests(requests, 3);
      };

      const { result } = await measureAsyncOperation(
        unreliableNetworkTest,
        'unreliable_network_test'
      );

      expect(result.successfulRequests).toBeGreaterThan(result.totalRequests * 0.8); // 80% success rate
      expect(result.failedRequests).toBeLessThan(result.totalRequests * 0.2); // Less than 20% failures
    });

    it('should handle network recovery scenarios', async () => {
      const networkRecoveryTest = async () => {
        const results = [];

        // Phase 1: Good network
        networkSimulator.setNetworkConditions(50, 5000000, 0); // 50ms, 5MB/s, 0% loss
        const goodNetworkResult = await networkSimulator.simulateBatchRequests([100000], 1);
        results.push({ phase: 'good', result: goodNetworkResult });

        // Phase 2: Bad network
        networkSimulator.setNetworkConditions(1000, 100000, 0.2); // 1s, 100KB/s, 20% loss
        const badNetworkResult = await networkSimulator.simulateBatchRequests([100000], 1);
        results.push({ phase: 'bad', result: badNetworkResult });

        // Phase 3: Recovery
        networkSimulator.setNetworkConditions(100, 2000000, 0.02); // 100ms, 2MB/s, 2% loss
        const recoveryResult = await networkSimulator.simulateBatchRequests([100000], 1);
        results.push({ phase: 'recovery', result: recoveryResult });

        return results;
      };

      const { result } = await measureAsyncOperation(
        networkRecoveryTest,
        'network_recovery_test'
      );

      const [good, bad, recovery] = result;

      expect(good.result.successfulRequests).toBe(1); // Good network should succeed
      expect(bad.result.successfulRequests).toBeLessThan(1); // Bad network may fail
      expect(recovery.result.successfulRequests).toBe(1); // Recovery should succeed
      expect(recovery.result.averageResponseTime).toBeLessThan(bad.result.averageResponseTime); // Recovery should be faster
    });
  });

  describe('Scalability Benchmarks', () => {
    it('should scale linearly with user count', async () => {
      const userCounts = [10, 25, 50, 100];
      const scalabilityResults = [];

      for (const userCount of userCounts) {
        const config: LoadTestConfig = {
          userCount,
          duration: 5000,
          operationsPerSecond: userCount * 2, // 2 ops per user per second
          rampUpTime: 1000,
          rampDownTime: 1000,
        };

        const operationFactory = async (userId: string) => {
          await this.simulateStandardOperation(userId);
        };

        const result = await loadTestRunner.runLoadTest(config, operationFactory);
        
        scalabilityResults.push({
          userCount,
          operationsPerSecond: result.metrics.operationsPerSecond,
          averageResponseTime: result.metrics.averageResponseTime,
          errorRate: result.metrics.errorRate,
        });
      }

      // Check that performance scales reasonably
      for (let i = 1; i < scalabilityResults.length; i++) {
        const current = scalabilityResults[i];
        const previous = scalabilityResults[i - 1];
        
        // Response time should not increase exponentially
        const responseTimeRatio = current.averageResponseTime / previous.averageResponseTime;
        expect(responseTimeRatio).toBeLessThan(3); // No more than 3x increase
        
        // Error rate should remain reasonable
        expect(current.errorRate).toBeLessThan(0.2); // Less than 20%
      }
    });

    it('should maintain performance under sustained load', async () => {
      const config: LoadTestConfig = {
        userCount: 100,
        duration: 30000, // 30 seconds sustained load
        operationsPerSecond: 200,
        rampUpTime: 5000,
        rampDownTime: 5000,
      };

      const operationFactory = async (userId: string) => {
        await simulateStandardOperation(userId);
      };

      const { result } = await measureAsyncOperation(
        () => loadTestRunner.runLoadTest(config, operationFactory),
        'sustained_load_test'
      );

      // Analyze performance over time
      const timelineSegments = analyzeTimeline(result.timeline);
      
      // Performance should remain stable throughout the test
      const responseTimeVariation = calculateVariation(
        timelineSegments.map(segment => segment.averageResponseTime)
      );
      
      expect(responseTimeVariation).toBeLessThan(0.5); // Less than 50% variation
      expect(result.metrics.errorRate).toBeLessThan(0.1); // Less than 10% error rate
    });
  });

});

// Helper functions for simulating operations
const simulateHabitCompletion = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
};

const simulateHabitCreation = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
};

const simulateActivityFeedLoad = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
};

const simulateFriendInteraction = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 75 + Math.random() * 150));
};

const simulateComplexQuery = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
};

const simulateBatchOperation = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
};

const simulateDataAggregation = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 800));
};

const simulateIntensiveOperation = async (userId: string): Promise<void> => {
  // Simulate operation that might fail under high load
  if (Math.random() < 0.1) { // 10% chance of failure
    throw new Error('Operation failed under load');
  }
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 600));
};

const simulateStandardOperation = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
};

const analyzeTimeline = (timeline: any[]): any[] => {
  const segmentSize = Math.ceil(timeline.length / 5); // Divide into 5 segments
  const segments = [];

  for (let i = 0; i < timeline.length; i += segmentSize) {
    const segment = timeline.slice(i, i + segmentSize);
    const averageResponseTime = segment.reduce((sum, point) => sum + point.responseTime, 0) / segment.length;
    const averageOpsPerSecond = segment.reduce((sum, point) => sum + point.operationsPerSecond, 0) / segment.length;
    
    segments.push({
      startIndex: i,
      endIndex: Math.min(i + segmentSize - 1, timeline.length - 1),
      averageResponseTime,
      averageOpsPerSecond,
    });
  }

  return segments;
};

const calculateVariation = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  return standardDeviation / mean; // Coefficient of variation
};
});
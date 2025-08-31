/**
 * Load Testing Utilities
 * Utilities for simulating high load scenarios and measuring system performance
 */

export interface LoadTestConfig {
  userCount: number;
  duration: number; // milliseconds
  operationsPerSecond: number;
  rampUpTime: number; // milliseconds
  rampDownTime: number; // milliseconds
}

export interface LoadTestResult {
  config: LoadTestConfig;
  metrics: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    operationsPerSecond: number;
    errorRate: number;
  };
  timeline: Array<{
    timestamp: number;
    activeUsers: number;
    operationsPerSecond: number;
    responseTime: number;
  }>;
}

export class LoadTestRunner {
  private activeUsers: Set<string> = new Set();
  private operations: Array<{
    id: string;
    userId: string;
    operation: string;
    startTime: number;
    endTime?: number;
    success: boolean;
    error?: string;
  }> = [];
  private timeline: Array<{
    timestamp: number;
    activeUsers: number;
    operationsPerSecond: number;
    responseTime: number;
  }> = [];

  async runLoadTest(
    config: LoadTestConfig,
    operationFactory: (userId: string) => Promise<any>
  ): Promise<LoadTestResult> {
    this.reset();
    
    const startTime = Date.now();
    const endTime = startTime + config.duration;
    
    // Start timeline monitoring
    const timelineInterval = setInterval(() => {
      this.recordTimelineSnapshot();
    }, 1000);

    try {
      // Ramp up phase
      await this.rampUp(config, operationFactory);
      
      // Steady state phase
      await this.steadyState(config, operationFactory, endTime);
      
      // Ramp down phase
      await this.rampDown(config);
      
    } finally {
      clearInterval(timelineInterval);
    }

    return this.generateResults(config);
  }

  private async rampUp(
    config: LoadTestConfig,
    operationFactory: (userId: string) => Promise<any>
  ): Promise<void> {
    const rampUpSteps = 10;
    const stepDuration = config.rampUpTime / rampUpSteps;
    const usersPerStep = Math.ceil(config.userCount / rampUpSteps);

    for (let step = 0; step < rampUpSteps; step++) {
      const stepStartTime = Date.now();
      
      // Add users for this step
      for (let i = 0; i < usersPerStep && this.activeUsers.size < config.userCount; i++) {
        const userId = `load-user-${this.activeUsers.size}`;
        this.activeUsers.add(userId);
        
        // Start user operations
        this.startUserOperations(userId, config, operationFactory);
      }
      
      // Wait for step duration
      const stepEndTime = stepStartTime + stepDuration;
      const remainingTime = stepEndTime - Date.now();
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    }
  }

  private async steadyState(
    config: LoadTestConfig,
    operationFactory: (userId: string) => Promise<any>,
    endTime: number
  ): Promise<void> {
    // Continue operations until end time
    while (Date.now() < endTime - config.rampDownTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async rampDown(config: LoadTestConfig): Promise<void> {
    const rampDownSteps = 10;
    const stepDuration = config.rampDownTime / rampDownSteps;
    const usersPerStep = Math.ceil(this.activeUsers.size / rampDownSteps);

    for (let step = 0; step < rampDownSteps; step++) {
      const stepStartTime = Date.now();
      
      // Remove users for this step
      const usersToRemove = Array.from(this.activeUsers).slice(0, usersPerStep);
      usersToRemove.forEach(userId => this.activeUsers.delete(userId));
      
      // Wait for step duration
      const stepEndTime = stepStartTime + stepDuration;
      const remainingTime = stepEndTime - Date.now();
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    }
  }

  private async startUserOperations(
    userId: string,
    config: LoadTestConfig,
    operationFactory: (userId: string) => Promise<any>
  ): Promise<void> {
    const operationInterval = 1000 / (config.operationsPerSecond / config.userCount);
    
    const runOperation = async () => {
      if (!this.activeUsers.has(userId)) {
        return;
      }

      const operationId = `${userId}-${Date.now()}-${Math.random()}`;
      const operation = {
        id: operationId,
        userId,
        operation: 'user_operation',
        startTime: Date.now(),
        success: false,
      };

      this.operations.push(operation);

      try {
        await operationFactory(userId);
        operation.endTime = Date.now();
        operation.success = true;
      } catch (error) {
        operation.endTime = Date.now();
        operation.success = false;
        operation.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Schedule next operation
      if (this.activeUsers.has(userId)) {
        setTimeout(runOperation, operationInterval + Math.random() * operationInterval * 0.2);
      }
    };

    // Start first operation with random delay
    setTimeout(runOperation, Math.random() * operationInterval);
  }

  private recordTimelineSnapshot(): void {
    const now = Date.now();
    const recentOperations = this.operations.filter(op => 
      op.endTime && now - op.endTime < 1000
    );

    const responseTime = recentOperations.length > 0
      ? recentOperations.reduce((sum, op) => sum + (op.endTime! - op.startTime), 0) / recentOperations.length
      : 0;

    this.timeline.push({
      timestamp: now,
      activeUsers: this.activeUsers.size,
      operationsPerSecond: recentOperations.length,
      responseTime,
    });
  }

  private generateResults(config: LoadTestConfig): LoadTestResult {
    const completedOperations = this.operations.filter(op => op.endTime);
    const successfulOperations = completedOperations.filter(op => op.success);
    const failedOperations = completedOperations.filter(op => !op.success);

    const responseTimes = completedOperations.map(op => op.endTime! - op.startTime);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const testDuration = (this.timeline[this.timeline.length - 1]?.timestamp || Date.now()) - 
                        (this.timeline[0]?.timestamp || Date.now());

    return {
      config,
      metrics: {
        totalOperations: completedOperations.length,
        successfulOperations: successfulOperations.length,
        failedOperations: failedOperations.length,
        averageResponseTime,
        maxResponseTime: Math.max(...responseTimes, 0),
        minResponseTime: Math.min(...responseTimes, 0),
        operationsPerSecond: completedOperations.length / (testDuration / 1000),
        errorRate: failedOperations.length / completedOperations.length,
      },
      timeline: this.timeline,
    };
  }

  private reset(): void {
    this.activeUsers.clear();
    this.operations = [];
    this.timeline = [];
  }
}

// Stress testing utilities
export class StressTestRunner {
  async runCPUStressTest(duration: number): Promise<{
    duration: number;
    operationsCompleted: number;
    operationsPerSecond: number;
  }> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    let operationsCompleted = 0;

    while (Date.now() < endTime) {
      // CPU intensive operation
      this.performCPUIntensiveTask();
      operationsCompleted++;
    }

    const actualDuration = Date.now() - startTime;
    
    return {
      duration: actualDuration,
      operationsCompleted,
      operationsPerSecond: operationsCompleted / (actualDuration / 1000),
    };
  }

  async runMemoryStressTest(targetMemoryMB: number): Promise<{
    targetMemoryMB: number;
    actualMemoryMB: number;
    allocationTime: number;
    success: boolean;
  }> {
    const startTime = Date.now();
    
    try {
      // Allocate memory in chunks
      const chunks: number[][] = [];
      const chunkSize = 1024 * 1024; // 1MB chunks
      const targetChunks = targetMemoryMB;

      for (let i = 0; i < targetChunks; i++) {
        const chunk = new Array(chunkSize / 4).fill(Math.random()); // 4 bytes per number
        chunks.push(chunk);
        
        // Allow other operations to run
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      const allocationTime = Date.now() - startTime;
      const actualMemoryMB = chunks.length;

      // Clean up
      chunks.length = 0;

      return {
        targetMemoryMB,
        actualMemoryMB,
        allocationTime,
        success: true,
      };
    } catch (error) {
      return {
        targetMemoryMB,
        actualMemoryMB: 0,
        allocationTime: Date.now() - startTime,
        success: false,
      };
    }
  }

  private performCPUIntensiveTask(): void {
    // Perform some CPU-intensive calculations
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    return result;
  }
}

// Network simulation utilities
export class NetworkSimulator {
  private latency: number = 0;
  private bandwidth: number = Infinity;
  private packetLoss: number = 0;

  setNetworkConditions(latency: number, bandwidth: number, packetLoss: number = 0): void {
    this.latency = latency;
    this.bandwidth = bandwidth;
    this.packetLoss = packetLoss;
  }

  async simulateNetworkRequest(dataSize: number): Promise<{
    success: boolean;
    responseTime: number;
    actualDataSize: number;
  }> {
    const startTime = Date.now();

    // Simulate packet loss
    if (Math.random() < this.packetLoss) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        actualDataSize: 0,
      };
    }

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, this.latency));

    // Simulate bandwidth limitation
    const transferTime = (dataSize / this.bandwidth) * 1000; // Convert to milliseconds
    await new Promise(resolve => setTimeout(resolve, transferTime));

    return {
      success: true,
      responseTime: Date.now() - startTime,
      actualDataSize: dataSize,
    };
  }

  async simulateBatchRequests(requests: number[], concurrency: number = 5): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTime: number;
    averageResponseTime: number;
  }> {
    const startTime = Date.now();
    const results = [];

    // Process requests in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(dataSize => this.simulateNetworkRequest(dataSize));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success).length;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    return {
      totalRequests: requests.length,
      successfulRequests,
      failedRequests,
      totalTime: Date.now() - startTime,
      averageResponseTime,
    };
  }
}

// Export instances for use in tests
export const loadTestRunner = new LoadTestRunner();
export const stressTestRunner = new StressTestRunner();
export const networkSimulator = new NetworkSimulator();
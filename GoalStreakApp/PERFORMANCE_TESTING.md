# Performance Testing Guide

## Overview

This document outlines the comprehensive performance testing strategy for GoalStreak, including application performance metrics, scalability testing, and load testing procedures.

## Performance Testing Structure

### Test Categories

1. **Application Performance Metrics** (`applicationPerformance.test.ts`)
   - App startup time testing
   - Memory usage monitoring
   - Scroll performance validation
   - Network request optimization

2. **Component Performance** (`componentPerformance.test.ts`)
   - React component rendering performance
   - Animation performance testing
   - Memory leak detection
   - Stress testing under high component count

3. **Scalability Testing** (`scalabilityTests.test.ts`)
   - Large friend network handling
   - High-volume activity feed processing
   - Concurrent user simulation
   - Firebase quota limit testing

4. **Load Testing** (`loadTests.test.ts`)
   - User load simulation
   - Stress testing (CPU/Memory)
   - Network condition testing
   - Scalability benchmarks

## Performance Thresholds

### Application Performance
- **App Startup**: < 3 seconds
- **Screen Transitions**: < 300ms
- **Scroll Performance**: 60 FPS
- **Memory Usage**: < 200MB
- **Network Timeout**: < 5 seconds

### Scalability Targets
- **Concurrent Users**: 500+ users
- **Friend Network Size**: 1000+ friends
- **Activity Feed Volume**: 10,000+ activities
- **Operations Per Second**: 1000+ ops/sec

## Running Performance Tests

### Basic Performance Tests
```bash
# Run all performance tests
npm run test:performance

# Run with coverage
npm run test:performance:coverage

# Watch mode for development
npm run test:performance:watch
```

### Specific Test Categories
```bash
# Load testing only
npm run test:load

# Stress testing only
npm run test:stress

# Scalability testing only
npm run test:scalability
```

### CI/CD Integration
```bash
# Run performance tests in CI environment
npm run test:performance:ci
```

## Test Configuration

### Performance Test Configuration (`jest.performance.config.js`)
- **Test Timeout**: 60 seconds (for load tests)
- **Max Workers**: 1 (sequential execution)
- **Environment**: Node.js
- **Coverage**: Enabled with HTML reports

### Environment Variables
```bash
NODE_ENV=test
PERFORMANCE_MODE=true
__PERFORMANCE_TESTING__=true
```

## Performance Monitoring Setup

### Performance Monitor Class
The `PerformanceMonitor` class provides:
- Start/end measurement tracking
- Memory usage monitoring
- Render count tracking
- Performance assertion utilities

```typescript
import { performanceMonitor } from './performanceSetup';

// Start measurement
performanceMonitor.startMeasurement('test_name');

// Your code here...

// End measurement and get metrics
const metrics = performanceMonitor.endMeasurement('test_name');
```

### Load Test Runner
The `LoadTestRunner` class enables:
- Concurrent user simulation
- Configurable load patterns
- Ramp-up/ramp-down phases
- Performance metrics collection

```typescript
import { loadTestRunner } from './loadTestingUtils';

const config = {
  userCount: 100,
  duration: 10000,
  operationsPerSecond: 200,
  rampUpTime: 2000,
  rampDownTime: 2000,
};

const result = await loadTestRunner.runLoadTest(config, operationFactory);
```

## Test Scenarios

### 1. Application Performance Metrics

#### App Startup Performance
- **Cold Start**: Full app initialization from scratch
- **Warm Start**: App resume from background
- **Performance Threshold**: < 3 seconds

#### Memory Usage Testing
- **Small Datasets**: 10-50 items
- **Large Datasets**: 1000+ items
- **Memory Cleanup**: Garbage collection validation
- **Performance Threshold**: < 200MB

#### Scroll Performance
- **Many Items**: 100+ habit cards
- **Rapid Scrolling**: 60 FPS target
- **Animation Performance**: Smooth transitions

#### Network Optimization
- **Request Batching**: Multiple operations combined
- **Caching**: Reduced redundant requests
- **Timeout Handling**: Graceful failure recovery

### 2. Scalability Testing

#### Large Friend Networks
- **Friend Count**: 1000+ friends
- **Search Performance**: < 5ms per search
- **Activity Aggregation**: Efficient feed generation

#### High Activity Volume
- **Activity Count**: 10,000+ activities
- **Filtering Performance**: < 50ms per filter
- **Real-time Updates**: Concurrent user handling

#### Concurrent Users
- **User Count**: 100-500 concurrent users
- **Operations**: 10+ operations per user
- **Performance**: < 5 seconds total execution

### 3. Load Testing

#### User Load Simulation
- **Moderate Load**: 50 users, 100 ops/sec
- **High Load**: 200 users, 500 ops/sec
- **Peak Load**: 500 users, 1000 ops/sec

#### Stress Testing
- **CPU Stress**: Intensive calculations
- **Memory Stress**: Large data allocation
- **Combined Stress**: CPU + Memory simultaneously

#### Network Conditions
- **Slow Network**: 3G simulation (300ms latency)
- **Unreliable Network**: 10% packet loss
- **Network Recovery**: Condition changes

## Performance Metrics Collection

### Key Performance Indicators (KPIs)
- **Response Time**: Average, min, max operation duration
- **Throughput**: Operations per second
- **Error Rate**: Percentage of failed operations
- **Memory Usage**: Current and peak memory consumption
- **CPU Usage**: Processing time and efficiency

### Metrics Analysis
```typescript
interface PerformanceMetrics {
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
```

## Continuous Performance Monitoring

### Automated Performance Testing
- **CI/CD Integration**: Performance tests in build pipeline
- **Performance Regression Detection**: Baseline comparison
- **Automated Alerts**: Performance threshold violations

### Performance Benchmarking
- **Baseline Establishment**: Initial performance measurements
- **Trend Analysis**: Performance over time
- **Regression Detection**: Performance degradation alerts

## Troubleshooting Performance Issues

### Common Performance Problems
1. **Memory Leaks**: Unreleased component references
2. **Excessive Re-renders**: Unnecessary component updates
3. **Network Bottlenecks**: Inefficient API usage
4. **Animation Jank**: Dropped frames during animations

### Debugging Tools
- **Performance Monitor**: Built-in measurement utilities
- **Memory Profiler**: Memory usage tracking
- **Network Simulator**: Network condition testing
- **Load Test Runner**: Concurrent user simulation

### Performance Optimization Strategies
1. **Component Memoization**: React.memo, useMemo, useCallback
2. **Lazy Loading**: On-demand component loading
3. **Data Virtualization**: Efficient large list rendering
4. **Network Optimization**: Request batching, caching
5. **Memory Management**: Proper cleanup, garbage collection

## Performance Test Results Analysis

### Test Report Structure
```typescript
interface LoadTestResult {
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
```

### Performance Assertions
```typescript
// Response time assertions
expect(metrics.averageResponseTime).toBeLessThan(500);

// Throughput assertions
expect(metrics.operationsPerSecond).toBeGreaterThan(100);

// Error rate assertions
expect(metrics.errorRate).toBeLessThan(0.05); // Less than 5%

// Memory usage assertions
expect(memoryUsage.percentage).toBeLessThan(80);
```

## Best Practices

### Performance Test Design
1. **Realistic Scenarios**: Test real-world usage patterns
2. **Gradual Load**: Ramp-up and ramp-down phases
3. **Baseline Comparison**: Compare against established benchmarks
4. **Environment Consistency**: Consistent test environments

### Test Data Management
1. **Realistic Data**: Use production-like test data
2. **Data Cleanup**: Reset state between tests
3. **Scalable Datasets**: Test with various data sizes
4. **Edge Cases**: Test boundary conditions

### Monitoring and Alerting
1. **Continuous Monitoring**: Regular performance checks
2. **Threshold Alerts**: Automated performance warnings
3. **Trend Analysis**: Long-term performance tracking
4. **Regression Detection**: Performance degradation alerts

## Integration with Development Workflow

### Pre-commit Hooks
- **Performance Checks**: Basic performance validation
- **Regression Prevention**: Block performance degradations

### Pull Request Validation
- **Performance Tests**: Automated performance testing
- **Benchmark Comparison**: Performance impact analysis

### Release Validation
- **Full Performance Suite**: Comprehensive testing
- **Production Readiness**: Performance certification

This comprehensive performance testing strategy ensures GoalStreak maintains optimal performance under various load conditions and scales effectively as the user base grows.
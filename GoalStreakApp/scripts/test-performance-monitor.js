#!/usr/bin/env node

/**
 * Test Performance Monitoring Script
 * 
 * This script monitors test suite performance and generates reports
 * to help maintain optimal test execution times and identify bottlenecks.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestPerformanceMonitor {
  constructor() {
    this.benchmarks = {
      unit: {
        maxExecutionTime: 30000, // 30 seconds
        maxMemoryUsage: 512, // 512 MB
        targetTestsPerSecond: 10
      },
      integration: {
        maxExecutionTime: 120000, // 2 minutes
        maxMemoryUsage: 1024, // 1 GB
        targetTestsPerSecond: 2
      },
      e2e: {
        maxExecutionTime: 300000, // 5 minutes
        maxMemoryUsage: 2048, // 2 GB
        targetTestsPerSecond: 0.1
      }
    };

    this.reportPath = path.join(__dirname, '..', 'test-performance-reports');
    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    if (!fs.existsSync(this.reportPath)) {
      fs.mkdirSync(this.reportPath, { recursive: true });
    }
  }

  async runPerformanceMonitoring() {
    console.log('🚀 Starting test performance monitoring...');
    
    const results = {
      timestamp: new Date().toISOString(),
      system: this.getSystemInfo(),
      testSuites: {}
    };

    // Monitor each test suite
    for (const [suiteName, benchmark] of Object.entries(this.benchmarks)) {
      console.log(`\n📊 Monitoring ${suiteName} tests...`);
      
      try {
        const suiteResult = await this.monitorTestSuite(suiteName, benchmark);
        results.testSuites[suiteName] = suiteResult;
        
        this.logSuiteResults(suiteName, suiteResult);
      } catch (error) {
        console.error(`❌ Failed to monitor ${suiteName} tests:`, error.message);
        results.testSuites[suiteName] = {
          status: 'error',
          error: error.message
        };
      }
    }

    // Generate comprehensive report
    this.generatePerformanceReport(results);
    
    // Check for performance regressions
    this.checkForRegressions(results);
    
    console.log('\n✅ Performance monitoring completed');
    return results;
  }

  async monitorTestSuite(suiteName, benchmark) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Run the test suite with performance tracking
    const command = this.getTestCommand(suiteName);
    let testOutput;
    
    try {
      testOutput = execSync(command, { 
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: benchmark.maxExecutionTime
      });
    } catch (error) {
      // Handle test failures or timeouts
      testOutput = error.stdout || error.stderr || '';
      if (error.signal === 'SIGTERM') {
        throw new Error(`Test suite timed out after ${benchmark.maxExecutionTime}ms`);
      }
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    // Parse test results
    const testStats = this.parseTestOutput(testOutput);
    
    // Calculate performance metrics
    const executionTime = endTime - startTime;
    const memoryUsed = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024; // MB
    const testsPerSecond = testStats.totalTests / (executionTime / 1000);

    return {
      status: 'completed',
      executionTime,
      memoryUsed,
      testsPerSecond,
      testStats,
      benchmark,
      performance: {
        executionTimeStatus: executionTime <= benchmark.maxExecutionTime ? 'pass' : 'fail',
        memoryUsageStatus: memoryUsed <= benchmark.maxMemoryUsage ? 'pass' : 'fail',
        throughputStatus: testsPerSecond >= benchmark.targetTestsPerSecond ? 'pass' : 'fail'
      }
    };
  }

  getTestCommand(suiteName) {
    const commands = {
      unit: 'npm run test:unit -- --silent --passWithNoTests',
      integration: 'npm run test:integration -- --silent --passWithNoTests',
      e2e: 'npm run test:e2e -- --headless'
    };

    return commands[suiteName] || 'npm test -- --silent --passWithNoTests';
  }

  parseTestOutput(output) {
    const stats = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      suites: 0
    };

    // Parse Jest output
    const testSummaryMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (testSummaryMatch) {
      stats.failedTests = parseInt(testSummaryMatch[1]);
      stats.passedTests = parseInt(testSummaryMatch[2]);
      stats.totalTests = parseInt(testSummaryMatch[3]);
    }

    const suitesMatch = output.match(/Test Suites:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (suitesMatch) {
      stats.suites = parseInt(suitesMatch[3]);
    }

    // If no matches found, try alternative parsing
    if (stats.totalTests === 0) {
      const alternativeMatch = output.match(/(\d+)\s+passing/);
      if (alternativeMatch) {
        stats.passedTests = parseInt(alternativeMatch[1]);
        stats.totalTests = stats.passedTests;
      }
    }

    return stats;
  }

  logSuiteResults(suiteName, result) {
    console.log(`\n📈 ${suiteName.toUpperCase()} Test Results:`);
    console.log(`   Execution Time: ${result.executionTime}ms (${result.performance.executionTimeStatus})`);
    console.log(`   Memory Used: ${result.memoryUsed.toFixed(2)}MB (${result.performance.memoryUsageStatus})`);
    console.log(`   Tests/Second: ${result.testsPerSecond.toFixed(2)} (${result.performance.throughputStatus})`);
    console.log(`   Total Tests: ${result.testStats.totalTests}`);
    console.log(`   Passed: ${result.testStats.passedTests}`);
    console.log(`   Failed: ${result.testStats.failedTests}`);

    // Show warnings for performance issues
    if (result.performance.executionTimeStatus === 'fail') {
      console.log(`   ⚠️  Execution time exceeded threshold (${result.benchmark.maxExecutionTime}ms)`);
    }
    if (result.performance.memoryUsageStatus === 'fail') {
      console.log(`   ⚠️  Memory usage exceeded threshold (${result.benchmark.maxMemoryUsage}MB)`);
    }
    if (result.performance.throughputStatus === 'fail') {
      console.log(`   ⚠️  Test throughput below target (${result.benchmark.targetTestsPerSecond} tests/sec)`);
    }
  }

  generatePerformanceReport(results) {
    const reportFile = path.join(
      this.reportPath,
      `performance-report-${new Date().toISOString().split('T')[0]}.json`
    );

    // Add analysis and recommendations
    results.analysis = this.analyzePerformance(results);
    results.recommendations = this.generateRecommendations(results);

    // Save detailed report
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));

    // Generate summary report
    this.generateSummaryReport(results);

    console.log(`\n📄 Performance report saved to: ${reportFile}`);
  }

  analyzePerformance(results) {
    const analysis = {
      overallStatus: 'pass',
      issues: [],
      trends: this.analyzeTrends(),
      bottlenecks: []
    };

    // Check each test suite for issues
    Object.entries(results.testSuites).forEach(([suiteName, suiteResult]) => {
      if (suiteResult.status === 'error') {
        analysis.overallStatus = 'fail';
        analysis.issues.push(`${suiteName} tests failed to execute`);
        return;
      }

      // Check performance metrics
      Object.entries(suiteResult.performance).forEach(([metric, status]) => {
        if (status === 'fail') {
          analysis.overallStatus = 'fail';
          analysis.issues.push(`${suiteName} ${metric} exceeded threshold`);
          
          // Identify potential bottlenecks
          if (metric === 'executionTimeStatus') {
            analysis.bottlenecks.push({
              suite: suiteName,
              type: 'slow_execution',
              value: suiteResult.executionTime,
              threshold: suiteResult.benchmark.maxExecutionTime
            });
          }
        }
      });
    });

    return analysis;
  }

  analyzeTrends() {
    // Load historical data and analyze trends
    const historicalFiles = fs.readdirSync(this.reportPath)
      .filter(file => file.startsWith('performance-report-'))
      .sort()
      .slice(-7); // Last 7 reports

    if (historicalFiles.length < 2) {
      return { status: 'insufficient_data' };
    }

    const trends = {
      executionTime: [],
      memoryUsage: [],
      testCount: []
    };

    historicalFiles.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.reportPath, file), 'utf8'));
        
        Object.entries(data.testSuites).forEach(([suiteName, suiteData]) => {
          if (suiteData.status === 'completed') {
            trends.executionTime.push({
              date: data.timestamp,
              suite: suiteName,
              value: suiteData.executionTime
            });
            trends.memoryUsage.push({
              date: data.timestamp,
              suite: suiteName,
              value: suiteData.memoryUsed
            });
            trends.testCount.push({
              date: data.timestamp,
              suite: suiteName,
              value: suiteData.testStats.totalTests
            });
          }
        });
      } catch (error) {
        console.warn(`Failed to parse historical data from ${file}`);
      }
    });

    return this.calculateTrendAnalysis(trends);
  }

  calculateTrendAnalysis(trends) {
    const analysis = {};

    Object.entries(trends).forEach(([metric, data]) => {
      if (data.length < 2) {
        analysis[metric] = { status: 'insufficient_data' };
        return;
      }

      // Group by suite and calculate trends
      const suiteData = {};
      data.forEach(point => {
        if (!suiteData[point.suite]) {
          suiteData[point.suite] = [];
        }
        suiteData[point.suite].push(point.value);
      });

      analysis[metric] = {};
      Object.entries(suiteData).forEach(([suite, values]) => {
        const trend = this.calculateLinearTrend(values);
        analysis[metric][suite] = {
          trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
          slope: trend,
          latest: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length
        };
      });
    });

    return analysis;
  }

  calculateLinearTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Analyze results and generate specific recommendations
    Object.entries(results.testSuites).forEach(([suiteName, suiteResult]) => {
      if (suiteResult.status === 'error') {
        recommendations.push({
          priority: 'high',
          category: 'reliability',
          suite: suiteName,
          issue: 'Test execution failure',
          recommendation: 'Investigate test failures and fix broken tests'
        });
        return;
      }

      // Performance recommendations
      if (suiteResult.performance.executionTimeStatus === 'fail') {
        recommendations.push({
          priority: 'medium',
          category: 'performance',
          suite: suiteName,
          issue: 'Slow test execution',
          recommendation: 'Consider parallelizing tests, optimizing setup/teardown, or mocking expensive operations'
        });
      }

      if (suiteResult.performance.memoryUsageStatus === 'fail') {
        recommendations.push({
          priority: 'medium',
          category: 'performance',
          suite: suiteName,
          issue: 'High memory usage',
          recommendation: 'Review test cleanup, reduce test data size, or investigate memory leaks'
        });
      }

      if (suiteResult.performance.throughputStatus === 'fail') {
        recommendations.push({
          priority: 'low',
          category: 'efficiency',
          suite: suiteName,
          issue: 'Low test throughput',
          recommendation: 'Optimize test structure, reduce redundant operations, or improve test isolation'
        });
      }
    });

    // Add trend-based recommendations
    if (results.analysis.trends && results.analysis.trends.executionTime) {
      Object.entries(results.analysis.trends.executionTime).forEach(([suite, trend]) => {
        if (trend.trend === 'increasing' && trend.slope > 100) { // Increasing by >100ms per report
          recommendations.push({
            priority: 'medium',
            category: 'trend',
            suite,
            issue: 'Execution time trending upward',
            recommendation: 'Monitor test performance closely and investigate causes of slowdown'
          });
        }
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  generateSummaryReport(results) {
    const summaryFile = path.join(this.reportPath, 'performance-summary.md');
    
    let summary = `# Test Performance Summary\n\n`;
    summary += `**Generated:** ${results.timestamp}\n\n`;
    summary += `**Overall Status:** ${results.analysis.overallStatus.toUpperCase()}\n\n`;

    // Test suite results
    summary += `## Test Suite Performance\n\n`;
    summary += `| Suite | Status | Execution Time | Memory Usage | Tests/Sec | Total Tests |\n`;
    summary += `|-------|--------|----------------|--------------|-----------|-------------|\n`;

    Object.entries(results.testSuites).forEach(([suiteName, suiteResult]) => {
      if (suiteResult.status === 'completed') {
        const execStatus = suiteResult.performance.executionTimeStatus === 'pass' ? '✅' : '❌';
        const memStatus = suiteResult.performance.memoryUsageStatus === 'pass' ? '✅' : '❌';
        const throughputStatus = suiteResult.performance.throughputStatus === 'pass' ? '✅' : '❌';
        
        summary += `| ${suiteName} | ${execStatus}${memStatus}${throughputStatus} | ${suiteResult.executionTime}ms | ${suiteResult.memoryUsed.toFixed(1)}MB | ${suiteResult.testsPerSecond.toFixed(2)} | ${suiteResult.testStats.totalTests} |\n`;
      } else {
        summary += `| ${suiteName} | ❌ | - | - | - | - |\n`;
      }
    });

    // Issues and recommendations
    if (results.analysis.issues.length > 0) {
      summary += `\n## Issues Found\n\n`;
      results.analysis.issues.forEach(issue => {
        summary += `- ⚠️ ${issue}\n`;
      });
    }

    if (results.recommendations.length > 0) {
      summary += `\n## Recommendations\n\n`;
      results.recommendations.forEach(rec => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        summary += `${priority} **${rec.suite}**: ${rec.recommendation}\n\n`;
      });
    }

    fs.writeFileSync(summaryFile, summary);
    console.log(`📋 Summary report saved to: ${summaryFile}`);
  }

  checkForRegressions(results) {
    const regressions = [];

    // Load previous report for comparison
    const reportFiles = fs.readdirSync(this.reportPath)
      .filter(file => file.startsWith('performance-report-'))
      .sort();

    if (reportFiles.length < 2) {
      console.log('ℹ️  No previous reports found for regression analysis');
      return;
    }

    try {
      const previousReportFile = reportFiles[reportFiles.length - 2];
      const previousReport = JSON.parse(
        fs.readFileSync(path.join(this.reportPath, previousReportFile), 'utf8')
      );

      // Compare execution times
      Object.entries(results.testSuites).forEach(([suiteName, currentResult]) => {
        const previousResult = previousReport.testSuites[suiteName];
        
        if (previousResult && previousResult.status === 'completed' && currentResult.status === 'completed') {
          const executionTimeIncrease = currentResult.executionTime - previousResult.executionTime;
          const percentageIncrease = (executionTimeIncrease / previousResult.executionTime) * 100;

          if (percentageIncrease > 20) { // 20% increase threshold
            regressions.push({
              suite: suiteName,
              metric: 'execution_time',
              previous: previousResult.executionTime,
              current: currentResult.executionTime,
              increase: executionTimeIncrease,
              percentageIncrease: percentageIncrease.toFixed(1)
            });
          }
        }
      });

      if (regressions.length > 0) {
        console.log('\n🚨 Performance regressions detected:');
        regressions.forEach(regression => {
          console.log(`   ${regression.suite}: ${regression.metric} increased by ${regression.percentageIncrease}% (${regression.increase}ms)`);
        });
      } else {
        console.log('\n✅ No significant performance regressions detected');
      }

    } catch (error) {
      console.warn('⚠️  Failed to analyze regressions:', error.message);
    }
  }

  getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: require('os').cpus().length,
      totalMemory: Math.round(require('os').totalmem() / 1024 / 1024 / 1024) + 'GB',
      freeMemory: Math.round(require('os').freemem() / 1024 / 1024 / 1024) + 'GB'
    };
  }
}

// Run performance monitoring if called directly
if (require.main === module) {
  const monitor = new TestPerformanceMonitor();
  monitor.runPerformanceMonitoring()
    .then(results => {
      const hasIssues = results.analysis.overallStatus === 'fail';
      process.exit(hasIssues ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Performance monitoring failed:', error);
      process.exit(1);
    });
}

module.exports = TestPerformanceMonitor;
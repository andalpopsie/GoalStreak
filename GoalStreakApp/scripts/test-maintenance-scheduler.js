#!/usr/bin/env node

/**
 * Test Maintenance Scheduler
 * 
 * This script manages scheduled maintenance tasks for the test suite,
 * including cleanup, optimization, and health monitoring.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

class TestMaintenanceScheduler {
  constructor() {
    this.maintenanceLogPath = path.join(__dirname, '..', 'test-maintenance.log');
    this.configPath = path.join(__dirname, '..', 'test-maintenance-config.json');
    
    this.defaultConfig = {
      schedules: {
        daily: {
          enabled: true,
          time: '0 9 * * *', // 9 AM daily
          tasks: ['healthCheck', 'cleanupArtifacts']
        },
        weekly: {
          enabled: true,
          time: '0 9 * * 1', // 9 AM every Monday
          tasks: ['performanceMonitoring', 'dependencyCheck', 'updateDocumentation']
        },
        monthly: {
          enabled: true,
          time: '0 9 1 * *', // 9 AM on 1st of each month
          tasks: ['comprehensiveReview', 'optimizeTestSuite', 'updateBenchmarks']
        }
      },
      notifications: {
        enabled: true,
        channels: ['console', 'file'],
        webhook: null // Optional webhook URL for notifications
      },
      thresholds: {
        maxExecutionTime: 300000, // 5 minutes
        minCoverage: 80,
        maxFailureRate: 5 // 5%
      }
    };

    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.config = { ...this.defaultConfig, ...config };
      } else {
        this.config = this.defaultConfig;
        this.saveConfig();
      }
    } catch (error) {
      console.warn('Failed to load maintenance config, using defaults:', error.message);
      this.config = this.defaultConfig;
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save maintenance config:', error.message);
    }
  }

  startScheduler() {
    console.log('🕐 Starting test maintenance scheduler...');
    this.log('Maintenance scheduler started');

    // Schedule daily tasks
    if (this.config.schedules.daily.enabled) {
      cron.schedule(this.config.schedules.daily.time, () => {
        this.runDailyMaintenance();
      });
      console.log(`📅 Daily maintenance scheduled: ${this.config.schedules.daily.time}`);
    }

    // Schedule weekly tasks
    if (this.config.schedules.weekly.enabled) {
      cron.schedule(this.config.schedules.weekly.time, () => {
        this.runWeeklyMaintenance();
      });
      console.log(`📅 Weekly maintenance scheduled: ${this.config.schedules.weekly.time}`);
    }

    // Schedule monthly tasks
    if (this.config.schedules.monthly.enabled) {
      cron.schedule(this.config.schedules.monthly.time, () => {
        this.runMonthlyMaintenance();
      });
      console.log(`📅 Monthly maintenance scheduled: ${this.config.schedules.monthly.time}`);
    }

    console.log('✅ Test maintenance scheduler is running');
    console.log('Press Ctrl+C to stop the scheduler');

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping test maintenance scheduler...');
      this.log('Maintenance scheduler stopped');
      process.exit(0);
    });
  }

  async runDailyMaintenance() {
    this.log('Starting daily maintenance');
    console.log('🌅 Running daily test maintenance...');

    const tasks = this.config.schedules.daily.tasks;
    const results = {};

    for (const task of tasks) {
      try {
        console.log(`   Running ${task}...`);
        results[task] = await this.executeTask(task);
        console.log(`   ✅ ${task} completed`);
      } catch (error) {
        console.error(`   ❌ ${task} failed:`, error.message);
        results[task] = { status: 'failed', error: error.message };
      }
    }

    this.generateMaintenanceReport('daily', results);
    this.log('Daily maintenance completed');
  }

  async runWeeklyMaintenance() {
    this.log('Starting weekly maintenance');
    console.log('📊 Running weekly test maintenance...');

    const tasks = this.config.schedules.weekly.tasks;
    const results = {};

    for (const task of tasks) {
      try {
        console.log(`   Running ${task}...`);
        results[task] = await this.executeTask(task);
        console.log(`   ✅ ${task} completed`);
      } catch (error) {
        console.error(`   ❌ ${task} failed:`, error.message);
        results[task] = { status: 'failed', error: error.message };
      }
    }

    this.generateMaintenanceReport('weekly', results);
    this.log('Weekly maintenance completed');
  }

  async runMonthlyMaintenance() {
    this.log('Starting monthly maintenance');
    console.log('🗓️ Running monthly test maintenance...');

    const tasks = this.config.schedules.monthly.tasks;
    const results = {};

    for (const task of tasks) {
      try {
        console.log(`   Running ${task}...`);
        results[task] = await this.executeTask(task);
        console.log(`   ✅ ${task} completed`);
      } catch (error) {
        console.error(`   ❌ ${task} failed:`, error.message);
        results[task] = { status: 'failed', error: error.message };
      }
    }

    this.generateMaintenanceReport('monthly', results);
    this.log('Monthly maintenance completed');
  }

  async executeTask(taskName) {
    const taskMethods = {
      healthCheck: () => this.runHealthCheck(),
      cleanupArtifacts: () => this.cleanupArtifacts(),
      performanceMonitoring: () => this.runPerformanceMonitoring(),
      dependencyCheck: () => this.checkDependencies(),
      updateDocumentation: () => this.updateDocumentation(),
      comprehensiveReview: () => this.runComprehensiveReview(),
      optimizeTestSuite: () => this.optimizeTestSuite(),
      updateBenchmarks: () => this.updateBenchmarks()
    };

    const taskMethod = taskMethods[taskName];
    if (!taskMethod) {
      throw new Error(`Unknown task: ${taskName}`);
    }

    return await taskMethod();
  }

  async runHealthCheck() {
    const startTime = Date.now();
    
    try {
      // Run test suite health check
      const output = execSync('npm run test:health-check', { 
        encoding: 'utf8',
        timeout: this.config.thresholds.maxExecutionTime
      });

      const executionTime = Date.now() - startTime;
      
      // Parse health check results
      const healthData = this.parseHealthCheckOutput(output);
      
      return {
        status: 'completed',
        executionTime,
        results: healthData,
        issues: this.identifyHealthIssues(healthData)
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  async cleanupArtifacts() {
    const cleanupResults = {
      removedFiles: 0,
      freedSpace: 0,
      directories: []
    };

    const artifactDirs = [
      'coverage',
      'test-results',
      'e2e/artifacts',
      'e2e/reports',
      'test-performance-reports'
    ];

    for (const dir of artifactDirs) {
      if (fs.existsSync(dir)) {
        const beforeSize = this.getDirectorySize(dir);
        const removedCount = this.cleanupDirectory(dir, 7); // Remove files older than 7 days
        const afterSize = this.getDirectorySize(dir);
        
        cleanupResults.directories.push({
          path: dir,
          removedFiles: removedCount,
          spaceSaved: beforeSize - afterSize
        });
        
        cleanupResults.removedFiles += removedCount;
        cleanupResults.freedSpace += beforeSize - afterSize;
      }
    }

    return {
      status: 'completed',
      results: cleanupResults
    };
  }

  async runPerformanceMonitoring() {
    try {
      const output = execSync('node scripts/test-performance-monitor.js', {
        encoding: 'utf8',
        timeout: this.config.thresholds.maxExecutionTime
      });

      return {
        status: 'completed',
        output: output.trim()
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async checkDependencies() {
    const results = {
      outdated: [],
      security: [],
      recommendations: []
    };

    try {
      // Check for outdated dependencies
      const outdatedOutput = execSync('npm outdated --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (outdatedOutput.trim()) {
        results.outdated = JSON.parse(outdatedOutput);
      }
    } catch (error) {
      // npm outdated returns non-zero exit code when outdated packages exist
      if (error.stdout) {
        try {
          results.outdated = JSON.parse(error.stdout);
        } catch (parseError) {
          // Ignore parse errors
        }
      }
    }

    try {
      // Check for security vulnerabilities
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const auditData = JSON.parse(auditOutput);
      results.security = auditData.vulnerabilities || [];
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities exist
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          results.security = auditData.vulnerabilities || [];
        } catch (parseError) {
          // Ignore parse errors
        }
      }
    }

    // Generate recommendations
    if (Object.keys(results.outdated).length > 0) {
      results.recommendations.push('Update outdated dependencies');
    }
    if (Object.keys(results.security).length > 0) {
      results.recommendations.push('Address security vulnerabilities');
    }

    return {
      status: 'completed',
      results
    };
  }

  async updateDocumentation() {
    try {
      // Update test metrics in documentation
      execSync('node scripts/update-test-docs.js', { 
        encoding: 'utf8',
        timeout: 60000 // 1 minute timeout
      });

      return {
        status: 'completed',
        message: 'Documentation updated successfully'
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async runComprehensiveReview() {
    const review = {
      testCoverage: null,
      codeQuality: null,
      performance: null,
      security: null,
      recommendations: []
    };

    try {
      // Run comprehensive test coverage analysis
      const coverageOutput = execSync('npm run test:coverage -- --json', {
        encoding: 'utf8'
      });
      review.testCoverage = this.analyzeCoverage(coverageOutput);

      // Run code quality checks
      const lintOutput = execSync('npm run lint -- --format json', {
        encoding: 'utf8'
      });
      review.codeQuality = this.analyzeLintResults(lintOutput);

      // Run security analysis
      const securityOutput = execSync('npm run test:security', {
        encoding: 'utf8'
      });
      review.security = this.analyzeSecurityResults(securityOutput);

      // Generate recommendations based on review
      review.recommendations = this.generateReviewRecommendations(review);

      return {
        status: 'completed',
        results: review
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async optimizeTestSuite() {
    const optimizations = {
      slowTests: [],
      duplicateTests: [],
      unusedMocks: [],
      optimizationsSuggested: []
    };

    try {
      // Identify slow tests
      optimizations.slowTests = await this.identifySlowTests();
      
      // Find duplicate test patterns
      optimizations.duplicateTests = await this.findDuplicateTests();
      
      // Find unused mocks
      optimizations.unusedMocks = await this.findUnusedMocks();
      
      // Generate optimization suggestions
      optimizations.optimizationsSuggested = this.generateOptimizationSuggestions(optimizations);

      return {
        status: 'completed',
        results: optimizations
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async updateBenchmarks() {
    try {
      // Run current performance tests to establish new benchmarks
      const performanceResults = await this.runPerformanceMonitoring();
      
      if (performanceResults.status === 'completed') {
        // Update benchmark configuration
        this.updatePerformanceBenchmarks(performanceResults);
        
        return {
          status: 'completed',
          message: 'Performance benchmarks updated'
        };
      } else {
        return {
          status: 'failed',
          error: 'Failed to run performance tests for benchmark update'
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  parseHealthCheckOutput(output) {
    // Parse health check output and extract metrics
    const healthData = {
      passRate: 100,
      coverage: 0,
      executionTime: 0,
      issues: []
    };

    // Extract pass rate
    const passRateMatch = output.match(/Pass rate: (\d+)%/);
    if (passRateMatch) {
      healthData.passRate = parseInt(passRateMatch[1]);
    }

    // Extract coverage
    const coverageMatch = output.match(/Coverage: (\d+)%/);
    if (coverageMatch) {
      healthData.coverage = parseInt(coverageMatch[1]);
    }

    // Extract execution time
    const timeMatch = output.match(/Execution time: (\d+)ms/);
    if (timeMatch) {
      healthData.executionTime = parseInt(timeMatch[1]);
    }

    return healthData;
  }

  identifyHealthIssues(healthData) {
    const issues = [];

    if (healthData.passRate < 95) {
      issues.push(`Low pass rate: ${healthData.passRate}%`);
    }

    if (healthData.coverage < this.config.thresholds.minCoverage) {
      issues.push(`Low coverage: ${healthData.coverage}%`);
    }

    if (healthData.executionTime > this.config.thresholds.maxExecutionTime) {
      issues.push(`Slow execution: ${healthData.executionTime}ms`);
    }

    return issues;
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  cleanupDirectory(dirPath, maxAgeDays) {
    let removedCount = 0;
    
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        if (stats.isDirectory()) {
          removedCount += this.cleanupDirectory(filePath, 0); // Remove all files in old directories
          fs.rmdirSync(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
        removedCount++;
      }
    }
    
    return removedCount;
  }

  generateMaintenanceReport(type, results) {
    const report = {
      type,
      timestamp: new Date().toISOString(),
      results,
      summary: this.generateSummary(results)
    };

    const reportPath = path.join(__dirname, '..', 'test-maintenance-reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const reportFile = path.join(reportPath, `${type}-maintenance-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📄 ${type} maintenance report saved to: ${reportFile}`);

    // Send notifications if configured
    this.sendNotification(type, report);
  }

  generateSummary(results) {
    const summary = {
      totalTasks: Object.keys(results).length,
      successfulTasks: 0,
      failedTasks: 0,
      issues: [],
      recommendations: []
    };

    Object.entries(results).forEach(([task, result]) => {
      if (result.status === 'completed') {
        summary.successfulTasks++;
      } else {
        summary.failedTasks++;
        summary.issues.push(`${task}: ${result.error || 'Unknown error'}`);
      }

      // Extract recommendations from task results
      if (result.results && result.results.recommendations) {
        summary.recommendations.push(...result.results.recommendations);
      }
    });

    return summary;
  }

  sendNotification(type, report) {
    if (!this.config.notifications.enabled) {
      return;
    }

    const message = this.formatNotificationMessage(type, report);

    // Console notification
    if (this.config.notifications.channels.includes('console')) {
      console.log('\n📢 Maintenance Notification:');
      console.log(message);
    }

    // File notification
    if (this.config.notifications.channels.includes('file')) {
      this.log(`NOTIFICATION: ${message}`);
    }

    // Webhook notification
    if (this.config.notifications.webhook) {
      this.sendWebhookNotification(message, report);
    }
  }

  formatNotificationMessage(type, report) {
    const summary = report.summary;
    let message = `${type.toUpperCase()} maintenance completed: ${summary.successfulTasks}/${summary.totalTasks} tasks successful`;

    if (summary.failedTasks > 0) {
      message += `\nFailed tasks: ${summary.issues.join(', ')}`;
    }

    if (summary.recommendations.length > 0) {
      message += `\nRecommendations: ${summary.recommendations.slice(0, 3).join(', ')}`;
    }

    return message;
  }

  async sendWebhookNotification(message, report) {
    try {
      const https = require('https');
      const url = require('url');
      
      const webhookUrl = new url.URL(this.config.notifications.webhook);
      const payload = JSON.stringify({
        text: message,
        report: report
      });

      const options = {
        hostname: webhookUrl.hostname,
        port: webhookUrl.port || 443,
        path: webhookUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        console.log(`Webhook notification sent: ${res.statusCode}`);
      });

      req.on('error', (error) => {
        console.error('Failed to send webhook notification:', error.message);
      });

      req.write(payload);
      req.end();
    } catch (error) {
      console.error('Failed to send webhook notification:', error.message);
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
      fs.appendFileSync(this.maintenanceLogPath, logEntry);
    } catch (error) {
      console.error('Failed to write to maintenance log:', error.message);
    }
  }

  // CLI interface
  static async runOnDemand(taskType) {
    const scheduler = new TestMaintenanceScheduler();
    
    console.log(`🔧 Running ${taskType} maintenance on demand...`);
    
    try {
      let results;
      
      switch (taskType) {
        case 'daily':
          results = await scheduler.runDailyMaintenance();
          break;
        case 'weekly':
          results = await scheduler.runWeeklyMaintenance();
          break;
        case 'monthly':
          results = await scheduler.runMonthlyMaintenance();
          break;
        default:
          throw new Error(`Unknown maintenance type: ${taskType}`);
      }
      
      console.log('✅ On-demand maintenance completed');
      return results;
    } catch (error) {
      console.error('❌ On-demand maintenance failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Run specific maintenance type on demand
    const taskType = args[0];
    TestMaintenanceScheduler.runOnDemand(taskType);
  } else {
    // Start the scheduler
    const scheduler = new TestMaintenanceScheduler();
    scheduler.startScheduler();
  }
}

module.exports = TestMaintenanceScheduler;
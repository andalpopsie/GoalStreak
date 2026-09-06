/**
 * iOS Test Runner
 *
 * Main test runner for comprehensive iOS pre-launch testing
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Execute comprehensive iOS pre-launch testing
 */

import { Platform } from 'react-native';
import IOSTestSuite, { TestResult, IOSTestScenario } from './IOSTestSuite';

export interface IOSTestRunnerConfig {
  runDeviceTests: boolean;
  runVersionTests: boolean;
  runUserFlowTests: boolean;
  runIOSFeatureTests: boolean;
  generateReport: boolean;
  outputPath?: string;
}

export interface IOSTestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    criticalFailures: number;
    executionTime: number;
  };
  results: TestResult[];
  recommendations: string[];
  readyForAppStore: boolean;
}

export class IOSTestRunner {
  private testSuite: IOSTestSuite;
  private config: IOSTestRunnerConfig;

  constructor(
    config: IOSTestRunnerConfig = {
      runDeviceTests: true,
      runVersionTests: true,
      runUserFlowTests: true,
      runIOSFeatureTests: true,
      generateReport: true,
    }
  ) {
    this.testSuite = new IOSTestSuite();
    this.config = config;
  }

  /**
   * Run comprehensive iOS testing suite
   */
  async runComprehensiveTests(): Promise<IOSTestReport> {
    console.log('🚀 Starting iOS Pre-Launch Testing Suite...');

    const startTime = Date.now();
    const results: TestResult[] = [];

    try {
      // Clear previous results
      this.testSuite.clearResults();

      // Run device compatibility tests
      if (this.config.runDeviceTests) {
        console.log('📱 Running device compatibility tests...');
        const deviceResults = await this.runDeviceTests();
        results.push(...deviceResults);
      }

      // Run iOS version compatibility tests
      if (this.config.runVersionTests) {
        console.log('🔢 Running iOS version compatibility tests...');
        const versionResults = await this.runVersionTests();
        results.push(...versionResults);
      }

      // Run user flow tests
      if (this.config.runUserFlowTests) {
        console.log('👤 Running user flow tests...');
        const userFlowResults = await this.runUserFlowTests();
        results.push(...userFlowResults);
      }

      // Run iOS-specific feature tests
      if (this.config.runIOSFeatureTests) {
        console.log('🍎 Running iOS-specific feature tests...');
        const iosFeatureResults = await this.runIOSFeatureTests();
        results.push(...iosFeatureResults);
      }

      const executionTime = Date.now() - startTime;
      const report = this.generateTestReport(results, executionTime);

      console.log('✅ iOS Pre-Launch Testing Complete!');
      console.log(
        `📊 Results: ${report.summary.passed}/${report.summary.total} tests passed (${report.summary.passRate.toFixed(1)}%)`
      );

      if (report.summary.criticalFailures > 0) {
        console.log(`❌ Critical failures: ${report.summary.criticalFailures}`);
      }

      if (this.config.generateReport) {
        this.printReport(report);
      }

      return report;
    } catch (error) {
      console.error('❌ iOS testing failed:', error);
      throw error;
    }
  }

  /**
   * Run device compatibility tests
   */
  private async runDeviceTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const deviceScenarios = IOSTestSuite.TEST_SCENARIOS.filter((s) => s.category === 'device');

    for (const scenario of deviceScenarios) {
      for (const device of IOSTestSuite.SUPPORTED_DEVICES) {
        console.log(`  Testing ${scenario.name} on ${device.name}...`);
        const result = await this.testSuite.runTestScenario(scenario.id, device);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Run iOS version compatibility tests
   */
  private async runVersionTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const versionScenarios = IOSTestSuite.TEST_SCENARIOS.filter((s) => s.category === 'version');

    for (const scenario of versionScenarios) {
      console.log(`  Testing ${scenario.name}...`);
      const result = await this.testSuite.runTestScenario(scenario.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Run user flow tests
   */
  private async runUserFlowTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const userFlowScenarios = IOSTestSuite.TEST_SCENARIOS.filter((s) => s.category === 'userFlow');

    for (const scenario of userFlowScenarios) {
      console.log(`  Testing ${scenario.name}...`);
      const result = await this.testSuite.runTestScenario(scenario.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Run iOS-specific feature tests
   */
  private async runIOSFeatureTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const iosFeatureScenarios = IOSTestSuite.TEST_SCENARIOS.filter(
      (s) => s.category === 'iosFeature'
    );

    for (const scenario of iosFeatureScenarios) {
      console.log(`  Testing ${scenario.name}...`);
      const result = await this.testSuite.runTestScenario(scenario.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(results: TestResult[], executionTime: number): IOSTestReport {
    const summary = this.testSuite.getTestSummary();
    const recommendations = this.generateRecommendations(results);
    const readyForAppStore = this.assessAppStoreReadiness(results);

    return {
      summary: {
        ...summary,
        executionTime,
      },
      results,
      recommendations,
      readyForAppStore,
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];
    const failedResults = results.filter((r) => !r.passed);

    if (failedResults.length === 0) {
      recommendations.push('✅ All tests passed! Your app is ready for iOS App Store submission.');
      return recommendations;
    }

    // Analyze failed tests by category
    const failedByCategory = this.groupFailuresByCategory(failedResults);

    if (failedByCategory.device?.length > 0) {
      recommendations.push('📱 Device Compatibility Issues:');
      recommendations.push('  - Test your app on physical devices before submission');
      recommendations.push('  - Ensure UI elements are properly sized for all screen sizes');
      recommendations.push(
        '  - Verify touch targets meet iOS accessibility guidelines (44pt minimum)'
      );
    }

    if (failedByCategory.version?.length > 0) {
      recommendations.push('🔢 iOS Version Compatibility Issues:');
      recommendations.push('  - Update minimum iOS version in app.json if needed');
      recommendations.push('  - Test deprecated API usage and update to current iOS APIs');
      recommendations.push('  - Verify app works on iOS 15.0+ as specified');
    }

    if (failedByCategory.userFlow?.length > 0) {
      recommendations.push('👤 User Flow Issues:');
      recommendations.push('  - Fix critical user flows before App Store submission');
      recommendations.push('  - Test onboarding, habit creation, and social features thoroughly');
      recommendations.push('  - Ensure all user interactions provide appropriate feedback');
    }

    if (failedByCategory.iosFeature?.length > 0) {
      recommendations.push('🍎 iOS Feature Issues:');
      recommendations.push('  - Implement proper haptic feedback for better user experience');
      recommendations.push('  - Ensure notifications work correctly and respect user preferences');
      recommendations.push('  - Test accessibility features with VoiceOver enabled');
    }

    // Performance recommendations
    const slowTests = results.filter((r) => r.duration > 1000);
    if (slowTests.length > 0) {
      recommendations.push('⚡ Performance Recommendations:');
      recommendations.push('  - Optimize slow-performing features for better user experience');
      recommendations.push('  - Consider lazy loading for heavy components');
      recommendations.push('  - Profile memory usage and fix potential leaks');
    }

    return recommendations;
  }

  /**
   * Group failures by category
   */
  private groupFailuresByCategory(failedResults: TestResult[]): Record<string, TestResult[]> {
    const grouped: Record<string, TestResult[]> = {};

    for (const result of failedResults) {
      const scenario = IOSTestSuite.TEST_SCENARIOS.find((s) => s.id === result.scenarioId);
      if (scenario) {
        if (!grouped[scenario.category]) {
          grouped[scenario.category] = [];
        }
        grouped[scenario.category].push(result);
      }
    }

    return grouped;
  }

  /**
   * Assess if app is ready for App Store submission
   */
  private assessAppStoreReadiness(results: TestResult[]): boolean {
    const criticalFailures = results.filter((r) => {
      if (r.passed) return false;
      const scenario = IOSTestSuite.TEST_SCENARIOS.find((s) => s.id === r.scenarioId);
      return scenario?.priority === 'critical';
    });

    // App is ready if no critical failures
    return criticalFailures.length === 0;
  }

  /**
   * Print detailed test report
   */
  private printReport(report: IOSTestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 iOS PRE-LAUNCH TESTING REPORT');
    console.log('='.repeat(60));

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
    console.log(`Execution Time: ${(report.summary.executionTime / 1000).toFixed(2)}s`);
    console.log(`Critical Failures: ${report.summary.criticalFailures}`);

    // App Store Readiness
    console.log('\n🏪 APP STORE READINESS:');
    if (report.readyForAppStore) {
      console.log('✅ READY - Your app is ready for iOS App Store submission!');
    } else {
      console.log('❌ NOT READY - Please address critical issues before submission.');
    }

    // Failed Tests
    const failedResults = report.results.filter((r) => !r.passed);
    if (failedResults.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      for (const result of failedResults) {
        const scenario = IOSTestSuite.TEST_SCENARIOS.find((s) => s.id === result.scenarioId);
        const device = result.deviceInfo ? ` (${result.deviceInfo.name})` : '';
        console.log(`  • ${scenario?.name}${device}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      for (const recommendation of report.recommendations) {
        console.log(`  ${recommendation}`);
      }
    }

    // Device Coverage
    console.log('\n📱 DEVICE COVERAGE:');
    const deviceResults = report.results.filter((r) => r.deviceInfo);
    const deviceCoverage = this.calculateDeviceCoverage(deviceResults);
    for (const [deviceName, coverage] of Object.entries(deviceCoverage)) {
      const status = coverage.passRate === 100 ? '✅' : coverage.passRate >= 80 ? '⚠️' : '❌';
      console.log(
        `  ${status} ${deviceName}: ${coverage.passed}/${coverage.total} (${coverage.passRate.toFixed(1)}%)`
      );
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Calculate device coverage statistics
   */
  private calculateDeviceCoverage(deviceResults: TestResult[]): Record<
    string,
    {
      total: number;
      passed: number;
      passRate: number;
    }
  > {
    const coverage: Record<string, { total: number; passed: number; passRate: number }> = {};

    for (const result of deviceResults) {
      if (!result.deviceInfo) continue;

      const deviceName = result.deviceInfo.name;
      if (!coverage[deviceName]) {
        coverage[deviceName] = { total: 0, passed: 0, passRate: 0 };
      }

      coverage[deviceName].total++;
      if (result.passed) {
        coverage[deviceName].passed++;
      }
    }

    // Calculate pass rates
    for (const deviceName of Object.keys(coverage)) {
      const stats = coverage[deviceName];
      stats.passRate = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;
    }

    return coverage;
  }

  /**
   * Run quick smoke tests for critical functionality
   */
  async runSmokeTests(): Promise<boolean> {
    console.log('🔥 Running iOS smoke tests...');

    const criticalScenarios = IOSTestSuite.TEST_SCENARIOS.filter((s) => s.priority === 'critical');

    let allPassed = true;

    for (const scenario of criticalScenarios) {
      const result = await this.testSuite.runTestScenario(scenario.id);
      if (!result.passed) {
        console.log(`❌ Critical test failed: ${scenario.name}`);
        allPassed = false;
      } else {
        console.log(`✅ ${scenario.name}`);
      }
    }

    if (allPassed) {
      console.log('✅ All smoke tests passed!');
    } else {
      console.log('❌ Some smoke tests failed. Please fix critical issues.');
    }

    return allPassed;
  }

  /**
   * Validate iOS environment and prerequisites
   */
  static validateEnvironment(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check platform
    if (Platform.OS !== 'ios') {
      issues.push('Not running on iOS platform');
      recommendations.push('Run tests on iOS device or simulator for accurate results');
    }

    // Check iOS version
    const iosVersion = Platform.Version as string;
    if (typeof iosVersion === 'string') {
      const version = parseFloat(iosVersion);
      if (version < 15.0) {
        issues.push(`iOS version ${iosVersion} is below minimum supported version 15.0`);
        recommendations.push('Update iOS version or adjust minimum supported version');
      }
    }

    // Check available memory (mock check)
    const availableMemory = 1024; // MB - would be actual check in real implementation
    if (availableMemory < 512) {
      issues.push('Low available memory detected');
      recommendations.push('Close other apps and free up memory before testing');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

export default IOSTestRunner;

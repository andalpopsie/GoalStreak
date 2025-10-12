/**
 * iOS Pre-Launch Testing Execution Script
 * 
 * Main script to execute comprehensive iOS pre-launch testing
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Execute comprehensive iOS pre-launch testing
 */

import { Platform } from 'react-native';
import IOSTestRunner, { IOSTestRunnerConfig } from './IOSTestRunner';

/**
 * Main function to run iOS pre-launch tests
 */
export async function runIOSPreLaunchTests(
  config?: Partial<IOSTestRunnerConfig>
): Promise<boolean> {
  console.log('🍎 GoalStreak iOS Pre-Launch Testing Suite');
  console.log('==========================================');

  // Validate environment
  console.log('🔍 Validating iOS testing environment...');
  const envValidation = IOSTestRunner.validateEnvironment();
  
  if (!envValidation.isValid) {
    console.log('❌ Environment validation failed:');
    envValidation.issues.forEach(issue => console.log(`  • ${issue}`));
    
    if (envValidation.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      envValidation.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    // Continue with warnings but note limitations
    console.log('\n⚠️  Continuing with testing (results may not be fully accurate on non-iOS platform)...\n');
  } else {
    console.log('✅ Environment validation passed!\n');
  }

  // Initialize test runner
  const testConfig: IOSTestRunnerConfig = {
    runDeviceTests: true,
    runVersionTests: true,
    runUserFlowTests: true,
    runIOSFeatureTests: true,
    generateReport: true,
    ...config,
  };

  const testRunner = new IOSTestRunner(testConfig);

  try {
    // Run comprehensive tests
    const report = await testRunner.runComprehensiveTests();

    // Determine if tests passed
    const testsPassed = report.readyForAppStore && report.summary.criticalFailures === 0;

    if (testsPassed) {
      console.log('\n🎉 SUCCESS: iOS pre-launch testing completed successfully!');
      console.log('✅ Your app is ready for iOS App Store submission.');
    } else {
      console.log('\n⚠️  WARNING: iOS pre-launch testing completed with issues.');
      console.log('❌ Please address the issues before App Store submission.');
    }

    // Print final summary
    console.log('\n📋 FINAL SUMMARY:');
    console.log(`Tests Run: ${report.summary.total}`);
    console.log(`Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
    console.log(`Critical Failures: ${report.summary.criticalFailures}`);
    console.log(`Execution Time: ${(report.summary.executionTime / 1000).toFixed(2)}s`);
    console.log(`App Store Ready: ${report.readyForAppStore ? 'YES' : 'NO'}`);

    return testsPassed;

  } catch (error) {
    console.error('\n❌ FATAL ERROR: iOS testing failed unexpectedly:');
    console.error(error);
    return false;
  }
}

/**
 * Run quick smoke tests only
 */
export async function runIOSSmokeTests(): Promise<boolean> {
  console.log('🔥 GoalStreak iOS Smoke Tests');
  console.log('============================');

  const testRunner = new IOSTestRunner();
  
  try {
    const passed = await testRunner.runSmokeTests();
    
    if (passed) {
      console.log('\n✅ All smoke tests passed! Core functionality is working.');
    } else {
      console.log('\n❌ Some smoke tests failed. Critical issues detected.');
    }
    
    return passed;
  } catch (error) {
    console.error('\n❌ Smoke tests failed:', error);
    return false;
  }
}

/**
 * Run tests for specific category
 */
export async function runIOSTestCategory(
  category: 'device' | 'version' | 'userFlow' | 'iosFeature'
): Promise<boolean> {
  console.log(`🎯 Running iOS ${category} tests...`);

  const config: IOSTestRunnerConfig = {
    runDeviceTests: category === 'device',
    runVersionTests: category === 'version',
    runUserFlowTests: category === 'userFlow',
    runIOSFeatureTests: category === 'iosFeature',
    generateReport: true,
  };

  const testRunner = new IOSTestRunner(config);
  
  try {
    const report = await testRunner.runComprehensiveTests();
    const passed = report.summary.criticalFailures === 0;
    
    console.log(`\n${passed ? '✅' : '❌'} ${category} tests completed`);
    console.log(`Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
    
    return passed;
  } catch (error) {
    console.error(`\n❌ ${category} tests failed:`, error);
    return false;
  }
}

/**
 * CLI interface for running tests
 */
export async function runIOSTestsCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';

  switch (command) {
    case 'full':
    case 'comprehensive':
      await runIOSPreLaunchTests();
      break;
      
    case 'smoke':
      await runIOSSmokeTests();
      break;
      
    case 'device':
      await runIOSTestCategory('device');
      break;
      
    case 'version':
      await runIOSTestCategory('version');
      break;
      
    case 'userflow':
    case 'flows':
      await runIOSTestCategory('userFlow');
      break;
      
    case 'features':
    case 'ios':
      await runIOSTestCategory('iosFeature');
      break;
      
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

/**
 * Print CLI help
 */
function printHelp(): void {
  console.log(`
🍎 GoalStreak iOS Testing CLI

Usage: npm run test:ios [command]

Commands:
  full, comprehensive  Run all iOS pre-launch tests (default)
  smoke               Run quick smoke tests for critical functionality
  device              Run device compatibility tests only
  version             Run iOS version compatibility tests only
  userflow, flows     Run user flow tests only
  features, ios       Run iOS-specific feature tests only
  help, --help, -h    Show this help message

Examples:
  npm run test:ios                    # Run full test suite
  npm run test:ios smoke             # Run smoke tests
  npm run test:ios device            # Test device compatibility
  npm run test:ios userflow          # Test user flows

Environment:
  Platform: ${Platform.OS}
  Version: ${Platform.Version}
  `);
}

// Export for use in other files
export default {
  runIOSPreLaunchTests,
  runIOSSmokeTests,
  runIOSTestCategory,
  runIOSTestsCLI,
};

// Run CLI if this file is executed directly
if (require.main === module) {
  runIOSTestsCLI().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}
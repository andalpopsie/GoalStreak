#!/usr/bin/env node

/**
 * E2E Test Runner Script
 * Manages the execution of end-to-end tests with proper setup and cleanup
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  defaultConfiguration: 'ios.sim.debug',
  timeout: 600000, // 10 minutes
  retries: 2,
  platforms: ['ios', 'android'],
  devices: {
    ios: ['iphone-se', 'iphone-14', 'iphone-14-pro-max'],
    android: ['pixel-3', 'pixel-4-xl']
  }
};

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  configuration: args.find(arg => arg.startsWith('--configuration='))?.split('=')[1] || CONFIG.defaultConfiguration,
  platform: args.find(arg => arg.startsWith('--platform='))?.split('=')[1],
  device: args.find(arg => arg.startsWith('--device='))?.split('=')[1],
  testFile: args.find(arg => arg.startsWith('--test='))?.split('=')[1],
  build: !args.includes('--no-build'),
  cleanup: !args.includes('--no-cleanup'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help') || args.includes('-h'),
  crossPlatform: args.includes('--cross-platform'),
  record: args.includes('--record'),
  headless: args.includes('--headless')
};

// Help text
const HELP_TEXT = `
E2E Test Runner for GoalStreak

Usage: node e2e/scripts/runTests.js [options]

Options:
  --configuration=<config>  Detox configuration to use (default: ${CONFIG.defaultConfiguration})
  --platform=<platform>     Platform to test (ios|android)
  --device=<device>         Specific device to test
  --test=<file>            Specific test file to run
  --no-build               Skip building the app
  --no-cleanup             Skip cleanup after tests
  --verbose                Enable verbose logging
  --cross-platform         Run tests on all platforms
  --record                 Record test videos
  --headless               Run in headless mode (CI)
  --help, -h               Show this help message

Examples:
  node e2e/scripts/runTests.js
  node e2e/scripts/runTests.js --configuration=android.emu.debug
  node e2e/scripts/runTests.js --platform=ios --device=iphone-14
  node e2e/scripts/runTests.js --test=userJourney.test.ts
  node e2e/scripts/runTests.js --cross-platform --record
`;

// Utility functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const execCommand = (command, options = {}) => {
  if (options.verbose || process.env.VERBOSE) {
    log(`Executing: ${command}`);
  }
  
  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options
    });
    return result;
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    log(`Error: ${error.message}`, 'error');
    throw error;
  }
};

const checkPrerequisites = () => {
  log('Checking prerequisites...');
  
  // Check if Detox is installed
  try {
    execCommand('npx detox --version', { silent: true });
    log('Detox CLI found', 'success');
  } catch (error) {
    log('Detox CLI not found. Please install with: npm install -g detox-cli', 'error');
    process.exit(1);
  }
  
  // Check if configuration exists
  const configPath = path.join(__dirname, '../../.detoxrc.js');
  if (!fs.existsSync(configPath)) {
    log('Detox configuration not found', 'error');
    process.exit(1);
  }
  
  // Check if test directory exists
  const testDir = path.join(__dirname, '..');
  if (!fs.existsSync(testDir)) {
    log('E2E test directory not found', 'error');
    process.exit(1);
  }
  
  log('Prerequisites check passed', 'success');
};

const buildApp = async (configuration) => {
  if (!options.build) {
    log('Skipping app build (--no-build specified)');
    return;
  }
  
  log(`Building app for configuration: ${configuration}`);
  
  try {
    execCommand(`npx detox build --configuration ${configuration}`, {
      verbose: options.verbose
    });
    log('App build completed', 'success');
  } catch (error) {
    log('App build failed', 'error');
    throw error;
  }
};

const runTests = async (configuration, testFile) => {
  log(`Running E2E tests with configuration: ${configuration}`);
  
  const testCommand = [
    'npx detox test',
    `--configuration ${configuration}`,
    testFile ? `--testNamePattern="${testFile}"` : '',
    options.record ? '--record-videos all' : '',
    options.headless ? '--headless' : '',
    options.verbose ? '--verbose' : ''
  ].filter(Boolean).join(' ');
  
  try {
    execCommand(testCommand, { verbose: options.verbose });
    log('E2E tests completed successfully', 'success');
    return true;
  } catch (error) {
    log('E2E tests failed', 'error');
    return false;
  }
};

const cleanup = async () => {
  if (!options.cleanup) {
    log('Skipping cleanup (--no-cleanup specified)');
    return;
  }
  
  log('Performing cleanup...');
  
  try {
    // Kill any remaining simulators/emulators
    if (process.platform === 'darwin') {
      execCommand('pkill -f Simulator || true', { silent: true });
    }
    
    // Clean up artifacts if needed
    const artifactsDir = path.join(__dirname, '../artifacts');
    if (fs.existsSync(artifactsDir)) {
      // Keep artifacts but clean up old ones (older than 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const files = fs.readdirSync(artifactsDir);
      
      files.forEach(file => {
        const filePath = path.join(artifactsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          fs.rmSync(filePath, { recursive: true, force: true });
          log(`Cleaned up old artifact: ${file}`);
        }
      });
    }
    
    log('Cleanup completed', 'success');
  } catch (error) {
    log(`Cleanup warning: ${error.message}`, 'warn');
  }
};

const runCrossPlatformTests = async () => {
  log('Running cross-platform E2E tests...');
  
  const results = {};
  
  for (const platform of CONFIG.platforms) {
    log(`Testing platform: ${platform}`);
    
    const configurations = Object.keys(require('../../.detoxrc.js').configurations)
      .filter(config => config.includes(platform) && config.includes('debug'));
    
    for (const config of configurations) {
      try {
        await buildApp(config);
        const success = await runTests(config, options.testFile);
        results[config] = success;
      } catch (error) {
        results[config] = false;
        log(`Configuration ${config} failed: ${error.message}`, 'error');
      }
    }
  }
  
  // Report results
  log('Cross-platform test results:');
  Object.entries(results).forEach(([config, success]) => {
    log(`  ${config}: ${success ? 'PASSED' : 'FAILED'}`, success ? 'success' : 'error');
  });
  
  const allPassed = Object.values(results).every(result => result);
  return allPassed;
};

const generateReport = (results) => {
  const reportDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    configuration: options.configuration,
    platform: options.platform,
    results: results,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  const reportPath = path.join(reportDir, `e2e-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`Test report generated: ${reportPath}`);
};

// Main execution
const main = async () => {
  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  
  log('Starting E2E test execution...');
  log(`Configuration: ${JSON.stringify(options, null, 2)}`);
  
  try {
    // Check prerequisites
    checkPrerequisites();
    
    let success = false;
    
    if (options.crossPlatform) {
      success = await runCrossPlatformTests();
    } else {
      // Build app
      await buildApp(options.configuration);
      
      // Run tests
      success = await runTests(options.configuration, options.testFile);
    }
    
    // Generate report
    generateReport({ success });
    
    // Cleanup
    await cleanup();
    
    if (success) {
      log('All E2E tests completed successfully! 🎉', 'success');
      process.exit(0);
    } else {
      log('Some E2E tests failed! 💥', 'error');
      process.exit(1);
    }
    
  } catch (error) {
    log(`E2E test execution failed: ${error.message}`, 'error');
    
    // Attempt cleanup even on failure
    try {
      await cleanup();
    } catch (cleanupError) {
      log(`Cleanup failed: ${cleanupError.message}`, 'warn');
    }
    
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGINT', async () => {
  log('Received SIGINT, cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  log('Received SIGTERM, cleaning up...');
  await cleanup();
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  buildApp,
  cleanup,
  checkPrerequisites
};
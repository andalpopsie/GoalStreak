#!/usr/bin/env node

/**
 * iOS Production Build and App Store Submission Script
 * 
 * This script handles the complete iOS production build and submission process:
 * 1. Pre-build validation and checks
 * 2. EAS production build generation
 * 3. App Store Connect submission
 * 4. Post-submission monitoring setup
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  buildProfile: 'production-ios',
  platform: 'ios',
  submitProfile: 'production',
  appName: 'GoalStreak',
  bundleId: 'com.goalstreak.app',
  version: '1.0.0',
  buildNumber: '1'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.blue}[STEP ${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`${colors.cyan}Running: ${command}${colors.reset}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    logError(`Command failed: ${command}`);
    throw error;
  }
}

function checkPrerequisites() {
  logStep(1, 'Checking Prerequisites');
  
  // Check if EAS CLI is installed
  try {
    execSync('eas --version', { stdio: 'pipe' });
    logSuccess('EAS CLI is installed');
  } catch (error) {
    logError('EAS CLI is not installed. Please run: npm install -g eas-cli');
    process.exit(1);
  }
  
  // Check if logged into Expo
  try {
    execSync('eas whoami', { stdio: 'pipe' });
    logSuccess('Logged into Expo account');
  } catch (error) {
    logError('Not logged into Expo. Please run: eas login');
    process.exit(1);
  }
  
  // Check if eas.json exists
  if (!fs.existsSync('eas.json')) {
    logError('eas.json not found. Please ensure EAS is configured.');
    process.exit(1);
  }
  logSuccess('EAS configuration found');
  
  // Check if app.json exists and has required fields
  if (!fs.existsSync('app.json')) {
    logError('app.json not found');
    process.exit(1);
  }
  
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const requiredFields = ['name', 'version', 'ios.bundleIdentifier', 'ios.buildNumber'];
  
  for (const field of requiredFields) {
    const fieldPath = field.split('.');
    let value = appConfig.expo;
    for (const key of fieldPath) {
      value = value?.[key];
    }
    if (!value) {
      logError(`Missing required field in app.json: expo.${field}`);
      process.exit(1);
    }
  }
  logSuccess('App configuration validated');
  
  // Check if assets exist
  const requiredAssets = [
    'assets/icon.png',
    'assets/adaptive-icon.png',
    'assets/splash-icon.png'
  ];
  
  for (const asset of requiredAssets) {
    if (!fs.existsSync(asset)) {
      logError(`Missing required asset: ${asset}`);
      process.exit(1);
    }
  }
  logSuccess('Required assets found');
  
  // Check if iOS screenshots exist
  const screenshotDir = 'app-store-assets/real-screenshots/ios';
  if (!fs.existsSync(screenshotDir)) {
    logWarning('iOS screenshots directory not found. Screenshots will need to be uploaded manually.');
  } else {
    const screenshots = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
    if (screenshots.length === 0) {
      logWarning('No PNG screenshots found. Screenshots will need to be uploaded manually.');
    } else {
      logSuccess(`Found ${screenshots.length} iOS screenshots`);
    }
  }
}

function validateMetadata() {
  logStep(2, 'Validating App Store Metadata');
  
  // Check if metadata files exist
  const metadataFiles = [
    'app-store-assets/metadata/ios-metadata.json',
    'app-store-assets/metadata/app-store-connect-config.json',
    'app-store-assets/metadata/privacy-policy.md',
    'app-store-assets/metadata/terms-of-service.md'
  ];
  
  for (const file of metadataFiles) {
    if (!fs.existsSync(file)) {
      logError(`Missing metadata file: ${file}`);
      process.exit(1);
    }
  }
  logSuccess('All metadata files found');
  
  // Validate iOS metadata
  const iosMetadata = JSON.parse(fs.readFileSync('app-store-assets/metadata/ios-metadata.json', 'utf8'));
  
  // Check required fields
  const requiredMetadataFields = ['name', 'subtitle', 'description', 'keywords', 'category'];
  for (const field of requiredMetadataFields) {
    if (!iosMetadata[field]) {
      logError(`Missing required metadata field: ${field}`);
      process.exit(1);
    }
  }
  
  // Validate field lengths
  if (iosMetadata.name.length > 30) {
    logError(`App name too long: ${iosMetadata.name.length}/30 characters`);
    process.exit(1);
  }
  
  if (iosMetadata.subtitle.length > 30) {
    logError(`Subtitle too long: ${iosMetadata.subtitle.length}/30 characters`);
    process.exit(1);
  }
  
  if (iosMetadata.description.length > 4000) {
    logError(`Description too long: ${iosMetadata.description.length}/4000 characters`);
    process.exit(1);
  }
  
  if (iosMetadata.keywords.length > 100) {
    logError(`Keywords too long: ${iosMetadata.keywords.length}/100 characters`);
    process.exit(1);
  }
  
  logSuccess('Metadata validation passed');
}

function runPreBuildTests() {
  logStep(3, 'Running Pre-Build Tests');
  
  try {
    // Run type checking
    log('Running TypeScript type checking...');
    execCommand('npm run type-check');
    logSuccess('Type checking passed');
    
    // Run linting
    log('Running ESLint...');
    execCommand('npm run lint');
    logSuccess('Linting passed');
    
    // Run unit tests
    log('Running unit tests...');
    execCommand('npm run test:ci');
    logSuccess('Unit tests passed');
    
    // Run iOS-specific tests
    log('Running iOS-specific tests...');
    execCommand('npm run test:ios:comprehensive');
    logSuccess('iOS tests passed');
    
  } catch (error) {
    logError('Pre-build tests failed. Please fix issues before building.');
    process.exit(1);
  }
}

function buildProduction() {
  logStep(4, 'Building iOS Production Build');
  
  try {
    log(`Building ${CONFIG.appName} for iOS App Store...`);
    log(`Profile: ${CONFIG.buildProfile}`);
    log(`Platform: ${CONFIG.platform}`);
    log(`Version: ${CONFIG.version} (${CONFIG.buildNumber})`);
    
    // Build the app
    execCommand(`eas build --profile ${CONFIG.buildProfile} --platform ${CONFIG.platform} --non-interactive`);
    
    logSuccess('iOS production build completed successfully!');
    
    // Get build information
    log('Fetching build information...');
    const buildInfo = execSync('eas build:list --limit=1 --json', { encoding: 'utf8' });
    const builds = JSON.parse(buildInfo);
    
    if (builds.length > 0) {
      const latestBuild = builds[0];
      log(`\n${colors.bright}Build Information:${colors.reset}`);
      log(`Build ID: ${latestBuild.id}`);
      log(`Status: ${latestBuild.status}`);
      log(`Platform: ${latestBuild.platform}`);
      log(`Profile: ${latestBuild.buildProfile}`);
      log(`Created: ${new Date(latestBuild.createdAt).toLocaleString()}`);
      
      if (latestBuild.artifacts?.buildUrl) {
        log(`Download URL: ${latestBuild.artifacts.buildUrl}`);
      }
    }
    
  } catch (error) {
    logError('iOS production build failed');
    throw error;
  }
}

function submitToAppStore() {
  logStep(5, 'Submitting to App Store Connect');
  
  try {
    log('Submitting iOS build to App Store Connect...');
    log('This will use the latest successful build from EAS.');
    
    // Submit to App Store
    execCommand(`eas submit --profile ${CONFIG.submitProfile} --platform ${CONFIG.platform} --non-interactive`);
    
    logSuccess('iOS build submitted to App Store Connect successfully!');
    
    log(`\n${colors.bright}Next Steps:${colors.reset}`);
    log('1. Log into App Store Connect (https://appstoreconnect.apple.com)');
    log('2. Navigate to your app and select the new build');
    log('3. Complete the App Store listing with screenshots and metadata');
    log('4. Submit for App Store review');
    log('5. Monitor the review status and respond to any feedback');
    
  } catch (error) {
    logError('App Store submission failed');
    logWarning('You can submit manually by:');
    log('1. Downloading the .ipa file from EAS Build dashboard');
    log('2. Using Xcode or Application Loader to upload to App Store Connect');
    log('3. Configuring the app listing in App Store Connect');
    throw error;
  }
}

function setupMonitoring() {
  logStep(6, 'Setting Up Post-Submission Monitoring');
  
  // Create monitoring checklist
  const monitoringChecklist = `
# iOS App Store Submission Monitoring

## Submission Details
- **App Name**: ${CONFIG.appName}
- **Bundle ID**: ${CONFIG.bundleId}
- **Version**: ${CONFIG.version}
- **Build Number**: ${CONFIG.buildNumber}
- **Submission Date**: ${new Date().toISOString()}

## Review Status Tracking
- [ ] Submission confirmed in App Store Connect
- [ ] Build processing completed
- [ ] Metadata and screenshots uploaded
- [ ] App submitted for review
- [ ] Review in progress
- [ ] Review completed (approved/rejected)

## Monitoring Tasks
- [ ] Check App Store Connect daily for status updates
- [ ] Monitor crash reports and analytics
- [ ] Respond to any Apple reviewer feedback within 24 hours
- [ ] Prepare marketing materials for launch
- [ ] Set up customer support for user inquiries

## Key URLs
- App Store Connect: https://appstoreconnect.apple.com
- EAS Build Dashboard: https://expo.dev/accounts/[account]/projects/${CONFIG.appName}/builds
- Support Email: hello@goalfer.app
- Privacy Policy: https://goalfer.app/privacy
- Terms of Service: https://goalfer.app/terms

## Emergency Contacts
- Developer: [Your contact information]
- Apple Developer Support: https://developer.apple.com/contact/

## Success Metrics to Track
- App Store approval timeline
- Initial download numbers
- User ratings and reviews
- Crash-free session rate
- User retention rates

---
Generated on: ${new Date().toLocaleString()}
`;

  fs.writeFileSync('ios-submission-monitoring.md', monitoringChecklist);
  logSuccess('Monitoring checklist created: ios-submission-monitoring.md');
  
  log(`\n${colors.bright}Monitoring Setup Complete!${colors.reset}`);
  log('Review the monitoring checklist and track your submission progress.');
}

function displayFinalInstructions() {
  log(`\n${colors.bright}${colors.green}🎉 iOS Production Build and Submission Process Complete!${colors.reset}\n`);
  
  log(`${colors.bright}What happens next:${colors.reset}`);
  log('1. Apple will review your app (typically 1-7 days)');
  log('2. You\'ll receive email notifications about review status');
  log('3. If approved, you can release the app to the App Store');
  log('4. If rejected, address the feedback and resubmit');
  
  log(`\n${colors.bright}Important reminders:${colors.reset}`);
  log('• Check App Store Connect daily for updates');
  log('• Respond quickly to any Apple reviewer feedback');
  log('• Have marketing materials ready for launch');
  log('• Monitor app performance and user feedback post-launch');
  
  log(`\n${colors.bright}Resources:${colors.reset}`);
  log('• App Store Connect: https://appstoreconnect.apple.com');
  log('• App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/');
  log('• EAS Build Dashboard: https://expo.dev');
  log('• Monitoring Checklist: ./ios-submission-monitoring.md');
  
  log(`\n${colors.cyan}Good luck with your App Store launch! 🚀${colors.reset}`);
}

// Main execution
async function main() {
  try {
    log(`${colors.bright}${colors.magenta}🚀 GoalStreak iOS Production Build & App Store Submission${colors.reset}\n`);
    
    checkPrerequisites();
    validateMetadata();
    runPreBuildTests();
    buildProduction();
    submitToAppStore();
    setupMonitoring();
    displayFinalInstructions();
    
  } catch (error) {
    logError(`\nBuild and submission process failed: ${error.message}`);
    log(`\n${colors.bright}Troubleshooting:${colors.reset}`);
    log('1. Check the error messages above for specific issues');
    log('2. Ensure all prerequisites are met');
    log('3. Verify your Expo account and Apple Developer account');
    log('4. Check EAS Build dashboard for detailed build logs');
    log('5. Consult the iOS submission checklist for missing requirements');
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log(`\n${colors.yellow}Process interrupted. Build may still be running on EAS servers.${colors.reset}`);
  log('Check the EAS Build dashboard for status: https://expo.dev');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log(`\n${colors.yellow}Process terminated. Build may still be running on EAS servers.${colors.reset}`);
  log('Check the EAS Build dashboard for status: https://expo.dev');
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  checkPrerequisites,
  validateMetadata,
  runPreBuildTests,
  buildProduction,
  submitToAppStore,
  setupMonitoring
};
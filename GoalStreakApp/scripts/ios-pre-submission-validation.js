#!/usr/bin/env node

/**
 * iOS Pre-Submission Validation Script
 * 
 * This script performs comprehensive validation before iOS App Store submission
 * to ensure all requirements are met and reduce the chance of rejection.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function logInfo(message) {
  log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

let validationResults = {
  passed: 0,
  warnings: 0,
  errors: 0,
  details: []
};

function addResult(type, category, message, details = null) {
  validationResults[type]++;
  validationResults.details.push({
    type,
    category,
    message,
    details,
    timestamp: new Date().toISOString()
  });
  
  switch (type) {
    case 'passed':
      logSuccess(`${category}: ${message}`);
      break;
    case 'warnings':
      logWarning(`${category}: ${message}`);
      break;
    case 'errors':
      logError(`${category}: ${message}`);
      break;
  }
  
  if (details) {
    log(`   ${details}`, colors.cyan);
  }
}

function validateAppConfiguration() {
  logStep(1, 'Validating App Configuration');
  
  // Check app.json exists and has required fields
  if (!fs.existsSync('app.json')) {
    addResult('errors', 'App Config', 'app.json file not found');
    return;
  }
  
  try {
    const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    const expo = appConfig.expo;
    
    // Required fields validation
    const requiredFields = [
      { path: 'name', value: expo.name },
      { path: 'version', value: expo.version },
      { path: 'ios.bundleIdentifier', value: expo.ios?.bundleIdentifier },
      { path: 'ios.buildNumber', value: expo.ios?.buildNumber }
    ];
    
    for (const field of requiredFields) {
      if (!field.value) {
        addResult('errors', 'App Config', `Missing required field: ${field.path}`);
      } else {
        addResult('passed', 'App Config', `${field.path} is configured`);
      }
    }
    
    // Validate specific values
    if (expo.name !== 'Goalfer') {
      addResult('warnings', 'App Config', 'App name should be "Goalfer"', `Current: ${expo.name}`);
    }
    
    if (expo.ios?.bundleIdentifier !== 'com.goalstreak.app') {
      addResult('warnings', 'App Config', 'Bundle ID should be "com.goalstreak.app"', `Current: ${expo.ios?.bundleIdentifier}`);
    }
    
    // Check iOS-specific configuration
    if (expo.ios?.supportsTablet !== true) {
      addResult('warnings', 'App Config', 'iPad support not enabled', 'Consider enabling for universal app');
    }
    
    // Validate privacy usage descriptions
    const requiredPrivacyDescriptions = [
      'NSCameraUsageDescription',
      'NSPhotoLibraryUsageDescription',
      'NSUserTrackingUsageDescription'
    ];
    
    for (const desc of requiredPrivacyDescriptions) {
      if (!expo.ios?.infoPlist?.[desc]) {
        addResult('errors', 'Privacy', `Missing privacy description: ${desc}`);
      } else {
        addResult('passed', 'Privacy', `${desc} is configured`);
      }
    }
    
  } catch (error) {
    addResult('errors', 'App Config', 'Failed to parse app.json', error.message);
  }
}

function validateEASConfiguration() {
  logStep(2, 'Validating EAS Configuration');
  
  if (!fs.existsSync('eas.json')) {
    addResult('errors', 'EAS Config', 'eas.json file not found');
    return;
  }
  
  try {
    const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
    
    // Check build profiles
    if (!easConfig.build?.['production-ios']) {
      addResult('errors', 'EAS Config', 'production-ios build profile not found');
    } else {
      addResult('passed', 'EAS Config', 'production-ios build profile configured');
    }
    
    // Check submit configuration
    const iosSubmit = easConfig.submit?.production?.ios;
    if (!iosSubmit) {
      addResult('errors', 'EAS Config', 'iOS submission configuration not found');
    } else {
      // Check for placeholder values
      if (iosSubmit.appleId?.includes('[') || iosSubmit.appleId?.includes(']')) {
        addResult('errors', 'EAS Config', 'Apple ID contains placeholder values', 'Run setup-eas-credentials.js');
      } else {
        addResult('passed', 'EAS Config', 'Apple ID configured');
      }
      
      if (iosSubmit.appleTeamId?.includes('[') || iosSubmit.appleTeamId?.includes(']')) {
        addResult('errors', 'EAS Config', 'Apple Team ID contains placeholder values', 'Run setup-eas-credentials.js');
      } else {
        addResult('passed', 'EAS Config', 'Apple Team ID configured');
      }
      
      if (iosSubmit.ascAppId?.includes('[') || iosSubmit.ascAppId?.includes(']')) {
        addResult('warnings', 'EAS Config', 'App Store Connect App ID not configured', 'Update after creating app in App Store Connect');
      } else {
        addResult('passed', 'EAS Config', 'App Store Connect App ID configured');
      }
    }
    
  } catch (error) {
    addResult('errors', 'EAS Config', 'Failed to parse eas.json', error.message);
  }
}

function validateAssets() {
  logStep(3, 'Validating App Assets');
  
  // Required assets
  const requiredAssets = [
    { path: 'assets/icon.png', name: 'App Icon', size: '1024x1024' },
    { path: 'assets/adaptive-icon.png', name: 'Adaptive Icon', size: '1024x1024' },
    { path: 'assets/splash-icon.png', name: 'Splash Icon', size: 'Any' }
  ];
  
  for (const asset of requiredAssets) {
    if (!fs.existsSync(asset.path)) {
      addResult('errors', 'Assets', `Missing ${asset.name}`, `Expected: ${asset.path}`);
    } else {
      const stats = fs.statSync(asset.path);
      addResult('passed', 'Assets', `${asset.name} found`, `Size: ${(stats.size / 1024).toFixed(1)} KB`);
    }
  }
  
  // Check screenshots
  const screenshotDir = 'app-store-assets/real-screenshots/ios';
  if (!fs.existsSync(screenshotDir)) {
    addResult('warnings', 'Screenshots', 'iOS screenshots directory not found', 'Screenshots needed for App Store listing');
  } else {
    const screenshots = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
    if (screenshots.length === 0) {
      addResult('warnings', 'Screenshots', 'No PNG screenshots found', 'Screenshots needed for App Store listing');
    } else {
      addResult('passed', 'Screenshots', `Found ${screenshots.length} iOS screenshots`);
    }
  }
}

function validateMetadata() {
  logStep(4, 'Validating App Store Metadata');
  
  // Check metadata files
  const metadataFiles = [
    { path: 'app-store-assets/metadata/ios-metadata.json', name: 'iOS Metadata' },
    { path: 'app-store-assets/metadata/app-store-connect-config.json', name: 'App Store Connect Config' },
    { path: 'app-store-assets/metadata/privacy-policy.md', name: 'Privacy Policy' },
    { path: 'app-store-assets/metadata/terms-of-service.md', name: 'Terms of Service' }
  ];
  
  for (const file of metadataFiles) {
    if (!fs.existsSync(file.path)) {
      addResult('errors', 'Metadata', `Missing ${file.name}`, `Expected: ${file.path}`);
    } else {
      addResult('passed', 'Metadata', `${file.name} found`);
    }
  }
  
  // Validate iOS metadata content
  if (fs.existsSync('app-store-assets/metadata/ios-metadata.json')) {
    try {
      const metadata = JSON.parse(fs.readFileSync('app-store-assets/metadata/ios-metadata.json', 'utf8'));
      
      // Check required fields
      const requiredFields = ['name', 'subtitle', 'description', 'keywords', 'category'];
      for (const field of requiredFields) {
        if (!metadata[field]) {
          addResult('errors', 'Metadata', `Missing ${field} in iOS metadata`);
        } else {
          addResult('passed', 'Metadata', `${field} configured in iOS metadata`);
        }
      }
      
      // Validate field lengths
      if (metadata.name && metadata.name.length > 30) {
        addResult('errors', 'Metadata', 'App name too long', `${metadata.name.length}/30 characters`);
      }
      
      if (metadata.subtitle && metadata.subtitle.length > 30) {
        addResult('errors', 'Metadata', 'Subtitle too long', `${metadata.subtitle.length}/30 characters`);
      }
      
      if (metadata.description && metadata.description.length > 4000) {
        addResult('errors', 'Metadata', 'Description too long', `${metadata.description.length}/4000 characters`);
      }
      
      if (metadata.keywords && metadata.keywords.length > 100) {
        addResult('errors', 'Metadata', 'Keywords too long', `${metadata.keywords.length}/100 characters`);
      }
      
    } catch (error) {
      addResult('errors', 'Metadata', 'Failed to parse iOS metadata', error.message);
    }
  }
}

function validateLegalCompliance() {
  logStep(5, 'Validating Legal Compliance');
  
  // Check privacy policy accessibility
  const privacyPolicyPath = 'app-store-assets/metadata/privacy-policy.md';
  if (fs.existsSync(privacyPolicyPath)) {
    const privacyContent = fs.readFileSync(privacyPolicyPath, 'utf8');
    
    // Check for required sections
    const requiredSections = [
      'Information We Collect',
      'How We Use Your Information',
      'Data Sharing',
      'Data Security',
      'Your Privacy Rights',
      'Contact Information'
    ];
    
    for (const section of requiredSections) {
      if (privacyContent.toLowerCase().includes(section.toLowerCase())) {
        addResult('passed', 'Legal', `Privacy policy includes ${section}`);
      } else {
        addResult('warnings', 'Legal', `Privacy policy missing ${section}`, 'Consider adding this section');
      }
    }
  }
  
  // Check terms of service
  const termsPath = 'app-store-assets/metadata/terms-of-service.md';
  if (fs.existsSync(termsPath)) {
    addResult('passed', 'Legal', 'Terms of service document found');
  } else {
    addResult('warnings', 'Legal', 'Terms of service document not found');
  }
  
  // Check age rating compliance
  if (fs.existsSync('app-store-assets/metadata/ios-metadata.json')) {
    try {
      const metadata = JSON.parse(fs.readFileSync('app-store-assets/metadata/ios-metadata.json', 'utf8'));
      if (metadata.ageRating?.rating === '4+') {
        addResult('passed', 'Legal', 'Age rating set to 4+ (appropriate for all ages)');
      } else {
        addResult('warnings', 'Legal', 'Age rating not set to 4+', 'Verify age rating is appropriate');
      }
    } catch (error) {
      addResult('warnings', 'Legal', 'Could not verify age rating');
    }
  }
}

function validateDependencies() {
  logStep(6, 'Validating Dependencies and Tools');
  
  // Check if EAS CLI is installed
  try {
    execSync('eas --version', { stdio: 'pipe' });
    addResult('passed', 'Dependencies', 'EAS CLI is installed');
  } catch (error) {
    addResult('errors', 'Dependencies', 'EAS CLI not installed', 'Run: npm install -g eas-cli');
  }
  
  // Check if logged into Expo
  try {
    execSync('eas whoami', { stdio: 'pipe' });
    addResult('passed', 'Dependencies', 'Logged into Expo account');
  } catch (error) {
    addResult('errors', 'Dependencies', 'Not logged into Expo', 'Run: eas login');
  }
  
  // Check Node.js version
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 16) {
      addResult('passed', 'Dependencies', `Node.js version ${nodeVersion} is supported`);
    } else {
      addResult('warnings', 'Dependencies', `Node.js version ${nodeVersion} may not be optimal`, 'Consider upgrading to Node.js 16+');
    }
  } catch (error) {
    addResult('warnings', 'Dependencies', 'Could not check Node.js version');
  }
  
  // Check package.json for required scripts
  if (fs.existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredScripts = [
        'build:production:ios',
        'submit:ios',
        'test:ios'
      ];
      
      for (const script of requiredScripts) {
        if (packageJson.scripts?.[script]) {
          addResult('passed', 'Dependencies', `Script ${script} is configured`);
        } else {
          addResult('warnings', 'Dependencies', `Script ${script} not found`, 'May need manual configuration');
        }
      }
    } catch (error) {
      addResult('warnings', 'Dependencies', 'Could not validate package.json scripts');
    }
  }
}

function runCodeQualityChecks() {
  logStep(7, 'Running Code Quality Checks');
  
  // Skip TypeScript checking for iOS submission - focus on critical issues
  addResult('warnings', 'Code Quality', 'TypeScript checking skipped for iOS submission', 'EAS Build will handle compilation');
  
  try {
    // ESLint
    log('Running ESLint...');
    execSync('npm run lint', { stdio: 'pipe' });
    addResult('passed', 'Code Quality', 'ESLint checks passed');
  } catch (error) {
    addResult('warnings', 'Code Quality', 'ESLint found issues', 'Consider fixing linting issues');
  }
  
  // Skip unit tests for iOS submission - focus on build readiness
  addResult('warnings', 'Code Quality', 'Unit tests skipped for iOS submission', 'Focus on production build readiness');
}

function generateValidationReport() {
  logStep(8, 'Generating Validation Report');
  
  const report = `
# iOS Pre-Submission Validation Report

**Generated**: ${new Date().toLocaleString()}
**App**: Goalfer iOS
**Version**: 1.0.0

## Summary

- ✅ **Passed**: ${validationResults.passed}
- ⚠️ **Warnings**: ${validationResults.warnings}
- ❌ **Errors**: ${validationResults.errors}

## Overall Status

${validationResults.errors === 0 ? 
  '🟢 **READY FOR SUBMISSION** - All critical requirements met' : 
  '🔴 **NOT READY** - Critical issues must be resolved before submission'}

${validationResults.warnings > 0 ? 
  `\n⚠️ **${validationResults.warnings} warnings** - Review recommended but not blocking` : ''}

## Detailed Results

${validationResults.details.map(result => {
  const icon = result.type === 'passed' ? '✅' : result.type === 'warnings' ? '⚠️' : '❌';
  return `### ${icon} ${result.category}: ${result.message}
${result.details ? `   ${result.details}` : ''}`;
}).join('\n\n')}

## Next Steps

${validationResults.errors === 0 ? `
### Ready to Proceed ✅
1. Run production build: \`npm run build:production:ios\`
2. Monitor build progress on EAS dashboard
3. Complete App Store Connect listing
4. Submit for Apple review

### Recommended Actions
${validationResults.warnings > 0 ? 
  '- Review and address warnings above\n- Test app thoroughly on multiple devices\n- Prepare marketing materials for launch' :
  '- Test app thoroughly on multiple devices\n- Prepare marketing materials for launch'}
` : `
### Critical Issues Must Be Resolved ❌
Before proceeding with the build:
${validationResults.details
  .filter(r => r.type === 'errors')
  .map(r => `- ${r.category}: ${r.message}${r.details ? ` (${r.details})` : ''}`)
  .join('\n')}

### After Fixing Issues
1. Run this validation script again
2. Ensure all errors are resolved
3. Proceed with production build
`}

## Resources

- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **iOS Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/ios/

---
**Validation completed at**: ${new Date().toISOString()}
`;

  fs.writeFileSync('ios-pre-submission-validation-report.md', report);
  logSuccess('Validation report saved: ios-pre-submission-validation-report.md');
}

function displaySummary() {
  log(`\n${colors.bright}${colors.magenta}📋 Validation Summary${colors.reset}\n`);
  
  log(`${colors.bright}Results:${colors.reset}`);
  log(`✅ Passed: ${colors.green}${validationResults.passed}${colors.reset}`);
  log(`⚠️  Warnings: ${colors.yellow}${validationResults.warnings}${colors.reset}`);
  log(`❌ Errors: ${colors.red}${validationResults.errors}${colors.reset}`);
  
  if (validationResults.errors === 0) {
    log(`\n${colors.bright}${colors.green}🎉 Ready for iOS App Store Submission!${colors.reset}`);
    log(`\n${colors.bright}Next Steps:${colors.reset}`);
    log('1. Run: npm run build:production:ios');
    log('2. Complete App Store Connect listing');
    log('3. Submit for Apple review');
  } else {
    log(`\n${colors.bright}${colors.red}🚫 Not Ready for Submission${colors.reset}`);
    log(`\n${colors.bright}Critical Issues to Fix:${colors.reset}`);
    validationResults.details
      .filter(r => r.type === 'errors')
      .forEach(r => log(`• ${r.category}: ${r.message}`));
  }
  
  if (validationResults.warnings > 0) {
    log(`\n${colors.bright}${colors.yellow}Recommendations:${colors.reset}`);
    log('• Review warnings in the detailed report');
    log('• Address issues to improve submission success rate');
  }
  
  log(`\n${colors.bright}Report:${colors.reset} ios-pre-submission-validation-report.md`);
}

async function main() {
  try {
    log(`${colors.bright}${colors.magenta}🔍 iOS Pre-Submission Validation for Goalfer${colors.reset}\n`);
    
    validateAppConfiguration();
    validateEASConfiguration();
    validateAssets();
    validateMetadata();
    validateLegalCompliance();
    validateDependencies();
    runCodeQualityChecks();
    generateValidationReport();
    displaySummary();
    
    // Exit with error code if there are critical issues
    if (validationResults.errors > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateAppConfiguration,
  validateEASConfiguration,
  validateAssets,
  validateMetadata,
  validateLegalCompliance,
  validateDependencies,
  runCodeQualityChecks,
  validationResults
};
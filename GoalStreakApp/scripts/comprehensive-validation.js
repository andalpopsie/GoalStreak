#!/usr/bin/env node

/**
 * Comprehensive validation script for GoalStreak
 * Extends basic build validation with additional checks for production readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import basic validation functions
const {
  validateEnvironmentFile,
  validateAppJson,
  validateEasJson,
  validateAssets
} = require('./validate-build');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Validates package.json for required dependencies and scripts
 */
function validatePackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    log('❌ Missing package.json file', 'red');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check required dependencies
    const requiredDeps = [
      'expo',
      'react',
      'react-native',
      '@react-navigation/native',
      'firebase'
    ];
    
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
    
    if (missingDeps.length > 0) {
      log('❌ Missing required dependencies:', 'red');
      missingDeps.forEach(dep => log(`   - ${dep}`, 'red'));
      return false;
    }

    // Check for required scripts
    const requiredScripts = ['start', 'android', 'ios'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
    
    if (missingScripts.length > 0) {
      log('⚠️  Missing recommended scripts:', 'yellow');
      missingScripts.forEach(script => log(`   - ${script}`, 'yellow'));
    }

    log('✅ package.json is valid', 'green');
    return true;
  } catch (error) {
    log(`❌ Invalid JSON in package.json: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Validates TypeScript configuration
 */
function validateTypeScript() {
  const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    log('⚠️  Missing tsconfig.json - TypeScript not configured', 'yellow');
    return true; // Not critical for build
  }

  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Check for strict mode
    if (!tsconfig.compilerOptions?.strict) {
      log('⚠️  TypeScript strict mode not enabled', 'yellow');
    }

    // Check for proper module resolution
    if (tsconfig.compilerOptions?.moduleResolution !== 'node') {
      log('⚠️  TypeScript moduleResolution should be "node"', 'yellow');
    }

    log('✅ TypeScript configuration is valid', 'green');
    return true;
  } catch (error) {
    log(`❌ Invalid JSON in tsconfig.json: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Validates Firebase configuration files
 */
function validateFirebaseConfig() {
  const firebaseConfigPath = path.join(__dirname, '..', 'firebase.json');
  
  if (!fs.existsSync(firebaseConfigPath)) {
    log('⚠️  Missing firebase.json - Firebase features may not work', 'yellow');
    return true; // Not critical for mobile build
  }

  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    // Check for Firestore rules
    if (firebaseConfig.firestore?.rules) {
      const rulesPath = path.join(__dirname, '..', firebaseConfig.firestore.rules);
      if (!fs.existsSync(rulesPath)) {
        log('❌ Firestore rules file not found', 'red');
        return false;
      }
    }

    // Check for Storage rules
    if (firebaseConfig.storage?.rules) {
      const rulesPath = path.join(__dirname, '..', firebaseConfig.storage.rules);
      if (!fs.existsSync(rulesPath)) {
        log('❌ Storage rules file not found', 'red');
        return false;
      }
    }

    log('✅ Firebase configuration is valid', 'green');
    return true;
  } catch (error) {
    log(`❌ Invalid JSON in firebase.json: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Validates source code structure
 */
function validateSourceStructure() {
  const srcPath = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(srcPath)) {
    log('❌ Missing src/ directory', 'red');
    return false;
  }

  const requiredDirs = [
    'components',
    'screens', 
    'services',
    'hooks',
    'types',
    'constants',
    'utils'
  ];

  const missingDirs = requiredDirs.filter(dir => 
    !fs.existsSync(path.join(srcPath, dir))
  );

  if (missingDirs.length > 0) {
    log('❌ Missing required source directories:', 'red');
    missingDirs.forEach(dir => log(`   - src/${dir}`, 'red'));
    return false;
  }

  // Check for index files in components
  const componentsPath = path.join(srcPath, 'components');
  const indexPath = path.join(componentsPath, 'index.ts');
  
  if (!fs.existsSync(indexPath)) {
    log('⚠️  Missing components/index.ts - consider adding for better imports', 'yellow');
  }

  log('✅ Source code structure is valid', 'green');
  return true;
}

/**
 * Validates Git repository status
 */
function validateGitStatus() {
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (status.trim()) {
      log('⚠️  Uncommitted changes detected:', 'yellow');
      const changes = status.trim().split('\n').slice(0, 5); // Show first 5 changes
      changes.forEach(change => log(`   ${change}`, 'yellow'));
      if (status.trim().split('\n').length > 5) {
        log(`   ... and ${status.trim().split('\n').length - 5} more`, 'yellow');
      }
      log('   Consider committing changes before building for production', 'yellow');
    }

    // Check current branch
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (branch !== 'main' && branch !== 'master') {
      log(`⚠️  Building from branch: ${branch} (not main/master)`, 'yellow');
    }

    log('✅ Git repository status checked', 'green');
    return true;
  } catch (error) {
    log('⚠️  Not a git repository or git not available', 'yellow');
    return true; // Not critical
  }
}

/**
 * Validates app store readiness
 */
function validateAppStoreReadiness() {
  let ready = true;

  // Check for privacy policy
  const privacyFiles = [
    'PRIVACY_POLICY.md',
    'privacy-policy.md', 
    'app-store/privacy-policy.md'
  ];
  
  const hasPrivacyPolicy = privacyFiles.some(file => 
    fs.existsSync(path.join(__dirname, '..', file)) ||
    fs.existsSync(path.join(__dirname, '../..', file))
  );
  
  if (!hasPrivacyPolicy) {
    log('❌ Privacy policy not found - required for app store submission', 'red');
    ready = false;
  }

  // Check for terms of service
  const termsFiles = [
    'TERMS_OF_SERVICE.md',
    'terms-of-service.md',
    'app-store/terms-of-service.md'
  ];
  
  const hasTerms = termsFiles.some(file => 
    fs.existsSync(path.join(__dirname, '..', file)) ||
    fs.existsSync(path.join(__dirname, '../..', file))
  );
  
  if (!hasTerms) {
    log('❌ Terms of service not found - required for app store submission', 'red');
    ready = false;
  }

  // Check app.json for store-specific fields
  try {
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appJson.expo;

    if (!expo.description) {
      log('⚠️  Missing app description in app.json', 'yellow');
    }

    if (!expo.privacy) {
      log('⚠️  Missing privacy policy URL in app.json', 'yellow');
    }

    // NSUserTrackingUsageDescription intentionally absent — Goalfer performs no
    // ATT tracking (NSPrivacyTracking=false, no IDFA). Do not warn on its absence.

  } catch (error) {
    // app.json validation already handled elsewhere
  }

  if (ready) {
    log('✅ App store readiness checks passed', 'green');
  }
  
  return ready;
}

/**
 * Main comprehensive validation function
 */
function main() {
  log('🔍 Running comprehensive GoalStreak validation...', 'cyan');
  log('', 'reset');

  const validations = [
    { name: 'Development Environment', fn: () => validateEnvironmentFile('.env.development') },
    { name: 'Production Environment', fn: () => validateEnvironmentFile('.env.production') },
    { name: 'App Configuration', fn: validateAppJson },
    { name: 'EAS Configuration', fn: validateEasJson },
    { name: 'Required Assets', fn: validateAssets },
    { name: 'Package Dependencies', fn: validatePackageJson },
    { name: 'TypeScript Configuration', fn: validateTypeScript },
    { name: 'Firebase Configuration', fn: validateFirebaseConfig },
    { name: 'Source Code Structure', fn: validateSourceStructure },
    { name: 'Git Repository Status', fn: validateGitStatus },
    { name: 'App Store Readiness', fn: validateAppStoreReadiness }
  ];

  log('Running validations...', 'blue');
  log('', 'reset');

  const results = validations.map(validation => {
    const passed = validation.fn();
    return { name: validation.name, passed };
  });

  // Display results
  const allValid = results.every(result => result.passed);
  const passedCount = results.filter(result => result.passed).length;
  const failedValidations = results.filter(result => !result.passed);

  log('', 'reset');
  log('═'.repeat(60), 'cyan');
  log(`📊 COMPREHENSIVE VALIDATION SUMMARY`, 'cyan');
  log('═'.repeat(60), 'cyan');
  log(`Total Checks: ${results.length}`, 'blue');
  log(`Passed: ${passedCount}`, 'green');
  log(`Failed: ${failedValidations.length}`, failedValidations.length > 0 ? 'red' : 'green');
  log('', 'reset');

  if (allValid) {
    log('🎉 All comprehensive validations passed!', 'green');
    log('🚀 Your app is ready for production build and deployment.', 'green');
  } else {
    log('❌ Some validations failed:', 'red');
    failedValidations.forEach(result => log(`   • ${result.name}`, 'red'));
    log('', 'reset');
    log('Please fix the issues above before proceeding with production build.', 'yellow');
  }

  log('═'.repeat(60), 'cyan');
  
  process.exit(allValid ? 0 : 1);
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validatePackageJson,
  validateTypeScript,
  validateFirebaseConfig,
  validateSourceStructure,
  validateGitStatus,
  validateAppStoreReadiness
};
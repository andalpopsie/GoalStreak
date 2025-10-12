#!/usr/bin/env node

/**
 * Pre-build validation script for GoalStreak
 * Validates environment configuration and build requirements
 * 
 * Usage:
 *   node validate-build.js [--env=development|staging|production]
 *   npm run validate:build
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Validation configuration
const VALIDATION_CONFIG = {
  environmentVariables: {
    required: [
      'EXPO_PUBLIC_ENVIRONMENT',
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'EXPO_PUBLIC_FIREBASE_APP_ID'
    ]
  },
  
  appJsonFields: {
    required: [
      'name',
      'slug',
      'version',
      'ios.bundleIdentifier',
      'android.package'
    ]
  },
  
  assets: {
    required: [
      'icon.png',
      'adaptive-icon.png',
      'splash-icon.png',
      'favicon.png'
    ]
  }
};

// Error solutions for better user guidance
const ERROR_SOLUTIONS = {
  'Missing environment file': (file) => [
    `Create ${file} with required Firebase configuration`,
    `Copy template from ${file}.example if available`,
    `Get Firebase config from Firebase Console > Project Settings`
  ],
  'Missing app.json': () => [
    'Restore app.json from version control',
    'Run `expo init` to regenerate configuration',
    'Check if file was moved or renamed'
  ],
  'Missing eas.json': () => [
    'Run `eas build:configure` to create configuration',
    'Copy eas.json from project template',
    'Visit docs.expo.dev for EAS Build setup'
  ],
  'Missing assets': (assets) => [
    `Create missing assets: ${assets.join(', ')}`,
    'Use `expo install expo-splash-screen` for splash screen',
    'Generate app icons using online tools or design software'
  ]
};

/**
 * Logs a message with color formatting
 * @param {string} message - Message to log
 * @param {string} color - Color name from colors object
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Logs error with suggested solutions
 * @param {string} errorType - Type of error for solution lookup
 * @param {any} context - Additional context for solutions
 */
function logErrorWithSolutions(errorType, context = null) {
  const solutions = ERROR_SOLUTIONS[errorType];
  if (solutions) {
    log('💡 Suggested solutions:', 'blue');
    const solutionList = typeof solutions === 'function' ? solutions(context) : solutions;
    solutionList.forEach(solution => log(`   • ${solution}`, 'blue'));
    log('', 'reset');
  }
}

/**
 * Parses environment file content into key-value pairs
 * @param {string} envContent - Raw environment file content
 * @returns {Object<string, string>} Parsed environment variables
 */
function parseEnvFile(envContent) {
  const envVars = {};
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  
  return envVars;
}

/**
 * Validates environment variables for security issues
 * @param {string} envFile - Environment file name
 * @param {Object<string, string>} envVars - Parsed environment variables
 * @returns {boolean} True if secure, false if issues found
 */
function validateEnvironmentSecurity(envFile, envVars) {
  const securityIssues = [];
  
  // Check for placeholder values
  const placeholderPatterns = [
    /your[-_]?api[-_]?key/i,
    /replace[-_]?me/i,
    /example/i,
    /test[-_]?key/i,
    /demo/i
  ];
  
  // Validate Firebase API key format
  const apiKey = envVars['EXPO_PUBLIC_FIREBASE_API_KEY'];
  if (apiKey) {
    if (placeholderPatterns.some(pattern => pattern.test(apiKey))) {
      securityIssues.push('Firebase API key appears to contain placeholder text');
    } else if (!apiKey.startsWith('AIza')) {
      securityIssues.push('Firebase API key doesn\'t match expected format (should start with "AIza")');
    }
  }
  
  // Check project ID format
  const projectId = envVars['EXPO_PUBLIC_FIREBASE_PROJECT_ID'];
  if (projectId && placeholderPatterns.some(pattern => pattern.test(projectId))) {
    securityIssues.push('Firebase project ID appears to contain placeholder text');
  }
  
  if (securityIssues.length > 0) {
    log(`⚠️  Security concerns in ${envFile}:`, 'yellow');
    securityIssues.forEach(issue => log(`   - ${issue}`, 'yellow'));
    return false;
  }
  
  return true;
}

/**
 * Validates an environment file for required variables and security
 * @param {string} envFile - Environment file name (e.g., '.env.production')
 * @returns {boolean} True if valid, false otherwise
 */
function validateEnvironmentFile(envFile) {
  const envPath = path.join(__dirname, '..', envFile);
  
  if (!fs.existsSync(envPath)) {
    log(`❌ Missing environment file: ${envFile}`, 'red');
    logErrorWithSolutions('Missing environment file', envFile);
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = parseEnvFile(envContent);
  const requiredVars = VALIDATION_CONFIG.environmentVariables.required;

  const missingVars = requiredVars.filter(varName => 
    !envVars[varName] || envVars[varName] === ''
  );

  if (missingVars.length > 0) {
    log(`❌ Missing or empty variables in ${envFile}:`, 'red');
    missingVars.forEach(varName => log(`   - ${varName}`, 'red'));
    logErrorWithSolutions('Missing environment file', envFile);
    return false;
  }

  // Validate security for production environment
  if (envFile.includes('production')) {
    const securityValid = validateEnvironmentSecurity(envFile, envVars);
    if (!securityValid) {
      return false;
    }
  }

  log(`✅ Environment file ${envFile} is valid`, 'green');
  return true;
}

/**
 * Validates app.json configuration file
 * @returns {boolean} True if valid, false otherwise
 */
function validateAppJson() {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  
  if (!fs.existsSync(appJsonPath)) {
    log('❌ Missing app.json file', 'red');
    logErrorWithSolutions('Missing app.json');
    return false;
  }

  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appJson.expo;

    if (!expo) {
      log('❌ app.json missing "expo" configuration object', 'red');
      return false;
    }

    const requiredFields = VALIDATION_CONFIG.appJsonFields.required;
    const missingFields = requiredFields.filter(field => {
      const keys = field.split('.');
      let obj = expo;
      for (const key of keys) {
        if (!obj || !obj[key]) return true;
        obj = obj[key];
      }
      return false;
    });

    if (missingFields.length > 0) {
      log('❌ Missing required fields in app.json:', 'red');
      missingFields.forEach(field => log(`   - expo.${field}`, 'red'));
      logErrorWithSolutions('Missing app.json');
      return false;
    }

    // Validate bundle identifiers format
    const bundleId = expo.ios?.bundleIdentifier;
    const packageName = expo.android?.package;
    
    if (bundleId && !/^[a-zA-Z0-9.-]+$/.test(bundleId)) {
      log('⚠️  iOS bundle identifier contains invalid characters', 'yellow');
    }
    
    if (packageName && !/^[a-zA-Z0-9._]+$/.test(packageName)) {
      log('⚠️  Android package name contains invalid characters', 'yellow');
    }

    log('✅ app.json is valid', 'green');
    return true;
  } catch (error) {
    log(`❌ Invalid JSON in app.json: ${error.message}`, 'red');
    logErrorWithSolutions('Missing app.json');
    return false;
  }
}

/**
 * Validates EAS Build configuration file
 * @returns {boolean} True if valid, false otherwise
 */
function validateEasJson() {
  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  
  if (!fs.existsSync(easJsonPath)) {
    log('❌ Missing eas.json file', 'red');
    logErrorWithSolutions('Missing eas.json');
    return false;
  }

  try {
    const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

    if (!easJson.build) {
      log('❌ eas.json missing "build" configuration', 'red');
      return false;
    }

    // Check required build profiles
    const requiredProfiles = ['development', 'preview', 'production'];
    const missingProfiles = requiredProfiles.filter(profile => !easJson.build[profile]);

    if (missingProfiles.length > 0) {
      log('❌ Missing build profiles in eas.json:', 'red');
      missingProfiles.forEach(profile => log(`   - ${profile}`, 'red'));
      logErrorWithSolutions('Missing eas.json');
      return false;
    }

    // Validate CLI version if specified
    if (easJson.cli && easJson.cli.version) {
      const version = easJson.cli.version;
      if (!/^>=?\s*\d+\.\d+\.\d+/.test(version)) {
        log('⚠️  EAS CLI version format may be invalid', 'yellow');
      }
    }

    log('✅ eas.json is valid', 'green');
    return true;
  } catch (error) {
    log(`❌ Invalid JSON in eas.json: ${error.message}`, 'red');
    logErrorWithSolutions('Missing eas.json');
    return false;
  }
}

/**
 * Validates required app assets
 * @returns {boolean} True if all assets present, false otherwise
 */
function validateAssets() {
  const assetsPath = path.join(__dirname, '..', 'assets');
  
  if (!fs.existsSync(assetsPath)) {
    log('❌ Assets directory not found', 'red');
    logErrorWithSolutions('Missing assets', ['Create assets/ directory']);
    return false;
  }

  const requiredAssets = VALIDATION_CONFIG.assets.required;
  const missingAssets = requiredAssets.filter(asset => 
    !fs.existsSync(path.join(assetsPath, asset))
  );

  if (missingAssets.length > 0) {
    log('❌ Missing required assets:', 'red');
    missingAssets.forEach(asset => log(`   - assets/${asset}`, 'red'));
    logErrorWithSolutions('Missing assets', missingAssets);
    return false;
  }

  // Validate asset dimensions (basic check)
  const iconPath = path.join(assetsPath, 'icon.png');
  try {
    const iconStats = fs.statSync(iconPath);
    if (iconStats.size < 1000) { // Less than 1KB is suspicious
      log('⚠️  App icon file size seems too small', 'yellow');
    }
  } catch (error) {
    // File exists but can't read stats - not critical
  }

  log('✅ All required assets are present', 'green');
  return true;
}

/**
 * Runs all validation checks
 * @returns {Array<{name: string, passed: boolean}>} Validation results
 */
function runValidations() {
  const validations = [
    { name: 'Development Environment', fn: () => validateEnvironmentFile('.env.development') },
    { name: 'Production Environment', fn: () => validateEnvironmentFile('.env.production') },
    { name: 'App Configuration', fn: validateAppJson },
    { name: 'EAS Configuration', fn: validateEasJson },
    { name: 'Required Assets', fn: validateAssets }
  ];

  return validations.map(validation => ({
    name: validation.name,
    passed: validation.fn()
  }));
}

/**
 * Displays validation results with summary
 * @param {Array<{name: string, passed: boolean}>} results - Validation results
 * @returns {boolean} True if all validations passed
 */
function displayResults(results) {
  const allValid = results.every(result => result.passed);
  const failedValidations = results.filter(result => !result.passed);
  const passedCount = results.length - failedValidations.length;

  log('', 'reset');
  log(`📊 Validation Summary: ${passedCount}/${results.length} passed`, 'blue');
  
  if (allValid) {
    log('🎉 All validations passed! Ready for build.', 'green');
  } else {
    log(`❌ ${failedValidations.length} validation(s) failed:`, 'red');
    failedValidations.forEach(result => log(`   • ${result.name}`, 'red'));
    log('', 'reset');
    log('Fix the issues above and run the validation again.', 'yellow');
  }

  return allValid;
}

/**
 * Main validation function
 */
function main() {
  log('🔍 Validating GoalStreak build configuration...', 'blue');
  log('', 'reset');

  const results = runValidations();
  const success = displayResults(results);
  
  process.exit(success ? 0 : 1);
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentFile,
  validateAppJson,
  validateEasJson,
  validateAssets
};
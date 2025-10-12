#!/usr/bin/env node

/**
 * EAS Credentials Setup Script
 * 
 * This script helps configure EAS credentials and Apple Developer information
 * required for iOS App Store submission.
 */

const fs = require('fs');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, resolve);
  });
}

async function gatherCredentials() {
  logStep(1, 'Gathering Apple Developer Credentials');
  
  log(`\n${colors.bright}Apple Developer Account Information${colors.reset}`);
  log('You can find this information in your Apple Developer account:');
  log('• Apple ID: The email address for your Apple Developer account');
  log('• Team ID: Found in Apple Developer Portal > Membership');
  log('• App Store Connect App ID: Found in App Store Connect > App Information');
  
  const credentials = {};
  
  // Apple ID
  log(`\n${colors.yellow}Apple ID (Email Address)${colors.reset}`);
  log('This is the email address associated with your Apple Developer account.');
  credentials.appleId = await askQuestion('Enter your Apple ID email: ');
  
  // Team ID
  log(`\n${colors.yellow}Apple Developer Team ID${colors.reset}`);
  log('Found in Apple Developer Portal > Account > Membership');
  log('Example format: ABCD123456 (10 characters)');
  credentials.appleTeamId = await askQuestion('Enter your Apple Developer Team ID: ');
  
  // App Store Connect App ID
  log(`\n${colors.yellow}App Store Connect App ID${colors.reset}`);
  log('This will be generated when you create the app in App Store Connect.');
  log('If you haven\'t created the app yet, you can leave this blank and update it later.');
  log('Example format: 1234567890 (10 digits)');
  const ascAppId = await askQuestion('Enter App Store Connect App ID (or press Enter to skip): ');
  credentials.ascAppId = ascAppId || '[APP_STORE_CONNECT_APP_ID]';
  
  return credentials;
}

async function updateEASConfig(credentials) {
  logStep(2, 'Updating EAS Configuration');
  
  try {
    // Read current EAS config
    const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
    
    // Update iOS submission credentials
    easConfig.submit.production.ios.appleId = credentials.appleId;
    easConfig.submit.production.ios.appleTeamId = credentials.appleTeamId;
    easConfig.submit.production.ios.ascAppId = credentials.ascAppId;
    
    // Write updated config
    fs.writeFileSync('eas.json', JSON.stringify(easConfig, null, 2));
    
    logSuccess('EAS configuration updated successfully');
    
    // Show what was updated
    log(`\n${colors.bright}Updated Configuration:${colors.reset}`);
    log(`Apple ID: ${credentials.appleId}`);
    log(`Team ID: ${credentials.appleTeamId}`);
    log(`App Store Connect App ID: ${credentials.ascAppId}`);
    
  } catch (error) {
    logError(`Failed to update EAS configuration: ${error.message}`);
    throw error;
  }
}

async function generateAppStoreConnectInstructions(credentials) {
  logStep(3, 'Generating App Store Connect Setup Instructions');
  
  const instructions = `
# App Store Connect Setup Instructions

## 1. Create App in App Store Connect

### Access App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple ID: **${credentials.appleId}**
3. Click "My Apps"

### Create New App
1. Click the "+" button and select "New App"
2. Fill in the following information:
   - **Platform**: iOS
   - **Name**: GoalStreak
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.goalstreak.app
   - **SKU**: goalstreak-ios-app

3. Click "Create"

## 2. Get App Store Connect App ID

After creating the app:
1. Navigate to your app in App Store Connect
2. Go to "App Information" section
3. Look for "Apple ID" (this is your App Store Connect App ID)
4. Copy this 10-digit number

### Update EAS Configuration
If you didn't enter the App Store Connect App ID earlier, update it now:
1. Edit \`eas.json\`
2. Replace \`[APP_STORE_CONNECT_APP_ID]\` with your actual App ID
3. Save the file

## 3. Configure App Information

### Basic Information
- **Name**: GoalStreak
- **Bundle ID**: com.goalstreak.app (should be pre-filled)
- **Primary Language**: English (U.S.)
- **Category**: Health & Fitness
- **Secondary Category**: Productivity

### Content Rights
- **Contains Third-Party Content**: No
- **Uses Third-Party Content**: No

## 4. Set Up Agreements, Tax, and Banking

Before you can submit your app:
1. Go to "Agreements, Tax, and Banking"
2. Complete the "Paid Applications" agreement
3. Set up tax information
4. Add banking information for app sales

## 5. Certificates and Provisioning

EAS Build will handle most of this automatically, but ensure:
1. Your Apple Developer account is active
2. You have the necessary permissions in your team
3. Your Apple ID (${credentials.appleId}) has access to the team (${credentials.appleTeamId})

## 6. Next Steps

Once App Store Connect is set up:
1. Run the production build: \`npm run build:production:ios\`
2. Complete the app listing with metadata and screenshots
3. Submit for review

## Troubleshooting

### Common Issues
- **Team ID not found**: Verify your Team ID in Apple Developer Portal
- **Bundle ID conflicts**: Ensure com.goalstreak.app is available
- **Permission errors**: Make sure your Apple ID has App Manager or Admin role

### Resources
- **Apple Developer Portal**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/

---
Generated on: ${new Date().toLocaleString()}
Apple ID: ${credentials.appleId}
Team ID: ${credentials.appleTeamId}
`;

  fs.writeFileSync('app-store-connect-setup-instructions.md', instructions);
  logSuccess('Setup instructions created: app-store-connect-setup-instructions.md');
}

async function validateCredentials(credentials) {
  logStep(4, 'Validating Credentials');
  
  // Validate Apple ID format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(credentials.appleId)) {
    logWarning('Apple ID doesn\'t appear to be a valid email address');
  } else {
    logSuccess('Apple ID format is valid');
  }
  
  // Validate Team ID format
  const teamIdRegex = /^[A-Z0-9]{10}$/;
  if (!teamIdRegex.test(credentials.appleTeamId)) {
    logWarning('Team ID should be 10 characters (letters and numbers)');
  } else {
    logSuccess('Team ID format is valid');
  }
  
  // Validate App Store Connect App ID format (if provided)
  if (credentials.ascAppId !== '[APP_STORE_CONNECT_APP_ID]') {
    const appIdRegex = /^\d{10}$/;
    if (!appIdRegex.test(credentials.ascAppId)) {
      logWarning('App Store Connect App ID should be 10 digits');
    } else {
      logSuccess('App Store Connect App ID format is valid');
    }
  } else {
    logWarning('App Store Connect App ID not provided - update it after creating the app');
  }
}

async function main() {
  try {
    log(`${colors.bright}${colors.magenta}🔐 EAS Credentials Setup for GoalStreak iOS${colors.reset}\n`);
    
    log('This script will help you configure the necessary credentials for iOS App Store submission.');
    log('Make sure you have access to your Apple Developer account before proceeding.\n');
    
    const proceed = await askQuestion('Do you want to continue? (y/n): ');
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      log('Setup cancelled.');
      rl.close();
      return;
    }
    
    const credentials = await gatherCredentials();
    await validateCredentials(credentials);
    await updateEASConfig(credentials);
    await generateAppStoreConnectInstructions(credentials);
    
    log(`\n${colors.bright}${colors.green}✅ EAS Credentials Setup Complete!${colors.reset}\n`);
    
    log(`${colors.bright}Next Steps:${colors.reset}`);
    log('1. Review the setup instructions: app-store-connect-setup-instructions.md');
    log('2. Create your app in App Store Connect (if not done already)');
    log('3. Update the App Store Connect App ID in eas.json (if needed)');
    log('4. Run the production build: npm run build:production:ios');
    
    log(`\n${colors.bright}Files Updated:${colors.reset}`);
    log('• eas.json - Updated with your Apple Developer credentials');
    log('• app-store-connect-setup-instructions.md - Detailed setup guide');
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  gatherCredentials,
  updateEASConfig,
  generateAppStoreConnectInstructions,
  validateCredentials
};
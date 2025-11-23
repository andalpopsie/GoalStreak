#!/usr/bin/env node

/**
 * Increment Build Number Script
 * 
 * This script automatically increments the iOS build number in both:
 * 1. app.json (expo.ios.buildNumber)
 * 2. ios/GoalStreak.xcodeproj/project.pbxproj (CURRENT_PROJECT_VERSION)
 * 
 * Usage: npm run increment-build
 */

const fs = require('fs');
const path = require('path');

const APP_JSON_PATH = path.join(__dirname, '../app.json');
const XCODE_PROJECT_PATH = path.join(__dirname, '../ios/GoalStreak.xcodeproj/project.pbxproj');
const INFO_PLIST_PATH = path.join(__dirname, '../ios/GoalStreak/Info.plist');

function incrementBuildNumber() {
  console.log('🔢 Incrementing iOS build number...\n');

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  const currentBuildNumber = parseInt(appJson.expo.ios.buildNumber);
  const newBuildNumber = currentBuildNumber + 1;

  console.log(`📱 Current build number: ${currentBuildNumber}`);
  console.log(`📱 New build number: ${newBuildNumber}\n`);

  // Update app.json
  appJson.expo.ios.buildNumber = newBuildNumber.toString();
  fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n');
  console.log('✅ Updated app.json');

  // Update Xcode project
  let xcodeProject = fs.readFileSync(XCODE_PROJECT_PATH, 'utf8');
  const regex = /CURRENT_PROJECT_VERSION = \d+;/g;
  const matches = xcodeProject.match(regex);
  
  if (matches) {
    xcodeProject = xcodeProject.replace(
      regex,
      `CURRENT_PROJECT_VERSION = ${newBuildNumber};`
    );
    fs.writeFileSync(XCODE_PROJECT_PATH, xcodeProject);
    console.log('✅ Updated ios/GoalStreak.xcodeproj/project.pbxproj');
    console.log(`   (Updated ${matches.length} occurrences)`);
  } else {
    console.log('⚠️  Warning: Could not find CURRENT_PROJECT_VERSION in Xcode project');
  }

  // Update Info.plist
  let infoPlist = fs.readFileSync(INFO_PLIST_PATH, 'utf8');
  const plistRegex = /(<key>CFBundleVersion<\/key>\s*<string>)\d+(<\/string>)/;
  
  if (plistRegex.test(infoPlist)) {
    infoPlist = infoPlist.replace(
      plistRegex,
      `$1${newBuildNumber}$2`
    );
    fs.writeFileSync(INFO_PLIST_PATH, infoPlist);
    console.log('✅ Updated ios/GoalStreak/Info.plist\n');
  } else {
    console.log('⚠️  Warning: Could not find CFBundleVersion in Info.plist\n');
  }

  console.log('🎉 Build number incremented successfully!');
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Commit changes: git add . && git commit -m "Increment build to ${newBuildNumber}"`);
  console.log(`   2. Run: npm run build:production:ios`);
  console.log(`   3. Wait for build to complete (30-60 min)`);
  console.log(`   4. Run: npm run submit:ios\n`);
}

try {
  incrementBuildNumber();
} catch (error) {
  console.error('❌ Error incrementing build number:', error.message);
  process.exit(1);
}

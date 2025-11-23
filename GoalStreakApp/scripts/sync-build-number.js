#!/usr/bin/env node

/**
 * Sync Build Number Script
 * 
 * This script ensures build numbers are synchronized between:
 * 1. app.json (expo.ios.buildNumber)
 * 2. ios/GoalStreak.xcodeproj/project.pbxproj (CURRENT_PROJECT_VERSION)
 * 
 * Usage: npm run sync-build-number
 */

const fs = require('fs');
const path = require('path');

const APP_JSON_PATH = path.join(__dirname, '../app.json');
const XCODE_PROJECT_PATH = path.join(__dirname, '../ios/GoalStreak.xcodeproj/project.pbxproj');
const INFO_PLIST_PATH = path.join(__dirname, '../ios/GoalStreak/Info.plist');

function syncBuildNumber() {
  console.log('🔄 Syncing iOS build numbers...\n');

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  const appJsonBuildNumber = parseInt(appJson.expo.ios.buildNumber);

  // Read Xcode project
  const xcodeProject = fs.readFileSync(XCODE_PROJECT_PATH, 'utf8');
  const xcodeMatch = xcodeProject.match(/CURRENT_PROJECT_VERSION = (\d+);/);
  const xcodeBuildNumber = xcodeMatch ? parseInt(xcodeMatch[1]) : null;

  // Read Info.plist
  const infoPlist = fs.readFileSync(INFO_PLIST_PATH, 'utf8');
  const plistMatch = infoPlist.match(/<key>CFBundleVersion<\/key>\s*<string>(\d+)<\/string>/);
  const plistBuildNumber = plistMatch ? parseInt(plistMatch[1]) : null;

  console.log(`📱 app.json build number: ${appJsonBuildNumber}`);
  console.log(`📱 Xcode project build number: ${xcodeBuildNumber}`);
  console.log(`📱 Info.plist build number: ${plistBuildNumber}\n`);

  if (appJsonBuildNumber === xcodeBuildNumber && appJsonBuildNumber === plistBuildNumber) {
    console.log('✅ All build numbers are in sync!');
    console.log(`   Current build number: ${appJsonBuildNumber}\n`);
    return;
  }

  // Use the higher number as the source of truth
  const correctBuildNumber = Math.max(
    appJsonBuildNumber,
    xcodeBuildNumber || 0,
    plistBuildNumber || 0
  );
  console.log(`⚠️  Build numbers are out of sync!`);
  console.log(`🔧 Syncing all to: ${correctBuildNumber}\n`);

  // Update app.json if needed
  if (appJsonBuildNumber !== correctBuildNumber) {
    appJson.expo.ios.buildNumber = correctBuildNumber.toString();
    fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n');
    console.log('✅ Updated app.json');
  }

  // Update Xcode project if needed
  if (xcodeBuildNumber !== correctBuildNumber) {
    const updatedXcodeProject = xcodeProject.replace(
      /CURRENT_PROJECT_VERSION = \d+;/g,
      `CURRENT_PROJECT_VERSION = ${correctBuildNumber};`
    );
    fs.writeFileSync(XCODE_PROJECT_PATH, updatedXcodeProject);
    console.log('✅ Updated ios/GoalStreak.xcodeproj/project.pbxproj');
  }

  // Update Info.plist if needed
  if (plistBuildNumber !== correctBuildNumber) {
    const updatedInfoPlist = infoPlist.replace(
      /(<key>CFBundleVersion<\/key>\s*<string>)\d+(<\/string>)/,
      `$1${correctBuildNumber}$2`
    );
    fs.writeFileSync(INFO_PLIST_PATH, updatedInfoPlist);
    console.log('✅ Updated ios/GoalStreak/Info.plist');
  }

  console.log('\n🎉 Build numbers synchronized successfully!\n');
}

try {
  syncBuildNumber();
} catch (error) {
  console.error('❌ Error syncing build numbers:', error.message);
  process.exit(1);
}

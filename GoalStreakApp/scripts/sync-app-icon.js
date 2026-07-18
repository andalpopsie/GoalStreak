#!/usr/bin/env node

/**
 * Sync App Icon Script
 * 
 * Copies the generated app icon to the iOS native project.
 * Run this after generating new icons.
 * 
 * Usage: npm run sync-app-icon
 */

const fs = require('fs');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, '../assets/icon.png');
const TARGET_ICON = path.join(__dirname, '../ios/GoalStreak/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png');

function syncAppIcon() {
  console.log('🎨 Syncing App Icon to iOS Project...\n');

  // Check if source exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Source icon not found!');
    console.error(`   Expected: ${SOURCE_ICON}`);
    console.error('\n💡 The canonical app icon lives at GoalStreakApp/assets/icon.png (1024×1024).');
    console.error('   See .kiro/steering/asset-paths.md for the full asset map.\n');
    process.exit(1);
  }

  // Check if target directory exists
  const targetDir = path.dirname(TARGET_ICON);
  if (!fs.existsSync(targetDir)) {
    console.error('❌ iOS AppIcon.appiconset directory not found!');
    console.error(`   Expected: ${targetDir}\n`);
    process.exit(1);
  }

  // Copy the icon
  fs.copyFileSync(SOURCE_ICON, TARGET_ICON);
  
  // Get file sizes
  const sourceSize = fs.statSync(SOURCE_ICON).size;
  const targetSize = fs.statSync(TARGET_ICON).size;
  
  console.log('✅ App icon synced successfully!\n');
  console.log(`   Source: ${(sourceSize / 1024).toFixed(1)} KB`);
  console.log(`   Target: ${(targetSize / 1024).toFixed(1)} KB`);
  console.log(`   Location: ios/GoalStreak/Images.xcassets/AppIcon.appiconset/\n`);
  
  console.log('📋 Next steps:');
  console.log('   1. Commit: git add ios/GoalStreak/Images.xcassets/');
  console.log('   2. Build: npm run build:production:ios\n');
}

try {
  syncAppIcon();
} catch (error) {
  console.error('❌ Error syncing app icon:', error.message);
  process.exit(1);
}

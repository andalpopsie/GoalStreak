#!/usr/bin/env node

/**
 * Storage Cleanup Script
 * 
 * Safely removes cached files and build artifacts to free up disk space.
 * Does NOT affect your source code or EAS cloud builds.
 * 
 * Usage: npm run cleanup:storage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getDirectorySize(dirPath) {
  try {
    const output = execSync(`du -sh "${dirPath}" 2>/dev/null`, { encoding: 'utf8' });
    return output.split('\t')[0];
  } catch {
    return 'N/A';
  }
}

function cleanupStorage() {
  console.log('🧹 GoalStreak Storage Cleanup\n');
  console.log('📊 Current Storage Usage:\n');

  const dirs = [
    { path: 'node_modules', desc: 'Dependencies', safe: true },
    { path: 'ios/Pods', desc: 'iOS Dependencies', safe: true },
    { path: 'ios/build', desc: 'iOS Build Cache', safe: true },
    { path: '.expo', desc: 'Expo Cache', safe: true },
    { path: 'temp', desc: 'Temporary Files', safe: false }
  ];

  dirs.forEach(({ path: dirPath, desc, safe }) => {
    const fullPath = path.join(process.cwd(), dirPath);
    const size = getDirectorySize(fullPath);
    const exists = fs.existsSync(fullPath);
    const status = exists ? `${size}` : 'Not found';
    const safetyLabel = safe ? '✅ Safe to delete' : '⚠️  Keep';
    console.log(`  ${desc.padEnd(20)} ${status.padEnd(10)} ${safetyLabel}`);
  });

  console.log('\n📝 What can be safely deleted:\n');
  console.log('  ✅ node_modules - Reinstall with: npm install');
  console.log('  ✅ ios/Pods - Reinstall with: cd ios && pod install');
  console.log('  ✅ ios/build - Xcode build cache (auto-regenerated)');
  console.log('  ✅ .expo - Expo cache (auto-regenerated)');
  console.log('  ⚠️  temp - Contains archived files (review first)\n');

  console.log('🔍 EAS Build Storage:\n');
  console.log('  • EAS builds are stored on Expo cloud servers');
  console.log('  • They do NOT consume local disk space');
  console.log('  • Each build is ~100-200MB on Expo servers');
  console.log('  • Free tier: Unlimited storage for 30 days\n');

  console.log('💡 To free up space, run:\n');
  console.log('  # Remove dependencies (can reinstall anytime)');
  console.log('  rm -rf node_modules ios/Pods\n');
  console.log('  # Reinstall when needed');
  console.log('  npm install && cd ios && pod install\n');

  console.log('⚠️  WARNING: Do NOT delete:\n');
  console.log('  ❌ src/ - Your source code');
  console.log('  ❌ assets/ - App icons and images');
  console.log('  ❌ ios/ (except Pods and build) - Native iOS config');
  console.log('  ❌ app.json, package.json - Configuration files\n');
}

try {
  cleanupStorage();
} catch (error) {
  console.error('❌ Error analyzing storage:', error.message);
  process.exit(1);
}

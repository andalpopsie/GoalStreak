#!/usr/bin/env node

/**
 * Screenshot Processing Script
 * Processes raw screenshots to app store requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// App Store screenshot dimensions
const DIMENSIONS = {
  ios: {
    'iphone-6.7': { width: 1290, height: 2796 },
    'iphone-6.5': { width: 1284, height: 2778 },
    'iphone-6.1': { width: 1179, height: 2556 },
    'iphone-5.5': { width: 1242, height: 2208 },
    'ipad-12.9': { width: 2048, height: 2732 },
  },
  android: {
    'phone': { width: 1080, height: 1920 },
    'tablet-7': { width: 1200, height: 1920 },
    'tablet-10': { width: 1600, height: 2560 },
  }
};

function processScreenshots() {
  console.log('🔄 Processing screenshots for app store submission...');
  
  // Check if ImageMagick is available
  try {
    execSync('which magick', { stdio: 'ignore' });
  } catch (error) {
    console.log('⚠️  ImageMagick not found. Install with: brew install imagemagick');
    console.log('   Or use design tools to resize screenshots manually.');
    return;
  }
  
  const rawDir = path.join(__dirname, 'raw-captures');
  const processedDir = path.join(__dirname, 'processed');
  
  if (!fs.existsSync(rawDir)) {
    console.log('❌ Raw captures directory not found. Please capture screenshots first.');
    return;
  }
  
  // Process iOS screenshots
  Object.entries(DIMENSIONS.ios).forEach(([device, dims]) => {
    const deviceDir = path.join(processedDir, 'ios', device);
    if (!fs.existsSync(deviceDir)) {
      fs.mkdirSync(deviceDir, { recursive: true });
    }
    
    console.log(`📱 Processing iOS ${device} (${dims.width}x${dims.height})`);
  });
  
  // Process Android screenshots  
  Object.entries(DIMENSIONS.android).forEach(([device, dims]) => {
    const deviceDir = path.join(processedDir, 'android', device);
    if (!fs.existsSync(deviceDir)) {
      fs.mkdirSync(deviceDir, { recursive: true });
    }
    
    console.log(`🤖 Processing Android ${device} (${dims.width}x${dims.height})`);
  });
  
  console.log('✅ Screenshot processing setup complete!');
  console.log('📋 Next: Place raw screenshots in raw-captures/ and run processing commands');
}

if (require.main === module) {
  processScreenshots();
}

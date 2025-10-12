#!/usr/bin/env node

/**
 * GoalStreak Real Screenshots Organizer
 * 
 * Helps organize and validate your real app screenshots for app store submission
 */

const fs = require('fs');
const path = require('path');

class RealScreenshotsOrganizer {
  constructor() {
    this.realScreenshotsDir = path.join(__dirname, '..', 'app-store-assets', 'real-screenshots');
    this.requiredScreenshots = [
      '01-onboarding',
      '02-dashboard', 
      '03-social',
      '04-analytics',
      '05-habit-creation'
    ];
    this.platforms = ['ios', 'android'];
  }

  checkScreenshotDimensions(imagePath) {
    // This would require an image processing library like sharp
    // For now, we'll just check if file exists and provide guidance
    const stats = fs.statSync(imagePath);
    return {
      exists: true,
      size: stats.size,
      sizeFormatted: this.formatFileSize(stats.size)
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  analyzeRealScreenshots() {
    console.log('📱 Real Screenshots Analysis');
    console.log('═'.repeat(50));
    
    let totalFound = 0;
    let totalRequired = this.requiredScreenshots.length * this.platforms.length;
    
    for (const platform of this.platforms) {
      const platformDir = path.join(this.realScreenshotsDir, platform);
      
      console.log(`\n${platform.toUpperCase()} Screenshots:`);
      
      if (!fs.existsSync(platformDir)) {
        console.log(`  ❌ Directory not found: ${platformDir}`);
        continue;
      }
      
      const files = fs.readdirSync(platformDir);
      console.log(`  📁 Found ${files.length} files in directory`);
      
      for (const screenshot of this.requiredScreenshots) {
        const pngFile = `${screenshot}.png`;
        const jpgFile = `${screenshot}.jpg`;
        const jpegFile = `${screenshot}.jpeg`;
        
        const pngPath = path.join(platformDir, pngFile);
        const jpgPath = path.join(platformDir, jpgFile);
        const jpegPath = path.join(platformDir, jpegFile);
        
        let found = false;
        let filePath = '';
        let fileInfo = null;
        
        if (fs.existsSync(pngPath)) {
          found = true;
          filePath = pngPath;
          fileInfo = this.checkScreenshotDimensions(pngPath);
        } else if (fs.existsSync(jpgPath)) {
          found = true;
          filePath = jpgPath;
          fileInfo = this.checkScreenshotDimensions(jpgPath);
        } else if (fs.existsSync(jpegPath)) {
          found = true;
          filePath = jpegPath;
          fileInfo = this.checkScreenshotDimensions(jpegPath);
        }
        
        if (found) {
          console.log(`    ✅ ${screenshot}: ${path.basename(filePath)} (${fileInfo.sizeFormatted})`);
          totalFound++;
        } else {
          console.log(`    ❌ ${screenshot}: Missing (expected ${pngFile})`);
        }
      }
    }
    
    return { totalFound, totalRequired };
  }

  generateScreenshotTemplate() {
    console.log('\n📋 Screenshot Template Guide');
    console.log('═'.repeat(50));
    
    console.log('\nRequired screenshots for each platform:');
    
    this.requiredScreenshots.forEach((screenshot, index) => {
      const descriptions = {
        '01-onboarding': 'Welcome screen or app introduction',
        '02-dashboard': 'Main habit tracking interface with progress',
        '03-social': 'Social feed showing friend activities',
        '04-analytics': 'Progress charts and analytics dashboard',
        '05-habit-creation': 'Habit creation flow with categories'
      };
      
      console.log(`  ${index + 1}. ${screenshot}.png`);
      console.log(`     📝 ${descriptions[screenshot]}`);
    });
    
    console.log('\n📱 Recommended dimensions:');
    console.log('  iOS: 1290×2796 (iPhone 6.7") or 1284×2778 (iPhone 6.5")');
    console.log('  Android: 1080×1920 (Phone) or higher resolution');
    
    console.log('\n💡 Pro tips:');
    console.log('  • Use PNG format for best quality');
    console.log('  • Keep file sizes under 8MB each');
    console.log('  • Show realistic data, not test content');
    console.log('  • Ensure good lighting and clean interface');
    console.log('  • Remove any debug information');
  }

  generateMissingScreenshotsList() {
    console.log('\n📝 Missing Screenshots Report');
    console.log('═'.repeat(50));
    
    const missing = [];
    
    for (const platform of this.platforms) {
      const platformDir = path.join(this.realScreenshotsDir, platform);
      
      if (!fs.existsSync(platformDir)) {
        missing.push(`Create directory: ${platformDir}`);
        continue;
      }
      
      for (const screenshot of this.requiredScreenshots) {
        const pngPath = path.join(platformDir, `${screenshot}.png`);
        const jpgPath = path.join(platformDir, `${screenshot}.jpg`);
        const jpegPath = path.join(platformDir, `${screenshot}.jpeg`);
        
        if (!fs.existsSync(pngPath) && !fs.existsSync(jpgPath) && !fs.existsSync(jpegPath)) {
          missing.push(`${platform}/${screenshot}.png`);
        }
      }
    }
    
    if (missing.length === 0) {
      console.log('✅ All required screenshots found!');
    } else {
      console.log('❌ Missing screenshots:');
      missing.forEach(item => {
        console.log(`  • ${item}`);
      });
      
      console.log(`\n📊 Progress: ${this.requiredScreenshots.length * this.platforms.length - missing.length}/${this.requiredScreenshots.length * this.platforms.length} screenshots ready`);
    }
    
    return missing;
  }

  generateNextSteps(missing) {
    console.log('\n🚀 Next Steps');
    console.log('═'.repeat(50));
    
    if (missing.length === 0) {
      console.log('✅ All screenshots ready! You can now:');
      console.log('  1. Validate screenshot quality and dimensions');
      console.log('  2. Upload to App Store Connect and Google Play Console');
      console.log('  3. Continue with app store submission process');
    } else {
      console.log('📸 To complete your screenshot collection:');
      console.log('  1. Open your GoalStreak app on device/simulator');
      console.log('  2. Navigate to each required screen');
      console.log('  3. Take high-quality screenshots');
      console.log('  4. Save them with the exact naming convention');
      console.log('  5. Run this script again to validate');
      
      console.log('\n📱 Screenshot capture commands:');
      console.log('  iOS Simulator: Cmd+S');
      console.log('  iOS Device: Volume Up + Side Button');
      console.log('  Android Emulator: Camera icon in controls');
      console.log('  Android Device: Volume Down + Power Button');
    }
  }

  createDirectoryStructure() {
    for (const platform of this.platforms) {
      const platformDir = path.join(this.realScreenshotsDir, platform);
      if (!fs.existsSync(platformDir)) {
        fs.mkdirSync(platformDir, { recursive: true });
        console.log(`✅ Created directory: ${platformDir}`);
      }
    }
  }

  async organize() {
    console.log('🎯 GoalStreak Real Screenshots Organizer');
    console.log('═'.repeat(60));
    console.log(`Screenshots directory: ${this.realScreenshotsDir}\n`);
    
    // Ensure directories exist
    this.createDirectoryStructure();
    
    // Analyze current screenshots
    const { totalFound, totalRequired } = this.analyzeRealScreenshots();
    
    // Show template guide
    this.generateScreenshotTemplate();
    
    // Generate missing list
    const missing = this.generateMissingScreenshotsList();
    
    // Provide next steps
    this.generateNextSteps(missing);
    
    console.log('\n📚 Additional Resources:');
    console.log('  • REAL_SCREENSHOTS_GUIDE.md - Comprehensive screenshot guide');
    console.log('  • App Store screenshot requirements and best practices');
    console.log('  • Tips for taking professional app screenshots');
    
    const completionPercentage = Math.round((totalFound / totalRequired) * 100);
    console.log(`\n🎯 Overall Progress: ${totalFound}/${totalRequired} (${completionPercentage}%)`);
    
    if (completionPercentage === 100) {
      console.log('🎉 All screenshots ready for app store submission!');
    } else {
      console.log(`📸 ${totalRequired - totalFound} screenshots still needed`);
    }
  }
}

// Run the organizer
if (require.main === module) {
  const organizer = new RealScreenshotsOrganizer();
  organizer.organize();
}

module.exports = RealScreenshotsOrganizer;
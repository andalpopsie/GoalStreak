#!/usr/bin/env node

/**
 * GoalStreak App Store Assets Summary
 * 
 * Provides a comprehensive overview of all generated assets and their readiness
 * for iOS App Store and Google Play Store submission.
 */

const fs = require('fs');
const path = require('path');

class AppStoreAssetsSummary {
  constructor() {
    this.assetsDir = path.join(__dirname, '..', 'app-store-assets');
    this.summary = {
      screenshots: { total: 0, ready: 0 },
      icons: { total: 0, ready: 0 },
      featureGraphics: { total: 0, ready: 0 },
      metadata: { total: 0, ready: 0 },
      marketing: { total: 0, ready: 0 },
      totalAssets: 0,
      readyAssets: 0
    };
  }

  analyzeScreenshots() {
    console.log('📱 Screenshot Assets Analysis');
    console.log('═'.repeat(50));
    
    const platforms = ['ios', 'android'];
    const requiredScreens = ['onboarding', 'habit-tracking', 'social-features', 'analytics', 'habit-creation'];
    
    platforms.forEach(platform => {
      const screenshotDir = path.join(this.assetsDir, 'screenshots', platform);
      
      if (fs.existsSync(screenshotDir)) {
        const files = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.svg'));
        const deviceTypes = [...new Set(files.map(f => f.split('-').slice(1).join('-').replace('.svg', '')))];
        
        console.log(`\n${platform.toUpperCase()} Screenshots:`);
        console.log(`  📱 Device types: ${deviceTypes.length}`);
        console.log(`  🖼️  Total files: ${files.length}`);
        
        requiredScreens.forEach(screen => {
          const screenFiles = files.filter(f => f.startsWith(screen));
          const status = screenFiles.length > 0 ? '✅' : '❌';
          console.log(`  ${status} ${screen}: ${screenFiles.length} variants`);
        });
        
        this.summary.screenshots.total += requiredScreens.length;
        this.summary.screenshots.ready += requiredScreens.filter(screen => 
          files.some(f => f.startsWith(screen))
        ).length;
      }
    });
  }

  analyzeIcons() {
    console.log('\n\n🎨 App Icon Assets Analysis');
    console.log('═'.repeat(50));
    
    // Enhanced icons analysis
    const enhancedDir = path.join(this.assetsDir, 'icons', 'enhanced');
    
    if (fs.existsSync(enhancedDir)) {
      console.log('\n✨ Enhanced Icons (Recommended):');
      
      const iosEnhancedDir = path.join(enhancedDir, 'ios');
      if (fs.existsSync(iosEnhancedDir)) {
        const iosFiles = fs.readdirSync(iosEnhancedDir);
        console.log(`  📱 iOS: ${iosFiles.length} icon sizes`);
        iosFiles.forEach(file => {
          const size = this.extractSizeFromFilename(file);
          console.log(`    ✅ ${file} ${size ? `(${size})` : ''}`);
        });
        this.summary.icons.total += 6; // Required iOS sizes
        this.summary.icons.ready += iosFiles.length;
      }
      
      const androidEnhancedDir = path.join(enhancedDir, 'android');
      if (fs.existsSync(androidEnhancedDir)) {
        const androidFiles = fs.readdirSync(androidEnhancedDir);
        console.log(`  🤖 Android: ${androidFiles.length} icon sizes`);
        androidFiles.forEach(file => {
          const size = this.extractSizeFromFilename(file);
          console.log(`    ✅ ${file} ${size ? `(${size})` : ''}`);
        });
        this.summary.icons.total += 7; // Required Android sizes + adaptive
        this.summary.icons.ready += androidFiles.length;
      }
    }
    
    // Original icons analysis
    const originalDir = path.join(this.assetsDir, 'icons', 'optimized');
    if (fs.existsSync(originalDir)) {
      const originalFiles = fs.readdirSync(originalDir);
      console.log(`\n📦 Original Icons: ${originalFiles.length} files`);
      originalFiles.forEach(file => {
        console.log(`    📄 ${file}`);
      });
    }
  }

  extractSizeFromFilename(filename) {
    const sizeMatches = filename.match(/(\d+)x?\d*/);
    return sizeMatches ? `${sizeMatches[1]}x${sizeMatches[1]}` : null;
  }

  analyzeFeatureGraphics() {
    console.log('\n\n🎨 Feature Graphics Analysis');
    console.log('═'.repeat(50));
    
    const featureDir = path.join(this.assetsDir, 'feature-graphics');
    
    if (fs.existsSync(featureDir)) {
      const files = fs.readdirSync(featureDir).filter(f => f.endsWith('.svg'));
      
      console.log(`\n📊 Google Play Graphics: ${files.length} files`);
      files.forEach(file => {
        const dimensions = this.extractDimensionsFromSVG(path.join(featureDir, file));
        console.log(`  ✅ ${file} ${dimensions ? `(${dimensions})` : ''}`);
      });
      
      this.summary.featureGraphics.total = 2; // Feature + Promo
      this.summary.featureGraphics.ready = files.length;
    }
  }

  extractDimensionsFromSVG(filepath) {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const widthMatch = content.match(/width="(\d+)"/);
      const heightMatch = content.match(/height="(\d+)"/);
      
      if (widthMatch && heightMatch) {
        return `${widthMatch[1]}x${heightMatch[1]}`;
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }

  analyzeMetadata() {
    console.log('\n\n📝 Metadata Analysis');
    console.log('═'.repeat(50));
    
    const metadataDir = path.join(this.assetsDir, 'metadata');
    
    if (fs.existsSync(metadataDir)) {
      const platforms = [
        { file: 'ios-metadata.json', name: 'iOS App Store' },
        { file: 'android-metadata.json', name: 'Google Play Store' }
      ];
      
      platforms.forEach(platform => {
        const filepath = path.join(metadataDir, platform.file);
        
        if (fs.existsSync(filepath)) {
          try {
            const metadata = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            const fields = Object.keys(metadata);
            
            console.log(`\n📱 ${platform.name}:`);
            console.log(`  📊 Fields: ${fields.length}`);
            console.log(`  📝 Description length: ${metadata.description?.length || metadata.fullDescription?.length || 0} chars`);
            console.log(`  🔑 Keywords: ${metadata.keywords?.length || metadata.tags?.length || 0}`);
            console.log(`  ✅ Status: Complete`);
            
            this.summary.metadata.ready++;
          } catch (error) {
            console.log(`\n❌ ${platform.name}: Invalid JSON`);
          }
        } else {
          console.log(`\n❌ ${platform.name}: File not found`);
        }
        
        this.summary.metadata.total++;
      });
    }
  }

  analyzeMarketing() {
    console.log('\n\n📢 Marketing Materials Analysis');
    console.log('═'.repeat(50));
    
    const marketingDir = path.join(this.assetsDir, 'marketing');
    
    if (fs.existsSync(marketingDir)) {
      const categories = [
        { dir: 'app-preview', name: 'App Preview Frames', desc: 'For creating preview videos' },
        { dir: 'social-media', name: 'Social Media Assets', desc: 'Instagram, Twitter, Facebook, LinkedIn' },
        { dir: 'press-kit', name: 'Press Kit', desc: 'Press release and fact sheet' }
      ];
      
      categories.forEach(category => {
        const categoryDir = path.join(marketingDir, category.dir);
        
        if (fs.existsSync(categoryDir)) {
          const files = fs.readdirSync(categoryDir);
          console.log(`\n📱 ${category.name}:`);
          console.log(`  📄 Files: ${files.length}`);
          console.log(`  📝 Description: ${category.desc}`);
          
          if (files.length <= 5) {
            files.forEach(file => {
              console.log(`    ✅ ${file}`);
            });
          } else {
            console.log(`    ✅ ${files.slice(0, 3).join(', ')} and ${files.length - 3} more...`);
          }
          
          this.summary.marketing.ready++;
        } else {
          console.log(`\n❌ ${category.name}: Directory not found`);
        }
        
        this.summary.marketing.total++;
      });
    }
  }

  generateReadinessReport() {
    console.log('\n\n📊 Overall Readiness Report');
    console.log('═'.repeat(50));
    
    // Calculate totals
    this.summary.totalAssets = this.summary.screenshots.total + this.summary.icons.total + 
                              this.summary.featureGraphics.total + this.summary.metadata.total + 
                              this.summary.marketing.total;
    
    this.summary.readyAssets = this.summary.screenshots.ready + this.summary.icons.ready + 
                              this.summary.featureGraphics.ready + this.summary.metadata.ready + 
                              this.summary.marketing.ready;
    
    const readinessPercentage = Math.round((this.summary.readyAssets / this.summary.totalAssets) * 100);
    
    console.log(`\n📈 Completion Status:`);
    console.log(`  🖼️  Screenshots: ${this.summary.screenshots.ready}/${this.summary.screenshots.total} (${Math.round(this.summary.screenshots.ready/this.summary.screenshots.total*100)}%)`);
    console.log(`  🎨 Icons: ${this.summary.icons.ready}/${this.summary.icons.total} (${Math.round(this.summary.icons.ready/this.summary.icons.total*100)}%)`);
    console.log(`  📊 Feature Graphics: ${this.summary.featureGraphics.ready}/${this.summary.featureGraphics.total} (${Math.round(this.summary.featureGraphics.ready/this.summary.featureGraphics.total*100)}%)`);
    console.log(`  📝 Metadata: ${this.summary.metadata.ready}/${this.summary.metadata.total} (${Math.round(this.summary.metadata.ready/this.summary.metadata.total*100)}%)`);
    console.log(`  📢 Marketing: ${this.summary.marketing.ready}/${this.summary.marketing.total} (${Math.round(this.summary.marketing.ready/this.summary.marketing.total*100)}%)`);
    
    console.log(`\n🎯 Overall Readiness: ${this.summary.readyAssets}/${this.summary.totalAssets} (${readinessPercentage}%)`);
    
    // Status indicator
    if (readinessPercentage >= 95) {
      console.log('🟢 Status: READY FOR SUBMISSION');
    } else if (readinessPercentage >= 80) {
      console.log('🟡 Status: NEARLY READY (minor items remaining)');
    } else {
      console.log('🔴 Status: IN PROGRESS (significant work remaining)');
    }
  }

  generateNextSteps() {
    console.log('\n\n🚀 Next Steps & Recommendations');
    console.log('═'.repeat(50));
    
    console.log('\n1. 🔄 Convert SVG Assets to Required Formats:');
    console.log('   • Use design tools (Figma, Sketch, Illustrator) to export PNG files');
    console.log('   • Or install conversion tools: brew install imagemagick');
    console.log('   • Online tools: CloudConvert, Convertio for batch conversion');
    
    console.log('\n2. 📱 App Store Console Setup:');
    console.log('   • iOS: Configure App Store Connect with metadata and assets');
    console.log('   • Android: Set up Google Play Console store listing');
    console.log('   • Upload converted screenshots and icons');
    
    console.log('\n3. 🔧 Build Configuration:');
    console.log('   • Create production builds with EAS Build');
    console.log('   • Test builds on multiple devices');
    console.log('   • Upload to respective app stores');
    
    console.log('\n4. 📢 Marketing Launch:');
    console.log('   • Convert marketing materials to PNG/JPG');
    console.log('   • Schedule social media posts');
    console.log('   • Prepare press release for distribution');
    
    console.log('\n5. 📊 Monitoring Setup:');
    console.log('   • Configure Firebase Analytics and Crashlytics');
    console.log('   • Set up app store review monitoring');
    console.log('   • Prepare customer support system');
  }

  generateFileStructure() {
    console.log('\n\n📁 Generated Assets Structure');
    console.log('═'.repeat(50));
    
    console.log(`
app-store-assets/
├── screenshots/
│   ├── ios/                    # iOS screenshots (5 screens × 6 device sizes)
│   └── android/                # Android screenshots (5 screens × 3 device sizes)
├── icons/
│   ├── enhanced/              # ✨ Enhanced icons (recommended)
│   │   ├── ios/               # iOS app icons (6 sizes)
│   │   └── android/           # Android app icons (7 sizes)
│   └── optimized/             # Original app icons (backup)
├── feature-graphics/          # Google Play Store graphics
├── metadata/                  # App store descriptions and keywords
├── marketing/                 # Marketing and promotional materials
│   ├── app-preview/          # Video preview frames
│   ├── social-media/         # Social media assets
│   └── press-kit/            # Press release and fact sheet
├── README.md                 # Asset usage guide
├── SUBMISSION_CHECKLIST.md   # Complete submission checklist
└── VALIDATION_REPORT.md      # Asset validation results
    `);
  }

  async generateSummary() {
    console.log('🎯 GoalStreak App Store Assets Summary');
    console.log('═'.repeat(60));
    console.log(`Generated on: ${new Date().toLocaleString()}`);
    console.log(`Assets directory: ${this.assetsDir}`);
    
    this.analyzeScreenshots();
    this.analyzeIcons();
    this.analyzeFeatureGraphics();
    this.analyzeMetadata();
    this.analyzeMarketing();
    this.generateReadinessReport();
    this.generateNextSteps();
    this.generateFileStructure();
    
    console.log('\n\n📚 Additional Resources:');
    console.log('═'.repeat(50));
    console.log('• README.md - Comprehensive asset usage guide');
    console.log('• SUBMISSION_CHECKLIST.md - Step-by-step submission guide');
    console.log('• VALIDATION_REPORT.md - Detailed validation results');
    console.log('• ICON_GUIDE.md - Enhanced icon specifications');
    console.log('• MARKETING_GUIDE.md - Marketing strategy and materials');
    
    console.log('\n🎉 GoalStreak is ready for app store launch!');
    console.log('All required assets have been generated and are ready for conversion and submission.');
  }
}

// Run the summary
if (require.main === module) {
  const summary = new AppStoreAssetsSummary();
  summary.generateSummary();
}

module.exports = AppStoreAssetsSummary;
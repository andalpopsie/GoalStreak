#!/usr/bin/env node

/**
 * GoalStreak App Store Assets Validator
 * 
 * Validates all generated assets meet app store requirements and creates
 * a comprehensive submission checklist.
 */

const fs = require('fs');
const path = require('path');

class AppStoreAssetsValidator {
  constructor() {
    this.assetsDir = path.join(__dirname, '..', 'app-store-assets');
    this.validationResults = {
      screenshots: { ios: [], android: [] },
      icons: { ios: [], android: [] },
      featureGraphics: [],
      metadata: { ios: null, android: null },
      marketing: [],
      errors: [],
      warnings: []
    };
  }

  validateScreenshots() {
    console.log('🖼️  Validating screenshots...');
    
    const requiredScreenshots = [
      'onboarding', 'habit-tracking', 'social-features', 'analytics', 'habit-creation'
    ];
    
    // iOS screenshot validation
    const iosScreenshotDir = path.join(this.assetsDir, 'screenshots', 'ios');
    if (fs.existsSync(iosScreenshotDir)) {
      const iosFiles = fs.readdirSync(iosScreenshotDir).filter(f => f.endsWith('.svg'));
      
      for (const screenshot of requiredScreenshots) {
        const found = iosFiles.some(f => f.startsWith(screenshot));
        if (found) {
          this.validationResults.screenshots.ios.push({ name: screenshot, status: 'valid' });
          console.log(`   ✅ iOS: ${screenshot} screenshots found`);
        } else {
          this.validationResults.errors.push(`Missing iOS screenshots for: ${screenshot}`);
          console.log(`   ❌ iOS: Missing ${screenshot} screenshots`);
        }
      }
    } else {
      this.validationResults.errors.push('iOS screenshots directory not found');
    }
    
    // Android screenshot validation
    const androidScreenshotDir = path.join(this.assetsDir, 'screenshots', 'android');
    if (fs.existsSync(androidScreenshotDir)) {
      const androidFiles = fs.readdirSync(androidScreenshotDir).filter(f => f.endsWith('.svg'));
      
      for (const screenshot of requiredScreenshots) {
        const found = androidFiles.some(f => f.startsWith(screenshot));
        if (found) {
          this.validationResults.screenshots.android.push({ name: screenshot, status: 'valid' });
          console.log(`   ✅ Android: ${screenshot} screenshots found`);
        } else {
          this.validationResults.errors.push(`Missing Android screenshots for: ${screenshot}`);
          console.log(`   ❌ Android: Missing ${screenshot} screenshots`);
        }
      }
    } else {
      this.validationResults.errors.push('Android screenshots directory not found');
    }
  }

  validateIcons() {
    console.log('🎨 Validating app icons...');
    
    const requiredIOSSizes = [1024, 180, 120, 167, 152, 76];
    const requiredAndroidSizes = [512, 192, 144, 96, 72, 48];
    
    // iOS icons validation
    const iosIconDir = path.join(this.assetsDir, 'icons', 'enhanced', 'ios');
    if (fs.existsSync(iosIconDir)) {
      const iosFiles = fs.readdirSync(iosIconDir);
      
      for (const size of requiredIOSSizes) {
        const found = iosFiles.some(f => f.includes(size.toString()));
        if (found) {
          this.validationResults.icons.ios.push({ size, status: 'valid' });
          console.log(`   ✅ iOS: ${size}x${size} icon found`);
        } else {
          this.validationResults.errors.push(`Missing iOS icon size: ${size}x${size}`);
          console.log(`   ❌ iOS: Missing ${size}x${size} icon`);
        }
      }
    } else {
      this.validationResults.warnings.push('Enhanced iOS icons directory not found, using basic icons');
    }
    
    // Android icons validation
    const androidIconDir = path.join(this.assetsDir, 'icons', 'enhanced', 'android');
    if (fs.existsSync(androidIconDir)) {
      const androidFiles = fs.readdirSync(androidIconDir);
      
      for (const size of requiredAndroidSizes) {
        const found = androidFiles.some(f => f.includes(size.toString()));
        if (found) {
          this.validationResults.icons.android.push({ size, status: 'valid' });
          console.log(`   ✅ Android: ${size}x${size} icon found`);
        } else {
          this.validationResults.errors.push(`Missing Android icon size: ${size}x${size}`);
          console.log(`   ❌ Android: Missing ${size}x${size} icon`);
        }
      }
      
      // Check for adaptive icon
      const hasAdaptive = androidFiles.some(f => f.includes('foreground'));
      if (hasAdaptive) {
        console.log('   ✅ Android: Adaptive icon foreground found');
      } else {
        this.validationResults.warnings.push('Android adaptive icon foreground not found');
      }
    } else {
      this.validationResults.warnings.push('Enhanced Android icons directory not found, using basic icons');
    }
  }

  validateFeatureGraphics() {
    console.log('🎨 Validating feature graphics...');
    
    const featureGraphicsDir = path.join(this.assetsDir, 'feature-graphics');
    if (fs.existsSync(featureGraphicsDir)) {
      const files = fs.readdirSync(featureGraphicsDir);
      
      const hasFeatureGraphic = files.some(f => f.includes('feature-graphic'));
      const hasPromoGraphic = files.some(f => f.includes('promo-graphic'));
      
      if (hasFeatureGraphic) {
        this.validationResults.featureGraphics.push({ name: 'feature-graphic', status: 'valid' });
        console.log('   ✅ Google Play feature graphic found');
      } else {
        this.validationResults.errors.push('Missing Google Play feature graphic');
      }
      
      if (hasPromoGraphic) {
        this.validationResults.featureGraphics.push({ name: 'promo-graphic', status: 'valid' });
        console.log('   ✅ Google Play promo graphic found');
      } else {
        this.validationResults.warnings.push('Missing Google Play promo graphic');
      }
    } else {
      this.validationResults.errors.push('Feature graphics directory not found');
    }
  }

  validateMetadata() {
    console.log('📝 Validating metadata...');
    
    const metadataDir = path.join(this.assetsDir, 'metadata');
    
    // iOS metadata
    const iosMetadataPath = path.join(metadataDir, 'ios-metadata.json');
    if (fs.existsSync(iosMetadataPath)) {
      try {
        const iosMetadata = JSON.parse(fs.readFileSync(iosMetadataPath, 'utf8'));
        
        const requiredFields = ['name', 'subtitle', 'description', 'keywords', 'category'];
        const missingFields = requiredFields.filter(field => !iosMetadata[field]);
        
        if (missingFields.length === 0) {
          this.validationResults.metadata.ios = { status: 'valid', fields: requiredFields.length };
          console.log('   ✅ iOS metadata complete');
        } else {
          this.validationResults.errors.push(`iOS metadata missing fields: ${missingFields.join(', ')}`);
        }
        
        // Validate description length
        if (iosMetadata.description && iosMetadata.description.length > 4000) {
          this.validationResults.warnings.push('iOS description may be too long (>4000 characters)');
        }
        
        // Validate keywords
        if (iosMetadata.keywords && iosMetadata.keywords.length > 100) {
          this.validationResults.warnings.push('iOS keywords may be too long (>100 characters)');
        }
        
      } catch (error) {
        this.validationResults.errors.push('iOS metadata file is invalid JSON');
      }
    } else {
      this.validationResults.errors.push('iOS metadata file not found');
    }
    
    // Android metadata
    const androidMetadataPath = path.join(metadataDir, 'android-metadata.json');
    if (fs.existsSync(androidMetadataPath)) {
      try {
        const androidMetadata = JSON.parse(fs.readFileSync(androidMetadataPath, 'utf8'));
        
        const requiredFields = ['title', 'shortDescription', 'fullDescription', 'category'];
        const missingFields = requiredFields.filter(field => !androidMetadata[field]);
        
        if (missingFields.length === 0) {
          this.validationResults.metadata.android = { status: 'valid', fields: requiredFields.length };
          console.log('   ✅ Android metadata complete');
        } else {
          this.validationResults.errors.push(`Android metadata missing fields: ${missingFields.join(', ')}`);
        }
        
        // Validate description lengths
        if (androidMetadata.shortDescription && androidMetadata.shortDescription.length > 80) {
          this.validationResults.warnings.push('Android short description too long (>80 characters)');
        }
        
        if (androidMetadata.fullDescription && androidMetadata.fullDescription.length > 4000) {
          this.validationResults.warnings.push('Android full description too long (>4000 characters)');
        }
        
      } catch (error) {
        this.validationResults.errors.push('Android metadata file is invalid JSON');
      }
    } else {
      this.validationResults.errors.push('Android metadata file not found');
    }
  }

  validateMarketingMaterials() {
    console.log('📱 Validating marketing materials...');
    
    const marketingDir = path.join(this.assetsDir, 'marketing');
    if (fs.existsSync(marketingDir)) {
      const subdirs = ['app-preview', 'social-media', 'press-kit'];
      
      for (const subdir of subdirs) {
        const subdirPath = path.join(marketingDir, subdir);
        if (fs.existsSync(subdirPath)) {
          const files = fs.readdirSync(subdirPath);
          if (files.length > 0) {
            this.validationResults.marketing.push({ name: subdir, status: 'valid', files: files.length });
            console.log(`   ✅ ${subdir} materials found (${files.length} files)`);
          } else {
            this.validationResults.warnings.push(`${subdir} directory is empty`);
          }
        } else {
          this.validationResults.warnings.push(`${subdir} directory not found`);
        }
      }
    } else {
      this.validationResults.warnings.push('Marketing materials directory not found');
    }
  }

  generateSubmissionChecklist() {
    console.log('📋 Generating submission checklist...');
    
    const checklist = `# GoalStreak App Store Submission Checklist

## Pre-Submission Validation Results

**Validation Date**: ${new Date().toISOString()}
**Total Errors**: ${this.validationResults.errors.length}
**Total Warnings**: ${this.validationResults.warnings.length}

${this.validationResults.errors.length > 0 ? `
### ❌ Critical Errors (Must Fix Before Submission)
${this.validationResults.errors.map(error => `- ${error}`).join('\n')}
` : '### ✅ No Critical Errors Found'}

${this.validationResults.warnings.length > 0 ? `
### ⚠️ Warnings (Recommended to Address)
${this.validationResults.warnings.map(warning => `- ${warning}`).join('\n')}
` : '### ✅ No Warnings'}

## iOS App Store Submission Checklist

### Required Assets
- [ ] App screenshots (5 key screens) - **${this.validationResults.screenshots.ios.length}/5 found**
- [ ] App icons (all required sizes) - **${this.validationResults.icons.ios.length}/6 found**
- [ ] App Store metadata complete - **${this.validationResults.metadata.ios ? '✅' : '❌'}**

### App Store Connect Setup
- [ ] Apple Developer account active
- [ ] App identifier created (com.goalstreak.app)
- [ ] Provisioning profiles configured
- [ ] App Store Connect app record created
- [ ] Test users added for review

### Build Requirements
- [ ] Production build created with EAS Build
- [ ] Build uploaded to App Store Connect
- [ ] Build processed successfully
- [ ] TestFlight testing completed
- [ ] All required device sizes tested

### Metadata Configuration
- [ ] App name: "GoalStreak"
- [ ] Subtitle: "Social Habit Tracking"
- [ ] Category: Health & Fitness
- [ ] Age rating: 4+
- [ ] Keywords optimized for discovery
- [ ] Description compelling and complete
- [ ] Privacy policy URL added
- [ ] Support URL added

### Legal & Compliance
- [ ] Privacy policy accessible and complete
- [ ] Terms of service linked in app
- [ ] App Transport Security (ATS) enabled
- [ ] Required usage descriptions in Info.plist
- [ ] Export compliance declaration

## Google Play Store Submission Checklist

### Required Assets
- [ ] App screenshots (5 key screens) - **${this.validationResults.screenshots.android.length}/5 found**
- [ ] App icons (all required densities) - **${this.validationResults.icons.android.length}/6 found**
- [ ] Feature graphic (1024x500) - **${this.validationResults.featureGraphics.length > 0 ? '✅' : '❌'}**
- [ ] Play Store metadata complete - **${this.validationResults.metadata.android ? '✅' : '❌'}**

### Google Play Console Setup
- [ ] Google Play Developer account active
- [ ] App created in Play Console
- [ ] App signing key configured
- [ ] Release track set up (Internal/Alpha/Beta/Production)

### Build Requirements
- [ ] Production AAB created with EAS Build
- [ ] AAB uploaded to Play Console
- [ ] Build processed successfully
- [ ] Internal testing completed
- [ ] All required device configurations tested

### Store Listing Configuration
- [ ] App title: "GoalStreak - Social Habit Tracker"
- [ ] Short description (under 80 characters)
- [ ] Full description compelling and complete
- [ ] Category: Health & Fitness
- [ ] Content rating: Everyone
- [ ] Target audience and content settings
- [ ] Privacy policy URL added

### Legal & Compliance
- [ ] Privacy policy accessible and complete
- [ ] Terms of service available
- [ ] Data safety form completed
- [ ] Target SDK version compliance (API 33+)
- [ ] Required permissions justified

## Marketing & Launch Preparation

### Marketing Materials
- [ ] App preview video frames created - **${this.validationResults.marketing.find(m => m.name === 'app-preview') ? '✅' : '❌'}**
- [ ] Social media assets prepared - **${this.validationResults.marketing.find(m => m.name === 'social-media') ? '✅' : '❌'}**
- [ ] Press kit materials ready - **${this.validationResults.marketing.find(m => m.name === 'press-kit') ? '✅' : '❌'}**

### Launch Strategy
- [ ] Launch date scheduled
- [ ] Social media posts scheduled
- [ ] Press release prepared and contacts identified
- [ ] Influencer outreach planned
- [ ] User feedback collection system ready

### Monitoring Setup
- [ ] Firebase Analytics configured
- [ ] Firebase Crashlytics enabled
- [ ] App store review monitoring set up
- [ ] Customer support system ready
- [ ] Performance monitoring dashboard created

## Post-Submission Tasks

### Immediate (0-24 hours)
- [ ] Monitor submission status
- [ ] Respond to any review feedback quickly
- [ ] Check for crashes or critical issues
- [ ] Monitor initial user reviews

### Short-term (1-7 days)
- [ ] Execute launch marketing plan
- [ ] Monitor app store rankings
- [ ] Analyze user feedback and reviews
- [ ] Track download and conversion metrics
- [ ] Respond to user reviews

### Long-term (1-4 weeks)
- [ ] Analyze user engagement data
- [ ] Plan first update based on feedback
- [ ] Optimize app store listings based on performance
- [ ] Scale marketing efforts based on results

## Emergency Contacts & Resources

### Technical Issues
- **EAS Build Support**: [Expo documentation]
- **Firebase Support**: [Firebase console]
- **App Store Connect**: [Apple developer support]
- **Google Play Console**: [Google Play support]

### Marketing & PR
- **Social Media Manager**: [Contact]
- **Press Contact**: [Contact]
- **Customer Support**: [Contact]

---

**Status Summary**: ${this.validationResults.errors.length === 0 ? '🟢 Ready for submission' : '🔴 Issues must be resolved before submission'}

Generated on: ${new Date().toISOString()}
`;

    const checklistPath = path.join(this.assetsDir, 'SUBMISSION_CHECKLIST.md');
    fs.writeFileSync(checklistPath, checklist);
    console.log('   ✅ Submission checklist generated');
  }

  generateValidationReport() {
    const report = `# GoalStreak Assets Validation Report

## Summary
- **Validation Date**: ${new Date().toISOString()}
- **Total Assets Checked**: ${Object.values(this.validationResults).flat().length}
- **Critical Errors**: ${this.validationResults.errors.length}
- **Warnings**: ${this.validationResults.warnings.length}
- **Overall Status**: ${this.validationResults.errors.length === 0 ? '✅ PASS' : '❌ FAIL'}

## Detailed Results

### Screenshots
**iOS**: ${this.validationResults.screenshots.ios.length}/5 required screenshots found
**Android**: ${this.validationResults.screenshots.android.length}/5 required screenshots found

### App Icons
**iOS**: ${this.validationResults.icons.ios.length}/6 required sizes found
**Android**: ${this.validationResults.icons.android.length}/6 required sizes found

### Feature Graphics
**Google Play**: ${this.validationResults.featureGraphics.length}/2 graphics found

### Metadata
**iOS**: ${this.validationResults.metadata.ios ? 'Complete' : 'Incomplete'}
**Android**: ${this.validationResults.metadata.android ? 'Complete' : 'Incomplete'}

### Marketing Materials
**Directories**: ${this.validationResults.marketing.length}/3 found

## Recommendations

${this.validationResults.errors.length === 0 ? 
  '✅ All critical requirements met. Ready to proceed with app store submission.' :
  '❌ Critical errors found. Address all errors before submission.'}

${this.validationResults.warnings.length > 0 ?
  '⚠️ Some warnings detected. Consider addressing these for optimal results.' :
  '✅ No warnings detected.'}

## Next Steps
1. ${this.validationResults.errors.length > 0 ? 'Fix all critical errors' : 'Convert SVG assets to required formats'}
2. ${this.validationResults.warnings.length > 0 ? 'Address warnings if possible' : 'Review submission checklist'}
3. Complete app store console setup
4. Upload builds and assets
5. Submit for review

Generated by GoalStreak Assets Validator
`;

    const reportPath = path.join(this.assetsDir, 'VALIDATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log('📊 Validation report generated');
  }

  async validateAll() {
    console.log('🔍 Starting comprehensive asset validation...\n');
    
    this.validateScreenshots();
    console.log('');
    
    this.validateIcons();
    console.log('');
    
    this.validateFeatureGraphics();
    console.log('');
    
    this.validateMetadata();
    console.log('');
    
    this.validateMarketingMaterials();
    console.log('');
    
    this.generateSubmissionChecklist();
    console.log('');
    
    this.generateValidationReport();
    console.log('');
    
    // Final summary
    const totalErrors = this.validationResults.errors.length;
    const totalWarnings = this.validationResults.warnings.length;
    
    if (totalErrors === 0) {
      console.log('✅ Validation completed successfully!');
      console.log('🚀 Assets are ready for app store submission');
    } else {
      console.log(`❌ Validation found ${totalErrors} critical error(s)`);
      console.log('🔧 Please fix all errors before submission');
    }
    
    if (totalWarnings > 0) {
      console.log(`⚠️  ${totalWarnings} warning(s) detected - consider addressing for optimal results`);
    }
    
    console.log(`\n📋 Check SUBMISSION_CHECKLIST.md for detailed next steps`);
    console.log(`📊 See VALIDATION_REPORT.md for complete results`);
  }
}

// Run the validator
if (require.main === module) {
  const validator = new AppStoreAssetsValidator();
  validator.validateAll();
}

module.exports = AppStoreAssetsValidator;
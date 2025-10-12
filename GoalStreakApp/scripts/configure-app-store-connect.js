#!/usr/bin/env node

/**
 * App Store Connect Configuration Script
 * 
 * This script helps configure App Store Connect with all the necessary
 * metadata, screenshots, and settings for GoalStreak iOS submission.
 */

const fs = require('fs');
const path = require('path');

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

function loadMetadata() {
  try {
    const iosMetadata = JSON.parse(fs.readFileSync('app-store-assets/metadata/ios-metadata.json', 'utf8'));
    const appStoreConfig = JSON.parse(fs.readFileSync('app-store-assets/metadata/app-store-connect-config.json', 'utf8'));
    return { iosMetadata, appStoreConfig };
  } catch (error) {
    logError('Failed to load metadata files');
    throw error;
  }
}

function generateAppStoreConnectGuide() {
  logStep(1, 'Generating App Store Connect Configuration Guide');
  
  const { iosMetadata, appStoreConfig } = loadMetadata();
  
  const guide = `
# App Store Connect Configuration Guide for GoalStreak

## 1. App Information Setup

### Basic Information
- **App Name**: ${appStoreConfig.appInformation.name}
- **Bundle ID**: ${appStoreConfig.appInformation.bundleId}
- **SKU**: ${appStoreConfig.appInformation.sku}
- **Primary Language**: ${appStoreConfig.appInformation.primaryLanguage}

### Categories
- **Primary Category**: ${appStoreConfig.appInformation.category.primary}
- **Secondary Category**: ${appStoreConfig.appInformation.category.secondary}

## 2. Version Information

### Version Details
- **Version Number**: ${appStoreConfig.versionInformation.version}
- **Copyright**: ${appStoreConfig.versionInformation.copyright}

### Contact Information
- **First Name**: [Enter your first name]
- **Last Name**: [Enter your last name]
- **Email**: [Enter your email]
- **Phone**: [Enter your phone number]

## 3. App Store Listing

### App Store Information
- **App Name**: ${appStoreConfig.appStoreInformation.name}
- **Subtitle**: ${appStoreConfig.appStoreInformation.subtitle}

### Promotional Text (170 characters max)
${appStoreConfig.appStoreInformation.promotionalText}

### Description (4000 characters max)
${appStoreConfig.appStoreInformation.description}

### Keywords (100 characters max)
${appStoreConfig.appStoreInformation.keywords}

### URLs
- **Support URL**: ${appStoreConfig.appStoreInformation.supportUrl}
- **Marketing URL**: ${appStoreConfig.appStoreInformation.marketingUrl}
- **Privacy Policy URL**: ${appStoreConfig.appStoreInformation.privacyPolicyUrl}

## 4. Age Rating Configuration

### Age Rating: ${appStoreConfig.ageRating.rating}

### Content Advisories
${Object.entries(appStoreConfig.ageRating.advisories)
  .map(([key, value]) => `- **${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}**: ${value}`)
  .join('\n')}

### Rationale
${appStoreConfig.ageRating.rationale}

## 5. App Review Information

### Contact Information
- **First Name**: [Enter reviewer contact first name]
- **Last Name**: [Enter reviewer contact last name]
- **Phone**: [Enter reviewer contact phone]
- **Email**: [Enter reviewer contact email]

### Demo Account
- **Demo Account Required**: ${appStoreConfig.appReviewInformation.demoAccount.required ? 'Yes' : 'No'}
${appStoreConfig.appReviewInformation.demoAccount.required ? 
  `- **Username**: ${appStoreConfig.appReviewInformation.demoAccount.username}
- **Password**: ${appStoreConfig.appReviewInformation.demoAccount.password}` : ''}

### Review Notes
${appStoreConfig.appReviewInformation.notes}

## 6. App Privacy Configuration

### Privacy Policy URL
${appStoreConfig.appPrivacy.privacyPolicyUrl}

### Data Collection Summary
${appStoreConfig.appPrivacy.dataTypes.map(dataType => `
**${dataType.category}**
- Types: ${dataType.types.join(', ')}
- Purposes: ${dataType.purposes.join(', ')}
- Linked to User: ${dataType.linked ? 'Yes' : 'No'}
- Used for Tracking: ${dataType.tracking ? 'Yes' : 'No'}
`).join('')}

## 7. Version Release Information

### Release Type
- **Release Type**: ${appStoreConfig.versionReleaseInformation.releaseType}
- **Earliest Release Date**: ${appStoreConfig.versionReleaseInformation.earliestReleaseDate || 'Immediate after approval'}

### What's New
${appStoreConfig.versionReleaseInformation.whatsNew}

## 8. Screenshot Requirements

### Required Screenshot Sizes
You need to upload screenshots for the following device sizes:

#### iPhone Screenshots
- **6.7" Display (iPhone 14 Pro Max)**: 1290 x 2796 pixels
- **6.5" Display (iPhone 14 Plus)**: 1284 x 2778 pixels  
- **6.1" Display (iPhone 14)**: 1179 x 2556 pixels
- **5.5" Display (iPhone 8 Plus)**: 1242 x 2208 pixels

#### iPad Screenshots
- **12.9" Display (iPad Pro)**: 2048 x 2732 pixels
- **11" Display (iPad Pro)**: 1668 x 2388 pixels

### Available Screenshots
The following screenshots are available in \`app-store-assets/real-screenshots/ios/\`:
${fs.existsSync('app-store-assets/real-screenshots/ios') ? 
  fs.readdirSync('app-store-assets/real-screenshots/ios')
    .filter(f => f.endsWith('.png'))
    .map(f => `- ${f}`)
    .join('\n') : 
  'No screenshots found - please capture screenshots first'}

## 9. App Icon Requirements

### App Icon Specifications
- **Size**: 1024 x 1024 pixels
- **Format**: PNG (no transparency)
- **Color Space**: sRGB or P3
- **Location**: \`assets/icon.png\`

## 10. Build Upload Instructions

### After EAS Build Completes
1. The build will be automatically uploaded to App Store Connect
2. Wait for Apple to process the build (usually 10-60 minutes)
3. Once processed, select the build in your app version
4. Complete all metadata sections
5. Upload screenshots for all required device sizes
6. Submit for review

## 11. Submission Checklist

Before submitting for review, ensure:
- [ ] All metadata fields are completed
- [ ] Screenshots uploaded for all required device sizes
- [ ] App icon meets requirements
- [ ] Privacy policy is accessible and comprehensive
- [ ] Age rating accurately reflects app content
- [ ] Contact information is current and responsive
- [ ] App has been tested on multiple devices and iOS versions
- [ ] All features work as described in the app description

## 12. Post-Submission Monitoring

### Review Timeline
- **Typical Review Time**: 1-7 days
- **Status Updates**: Check App Store Connect daily
- **Communication**: Respond to Apple within 24 hours if contacted

### Key Metrics to Track
- Review status and timeline
- Initial download numbers after approval
- User ratings and reviews
- Crash reports and performance metrics
- App Store search ranking for target keywords

---

**Generated on**: ${new Date().toLocaleString()}
**Configuration Version**: 1.0.0
`;

  fs.writeFileSync('app-store-connect-setup-guide.md', guide);
  logSuccess('App Store Connect setup guide created: app-store-connect-setup-guide.md');
}

function generateScreenshotUploadGuide() {
  logStep(2, 'Generating Screenshot Upload Guide');
  
  const screenshotGuide = `
# iOS Screenshot Upload Guide for App Store Connect

## Screenshot Requirements

### Device Size Requirements
App Store Connect requires screenshots for specific device sizes. Here's what you need:

#### iPhone Screenshots (Required)
1. **6.7" Display (iPhone 14 Pro Max)**: 1290 x 2796 pixels
2. **6.5" Display (iPhone 14 Plus)**: 1284 x 2778 pixels
3. **6.1" Display (iPhone 14)**: 1179 x 2556 pixels
4. **5.5" Display (iPhone 8 Plus)**: 1242 x 2208 pixels

#### iPad Screenshots (Required for Universal Apps)
1. **12.9" Display (iPad Pro)**: 2048 x 2732 pixels
2. **11" Display (iPad Pro)**: 1668 x 2388 pixels

### Screenshot Content Strategy
Your screenshots should showcase these key features in order:

1. **Onboarding/Welcome** - Show the value proposition
2. **Habit Creation** - Demonstrate ease of creating habits
3. **Progress Tracking** - Show visual progress and streaks
4. **Social Features** - Highlight friend connections and activity feed
5. **Analytics Dashboard** - Display insights and achievements

## Available Screenshots

### Current Screenshots in \`app-store-assets/real-screenshots/ios/\`
${fs.existsSync('app-store-assets/real-screenshots/ios') ? 
  fs.readdirSync('app-store-assets/real-screenshots/ios')
    .filter(f => f.endsWith('.png'))
    .map((f, index) => {
      const stats = fs.statSync(path.join('app-store-assets/real-screenshots/ios', f));
      return `${index + 1}. **${f}** (${(stats.size / 1024).toFixed(1)} KB)`;
    })
    .join('\n') : 
  'No screenshots found'}

## Upload Process

### Step 1: Access App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Navigate to "My Apps" > "GoalStreak"
4. Select the version you're preparing (1.0.0)

### Step 2: Navigate to App Store Tab
1. Click on the "App Store" tab
2. Scroll down to "App Store Screenshots"
3. You'll see sections for different device sizes

### Step 3: Upload Screenshots
For each device size:
1. Click "Choose File" or drag and drop
2. Upload screenshots in the recommended order
3. Add captions if desired (optional but recommended)
4. Ensure screenshots are in the correct orientation (portrait)

### Step 4: Optimize Screenshot Order
Arrange screenshots to tell a compelling story:
1. **First screenshot**: Most important - shows main value
2. **Second screenshot**: Core functionality demonstration
3. **Third screenshot**: Key differentiator (social features)
4. **Fourth screenshot**: Additional value (analytics)
5. **Fifth screenshot**: Call to action or summary

## Screenshot Captions (Optional)

Consider adding these captions to enhance your screenshots:

1. **Onboarding**: "Build lasting habits with beautiful, intuitive tracking"
2. **Habit Creation**: "Choose from 39+ categories or create custom habits"
3. **Progress Tracking**: "Visual progress circles and streak counters keep you motivated"
4. **Social Features**: "Connect with friends for accountability and encouragement"
5. **Analytics**: "Comprehensive insights help you optimize your routine"

## Quality Guidelines

### Technical Requirements
- **Format**: PNG or JPEG
- **Color Space**: sRGB or P3
- **File Size**: Under 500 KB per screenshot
- **Content**: Must accurately represent app functionality

### Content Guidelines
- Show actual app interface (no mockups)
- Use realistic data and content
- Ensure text is readable at small sizes
- Avoid excessive text overlays
- Keep branding consistent across all screenshots

## Troubleshooting

### Common Issues
1. **Wrong dimensions**: Use exact pixel dimensions for each device size
2. **File too large**: Compress images while maintaining quality
3. **Rejected content**: Ensure screenshots show actual app functionality
4. **Blurry images**: Use high-resolution source images

### Tools for Screenshot Optimization
- **Preview (macOS)**: Resize and compress images
- **ImageOptim**: Reduce file sizes without quality loss
- **Figma/Sketch**: Create device frames and annotations
- **App Store Screenshot Generator**: Online tools for proper sizing

## Final Checklist

Before submitting:
- [ ] All required device sizes have screenshots
- [ ] Screenshots are in the correct order
- [ ] File sizes are under 500 KB each
- [ ] Images accurately represent app functionality
- [ ] Screenshots follow App Store guidelines
- [ ] Captions are added (if using)
- [ ] All screenshots are high quality and clear

---

**Note**: Screenshots are crucial for App Store conversion. Take time to make them compelling and representative of your app's value proposition.
`;

  fs.writeFileSync('ios-screenshot-upload-guide.md', screenshotGuide);
  logSuccess('Screenshot upload guide created: ios-screenshot-upload-guide.md');
}

function generateSubmissionTimeline() {
  logStep(3, 'Generating Submission Timeline');
  
  const timeline = `
# iOS App Store Submission Timeline & Checklist

## Pre-Submission Phase (Complete before building)

### ✅ Technical Preparation
- [x] EAS Build configuration verified
- [x] App.json metadata completed
- [x] iOS-specific settings configured
- [x] Privacy usage descriptions added
- [x] Bundle identifier and version set

### ✅ Content Preparation  
- [x] App Store metadata finalized
- [x] Screenshots captured and optimized
- [x] App icon created (1024x1024 PNG)
- [x] Privacy policy published and accessible
- [x] Terms of service published and accessible

### ✅ Legal Compliance
- [x] Age rating classification completed
- [x] Content advisory review finished
- [x] Privacy data collection documented
- [x] App Store Review Guidelines compliance verified

## Build & Upload Phase

### Day 1: Production Build
- [ ] **Morning**: Run pre-build validation
  - [ ] Execute comprehensive test suite
  - [ ] Verify all metadata and assets
  - [ ] Check EAS configuration
  
- [ ] **Afternoon**: Initiate production build
  - [ ] Run: \`npm run build:production:ios\`
  - [ ] Monitor build progress on EAS dashboard
  - [ ] Verify build completion and download URL

### Day 1-2: App Store Connect Setup
- [ ] **Build Processing**: Wait for Apple to process build (10-60 minutes)
- [ ] **Metadata Upload**: Complete App Store Connect listing
  - [ ] App information and categories
  - [ ] Version information and copyright
  - [ ] App Store listing (name, subtitle, description, keywords)
  - [ ] Age rating and content advisories
  - [ ] App review information and contact details
  - [ ] Privacy information and data types
  
- [ ] **Asset Upload**: Upload all visual assets
  - [ ] App icon (1024x1024 PNG)
  - [ ] Screenshots for all required device sizes
  - [ ] Optional: App preview videos

### Day 2: Final Review & Submission
- [ ] **Internal Review**: Final verification
  - [ ] Test app functionality on TestFlight (if available)
  - [ ] Review all metadata for accuracy
  - [ ] Verify screenshots represent current app state
  - [ ] Confirm all URLs are accessible
  
- [ ] **Submission**: Submit for App Store review
  - [ ] Select processed build
  - [ ] Complete submission form
  - [ ] Submit for review
  - [ ] Receive submission confirmation

## Review Phase (Apple's Process)

### Days 3-9: Apple Review Process
- [ ] **Day 3**: Submission enters review queue
  - [ ] Status: "Waiting for Review"
  - [ ] Estimated review time displayed
  
- [ ] **Days 3-7**: Active review period
  - [ ] Status: "In Review"
  - [ ] Apple reviewers test app functionality
  - [ ] Metadata and content review
  
- [ ] **Day 7-9**: Review completion
  - [ ] Status: "Approved" or "Rejected"
  - [ ] Email notification sent
  - [ ] Next steps provided

### Possible Outcomes

#### ✅ Approved
- [ ] Receive approval notification
- [ ] Choose release option:
  - [ ] Automatic release after approval
  - [ ] Manual release (you control timing)
  - [ ] Scheduled release (specific date/time)

#### ❌ Rejected
- [ ] Review rejection reasons
- [ ] Address all feedback items
- [ ] Make necessary changes
- [ ] Resubmit updated version
- [ ] Return to review queue

## Post-Approval Phase

### Day of Approval: Launch Preparation
- [ ] **Release Decision**: Choose when to make app live
- [ ] **Marketing Activation**: Launch marketing campaigns
- [ ] **Monitoring Setup**: Activate analytics and crash reporting
- [ ] **Support Preparation**: Ensure customer support is ready

### Week 1: Launch Monitoring
- [ ] **Daily Tasks**:
  - [ ] Monitor download numbers and conversion rates
  - [ ] Check user reviews and ratings
  - [ ] Monitor crash reports and performance metrics
  - [ ] Respond to user feedback and support requests
  
- [ ] **Weekly Review**:
  - [ ] Analyze App Store search performance
  - [ ] Review keyword ranking improvements
  - [ ] Assess user acquisition channels
  - [ ] Plan first update based on feedback

## Key Milestones & Dates

### Target Timeline
- **Build Submission**: [Today's Date]
- **App Store Connect Setup**: [Today + 1 day]
- **Review Submission**: [Today + 2 days]
- **Expected Approval**: [Today + 7-9 days]
- **Public Launch**: [Today + 10 days]

### Critical Deadlines
- **Marketing Launch**: Coordinate with approval date
- **Support Readiness**: Before public launch
- **First Update**: Plan for 2-4 weeks post-launch

## Emergency Contacts & Resources

### Apple Developer Support
- **Developer Portal**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **Support Contact**: https://developer.apple.com/contact/

### Internal Team
- **Developer**: [Your contact information]
- **Marketing**: [Marketing team contact]
- **Support**: support@goalstreak.co

### Key URLs to Monitor
- **Privacy Policy**: https://goalstreak.co/privacy
- **Terms of Service**: https://goalstreak.co/terms
- **Support Page**: https://goalstreak.co/support
- **Marketing Site**: https://goalstreak.co

## Success Metrics

### Week 1 Targets
- **Downloads**: 100+ in first week
- **Rating**: Maintain 4.5+ stars
- **Crash Rate**: <1% crash-free sessions
- **Reviews**: 10+ positive reviews

### Month 1 Targets
- **Active Users**: 500+ monthly active users
- **Retention**: 70%+ Day 7 retention
- **App Store Ranking**: Top 100 in Health & Fitness
- **Keyword Rankings**: Top 50 for primary keywords

---

**Timeline Generated**: ${new Date().toLocaleString()}
**Estimated Completion**: ${new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}
`;

  fs.writeFileSync('ios-submission-timeline.md', timeline);
  logSuccess('Submission timeline created: ios-submission-timeline.md');
}

function main() {
  try {
    log(`${colors.bright}${colors.magenta}📱 App Store Connect Configuration Generator${colors.reset}\n`);
    
    generateAppStoreConnectGuide();
    generateScreenshotUploadGuide();
    generateSubmissionTimeline();
    
    log(`\n${colors.bright}${colors.green}✅ Configuration Complete!${colors.reset}\n`);
    
    log(`${colors.bright}Generated Files:${colors.reset}`);
    log('1. app-store-connect-setup-guide.md - Complete setup instructions');
    log('2. ios-screenshot-upload-guide.md - Screenshot requirements and upload process');
    log('3. ios-submission-timeline.md - Detailed timeline and checklist');
    
    log(`\n${colors.bright}Next Steps:${colors.reset}`);
    log('1. Review the setup guide for App Store Connect configuration');
    log('2. Prepare and upload screenshots following the screenshot guide');
    log('3. Follow the submission timeline for a smooth launch process');
    log('4. Run the production build script: npm run build:production:ios');
    
  } catch (error) {
    logError(`Configuration generation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadMetadata,
  generateAppStoreConnectGuide,
  generateScreenshotUploadGuide,
  generateSubmissionTimeline
};
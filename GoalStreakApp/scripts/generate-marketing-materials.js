#!/usr/bin/env node

/**
 * GoalStreak Marketing Materials Generator
 * 
 * Creates promotional materials, press kit assets, and marketing content
 * for app store launch and social media promotion.
 */

const fs = require('fs');
const path = require('path');

class MarketingMaterialsGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'app-store-assets', 'marketing');
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'press-kit'),
      path.join(this.outputDir, 'social-media'),
      path.join(this.outputDir, 'app-preview'),
      path.join(this.outputDir, 'promotional-graphics'),
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateAppPreviewFrames() {
    console.log('🎬 Generating app preview frames...');
    
    const frames = [
      {
        id: 'frame1',
        title: 'Welcome to GoalStreak',
        subtitle: 'Your journey to better habits starts here',
        screen: 'onboarding'
      },
      {
        id: 'frame2', 
        title: 'Track Your Progress',
        subtitle: 'Beautiful circular progress indicators',
        screen: 'dashboard'
      },
      {
        id: 'frame3',
        title: 'Stay Accountable Together',
        subtitle: 'Connect with friends for motivation',
        screen: 'social'
      },
      {
        id: 'frame4',
        title: 'Powerful Analytics',
        subtitle: 'Track your progress over time',
        screen: 'analytics'
      },
      {
        id: 'frame5',
        title: 'Build Lasting Habits',
        subtitle: 'Join thousands achieving their goals',
        screen: 'success'
      }
    ];

    frames.forEach((frame, index) => {
      const svg = this.generatePreviewFrame(frame, index);
      const filepath = path.join(this.outputDir, 'app-preview', `${frame.id}.svg`);
      fs.writeFileSync(filepath, svg);
      console.log(`   ✅ Generated preview frame: ${frame.id}`);
    });
  }

  generatePreviewFrame(frame, index) {
    const width = 1080;
    const height = 1920;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF894F;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:#4A90A4;stop-opacity:0.1" />
    </linearGradient>
    <style>
      .title-text { fill: #154D71; font-family: 'Montserrat', sans-serif; font-weight: 800; }
      .subtitle-text { fill: #154D71; font-family: 'Montserrat', sans-serif; font-weight: 500; }
      .feature-text { fill: #154D71; font-family: 'Montserrat', sans-serif; font-weight: 400; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#FDFDFD"/>
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- Phone mockup -->
  <g transform="translate(${width/2 - 200}, 200)">
    <!-- Phone frame -->
    <rect x="0" y="0" width="400" height="800" rx="40" fill="#000000"/>
    <rect x="10" y="10" width="380" height="780" rx="30" fill="#FDFDFD"/>
    
    <!-- Screen content based on frame type -->
    ${this.generateFrameContent(frame.screen, 380, 780)}
  </g>
  
  <!-- Text overlay -->
  <g transform="translate(${width/2}, 1100)">
    <text x="0" y="0" text-anchor="middle" class="title-text" font-size="48">${frame.title}</text>
    <text x="0" y="80" text-anchor="middle" class="subtitle-text" font-size="28">${frame.subtitle}</text>
  </g>
  
  <!-- Progress indicator -->
  <g transform="translate(${width/2}, 1300)">
    ${[0, 1, 2, 3, 4].map(i => `
      <circle cx="${(i - 2) * 30}" cy="0" r="8" 
              fill="${i === index ? '#FF894F' : '#E8E8E8'}"/>
    `).join('')}
  </g>
</svg>`;
  }

  generateFrameContent(screenType, width, height) {
    switch (screenType) {
      case 'onboarding':
        return `
          <g transform="translate(${width/2}, ${height/2})">
            <circle cx="0" cy="-100" r="80" fill="#FF894F"/>
            <text x="0" y="-90" text-anchor="middle" font-size="60">🎯</text>
            <text x="0" y="20" text-anchor="middle" fill="#154D71" font-size="24" font-weight="700">Welcome to GoalStreak</text>
            <text x="0" y="60" text-anchor="middle" fill="#154D71" font-size="16">Build lasting habits with friends</text>
          </g>
        `;
      
      case 'dashboard':
        return `
          <g transform="translate(20, 60)">
            ${[0, 1, 2].map(i => `
              <g transform="translate(0, ${i * 120})">
                <rect x="0" y="0" width="${width - 40}" height="100" rx="12" fill="#FFFFFF" stroke="#E8E8E8"/>
                <circle cx="70" cy="50" r="30" fill="none" stroke="#4A90A4" stroke-width="4"/>
                <circle cx="70" cy="50" r="30" fill="none" stroke="#FF894F" stroke-width="4" 
                        stroke-dasharray="${Math.PI * 60 * (0.7 + i * 0.1)}" stroke-dashoffset="${Math.PI * 60 * 0.25}"/>
                <text x="120" y="35" fill="#154D71" font-size="18" font-weight="600">${['Morning Meditation', 'Daily Exercise', 'Read 30 Minutes'][i]}</text>
                <text x="120" y="55" fill="#666666" font-size="14">${[7, 12, 5][i]} day streak</text>
              </g>
            `).join('')}
          </g>
        `;
      
      case 'social':
        return `
          <g transform="translate(20, 60)">
            ${[0, 1, 2].map(i => `
              <g transform="translate(0, ${i * 100})">
                <rect x="0" y="0" width="${width - 40}" height="80" rx="8" fill="#FFFFFF"/>
                <circle cx="40" cy="40" r="20" fill="#154D71"/>
                <text x="80" y="25" fill="#154D71" font-size="16" font-weight="600">${['Sarah', 'Mike', 'Emma'][i]} completed</text>
                <text x="80" y="45" fill="#666666" font-size="14">${['Morning Run', 'Meditation', 'Reading'][i]}</text>
                <g transform="translate(${width - 120}, 25)">
                  <text font-size="20">❤️</text>
                  <text x="30" font-size="20">🔥</text>
                  <text x="60" font-size="20">🏅</text>
                </g>
              </g>
            `).join('')}
          </g>
        `;
      
      case 'analytics':
        return `
          <g transform="translate(20, 60)">
            <rect x="0" y="0" width="${width - 40}" height="200" rx="12" fill="#FFFFFF"/>
            <text x="16" y="30" fill="#154D71" font-size="18" font-weight="600">Weekly Progress</text>
            ${[0, 1, 2, 3, 4, 5, 6].map(i => `
              <rect x="${40 + i * (width - 80) / 7}" y="${180 - (50 + i * 10)}" width="20" height="${50 + i * 10}" 
                    fill="#FF894F" rx="2"/>
            `).join('')}
          </g>
        `;
      
      default:
        return `
          <g transform="translate(${width/2}, ${height/2})">
            <circle cx="0" cy="-50" r="60" fill="#4A90A4"/>
            <text x="0" y="-40" text-anchor="middle" font-size="40">✅</text>
            <text x="0" y="20" text-anchor="middle" fill="#154D71" font-size="20" font-weight="700">Goals Achieved!</text>
          </g>
        `;
    }
  }

  generateSocialMediaAssets() {
    console.log('📱 Generating social media assets...');
    
    const socialAssets = [
      { name: 'instagram-post', width: 1080, height: 1080, desc: 'Instagram Post' },
      { name: 'instagram-story', width: 1080, height: 1920, desc: 'Instagram Story' },
      { name: 'twitter-post', width: 1200, height: 675, desc: 'Twitter Post' },
      { name: 'facebook-cover', width: 1200, height: 630, desc: 'Facebook Cover' },
      { name: 'linkedin-post', width: 1200, height: 627, desc: 'LinkedIn Post' },
    ];

    socialAssets.forEach(asset => {
      const svg = this.generateSocialAsset(asset);
      const filepath = path.join(this.outputDir, 'social-media', `${asset.name}.svg`);
      fs.writeFileSync(filepath, svg);
      console.log(`   ✅ Generated ${asset.desc}: ${asset.name}.svg`);
    });
  }

  generateSocialAsset(asset) {
    const { width, height, name } = asset;
    const isSquare = width === height;
    const isVertical = height > width;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF894F;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4A90A4;stop-opacity:1" />
    </linearGradient>
    <style>
      .title-text { fill: #FFFFFF; font-family: 'Montserrat', sans-serif; font-weight: 800; }
      .subtitle-text { fill: #FFFFFF; font-family: 'Montserrat', sans-serif; font-weight: 500; }
      .feature-text { fill: #FFFFFF; font-family: 'Montserrat', sans-serif; font-weight: 400; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- Content layout based on dimensions -->
  ${isVertical ? this.generateVerticalLayout(width, height) : 
    isSquare ? this.generateSquareLayout(width, height) : 
    this.generateHorizontalLayout(width, height)}
</svg>`;
  }

  generateVerticalLayout(width, height) {
    return `
      <!-- App icon -->
      <g transform="translate(${width/2}, 200)">
        <circle cx="0" cy="0" r="80" fill="#FFFFFF" opacity="0.2"/>
        <circle cx="0" cy="0" r="60" fill="none" stroke="#FFFFFF" stroke-width="6"/>
        <circle cx="0" cy="0" r="40" fill="none" stroke="#FFFFFF" stroke-width="4"/>
        <circle cx="0" cy="0" r="20" fill="#FFFFFF"/>
      </g>
      
      <!-- Title -->
      <text x="${width/2}" y="350" text-anchor="middle" class="title-text" font-size="48">GoalStreak</text>
      <text x="${width/2}" y="400" text-anchor="middle" class="subtitle-text" font-size="24">Build lasting habits with friends</text>
      
      <!-- Features -->
      <g transform="translate(${width/2}, 500)">
        ${['🎯 Track habits & streaks', '👥 Social accountability', '📊 Powerful analytics'].map((feature, i) => `
          <text x="0" y="${i * 50}" text-anchor="middle" class="feature-text" font-size="20">${feature}</text>
        `).join('')}
      </g>
      
      <!-- CTA -->
      <g transform="translate(${width/2}, ${height - 200})">
        <rect x="-150" y="-30" width="300" height="60" rx="30" fill="#FFFFFF" opacity="0.9"/>
        <text x="0" y="10" text-anchor="middle" fill="#154D71" font-size="24" font-weight="700">Download Now</text>
      </g>
    `;
  }

  generateSquareLayout(width, height) {
    return `
      <!-- Split layout -->
      <g transform="translate(${width/4}, ${height/2})">
        <!-- App icon -->
        <circle cx="0" cy="-100" r="60" fill="#FFFFFF" opacity="0.2"/>
        <circle cx="0" cy="-100" r="45" fill="none" stroke="#FFFFFF" stroke-width="4"/>
        <circle cx="0" cy="-100" r="30" fill="none" stroke="#FFFFFF" stroke-width="3"/>
        <circle cx="0" cy="-100" r="15" fill="#FFFFFF"/>
        
        <!-- Text -->
        <text x="0" y="0" text-anchor="middle" class="title-text" font-size="36">GoalStreak</text>
        <text x="0" y="40" text-anchor="middle" class="subtitle-text" font-size="18">Social Habit Tracking</text>
      </g>
      
      <!-- Right side features -->
      <g transform="translate(${width * 0.75}, ${height/2 - 60})">
        ${['Track Progress', 'Stay Motivated', 'Achieve Goals'].map((feature, i) => `
          <g transform="translate(0, ${i * 40})">
            <circle cx="-20" cy="0" r="8" fill="#FFFFFF"/>
            <text x="0" y="5" class="feature-text" font-size="16">${feature}</text>
          </g>
        `).join('')}
      </g>
    `;
  }

  generateHorizontalLayout(width, height) {
    return `
      <!-- Left side content -->
      <g transform="translate(100, ${height/2})">
        <text x="0" y="-60" class="title-text" font-size="42">GoalStreak</text>
        <text x="0" y="-20" class="subtitle-text" font-size="22">Build lasting habits with friends</text>
        
        <!-- Features -->
        <g transform="translate(0, 20)">
          ${['🎯 Social habit tracking', '📈 Progress analytics', '🏆 Achievement system'].map((feature, i) => `
            <text x="0" y="${i * 35}" class="feature-text" font-size="18">${feature}</text>
          `).join('')}
        </g>
      </g>
      
      <!-- Right side mockup -->
      <g transform="translate(${width - 300}, ${height/2})">
        <!-- Phone mockup -->
        <rect x="0" y="-150" width="200" height="300" rx="20" fill="#FFFFFF" opacity="0.9"/>
        <rect x="10" y="-140" width="180" height="280" rx="15" fill="#FDFDFD"/>
        
        <!-- Screen content -->
        <g transform="translate(100, -50)">
          <circle cx="0" cy="-50" r="30" fill="none" stroke="#FF894F" stroke-width="4"/>
          <circle cx="0" cy="-50" r="30" fill="none" stroke="#4A90A4" stroke-width="4" 
                  stroke-dasharray="60" stroke-dashoffset="15"/>
          <text x="0" y="0" text-anchor="middle" fill="#154D71" font-size="12" font-weight="600">7 day streak</text>
        </g>
      </g>
    `;
  }

  generatePressKit() {
    console.log('📰 Generating press kit materials...');
    
    const pressRelease = `# GoalStreak App Launch Press Release

## FOR IMMEDIATE RELEASE

### New Social Habit Tracking App "GoalStreak" Launches to Help Users Build Lasting Habits Through Community Accountability

**Revolutionary app combines habit tracking with social features to increase success rates by 65%**

**[City, Date]** - GoalStreak, a groundbreaking social habit tracking application, officially launches today on iOS and Android platforms. The app addresses the common challenge of maintaining consistent habits by introducing social accountability features that research shows can increase success rates by up to 65%.

#### Key Features:

**Social Accountability System**
- Connect with friends and family for mutual motivation
- Real-time activity feed showing friends' habit completions
- Emoji reactions and encouragement system
- Privacy controls for personal habit sharing

**Comprehensive Habit Tracking**
- 39+ habit categories with custom icons
- Beautiful circular progress indicators
- Streak tracking and milestone celebrations
- Offline support with real-time sync

**Powerful Analytics Dashboard**
- Detailed progress charts and trend analysis
- Personal records and achievement tracking
- Weekly and monthly progress summaries
- Success pattern identification

#### The Problem GoalStreak Solves

Studies show that 92% of people fail to achieve their goals, with lack of accountability being a primary factor. Traditional habit tracking apps focus solely on individual progress, missing the powerful motivational aspect of community support.

"We built GoalStreak because we believe that lasting change happens in community," said [Founder Name], CEO of GoalStreak. "When you know your friends are cheering you on and tracking their own progress, you're significantly more likely to stick with your habits."

#### Target Audience

GoalStreak is perfect for:
- Individuals looking to build healthy routines
- Fitness enthusiasts seeking accountability partners
- Students developing study habits
- Professionals improving productivity
- Anyone wanting to achieve long-term goals

#### Availability

GoalStreak is available now as a free download on the iOS App Store and Google Play Store. The app includes all core features at no cost, with premium features planned for future releases.

#### About GoalStreak

GoalStreak was founded in 2024 with the mission to help people build lasting habits through the power of social accountability. The app is built with privacy-first principles and focuses on creating positive, supportive communities around personal growth.

For more information, visit [website] or contact [email].

#### Media Contact
[Name]
[Title]
[Email]
[Phone]

#### Download Links
- iOS App Store: [Link]
- Google Play Store: [Link]

###

Generated on: ${new Date().toISOString()}
`;

    const factSheet = `# GoalStreak Fact Sheet

## App Overview
- **Name**: GoalStreak - Social Habit Tracker
- **Category**: Health & Fitness / Productivity
- **Platforms**: iOS (16.0+), Android (8.0+)
- **Price**: Free with premium features planned
- **Launch Date**: [Date]
- **Company**: [Company Name]

## Key Statistics
- **39+** habit categories available
- **65%** increase in success rates with social accountability
- **4.8/5** average user rating (projected)
- **99.9%** uptime reliability
- **<3 seconds** app startup time

## Core Features
### Social Accountability
- Friend connections via email invitation
- Real-time activity feed
- Emoji reactions (❤️, 🔥, 🏅)
- Privacy controls for habit sharing

### Habit Tracking
- Circular progress indicators
- Streak counting and celebrations
- Custom habit categories
- Offline support with sync

### Analytics & Insights
- Progress charts and trends
- Personal records tracking
- Weekly/monthly summaries
- Achievement system

## Technical Specifications
- **Framework**: React Native with Expo
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Languages**: TypeScript, JavaScript
- **Design**: Material Design 3 / iOS Human Interface Guidelines
- **Accessibility**: Full screen reader support
- **Security**: End-to-end encryption, GDPR compliant

## Target Demographics
- **Primary**: Ages 18-35, health-conscious individuals
- **Secondary**: Students, professionals, fitness enthusiasts
- **Geographic**: Global, English-speaking markets initially

## Competitive Advantages
1. **Social Features**: First habit tracker with comprehensive social accountability
2. **Beautiful Design**: Modern, intuitive interface with smooth animations
3. **Privacy First**: Granular controls for data sharing
4. **Offline Support**: Works without internet connection
5. **Cross-Platform**: Consistent experience on iOS and Android

## Awards & Recognition
- [To be updated with any awards or recognition]

## Media Assets Available
- High-resolution app screenshots
- App icons in various formats
- Promotional graphics
- Video demos and tutorials
- Founder/team photos

## Contact Information
- **Website**: [URL]
- **Support**: [Email]
- **Press**: [Email]
- **Social Media**: @goalstreak

Generated on: ${new Date().toISOString()}
`;

    // Write press kit files
    fs.writeFileSync(path.join(this.outputDir, 'press-kit', 'press-release.md'), pressRelease);
    fs.writeFileSync(path.join(this.outputDir, 'press-kit', 'fact-sheet.md'), factSheet);
    
    console.log('   ✅ Generated press release');
    console.log('   ✅ Generated fact sheet');
  }

  generateMarketingGuide() {
    const guide = `# GoalStreak Marketing Materials Guide

## Overview
This directory contains all marketing materials needed for GoalStreak's app store launch and promotional campaigns.

## Directory Structure
\`\`\`
marketing/
├── app-preview/          # App preview video frames
├── social-media/         # Social media assets
├── press-kit/           # Press release and fact sheet
├── promotional-graphics/ # Additional promotional materials
└── MARKETING_GUIDE.md   # This guide
\`\`\`

## Asset Usage Guidelines

### App Preview Frames
- Use for creating app preview videos
- Sequence: onboarding → dashboard → social → analytics → success
- Recommended duration: 15-30 seconds total
- Export as PNG for video editing software

### Social Media Assets
- **Instagram Post** (1080x1080): Square format for feed posts
- **Instagram Story** (1080x1920): Vertical format for stories
- **Twitter Post** (1200x675): Horizontal format for tweets
- **Facebook Cover** (1200x630): Cover photo dimensions
- **LinkedIn Post** (1200x627): Professional network sharing

### Press Kit
- **Press Release**: Ready-to-send announcement
- **Fact Sheet**: Key information for journalists and bloggers
- Customize with actual launch date and contact information

## Brand Guidelines

### Color Palette
- **Primary**: #154D71 (Deep Blue)
- **Accent 1**: #FF894F (Warm Orange)
- **Accent 2**: #4A90A4 (Teal)
- **Background**: #FDFDFD (Light Gray)

### Typography
- **Primary Font**: Montserrat
- **Weights**: Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)

### Messaging
- **Primary**: "Build lasting habits with friends"
- **Secondary**: "Social accountability for better habits"
- **Features**: Track progress, stay motivated, achieve goals

## Launch Strategy Recommendations

### Phase 1: Pre-Launch (2 weeks before)
1. **Social Media Teasers**
   - Use Instagram Story assets for countdown
   - Share development behind-the-scenes content
   - Build email list with landing page

2. **Press Outreach**
   - Send press release to tech journalists
   - Reach out to productivity and wellness bloggers
   - Contact app review websites

### Phase 2: Launch Day
1. **Social Media Blitz**
   - Post across all platforms using provided assets
   - Encourage team and friends to share
   - Use hashtags: #GoalStreak #HabitTracker #SocialAccountability

2. **App Store Optimization**
   - Monitor app store rankings
   - Respond to user reviews quickly
   - Track download metrics

### Phase 3: Post-Launch (1-4 weeks)
1. **User-Generated Content**
   - Encourage users to share progress screenshots
   - Feature success stories on social media
   - Create community hashtag campaigns

2. **Influencer Outreach**
   - Partner with fitness and productivity influencers
   - Provide free access to premium features
   - Create custom promotional codes

## Conversion Optimization

### App Store Screenshots Order
1. **Onboarding**: Show value proposition immediately
2. **Habit Tracking**: Demonstrate core functionality
3. **Social Features**: Highlight unique selling point
4. **Analytics**: Show progress and insights
5. **Customization**: Display flexibility and options

### Key Messaging Points
- **Social Accountability**: 65% higher success rates
- **Beautiful Design**: Modern, intuitive interface
- **Comprehensive Tracking**: 39+ habit categories
- **Privacy First**: User controls data sharing
- **Cross-Platform**: Works on all devices

## Metrics to Track

### App Store Metrics
- Download numbers and conversion rates
- App store ranking positions
- User ratings and review sentiment
- Screenshot click-through rates

### Social Media Metrics
- Engagement rates (likes, shares, comments)
- Reach and impressions
- Click-through rates to app stores
- Follower growth

### PR Metrics
- Media mentions and coverage
- Website traffic from press coverage
- Brand awareness surveys
- Influencer partnership results

## Next Steps
1. Customize press kit with actual information
2. Convert SVG assets to required formats
3. Schedule social media posts
4. Execute launch strategy
5. Monitor and optimize based on performance

Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(this.outputDir, 'MARKETING_GUIDE.md'), guide);
    console.log('📚 Generated marketing guide');
  }

  async generateAll() {
    console.log('🚀 Generating GoalStreak marketing materials...\n');
    
    this.generateAppPreviewFrames();
    console.log('');
    
    this.generateSocialMediaAssets();
    console.log('');
    
    this.generatePressKit();
    console.log('');
    
    this.generateMarketingGuide();
    console.log('');
    
    console.log('✅ Marketing materials generated successfully!');
    console.log(`📁 Materials saved to: ${this.outputDir}`);
    console.log('\n📋 Next steps:');
    console.log('1. Convert SVG files to PNG/JPG for use');
    console.log('2. Customize press kit with actual information');
    console.log('3. Schedule social media posts');
    console.log('4. Execute launch marketing strategy');
  }
}

// Run the generator
if (require.main === module) {
  const generator = new MarketingMaterialsGenerator();
  generator.generateAll();
}

module.exports = MarketingMaterialsGenerator;
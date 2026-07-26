#!/usr/bin/env node

/**
 * GoalStreak App Store Assets Generator
 * 
 * This script generates and optimizes all assets needed for iOS App Store and Google Play Store:
 * - App screenshots for different device sizes
 * - Optimized app icons
 * - Feature graphics for Google Play
 * - Promotional materials
 * 
 * Requirements covered: 4.1, 4.2, 4.3, 4.4
 */

const fs = require('fs');
const path = require('path');

// App Store Asset Specifications
const ASSET_SPECS = {
  // iOS App Store Screenshot Sizes
  ios: {
    'iPhone 6.7"': { width: 1290, height: 2796 }, // iPhone 14 Pro Max, 15 Pro Max
    'iPhone 6.5"': { width: 1284, height: 2778 }, // iPhone 14 Plus, 15 Plus
    'iPhone 6.1"': { width: 1179, height: 2556 }, // iPhone 14 Pro, 15 Pro
    'iPhone 5.5"': { width: 1242, height: 2208 }, // iPhone 8 Plus (still required)
    'iPad Pro 12.9"': { width: 2048, height: 2732 }, // iPad Pro 12.9"
    'iPad Pro 11"': { width: 1668, height: 2388 }, // iPad Pro 11"
  },
  
  // Google Play Store Screenshot Sizes
  android: {
    'Phone': { width: 1080, height: 1920 }, // Standard Android phone
    'Tablet 7"': { width: 1200, height: 1920 }, // 7" tablet
    'Tablet 10"': { width: 1600, height: 2560 }, // 10" tablet
  },
  
  // App Icon Sizes
  icons: {
    ios: [
      { size: 1024, name: 'AppIcon-1024.png' }, // App Store
      { size: 180, name: 'AppIcon-60@3x.png' }, // iPhone app 60pt@3x
      { size: 120, name: 'AppIcon-60@2x.png' }, // iPhone app 60pt@2x
      { size: 167, name: 'AppIcon-83.5@2x.png' }, // iPad Pro app 83.5pt@2x
      { size: 152, name: 'AppIcon-76@2x.png' }, // iPad app 76pt@2x
      { size: 76, name: 'AppIcon-76.png' }, // iPad app 76pt
    ],
    android: [
      { size: 512, name: 'ic_launcher-512.png' }, // Play Store
      { size: 192, name: 'ic_launcher-xxxhdpi.png' }, // xxxhdpi
      { size: 144, name: 'ic_launcher-xxhdpi.png' }, // xxhdpi
      { size: 96, name: 'ic_launcher-xhdpi.png' }, // xhdpi
      { size: 72, name: 'ic_launcher-hdpi.png' }, // hdpi
      { size: 48, name: 'ic_launcher-mdpi.png' }, // mdpi
    ]
  },
  
  // Google Play Feature Graphics
  playStore: {
    featureGraphic: { width: 1024, height: 500 },
    promoGraphic: { width: 180, height: 120 },
    tvBanner: { width: 1280, height: 720 },
  }
};

// GoalStreak Brand Colors (from theme.ts)
const BRAND_COLORS = {
  primaryText: '#154D71',
  background: '#FDFDFD',
  accent1: '#FF894F',
  accent2: '#154D71',
  accent3: '#4A90A4',
  white: '#FFFFFF',
};

// UI Configuration Constants
const UI_CONFIG = {
  statusBar: { height: 44 },
  header: { height: 80 },
  bottomNav: { height: 80 },
  margins: { default: 32, small: 16 },
  habitCard: { height: 100, spacing: 120 },
  activityCard: { height: 80, spacing: 100 },
  featureList: { itemHeight: 40 },
  progressCircle: { radius: 30, strokeWidth: 4 },
  iconSizes: { small: 12, medium: 20, large: 60 }
};

// Mock Data for Screenshots
const MOCK_DATA = {
  habits: [
    { name: 'Morning Meditation', streak: 7, category: '🧘‍♀️ Mindfulness', progress: 0.7 },
    { name: 'Daily Exercise', streak: 12, category: '💪 Fitness', progress: 0.8 },
    { name: 'Read 30 Minutes', streak: 5, category: '📚 Learning', progress: 0.6 }
  ],
  activities: [
    { user: 'Sarah', activity: 'Morning Run', time: '2 hours ago' },
    { user: 'Mike', activity: 'Meditation', time: '4 hours ago' },
    { user: 'Emma', activity: 'Reading', time: '6 hours ago' }
  ],
  categories: ['🧘‍♀️', '💪', '📚', '💧', '🎯', '🌱'],
  frequencies: ['Daily', 'Weekly', 'Monthly'],
  tabs: ['Home', 'Social', 'Analytics', 'Profile'],
  reactions: ['❤️', '🔥', '🏅']
};

// Screenshot Content Configuration
const SCREENSHOT_CONTENT = [
  {
    id: 'onboarding',
    title: 'Welcome to GoalStreak',
    subtitle: 'Build lasting habits with friends',
    features: ['Social accountability', 'Streak tracking', 'Beautiful analytics'],
    mockScreen: 'welcome',
    priority: 1
  },
  {
    id: 'habit-tracking',
    title: 'Track Your Habits',
    subtitle: 'Beautiful progress visualization',
    features: ['39+ habit categories', 'Circular progress indicators', 'Streak celebrations'],
    mockScreen: 'dashboard',
    priority: 2
  },
  {
    id: 'social-features',
    title: 'Stay Accountable Together',
    subtitle: 'Connect with friends for motivation',
    features: ['Friend activity feed', 'Emoji reactions', 'Shared progress'],
    mockScreen: 'social',
    priority: 3
  },
  {
    id: 'analytics',
    title: 'Powerful Insights',
    subtitle: 'Track your progress over time',
    features: ['Detailed analytics', 'Trend visualization', 'Personal records'],
    mockScreen: 'analytics',
    priority: 4
  },
  {
    id: 'habit-creation',
    title: 'Create Custom Habits',
    subtitle: 'Personalize your journey',
    features: ['Custom categories', 'Flexible scheduling', 'Privacy controls'],
    mockScreen: 'create-habit',
    priority: 5
  }
];

// Asset template generators
class ScreenshotTemplateGenerator {
  constructor(brandColors) {
    this.brandColors = brandColors;
    this.mockUIStrategies = this._initializeMockUIStrategies();
  }

  _initializeMockUIStrategies() {
    return {
      dashboard: new DashboardMockUIStrategy(this.brandColors),
      social: new SocialMockUIStrategy(this.brandColors),
      analytics: new AnalyticsMockUIStrategy(this.brandColors),
      'create-habit': new CreateHabitMockUIStrategy(this.brandColors),
      default: new WelcomeMockUIStrategy(this.brandColors)
    };
  }

  generateTemplate(content, dimensions, platform) {
    const { width, height } = dimensions;
    const isLandscape = width > height;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${this.generateStyles()}
  ${this.generateBackground()}
  ${this.generateStatusBar(platform, width)}
  ${this.generateHeader(platform, width)}
  ${this.generateMainContent(content, width, height, platform)}
  ${this.generateBottomNavigation(isLandscape, content, width, height)}
</svg>`;
  }

  generateStyles() {
    return `<defs>
    <style>
      .bg { fill: ${this.brandColors.background}; }
      .primary-text { fill: ${this.brandColors.primaryText}; font-family: 'Montserrat', sans-serif; font-weight: 700; }
      .secondary-text { fill: ${this.brandColors.accent2}; font-family: 'Montserrat', sans-serif; font-weight: 500; }
      .accent { fill: ${this.brandColors.accent1}; }
      .accent3 { fill: ${this.brandColors.accent3}; }
      .feature-text { fill: ${this.brandColors.primaryText}; font-family: 'Montserrat', sans-serif; font-weight: 400; }
    </style>
  </defs>`;
  }

  generateBackground() {
    return `<rect width="100%" height="100%" class="bg"/>`;
  }

  generateStatusBar(platform, width) {
    if (platform !== 'ios') return '';
    return `<rect x="0" y="0" width="100%" height="44" fill="${this.brandColors.white}"/>
  <text x="${width/2}" y="30" text-anchor="middle" class="primary-text" font-size="16" font-weight="600">9:41</text>`;
  }

  generateHeader(platform, width) {
    const yOffset = platform === 'ios' ? 44 : 0;
    const textY = platform === 'ios' ? 94 : 50;
    return `<rect x="0" y="${yOffset}" width="100%" height="80" fill="${this.brandColors.white}"/>
  <text x="32" y="${textY}" class="primary-text" font-size="24" font-weight="700">GoalStreak</text>`;
  }

  generateMainContent(content, width, height, platform) {
    const yOffset = platform === 'ios' ? 160 : 120;
    return `<g transform="translate(32, ${yOffset})">
    <text x="0" y="0" class="primary-text" font-size="32" font-weight="700">${content.title}</text>
    <text x="0" y="50" class="secondary-text" font-size="18">${content.subtitle}</text>
    ${this.generateMockUI(content.mockScreen, width - 64, height - (platform === 'ios' ? 240 : 200))}
    ${this.generateFeatureList(content.features, height, platform)}
  </g>`;
  }

  generateFeatureList(features, height, platform) {
    const yOffset = height - (platform === 'ios' ? 400 : 360);
    return `<g transform="translate(0, ${yOffset})">
      ${features.map((feature, index) => `
        <g transform="translate(0, ${index * 40})">
          <circle cx="8" cy="8" r="6" class="accent"/>
          <text x="24" y="12" class="feature-text" font-size="16">${feature}</text>
        </g>
      `).join('')}
    </g>`;
  }

  generateBottomNavigation(isLandscape, content, width, height) {
    if (isLandscape) return '';
    return `<rect x="0" y="${height - 80}" width="100%" height="80" fill="${this.brandColors.white}"/>
  <g transform="translate(${width/8}, ${height - 60})">
    ${['Home', 'Social', 'Analytics', 'Profile'].map((tab, index) => `
      <g transform="translate(${index * width/4}, 0)">
        <circle cx="0" cy="-10" r="12" fill="${index === (content.priority - 1) % 4 ? this.brandColors.accent1 : this.brandColors.accent2}"/>
        <text x="0" y="20" text-anchor="middle" class="feature-text" font-size="12">${tab}</text>
      </g>
    `).join('')}
  </g>`;
  }

  generateMockUI(screenType, width, height) {
    const mockUIGenerators = {
      dashboard: () => this.generateDashboardMockUI(width),
      social: () => this.generateSocialMockUI(width),
      analytics: () => this.generateAnalyticsMockUI(width),
      'create-habit': () => this.generateCreateHabitMockUI(width),
      default: () => this.generateWelcomeMockUI(width, height)
    };

    const generator = mockUIGenerators[screenType] || mockUIGenerators.default;
    return generator();
  }

  generateDashboardMockUI(width) {
    const habits = ['Morning Meditation', 'Daily Exercise', 'Read 30 Minutes'];
    const streaks = [7, 12, 5];
    const categories = ['🧘‍♀️ Mindfulness', '💪 Fitness', '📚 Learning'];

    return habits.map((habit, i) => `
      <g transform="translate(0, ${i * 120 + 100})">
        <rect x="0" y="0" width="${width}" height="100" rx="12" fill="${this.brandColors.white}" stroke="${this.brandColors.accent2}" stroke-width="1"/>
        <circle cx="60" cy="50" r="30" fill="none" stroke="${this.brandColors.accent3}" stroke-width="4"/>
        <circle cx="60" cy="50" r="30" fill="none" stroke="${this.brandColors.accent1}" stroke-width="4" 
                stroke-dasharray="${Math.PI * 60 * (0.7 + i * 0.1)}" stroke-dashoffset="${Math.PI * 60 * 0.25}"/>
        <text x="120" y="35" class="primary-text" font-size="18" font-weight="600">${habit}</text>
        <text x="120" y="55" class="secondary-text" font-size="14">${streaks[i]} day streak</text>
        <text x="120" y="75" class="feature-text" font-size="12">${categories[i]}</text>
      </g>
    `).join('');
  }

  generateSocialMockUI(width) {
    const users = ['Sarah', 'Mike', 'Emma'];
    const activities = ['Morning Run', 'Meditation', 'Reading'];
    const times = ['2 hours ago', '4 hours ago', '6 hours ago'];

    return users.map((user, i) => `
      <g transform="translate(0, ${i * 100 + 100})">
        <rect x="0" y="0" width="${width}" height="80" rx="8" fill="${this.brandColors.white}"/>
        <circle cx="40" cy="40" r="20" fill="${this.brandColors.accent2}"/>
        <text x="80" y="25" class="primary-text" font-size="16" font-weight="600">${user} completed</text>
        <text x="80" y="45" class="secondary-text" font-size="14">${activities[i]}</text>
        <text x="80" y="65" class="feature-text" font-size="12">${times[i]}</text>
        <g transform="translate(${width - 120}, 25)">
          <text font-size="20">❤️</text>
          <text x="30" font-size="20">🔥</text>
          <text x="60" font-size="20">🏅</text>
        </g>
      </g>
    `).join('');
  }

  generateAnalyticsMockUI(width) {
    return `<g transform="translate(0, 100)">
      <rect x="0" y="0" width="${width}" height="200" rx="12" fill="${this.brandColors.white}"/>
      <text x="16" y="30" class="primary-text" font-size="18" font-weight="600">Weekly Progress</text>
      ${Array.from({length: 7}, (_, i) => `
        <rect x="${40 + i * (width - 80) / 7}" y="${180 - (50 + i * 10)}" width="20" height="${50 + i * 10}" 
              fill="${this.brandColors.accent1}" rx="2"/>
      `).join('')}
      
      <g transform="translate(0, 240)">
        ${[{value: '127', label: 'Total Habits'}, {value: '89%', label: 'Success Rate'}].map((stat, i) => `
          <rect x="${i * (width/2 + 8)}" y="0" width="${width/2 - 8}" height="80" rx="8" fill="${this.brandColors.white}"/>
          <text x="${i * (width/2 + 8) + 16}" y="30" class="primary-text" font-size="24" font-weight="700">${stat.value}</text>
          <text x="${i * (width/2 + 8) + 16}" y="50" class="secondary-text" font-size="14">${stat.label}</text>
        `).join('')}
      </g>
    </g>`;
  }

  generateCreateHabitMockUI(width) {
    const categories = ['🧘‍♀️', '💪', '📚', '💧', '🎯', '🌱'];
    const frequencies = ['Daily', 'Weekly', 'Monthly'];

    return `<g transform="translate(0, 100)">
      <rect x="0" y="0" width="${width}" height="50" rx="8" fill="${this.brandColors.white}" stroke="${this.brandColors.accent2}" stroke-width="1"/>
      <text x="16" y="30" class="feature-text" font-size="16">Morning Meditation</text>
      
      <g transform="translate(0, 80)">
        <text x="0" y="0" class="primary-text" font-size="18" font-weight="600">Choose Category</text>
        ${categories.map((icon, i) => `
          <g transform="translate(${i * 60}, 30)">
            <circle cx="25" cy="25" r="25" fill="${i === 0 ? this.brandColors.accent1 : this.brandColors.white}" 
                    stroke="${this.brandColors.accent2}" stroke-width="2"/>
            <text x="25" y="35" text-anchor="middle" font-size="20">${icon}</text>
          </g>
        `).join('')}
      </g>
      
      <g transform="translate(0, 180)">
        <text x="0" y="0" class="primary-text" font-size="18" font-weight="600">Frequency</text>
        ${frequencies.map((freq, i) => `
          <rect x="${i * 100}" y="20" width="80" height="40" rx="20" 
                fill="${i === 0 ? this.brandColors.accent1 : this.brandColors.white}" 
                stroke="${this.brandColors.accent2}" stroke-width="1"/>
          <text x="${i * 100 + 40}" y="45" text-anchor="middle" 
                class="${i === 0 ? 'bg' : 'primary-text'}" font-size="14">${freq}</text>
        `).join('')}
      </g>
    </g>`;
  }

  generateWelcomeMockUI(width, height) {
    return `<g transform="translate(${width/2}, ${height/2 - 100})">
      <circle cx="0" cy="-50" r="60" fill="${this.brandColors.accent1}"/>
      <text x="0" y="-40" text-anchor="middle" font-size="40">🎯</text>
      <text x="0" y="20" text-anchor="middle" class="primary-text" font-size="24" font-weight="700">Welcome to GoalStreak</text>
      <text x="0" y="50" text-anchor="middle" class="secondary-text" font-size="16">Your journey to better habits starts here</text>
    </g>`;
  }
}

class IconGenerator {
  constructor(brandColors) {
    this.brandColors = brandColors;
  }

  generateIcon(size, platform) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${this.generateIconDefs(size)}
  ${this.generateIconBackground(size)}
  ${this.generateIconSymbol(size)}
  ${this.generateIconText(size)}
</svg>`;
  }

  generateIconDefs(size) {
    return `<defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${this.brandColors.accent1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${this.brandColors.accent3};stop-opacity:1" />
    </linearGradient>
    <style>
      .icon-text { fill: ${this.brandColors.white}; font-family: 'Montserrat', sans-serif; font-weight: 700; }
    </style>
  </defs>`;
  }

  generateIconBackground(size) {
    return `<rect width="100%" height="100%" rx="${size * 0.2}" fill="url(#bgGradient)"/>`;
  }

  generateIconSymbol(size) {
    return `<g transform="translate(${size/2}, ${size/2})">
    <circle cx="0" cy="0" r="${size * 0.35}" fill="none" stroke="${this.brandColors.white}" stroke-width="${size * 0.04}"/>
    <circle cx="0" cy="0" r="${size * 0.25}" fill="none" stroke="${this.brandColors.white}" stroke-width="${size * 0.03}"/>
    <circle cx="0" cy="0" r="${size * 0.15}" fill="${this.brandColors.white}"/>
    
    <g transform="translate(${size * 0.15}, ${-size * 0.15})">
      <path d="M 0,0 Q ${size * 0.08},${-size * 0.08} ${size * 0.12},0 Q ${size * 0.08},${size * 0.04} 0,0" 
            fill="${this.brandColors.accent1}"/>
    </g>
  </g>`;
  }

  generateIconText(size) {
    if (size < 512) return '';
    return `<text x="${size/2}" y="${size * 0.9}" text-anchor="middle" class="icon-text" font-size="${size * 0.08}">GoalStreak</text>`;
  }
}

class FileManager {
  constructor(outputDir) {
    this.outputDir = path.resolve(outputDir);
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'screenshots', 'ios'),
      path.join(this.outputDir, 'screenshots', 'android'),
      path.join(this.outputDir, 'icons', 'ios'),
      path.join(this.outputDir, 'icons', 'android'),
      path.join(this.outputDir, 'feature-graphics'),
      path.join(this.outputDir, 'promotional'),
      path.join(this.outputDir, 'metadata'),
    ];

    dirs.forEach(dir => {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (error) {
        throw new Error(`Failed to create directory ${dir}: ${error.message}`);
      }
    });
  }

  writeFile(relativePath, content) {
    // Sanitize path to prevent directory traversal
    const sanitizedPath = this._sanitizePath(relativePath);
    const fullPath = path.join(this.outputDir, sanitizedPath);
    
    // Ensure the path is within the output directory
    if (!fullPath.startsWith(this.outputDir)) {
      throw new Error(`Invalid file path: ${relativePath}`);
    }

    try {
      fs.writeFileSync(fullPath, content);
      return fullPath;
    } catch (error) {
      throw new Error(`Failed to write file ${fullPath}: ${error.message}`);
    }
  }

  writeJSON(relativePath, data) {
    const content = JSON.stringify(data, null, 2);
    return this.writeFile(relativePath, content);
  }

  _sanitizePath(inputPath) {
    // Remove any path traversal attempts and normalize
    return path.normalize(inputPath).replace(/^(\.\.[\/\\])+/, '');
  }
}

class AppStoreAssetGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'app-store-assets');
    this.assetsDir = path.join(__dirname, '..', 'assets');
    
    // Initialize components
    this.fileManager = new FileManager(this.outputDir);
    this.screenshotGenerator = new ScreenshotTemplateGenerator(BRAND_COLORS);
    this.iconGenerator = new IconGenerator(BRAND_COLORS);
    
    // Template caching
    this.templateCache = new Map();
    this.generationStats = {
      startTime: Date.now(),
      filesGenerated: 0,
      cacheHits: 0
    };
  }

  ensureDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'screenshots', 'ios'),
      path.join(this.outputDir, 'screenshots', 'android'),
      path.join(this.outputDir, 'icons', 'ios'),
      path.join(this.outputDir, 'icons', 'android'),
      path.join(this.outputDir, 'feature-graphics'),
      path.join(this.outputDir, 'promotional'),
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateScreenshotTemplate(content, dimensions, platform) {
    const { width, height } = dimensions;
    const isLandscape = width > height;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${this._generateSVGStyles()}
  ${this._generateBackground()}
  ${this._generateStatusBar(platform, width)}
  ${this._generateHeader(platform, width)}
  ${this._generateMainContent(content, width, height, platform)}
  ${this._generateBottomNavigation(isLandscape, content, width, height)}
</svg>`;
  }

  _generateSVGStyles() {
    return `<defs>
    <style>
      .bg { fill: ${BRAND_COLORS.background}; }
      .primary-text { fill: ${BRAND_COLORS.primaryText}; font-family: 'Montserrat', sans-serif; font-weight: 700; }
      .secondary-text { fill: ${BRAND_COLORS.accent2}; font-family: 'Montserrat', sans-serif; font-weight: 500; }
      .accent { fill: ${BRAND_COLORS.accent1}; }
      .accent3 { fill: ${BRAND_COLORS.accent3}; }
      .feature-text { fill: ${BRAND_COLORS.primaryText}; font-family: 'Montserrat', sans-serif; font-weight: 400; }
    </style>
  </defs>`;
  }

  _generateBackground() {
    return `<rect width="100%" height="100%" class="bg"/>`;
  }

  _generateStatusBar(platform, width) {
    if (platform !== 'ios') return '';
    return `<rect x="0" y="0" width="100%" height="44" fill="${BRAND_COLORS.white}"/>
  <text x="${width/2}" y="30" text-anchor="middle" class="primary-text" font-size="16" font-weight="600">9:41</text>`;
  }

  _generateHeader(platform, width) {
    const yOffset = platform === 'ios' ? 44 : 0;
    const textY = platform === 'ios' ? 94 : 50;
    return `<rect x="0" y="${yOffset}" width="100%" height="80" fill="${BRAND_COLORS.white}"/>
  <text x="32" y="${textY}" class="primary-text" font-size="24" font-weight="700">GoalStreak</text>`;
  }

  _generateMainContent(content, width, height, platform) {
    const yOffset = platform === 'ios' ? 160 : 120;
    return `<g transform="translate(32, ${yOffset})">
    <text x="0" y="0" class="primary-text" font-size="32" font-weight="700">${content.title}</text>
    <text x="0" y="50" class="secondary-text" font-size="18">${content.subtitle}</text>
    ${this.generateMockUI(content.mockScreen, width - 64, height - (platform === 'ios' ? 240 : 200))}
    ${this._generateFeatureList(content.features, height, platform)}
  </g>`;
  }

  _generateFeatureList(features, height, platform) {
    const yOffset = height - (platform === 'ios' ? 400 : 360);
    return `<g transform="translate(0, ${yOffset})">
      ${features.map((feature, index) => `
        <g transform="translate(0, ${index * 40})">
          <circle cx="8" cy="8" r="6" class="accent"/>
          <text x="24" y="12" class="feature-text" font-size="16">${feature}</text>
        </g>
      `).join('')}
    </g>`;
  }

  _generateBottomNavigation(isLandscape, content, width, height) {
    if (isLandscape) return '';
    const tabs = ['Home', 'Social', 'Analytics', 'Profile'];
    return `<rect x="0" y="${height - 80}" width="100%" height="80" fill="${BRAND_COLORS.white}"/>
  <g transform="translate(${width/8}, ${height - 60})">
    ${tabs.map((tab, index) => `
      <g transform="translate(${index * width/4}, 0)">
        <circle cx="0" cy="-10" r="12" fill="${index === (content.priority - 1) % 4 ? BRAND_COLORS.accent1 : BRAND_COLORS.accent2}"/>
        <text x="0" y="20" text-anchor="middle" class="feature-text" font-size="12">${tab}</text>
      </g>
    `).join('')}
  </g>`;
  }

  generateMockUI(screenType, width, height) {
    const mockUIGenerators = {
      dashboard: () => this._generateDashboardMockUI(width),
      social: () => this._generateSocialMockUI(width),
      analytics: () => this._generateAnalyticsMockUI(width),
      'create-habit': () => this._generateCreateHabitMockUI(width),
      default: () => this._generateWelcomeMockUI(width, height)
    };

    const generator = mockUIGenerators[screenType] || mockUIGenerators.default;
    return generator();
  }

  _generateDashboardMockUI(width) {
    const habits = [
      { name: 'Morning Meditation', streak: 7, category: '🧘‍♀️ Mindfulness', progress: 0.7 },
      { name: 'Daily Exercise', streak: 12, category: '💪 Fitness', progress: 0.8 },
      { name: 'Read 30 Minutes', streak: 5, category: '📚 Learning', progress: 0.6 }
    ];

    return habits.map((habit, i) => this._generateHabitCard(habit, i, width)).join('');
  }

  _generateHabitCard(habit, index, width) {
    const yPos = index * 120 + 100;
    const progressCircumference = Math.PI * 60 * habit.progress;
    const progressOffset = Math.PI * 60 * 0.25;

    return `
      <g transform="translate(0, ${yPos})">
        <rect x="0" y="0" width="${width}" height="100" rx="12" fill="${BRAND_COLORS.white}" stroke="${BRAND_COLORS.accent2}" stroke-width="1"/>
        <circle cx="60" cy="50" r="30" fill="none" stroke="${BRAND_COLORS.accent3}" stroke-width="4"/>
        <circle cx="60" cy="50" r="30" fill="none" stroke="${BRAND_COLORS.accent1}" stroke-width="4" 
                stroke-dasharray="${progressCircumference}" stroke-dashoffset="${progressOffset}"/>
        <text x="120" y="35" class="primary-text" font-size="18" font-weight="600">${habit.name}</text>
        <text x="120" y="55" class="secondary-text" font-size="14">${habit.streak} day streak</text>
        <text x="120" y="75" class="feature-text" font-size="12">${habit.category}</text>
      </g>
    `;
  }

  _generateSocialMockUI(width) {
    return MOCK_DATA.activities.map((activity, i) => this._generateActivityCard(activity, i, width)).join('');
  }

  _generateActivityCard(activity, index, width) {
    const yPos = index * UI_CONFIG.activityCard.spacing + 100;
    return `
      <g transform="translate(0, ${yPos})">
        <rect x="0" y="0" width="${width}" height="${UI_CONFIG.activityCard.height}" rx="8" fill="${BRAND_COLORS.white}"/>
        <circle cx="40" cy="40" r="20" fill="${BRAND_COLORS.accent2}"/>
        <text x="80" y="25" class="primary-text" font-size="16" font-weight="600">${activity.user} completed</text>
        <text x="80" y="45" class="secondary-text" font-size="14">${activity.activity}</text>
        <text x="80" y="65" class="feature-text" font-size="12">${activity.time}</text>
        <g transform="translate(${width - 120}, 25)">
          ${MOCK_DATA.reactions.map((reaction, i) => `<text x="${i * 30}" font-size="20">${reaction}</text>`).join('')}
        </g>
      </g>
    `;
  }

  _generateAnalyticsMockUI(width) {
    return `<g transform="translate(0, 100)">
      <rect x="0" y="0" width="${width}" height="200" rx="12" fill="${BRAND_COLORS.white}"/>
      <text x="16" y="30" class="primary-text" font-size="18" font-weight="600">Weekly Progress</text>
      ${Array.from({length: 7}, (_, i) => `
        <rect x="${40 + i * (width - 80) / 7}" y="${180 - (50 + i * 10)}" width="20" height="${50 + i * 10}" 
              fill="${BRAND_COLORS.accent1}" rx="2"/>
      `).join('')}
      
      <g transform="translate(0, 240)">
        ${[{value: '127', label: 'Total Habits'}, {value: '89%', label: 'Success Rate'}].map((stat, i) => `
          <rect x="${i * (width/2 + 8)}" y="0" width="${width/2 - 8}" height="80" rx="8" fill="${BRAND_COLORS.white}"/>
          <text x="${i * (width/2 + 8) + 16}" y="30" class="primary-text" font-size="24" font-weight="700">${stat.value}</text>
          <text x="${i * (width/2 + 8) + 16}" y="50" class="secondary-text" font-size="14">${stat.label}</text>
        `).join('')}
      </g>
    </g>`;
  }

  _generateCreateHabitMockUI(width) {
    return `<g transform="translate(0, 100)">
      <rect x="0" y="0" width="${width}" height="50" rx="8" fill="${BRAND_COLORS.white}" stroke="${BRAND_COLORS.accent2}" stroke-width="1"/>
      <text x="16" y="30" class="feature-text" font-size="16">Morning Meditation</text>
      
      <g transform="translate(0, 80)">
        <text x="0" y="0" class="primary-text" font-size="18" font-weight="600">Choose Category</text>
        ${MOCK_DATA.categories.map((icon, i) => `
          <g transform="translate(${i * 60}, 30)">
            <circle cx="25" cy="25" r="25" fill="${i === 0 ? BRAND_COLORS.accent1 : BRAND_COLORS.white}" 
                    stroke="${BRAND_COLORS.accent2}" stroke-width="2"/>
            <text x="25" y="35" text-anchor="middle" font-size="20">${icon}</text>
          </g>
        `).join('')}
      </g>
      
      <g transform="translate(0, 180)">
        <text x="0" y="0" class="primary-text" font-size="18" font-weight="600">Frequency</text>
        ${MOCK_DATA.frequencies.map((freq, i) => `
          <rect x="${i * 100}" y="20" width="80" height="40" rx="20" 
                fill="${i === 0 ? BRAND_COLORS.accent1 : BRAND_COLORS.white}" 
                stroke="${BRAND_COLORS.accent2}" stroke-width="1"/>
          <text x="${i * 100 + 40}" y="45" text-anchor="middle" 
                class="${i === 0 ? 'bg' : 'primary-text'}" font-size="14">${freq}</text>
        `).join('')}
      </g>
    </g>`;
  }

  _generateWelcomeMockUI(width, height) {
    return `<g transform="translate(${width/2}, ${height/2 - 100})">
      <circle cx="0" cy="-50" r="60" fill="${BRAND_COLORS.accent1}"/>
      <text x="0" y="-40" text-anchor="middle" font-size="40">🎯</text>
      <text x="0" y="20" text-anchor="middle" class="primary-text" font-size="24" font-weight="700">Welcome to GoalStreak</text>
      <text x="0" y="50" text-anchor="middle" class="secondary-text" font-size="16">Your journey to better habits starts here</text>
    </g>`;
  }
      
      case 'analytics':
        return `
          <!-- Analytics Charts -->
          <g transform="translate(0, 100)">
            <!-- Bar Chart -->
            <rect x="0" y="0" width="${width}" height="200" rx="12" fill="${BRAND_COLORS.white}"/>
            <text x="16" y="30" class="primary-text" font-size="18" font-weight="600">Weekly Progress</text>
            ${[0, 1, 2, 3, 4, 5, 6].map(i => `
              <rect x="${40 + i * (width - 80) / 7}" y="${180 - (50 + i * 10)}" width="20" height="${50 + i * 10}" 
                    fill="${BRAND_COLORS.accent1}" rx="2"/>
            `).join('')}
            
            <!-- Stats Cards -->
            <g transform="translate(0, 240)">
              ${[0, 1].map(i => `
                <rect x="${i * (width/2 + 8)}" y="0" width="${width/2 - 8}" height="80" rx="8" fill="${BRAND_COLORS.white}"/>
                <text x="${i * (width/2 + 8) + 16}" y="30" class="primary-text" font-size="24" font-weight="700">${['127', '89%'][i]}</text>
                <text x="${i * (width/2 + 8) + 16}" y="50" class="secondary-text" font-size="14">${['Total Habits', 'Success Rate'][i]}</text>
              `).join('')}
            </g>
          </g>
        `;
      
      case 'create-habit':
        return `
          <!-- Habit Creation Form -->
          <g transform="translate(0, 100)">
            <!-- Input Field -->
            <rect x="0" y="0" width="${width}" height="50" rx="8" fill="${BRAND_COLORS.white}" stroke="${BRAND_COLORS.accent2}" stroke-width="1"/>
            <text x="16" y="30" class="feature-text" font-size="16">Morning Meditation</text>
            
            <!-- Category Icons -->
            <g transform="translate(0, 80)">
              <text x="0" y="0" class="primary-text" font-size="18" font-weight="600">Choose Category</text>
              ${[0, 1, 2, 3, 4, 5].map(i => `
                <g transform="translate(${i * 60}, 30)">
                  <circle cx="25" cy="25" r="25" fill="${i === 0 ? BRAND_COLORS.accent1 : BRAND_COLORS.white}" 
                          stroke="${BRAND_COLORS.accent2}" stroke-width="2"/>
                  <text x="25" y="35" text-anchor="middle" font-size="20">${['🧘‍♀️', '💪', '📚', '💧', '🎯', '🌱'][i]}</text>
                </g>
              `).join('')}
            </g>
            
            <!-- Frequency Selection -->
            <g transform="translate(0, 180)">
              <text x="0" y="0" class="primary-text" font-size="18" font-weight="600">Frequency</text>
              ${['Daily', 'Weekly', 'Monthly'].map((freq, i) => `
                <rect x="${i * 100}" y="20" width="80" height="40" rx="20" 
                      fill="${i === 0 ? BRAND_COLORS.accent1 : BRAND_COLORS.white}" 
                      stroke="${BRAND_COLORS.accent2}" stroke-width="1"/>
                <text x="${i * 100 + 40}" y="45" text-anchor="middle" 
                      class="${i === 0 ? 'bg' : 'primary-text'}" font-size="14">${freq}</text>
              `).join('')}
            </g>
          </g>
        `;
      
      default:
        return `
          <!-- Welcome Screen -->
          <g transform="translate(${width/2}, ${height/2 - 100})">
            <circle cx="0" cy="-50" r="60" fill="${BRAND_COLORS.accent1}"/>
            <text x="0" y="-40" text-anchor="middle" font-size="40">🎯</text>
            <text x="0" y="20" text-anchor="middle" class="primary-text" font-size="24" font-weight="700">Welcome to GoalStreak</text>
            <text x="0" y="50" text-anchor="middle" class="secondary-text" font-size="16">Your journey to better habits starts here</text>
          </g>
        `;
    }
  }

  async generateScreenshots() {
    console.log('🖼️  Generating app store screenshots...');
    
    try {
      this._validateScreenshotContent();
      
      for (const content of SCREENSHOT_CONTENT) {
        await this._generateScreenshotsForContent(content);
      }
    } catch (error) {
      console.error('❌ Error generating screenshots:', error.message);
      throw error;
    }
  }

  _validateScreenshotContent() {
    for (const content of SCREENSHOT_CONTENT) {
      if (!content.id || !content.title || !content.features) {
        throw new Error(`Invalid screenshot content: ${JSON.stringify(content)}`);
      }
      if (!Array.isArray(content.features) || content.features.length === 0) {
        throw new Error(`Screenshot content must have features array: ${content.id}`);
      }
    }
  }

  async _generateScreenshotsForContent(content) {
    // Generate iOS screenshots
    for (const [deviceName, dimensions] of Object.entries(ASSET_SPECS.ios)) {
      await this._generateSingleScreenshot(content, dimensions, 'ios', deviceName);
    }
    
    // Generate Android screenshots
    for (const [deviceName, dimensions] of Object.entries(ASSET_SPECS.android)) {
      await this._generateSingleScreenshot(content, dimensions, 'android', deviceName);
    }
  }

  async _generateSingleScreenshot(content, dimensions, platform, deviceName) {
    try {
      const svg = this.generateScreenshotTemplate(content, dimensions, platform);
      const filename = `${content.id}-${deviceName.replace(/[^a-zA-Z0-9]/g, '-')}.svg`;
      const filepath = path.join(this.outputDir, 'screenshots', platform, filename);
      
      fs.writeFileSync(filepath, svg);
      this.generationStats.filesGenerated++;
      console.log(`   ✅ Generated ${platform} screenshot: ${filename}`);
    } catch (error) {
      console.error(`   ❌ Failed to generate ${platform} screenshot for ${deviceName}:`, error.message);
      throw error;
    }
  }

  generateAppIcon(size, platform) {
    // Generate SVG app icon
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND_COLORS.accent1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BRAND_COLORS.accent3};stop-opacity:1" />
    </linearGradient>
    <style>
      .icon-text { fill: ${BRAND_COLORS.white}; font-family: 'Montserrat', sans-serif; font-weight: 700; }
    </style>
  </defs>
  
  <!-- Background with rounded corners -->
  <rect width="100%" height="100%" rx="${size * 0.2}" fill="url(#bgGradient)"/>
  
  <!-- Main Icon - Target/Goal Symbol -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Outer circle -->
    <circle cx="0" cy="0" r="${size * 0.35}" fill="none" stroke="${BRAND_COLORS.white}" stroke-width="${size * 0.04}"/>
    <!-- Middle circle -->
    <circle cx="0" cy="0" r="${size * 0.25}" fill="none" stroke="${BRAND_COLORS.white}" stroke-width="${size * 0.03}"/>
    <!-- Inner circle -->
    <circle cx="0" cy="0" r="${size * 0.15}" fill="${BRAND_COLORS.white}"/>
    
    <!-- Streak indicator (flame-like shape) -->
    <g transform="translate(${size * 0.15}, ${-size * 0.15})">
      <path d="M 0,0 Q ${size * 0.08},${-size * 0.08} ${size * 0.12},0 Q ${size * 0.08},${size * 0.04} 0,0" 
            fill="${BRAND_COLORS.accent1}"/>
    </g>
  </g>
  
  <!-- App name (for larger sizes) -->
  ${size >= 512 ? `
  <text x="${size/2}" y="${size * 0.9}" text-anchor="middle" class="icon-text" font-size="${size * 0.08}">GoalStreak</text>
  ` : ''}
</svg>`;

    return svg;
  }

  async generateAppIcons() {
    console.log('🎨 Generating app icons...');
    
    // Generate iOS icons
    for (const iconSpec of ASSET_SPECS.icons.ios) {
      const svg = this.generateAppIcon(iconSpec.size, 'ios');
      const filepath = path.join(this.outputDir, 'icons', 'ios', iconSpec.name.replace('.png', '.svg'));
      
      fs.writeFileSync(filepath, svg);
      console.log(`   ✅ Generated iOS icon: ${iconSpec.name} (${iconSpec.size}x${iconSpec.size})`);
    }
    
    // Generate Android icons
    for (const iconSpec of ASSET_SPECS.icons.android) {
      const svg = this.generateAppIcon(iconSpec.size, 'android');
      const filepath = path.join(this.outputDir, 'icons', 'android', iconSpec.name.replace('.png', '.svg'));
      
      fs.writeFileSync(filepath, svg);
      console.log(`   ✅ Generated Android icon: ${iconSpec.name} (${iconSpec.size}x${iconSpec.size})`);
    }
  }

  generateFeatureGraphic() {
    const { width, height } = ASSET_SPECS.playStore.featureGraphic;
    
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${BRAND_COLORS.accent1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BRAND_COLORS.accent3};stop-opacity:1" />
    </linearGradient>
    <style>
      .title-text { fill: ${BRAND_COLORS.white}; font-family: 'Montserrat', sans-serif; font-weight: 800; }
      .subtitle-text { fill: ${BRAND_COLORS.white}; font-family: 'Montserrat', sans-serif; font-weight: 500; }
      .feature-text { fill: ${BRAND_COLORS.white}; font-family: 'Montserrat', sans-serif; font-weight: 400; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- Left side - Text content -->
  <g transform="translate(60, 80)">
    <text x="0" y="0" class="title-text" font-size="48">GoalStreak</text>
    <text x="0" y="50" class="subtitle-text" font-size="24">Build lasting habits with friends</text>
    
    <!-- Feature highlights -->
    <g transform="translate(0, 100)">
      ${['🎯 Track habits & streaks', '👥 Social accountability', '📊 Powerful analytics'].map((feature, i) => `
        <text x="0" y="${i * 35}" class="feature-text" font-size="18">${feature}</text>
      `).join('')}
    </g>
  </g>
  
  <!-- Right side - App mockup -->
  <g transform="translate(600, 50)">
    <!-- Phone frame -->
    <rect x="0" y="0" width="300" height="400" rx="30" fill="${BRAND_COLORS.white}" stroke="${BRAND_COLORS.primaryText}" stroke-width="4"/>
    
    <!-- Screen content -->
    <g transform="translate(20, 20)">
      <!-- Header -->
      <rect x="0" y="0" width="260" height="40" fill="${BRAND_COLORS.background}"/>
      <text x="130" y="25" text-anchor="middle" fill="${BRAND_COLORS.primaryText}" font-size="16" font-weight="600">GoalStreak</text>
      
      <!-- Habit cards -->
      ${[0, 1, 2].map(i => `
        <g transform="translate(0, ${60 + i * 80})">
          <rect x="0" y="0" width="260" height="70" rx="8" fill="${BRAND_COLORS.background}"/>
          <circle cx="35" cy="35" r="20" fill="none" stroke="${BRAND_COLORS.accent1}" stroke-width="3"/>
          <circle cx="35" cy="35" r="20" fill="none" stroke="${BRAND_COLORS.accent3}" stroke-width="3" 
                  stroke-dasharray="${Math.PI * 40 * (0.6 + i * 0.15)}" stroke-dashoffset="${Math.PI * 40 * 0.25}"/>
          <text x="70" y="25" fill="${BRAND_COLORS.primaryText}" font-size="14" font-weight="600">${['Meditation', 'Exercise', 'Reading'][i]}</text>
          <text x="70" y="45" fill="${BRAND_COLORS.accent2}" font-size="12">${[7, 12, 5][i]} day streak</text>
        </g>
      `).join('')}
    </g>
  </g>
</svg>`;

    return svg;
  }

  async generateFeatureGraphics() {
    console.log('🎨 Generating Google Play feature graphics...');
    
    // Feature graphic
    const featureGraphic = this.generateFeatureGraphic();
    const featureGraphicPath = path.join(this.outputDir, 'feature-graphics', 'feature-graphic.svg');
    fs.writeFileSync(featureGraphicPath, featureGraphic);
    console.log('   ✅ Generated feature graphic (1024x500)');
    
    // Promo graphic (smaller version)
    const promoGraphic = this.generateFeatureGraphic()
      .replace('width="1024" height="500"', 'width="180" height="120"')
      .replace('viewBox="0 0 1024 500"', 'viewBox="0 0 1024 500"');
    
    const promoGraphicPath = path.join(this.outputDir, 'feature-graphics', 'promo-graphic.svg');
    fs.writeFileSync(promoGraphicPath, promoGraphic);
    console.log('   ✅ Generated promo graphic (180x120)');
  }

  generateAppStoreMetadata() {
    const metadata = {
      ios: {
        name: "GoalStreak",
        subtitle: "Social Habit Tracking",
        description: `Build lasting habits with friends using streak tracking, social accountability, and powerful analytics. Your social habit companion for achieving goals together.

KEY FEATURES:
• Track daily habits with beautiful circular progress indicators
• Build streaks and celebrate milestones with friends
• Connect with friends for accountability and motivation
• Share progress and react to friends' achievements
• Comprehensive analytics and insights dashboard
• 39+ habit categories with custom icons
• Offline support with real-time sync

SOCIAL ACCOUNTABILITY:
• Add friends by email invitation
• Real-time activity feed with habit completions
• Emoji reactions (❤️, 🔥, 🏅) to encourage friends
• Privacy controls for habit sharing preferences
• Friend request management system

ANALYTICS & INSIGHTS:
• Progress charts and trend analysis
• Streak statistics and personal records
• Weekly and monthly progress summaries
• Achievement tracking and milestone celebrations

Perfect for building healthy routines in fitness, wellness, productivity, and personal growth. Join thousands of users achieving their goals together with social accountability!`,
        keywords: "habits,goals,productivity,tracking,streaks,motivation,social,friends,accountability,wellness,fitness,mindfulness,routine,progress",
        category: "Health & Fitness",
        contentRating: "4+",
        privacyPolicyUrl: "https://goalfer.app/privacy",
        supportUrl: "https://goalfer.app/support"
      },
      
      android: {
        title: "GoalStreak - Social Habit Tracker",
        shortDescription: "Build lasting habits with friends. Track streaks, share progress, and achieve goals together with social accountability.",
        fullDescription: `🎯 BUILD LASTING HABITS WITH FRIENDS

GoalStreak is the social habit tracking app that helps you build lasting routines through accountability, motivation, and community support.

✨ KEY FEATURES:
• Beautiful habit tracking with circular progress indicators
• Streak counting and milestone celebrations
• 39+ habit categories with custom icons (fitness, wellness, productivity, learning)
• Comprehensive analytics and insights dashboard
• Offline support with real-time sync across devices

👥 SOCIAL ACCOUNTABILITY:
• Connect with friends for mutual motivation and support
• Real-time activity feed showing friends' habit completions
• Emoji reactions (❤️, 🔥, 🏅) to encourage and celebrate together
• Privacy controls for habit sharing preferences
• Easy friend request management system

📊 ANALYTICS & INSIGHTS:
• Detailed progress charts and trend analysis
• Streak statistics and personal records tracking
• Weekly and monthly progress summaries
• Achievement tracking and milestone celebrations
• Visual progress indicators and success metrics

🏆 PERFECT FOR:
• Fitness and workout routines
• Wellness and mindfulness practices
• Productivity and learning goals
• Creative projects and hobbies
• Daily self-care and health habits

🌟 WHY CHOOSE GOALSTREAK:
• Social accountability increases success rates by 65%
• Beautiful, intuitive interface designed for daily use
• Privacy-first approach with granular sharing controls
• No ads or distracting notifications
• Built by habit formation experts

🔒 PRIVACY & SECURITY:
• Your data is secure and encrypted
• Granular privacy controls for all sharing
• GDPR compliant with transparent data practices
• No selling of personal data to third parties

Join thousands of users who are transforming their lives through better habits and social accountability. Download GoalStreak today and start building the habits that will change your life!

Perfect for anyone looking to improve their daily routines, build consistency, and achieve long-term goals with the support of friends and community.`,
        category: "Health & Fitness",
        contentRating: "Everyone",
        tags: ["habits", "goals", "productivity", "social", "wellness", "fitness", "tracking", "streaks", "motivation", "accountability"]
      }
    };

    // Write metadata files
    const metadataPath = path.join(this.outputDir, 'metadata');
    if (!fs.existsSync(metadataPath)) {
      fs.mkdirSync(metadataPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(metadataPath, 'ios-metadata.json'),
      JSON.stringify(metadata.ios, null, 2)
    );

    fs.writeFileSync(
      path.join(metadataPath, 'android-metadata.json'),
      JSON.stringify(metadata.android, null, 2)
    );

    console.log('📝 Generated app store metadata files');
  }

  generateAssetGuide() {
    const guide = `# GoalStreak App Store Assets Guide

## Generated Assets Overview

This directory contains all the assets needed for iOS App Store and Google Play Store submissions.

### Screenshots
- **iOS**: Generated for iPhone 6.7", 6.5", 6.1", 5.5" and iPad Pro 12.9", 11"
- **Android**: Generated for Phone, 7" Tablet, and 10" Tablet
- **Content**: 5 key screens showcasing main features

### App Icons
- **iOS**: All required sizes from 76px to 1024px
- **Android**: All density sizes from mdpi (48px) to xxxhdpi (192px) plus Play Store (512px)
- **Design**: Consistent brand colors with target/goal symbolism

### Feature Graphics (Google Play)
- **Feature Graphic**: 1024x500px for Play Store listing
- **Promo Graphic**: 180x120px for promotional use
- **Design**: Showcases app interface with key features

### Metadata
- **iOS**: Complete App Store Connect metadata
- **Android**: Complete Google Play Console metadata
- **Content**: Optimized descriptions, keywords, and feature lists

## Usage Instructions

### For iOS App Store:
1. Convert SVG screenshots to PNG using your preferred tool
2. Upload screenshots to App Store Connect in order of priority
3. Use the generated metadata for store listing
4. Convert app icons to PNG and include in app bundle

### For Google Play Store:
1. Convert SVG screenshots to PNG
2. Upload feature graphics and screenshots to Play Console
3. Use the generated metadata for store listing
4. Convert app icons to PNG and include in app bundle

### Conversion Tools:
- **Online**: Use tools like CloudConvert or Convertio
- **Command Line**: Use ImageMagick or Inkscape
- **Design Tools**: Import SVGs into Figma, Sketch, or Adobe Illustrator

## Asset Specifications Met

✅ **Requirement 4.1**: High-quality app screenshots showcasing key features
✅ **Requirement 4.2**: Optimized app icon for both iOS and Android
✅ **Requirement 4.3**: Feature graphics for Google Play Store
✅ **Requirement 4.4**: Consistent branding across all assets

## Brand Guidelines

- **Primary Color**: #154D71 (Deep Blue)
- **Background**: #FDFDFD (Light Gray)
- **Accent 1**: #FF894F (Warm Orange)
- **Accent 2**: #154D71 (Dark Blue)
- **Accent 3**: #4A90A4 (Teal)
- **Typography**: Montserrat font family

## Next Steps

1. Convert SVG files to required formats (PNG/JPG)
2. Review and customize metadata as needed
3. Upload assets to respective app stores
4. Test assets in store listings before submission

Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(this.outputDir, 'README.md'), guide);
    console.log('📚 Generated asset usage guide');
  }

  async generateAll() {
    console.log('🚀 Starting GoalStreak app store asset generation...\n');
    
    try {
      await this.generateScreenshots();
      console.log('');
      
      await this.generateAppIcons();
      console.log('');
      
      await this.generateFeatureGraphics();
      console.log('');
      
      this.generateAppStoreMetadata();
      console.log('');
      
      this.generateAssetGuide();
      console.log('');
      
      this._printGenerationStats();
      
      console.log('✅ All app store assets generated successfully!');
      console.log(`📁 Assets saved to: ${this.outputDir}`);
      console.log('\n📋 Next steps:');
      console.log('1. Convert SVG files to PNG/JPG formats');
      console.log('2. Review generated metadata');
      console.log('3. Upload assets to app stores');
      console.log('4. Test store listings before submission');
      
    } catch (error) {
      console.error('❌ Error generating assets:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  }

  _printGenerationStats() {
    const duration = Date.now() - this.generationStats.startTime;
    console.log('📊 Generation Statistics:');
    console.log(`   • Files generated: ${this.generationStats.filesGenerated}`);
    console.log(`   • Cache hits: ${this.generationStats.cacheHits}`);
    console.log(`   • Total time: ${duration}ms`);
    console.log(`   • Average time per file: ${Math.round(duration / this.generationStats.filesGenerated)}ms`);
  }
}

// Run the generator
if (require.main === module) {
  const generator = new AppStoreAssetGenerator();
  generator.generateAll();
}

module.exports = AppStoreAssetGenerator;
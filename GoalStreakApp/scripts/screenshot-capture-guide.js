#!/usr/bin/env node

/**
 * GoalStreak Screenshot Capture Guide
 * 
 * Comprehensive guide for capturing real app screenshots for app store submission
 */

const fs = require('fs');
const path = require('path');

class ScreenshotCaptureGuide {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'app-store-assets', 'real-screenshots');
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'ios'),
      path.join(this.outputDir, 'android'),
      path.join(this.outputDir, 'raw-captures'),
      path.join(this.outputDir, 'processed'),
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateCaptureGuide() {
    const guide = `# GoalStreak Real Screenshot Capture Guide

## 📱 Required Screenshots (Priority Order)

### 1. **Onboarding/Welcome Screen** (Highest Priority)
- **What to show**: App logo, welcome message, "Get Started" button
- **Why important**: First impression, shows app value proposition
- **Tip**: Make sure the screen is clean and welcoming

### 2. **Main Dashboard/Home Screen** (Critical)
- **What to show**: List of habits with progress circles, streaks visible
- **Sample habits to create**:
  - "Morning Meditation" (7-day streak, 70% complete)
  - "Daily Exercise" (12-day streak, 85% complete) 
  - "Read 30 Minutes" (5-day streak, 60% complete)
- **Why important**: Shows core functionality and progress tracking

### 3. **Social Feed Screen** (Unique Selling Point)
- **What to show**: Friends' activity feed with habit completions
- **Setup needed**: Add test friends, create sample activities
- **Include**: Emoji reactions (❤️, 🔥, 🏅), timestamps
- **Why important**: Differentiates from other habit apps

### 4. **Analytics Screen** (Value Demonstration)
- **What to show**: Progress charts, streak statistics, insights
- **Best after**: Using app for a few days to generate real data
- **Include**: Weekly progress chart, success rate stats
- **Why important**: Shows data-driven insights

### 5. **Create Habit Screen** (Functionality)
- **What to show**: Habit creation form, category icons, frequency options
- **Setup**: Show form partially filled with "Morning Yoga"
- **Include**: Category selection (🧘‍♀️), frequency (Daily)
- **Why important**: Shows customization options

## 🎯 Screenshot Capture Process

### Step 1: Prepare Test Data
\`\`\`bash
# 1. Create a test account with realistic name
# 2. Add 3-5 habits with different categories
# 3. Complete habits for several days to show streaks
# 4. Add test friends (use different email addresses)
# 5. Generate some social activity
\`\`\`

### Step 2: Device Setup
\`\`\`bash
# iOS Simulator Setup
npx expo run:ios

# Android Emulator Setup  
npx expo run:android

# Or use Expo Go on physical devices
npx expo start
\`\`\`

### Step 3: Capture Screenshots

#### iOS Capture Commands:
\`\`\`bash
# iPhone 14 Pro Max (6.7")
xcrun simctl io booted screenshot screenshot-6.7-inch.png

# iPhone 14 Plus (6.5") 
xcrun simctl io booted screenshot screenshot-6.5-inch.png

# iPhone 14 Pro (6.1")
xcrun simctl io booted screenshot screenshot-6.1-inch.png

# iPhone 8 Plus (5.5")
xcrun simctl io booted screenshot screenshot-5.5-inch.png

# iPad Pro 12.9"
xcrun simctl io booted screenshot screenshot-ipad-12.9.png
\`\`\`

#### Android Capture:
\`\`\`bash
# Use Android Studio Device Manager
# Or adb command:
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
\`\`\`

## 📐 Required Dimensions & Formats

### iOS App Store Requirements:
- **Format**: PNG or JPEG
- **Color space**: sRGB or P3
- **No transparency**: Solid backgrounds only
- **No status bar content**: Clean status bar preferred

| Device | Dimensions | Aspect Ratio |
|--------|------------|--------------|
| iPhone 6.7" | 1290×2796 | 19.5:9 |
| iPhone 6.5" | 1284×2778 | 19.5:9 |
| iPhone 6.1" | 1179×2556 | 19.5:9 |
| iPhone 5.5" | 1242×2208 | 16:9 |
| iPad Pro 12.9" | 2048×2732 | 4:3 |

### Google Play Requirements:
- **Format**: PNG or JPEG  
- **Minimum**: 320px on shortest side
- **Maximum**: 3840px on longest side
- **Aspect ratio**: Between 16:9 and 9:16

| Device Type | Dimensions | Notes |
|-------------|------------|-------|
| Phone | 1080×1920 | Standard Android |
| 7" Tablet | 1200×1920 | Small tablet |
| 10" Tablet | 1600×2560 | Large tablet |

## 🛠️ Screenshot Processing Tools

### Option 1: Design Tools (Recommended)
\`\`\`bash
# Figma (Free)
1. Import screenshots
2. Resize to exact dimensions
3. Add device frames (optional)
4. Export as PNG

# Sketch (Mac)
1. Create artboards with exact dimensions
2. Import screenshots
3. Resize and crop as needed
4. Export for app store
\`\`\`

### Option 2: Command Line Tools
\`\`\`bash
# Install ImageMagick
brew install imagemagick

# Resize screenshot to exact dimensions
magick input.png -resize 1290x2796! output.png

# Crop to specific area
magick input.png -crop 1290x2796+0+0 output.png
\`\`\`

### Option 3: Online Tools
- **Figma** (figma.com) - Free, browser-based
- **Canva** (canva.com) - Templates available
- **Photopea** (photopea.com) - Free Photoshop alternative

## 📱 Device Frame Enhancement (Optional)

### Add Device Frames for Better Presentation:
\`\`\`bash
# Facebook Device Frames
# Download from: facebook.github.io/design/devices

# Apple Device Frames  
# Available in Sketch, Figma templates

# Custom Frames
# Create minimal frames matching GoalStreak brand colors
\`\`\`

## 🎨 Screenshot Optimization Tips

### Visual Quality:
- **Clean status bar**: 9:41 AM, full battery, strong signal
- **Consistent lighting**: Use same time/battery across screenshots
- **No personal data**: Use placeholder names and data
- **High contrast**: Ensure text is readable at small sizes

### Content Strategy:
- **Show progression**: Screenshots should tell a story
- **Highlight unique features**: Emphasize social aspects
- **Use realistic data**: Believable habit names and streaks
- **Show success**: Display completed habits and achievements

### Brand Consistency:
- **Color accuracy**: Ensure GoalStreak colors are correct
- **Font rendering**: Check Montserrat font displays properly
- **Icon clarity**: Habit category icons should be crisp
- **UI elements**: Buttons and progress circles should be sharp

## 📋 Screenshot Checklist

### Before Capturing:
- [ ] Test account created with realistic profile
- [ ] 3-5 habits added with different categories
- [ ] Habits completed for multiple days (show streaks)
- [ ] Test friends added and social activity generated
- [ ] App running smoothly without bugs
- [ ] Device/simulator set to required dimensions

### During Capture:
- [ ] Status bar shows 9:41 AM (iOS standard)
- [ ] Battery at 100% or high level
- [ ] Strong network signal shown
- [ ] No notifications or alerts visible
- [ ] App content is centered and complete
- [ ] All text is readable and properly rendered

### After Capture:
- [ ] Screenshots saved in correct dimensions
- [ ] File names follow consistent pattern
- [ ] Images are high quality (no compression artifacts)
- [ ] Colors match GoalStreak brand palette
- [ ] All required device sizes captured
- [ ] Screenshots tell cohesive story

## 📂 File Organization

### Recommended File Structure:
\`\`\`
real-screenshots/
├── raw-captures/           # Original screenshots from devices
│   ├── ios/
│   └── android/
├── processed/              # Resized and optimized
│   ├── ios/
│   │   ├── iphone-6.7/
│   │   ├── iphone-6.5/
│   │   ├── iphone-6.1/
│   │   ├── iphone-5.5/
│   │   └── ipad-12.9/
│   └── android/
│       ├── phone/
│       ├── tablet-7/
│       └── tablet-10/
└── final/                  # App store ready files
    ├── ios/
    └── android/
\`\`\`

### File Naming Convention:
\`\`\`
# iOS
01-onboarding-iphone-6.7.png
02-dashboard-iphone-6.7.png
03-social-iphone-6.7.png
04-analytics-iphone-6.7.png
05-create-habit-iphone-6.7.png

# Android  
01-onboarding-phone.png
02-dashboard-phone.png
03-social-phone.png
04-analytics-phone.png
05-create-habit-phone.png
\`\`\`

## 🚀 Quick Start Commands

### 1. Set up test environment:
\`\`\`bash
# Start development server
cd GoalStreakApp
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
\`\`\`

### 2. Create this directory structure:
\`\`\`bash
mkdir -p app-store-assets/real-screenshots/{ios,android,raw-captures,processed,final}
\`\`\`

### 3. Capture screenshots:
\`\`\`bash
# Navigate through app and capture each screen
# Save to raw-captures directory
# Process and resize for final submission
\`\`\`

## 📞 Need Help?

If you encounter issues:
1. **App crashes**: Check console logs, fix bugs first
2. **Wrong dimensions**: Use design tools to resize precisely  
3. **Poor quality**: Capture on higher resolution devices
4. **Missing features**: Ensure all app functionality works

Remember: Real screenshots showing actual app functionality are required for app store approval. Take time to create compelling, high-quality captures that showcase GoalStreak's unique social habit tracking features!

Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(this.outputDir, 'CAPTURE_GUIDE.md'), guide);
    console.log('📚 Screenshot capture guide generated');
  }

  generateProcessingScript() {
    const script = `#!/usr/bin/env node

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
    
    console.log(\`📱 Processing iOS \${device} (\${dims.width}x\${dims.height})\`);
  });
  
  // Process Android screenshots  
  Object.entries(DIMENSIONS.android).forEach(([device, dims]) => {
    const deviceDir = path.join(processedDir, 'android', device);
    if (!fs.existsSync(deviceDir)) {
      fs.mkdirSync(deviceDir, { recursive: true });
    }
    
    console.log(\`🤖 Processing Android \${device} (\${dims.width}x\${dims.height})\`);
  });
  
  console.log('✅ Screenshot processing setup complete!');
  console.log('📋 Next: Place raw screenshots in raw-captures/ and run processing commands');
}

if (require.main === module) {
  processScreenshots();
}
`;

    fs.writeFileSync(path.join(this.outputDir, 'process-screenshots.js'), script);
    console.log('🛠️ Screenshot processing script generated');
  }

  generateQuickCommands() {
    const commands = `# GoalStreak Screenshot Quick Commands

## 📱 Capture Screenshots

### iOS Simulator Commands:
\`\`\`bash
# Start iOS simulator with specific device
npx expo run:ios --device "iPhone 14 Pro Max"
npx expo run:ios --device "iPhone 14 Plus" 
npx expo run:ios --device "iPhone 14 Pro"
npx expo run:ios --device "iPhone 8 Plus"
npx expo run:ios --device "iPad Pro (12.9-inch)"

# Capture screenshot (while simulator is focused)
# Method 1: Keyboard shortcut
Cmd + S

# Method 2: Command line
xcrun simctl io booted screenshot ~/Desktop/screenshot.png
\`\`\`

### Android Emulator Commands:
\`\`\`bash
# Start Android emulator
npx expo run:android

# Capture screenshot
# Method 1: Extended controls in emulator
# Method 2: Command line  
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ~/Desktop/
\`\`\`

## 🔄 Process Screenshots with ImageMagick

### Resize to exact dimensions:
\`\`\`bash
# iPhone 6.7" (1290x2796)
magick input.png -resize 1290x2796! output-iphone-6.7.png

# iPhone 6.5" (1284x2778)  
magick input.png -resize 1284x2778! output-iphone-6.5.png

# iPhone 6.1" (1179x2556)
magick input.png -resize 1179x2556! output-iphone-6.1.png

# iPhone 5.5" (1242x2208)
magick input.png -resize 1242x2208! output-iphone-5.5.png

# iPad Pro 12.9" (2048x2732)
magick input.png -resize 2048x2732! output-ipad-12.9.png

# Android Phone (1080x1920)
magick input.png -resize 1080x1920! output-android-phone.png

# Android 7" Tablet (1200x1920)
magick input.png -resize 1200x1920! output-android-tablet-7.png

# Android 10" Tablet (1600x2560)
magick input.png -resize 1600x2560! output-android-tablet-10.png
\`\`\`

### Batch processing:
\`\`\`bash
# Process all screenshots in a directory
for file in *.png; do
  magick "$file" -resize 1290x2796! "processed-$file"
done
\`\`\`

## 📐 Crop Screenshots (if needed):
\`\`\`bash
# Crop from top-left corner
magick input.png -crop 1290x2796+0+0 output.png

# Crop from center
magick input.png -gravity center -crop 1290x2796+0+0 output.png
\`\`\`

## 🎨 Enhance Screenshots:
\`\`\`bash
# Adjust brightness/contrast
magick input.png -brightness-contrast 5x10 output.png

# Sharpen image
magick input.png -unsharp 0x1 output.png

# Remove transparency (if any)
magick input.png -background white -alpha remove output.png
\`\`\`

## 📱 Test App Setup Commands:

### Create test data:
\`\`\`bash
# 1. Start the app
npx expo start

# 2. Create test account with:
#    - Name: "Alex Johnson" 
#    - Email: test@goalfer.app

# 3. Add these test habits:
#    - Morning Meditation (🧘‍♀️, Daily, 7-day streak)
#    - Daily Exercise (💪, Daily, 12-day streak)  
#    - Read 30 Minutes (📚, Daily, 5-day streak)
#    - Drink Water (💧, Daily, 3-day streak)

# 4. Add test friends:
#    - sarah@example.com
#    - mike@example.com
\`\`\`

## 📂 File Organization:
\`\`\`bash
# Create directory structure
mkdir -p app-store-assets/real-screenshots/{raw-captures,processed,final}/{ios,android}

# Move screenshots to appropriate folders
mv screenshot1.png app-store-assets/real-screenshots/raw-captures/ios/
mv screenshot2.png app-store-assets/real-screenshots/raw-captures/android/
\`\`\`

## ✅ Quality Check:
\`\`\`bash
# Check image dimensions
identify screenshot.png

# Check file size (should be < 8MB)
ls -lh screenshot.png

# Verify no transparency
magick identify -verbose screenshot.png | grep -i alpha
\`\`\`

Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(this.outputDir, 'QUICK_COMMANDS.md'), commands);
    console.log('⚡ Quick commands guide generated');
  }

  async generateAll() {
    console.log('📸 Generating real screenshot capture guides...\n');
    
    this.generateCaptureGuide();
    console.log('');
    
    this.generateProcessingScript();
    console.log('');
    
    this.generateQuickCommands();
    console.log('');
    
    console.log('✅ Screenshot capture guides generated!');
    console.log(`📁 Guides saved to: ${this.outputDir}`);
    console.log('\n📋 Next steps:');
    console.log('1. Read CAPTURE_GUIDE.md for detailed instructions');
    console.log('2. Use QUICK_COMMANDS.md for fast screenshot capture');
    console.log('3. Run the app and capture real screenshots');
    console.log('4. Process screenshots to required dimensions');
    console.log('5. Replace mockup screenshots with real ones');
  }
}

// Run the generator
if (require.main === module) {
  const guide = new ScreenshotCaptureGuide();
  guide.generateAll();
}

module.exports = ScreenshotCaptureGuide;
#!/usr/bin/env node

/**
 * GoalStreak Optimized Icon Creator
 * 
 * Creates optimized app icons with improved design for better app store visibility
 */

const fs = require('fs');
const path = require('path');

class OptimizedIconCreator {
  constructor() {
    this.assetsDir = path.join(__dirname, '..', 'assets');
    this.outputDir = path.join(__dirname, '..', 'app-store-assets', 'icons', 'enhanced');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  generateEnhancedIcon(size) {
    // Enhanced icon design with better visual hierarchy
    const cornerRadius = size * 0.2; // 20% corner radius for modern look
    const strokeWidth = Math.max(2, size * 0.02); // Responsive stroke width
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Responsive sizing
    const outerRadius = size * 0.32;
    const middleRadius = size * 0.22;
    const innerRadius = size * 0.12;
    const streakSize = size * 0.08;
    const streakOffset = size * 0.18;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Enhanced gradient with better contrast -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF894F;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FF7F3E;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4A90A4;stop-opacity:1" />
    </linearGradient>
    
    <!-- Inner glow effect -->
    <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0" />
    </radialGradient>
    
    <!-- Shadow filter -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${size * 0.01}" stdDeviation="${size * 0.005}" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
    
    <style>
      .icon-text { 
        fill: #FFFFFF; 
        font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif; 
        font-weight: 800; 
        text-anchor: middle;
        dominant-baseline: middle;
      }
    </style>
  </defs>
  
  <!-- Background with enhanced gradient -->
  <rect width="100%" height="100%" rx="${cornerRadius}" fill="url(#bgGradient)"/>
  
  <!-- Inner glow overlay -->
  <rect width="100%" height="100%" rx="${cornerRadius}" fill="url(#innerGlow)"/>
  
  <!-- Main Icon - Enhanced Target/Goal Symbol -->
  <g transform="translate(${centerX}, ${centerY})" filter="url(#shadow)">
    <!-- Outer ring with enhanced styling -->
    <circle cx="0" cy="0" r="${outerRadius}" 
            fill="none" 
            stroke="#FFFFFF" 
            stroke-width="${strokeWidth * 2}" 
            opacity="0.9"/>
    
    <!-- Middle ring -->
    <circle cx="0" cy="0" r="${middleRadius}" 
            fill="none" 
            stroke="#FFFFFF" 
            stroke-width="${strokeWidth * 1.5}" 
            opacity="0.8"/>
    
    <!-- Inner filled circle (bullseye) -->
    <circle cx="0" cy="0" r="${innerRadius}" 
            fill="#FFFFFF" 
            opacity="0.95"/>
    
    <!-- Enhanced streak indicator (flame/arrow) -->
    <g transform="translate(${streakOffset}, ${-streakOffset})">
      <!-- Main flame shape -->
      <path d="M 0,0 
               Q ${streakSize * 0.6},${-streakSize * 0.8} ${streakSize},${-streakSize * 0.2}
               Q ${streakSize * 1.2},${streakSize * 0.2} ${streakSize * 0.8},${streakSize * 0.6}
               Q ${streakSize * 0.4},${streakSize * 0.4} 0,0 Z" 
            fill="#FF894F" 
            opacity="0.9"/>
      
      <!-- Inner flame highlight -->
      <path d="M ${streakSize * 0.2},${streakSize * 0.1}
               Q ${streakSize * 0.5},${-streakSize * 0.4} ${streakSize * 0.7},${-streakSize * 0.1}
               Q ${streakSize * 0.8},${streakSize * 0.2} ${streakSize * 0.5},${streakSize * 0.4}
               Q ${streakSize * 0.3},${streakSize * 0.3} ${streakSize * 0.2},${streakSize * 0.1} Z" 
            fill="#FFFFFF" 
            opacity="0.6"/>
    </g>
    
    <!-- Progress indicator dots (optional for larger sizes) -->
    ${size >= 180 ? `
    <g opacity="0.7">
      ${[0, 1, 2].map(i => {
        const angle = (i * 120 - 90) * Math.PI / 180; // -90°, 30°, 150°
        const dotRadius = outerRadius + strokeWidth * 3;
        const x = Math.cos(angle) * dotRadius;
        const y = Math.sin(angle) * dotRadius;
        const dotSize = strokeWidth * 0.8;
        return `<circle cx="${x}" cy="${y}" r="${dotSize}" fill="#FFFFFF" opacity="${0.9 - i * 0.2}"/>`;
      }).join('')}
    </g>
    ` : ''}
  </g>
  
  <!-- App name for very large sizes -->
  ${size >= 512 ? `
  <text x="${centerX}" y="${size * 0.88}" class="icon-text" font-size="${size * 0.06}">GoalStreak</text>
  ` : ''}
</svg>`;

    return svg;
  }

  generateAdaptiveIcon(size) {
    // Android adaptive icon (foreground only, no background)
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = 0.7; // Adaptive icons need to be smaller to account for masking
    
    const outerRadius = size * 0.32 * scale;
    const middleRadius = size * 0.22 * scale;
    const innerRadius = size * 0.12 * scale;
    const strokeWidth = Math.max(2, size * 0.02);
    const streakSize = size * 0.08 * scale;
    const streakOffset = size * 0.18 * scale;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${size * 0.01}" stdDeviation="${size * 0.005}" flood-color="#000000" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <!-- Foreground icon for adaptive icon -->
  <g transform="translate(${centerX}, ${centerY})" filter="url(#shadow)">
    <!-- Outer ring -->
    <circle cx="0" cy="0" r="${outerRadius}" 
            fill="none" 
            stroke="#154D71" 
            stroke-width="${strokeWidth * 2}"/>
    
    <!-- Middle ring -->
    <circle cx="0" cy="0" r="${middleRadius}" 
            fill="none" 
            stroke="#154D71" 
            stroke-width="${strokeWidth * 1.5}"/>
    
    <!-- Inner filled circle -->
    <circle cx="0" cy="0" r="${innerRadius}" 
            fill="#154D71"/>
    
    <!-- Streak indicator -->
    <g transform="translate(${streakOffset}, ${-streakOffset})">
      <path d="M 0,0 
               Q ${streakSize * 0.6},${-streakSize * 0.8} ${streakSize},${-streakSize * 0.2}
               Q ${streakSize * 1.2},${streakSize * 0.2} ${streakSize * 0.8},${streakSize * 0.6}
               Q ${streakSize * 0.4},${streakSize * 0.4} 0,0 Z" 
            fill="#FF894F"/>
    </g>
  </g>
</svg>`;

    return svg;
  }

  generateIconSet() {
    console.log('🎨 Creating enhanced app icons...');
    
    // iOS icon sizes
    const iosSizes = [
      { size: 1024, name: 'AppIcon-AppStore.svg', desc: 'App Store' },
      { size: 180, name: 'AppIcon-60@3x.svg', desc: 'iPhone App 60pt@3x' },
      { size: 120, name: 'AppIcon-60@2x.svg', desc: 'iPhone App 60pt@2x' },
      { size: 167, name: 'AppIcon-83.5@2x.svg', desc: 'iPad Pro App 83.5pt@2x' },
      { size: 152, name: 'AppIcon-76@2x.svg', desc: 'iPad App 76pt@2x' },
      { size: 76, name: 'AppIcon-76.svg', desc: 'iPad App 76pt' },
    ];

    // Android icon sizes
    const androidSizes = [
      { size: 512, name: 'ic_launcher-playstore.svg', desc: 'Play Store' },
      { size: 192, name: 'ic_launcher-xxxhdpi.svg', desc: 'xxxhdpi' },
      { size: 144, name: 'ic_launcher-xxhdpi.svg', desc: 'xxhdpi' },
      { size: 96, name: 'ic_launcher-xhdpi.svg', desc: 'xhdpi' },
      { size: 72, name: 'ic_launcher-hdpi.svg', desc: 'hdpi' },
      { size: 48, name: 'ic_launcher-mdpi.svg', desc: 'mdpi' },
    ];

    // Generate iOS icons
    const iosDir = path.join(this.outputDir, 'ios');
    if (!fs.existsSync(iosDir)) {
      fs.mkdirSync(iosDir, { recursive: true });
    }

    for (const iconSpec of iosSizes) {
      const svg = this.generateEnhancedIcon(iconSpec.size);
      const filepath = path.join(iosDir, iconSpec.name);
      fs.writeFileSync(filepath, svg);
      console.log(`   ✅ iOS: ${iconSpec.name} - ${iconSpec.desc} (${iconSpec.size}x${iconSpec.size})`);
    }

    // Generate Android icons
    const androidDir = path.join(this.outputDir, 'android');
    if (!fs.existsSync(androidDir)) {
      fs.mkdirSync(androidDir, { recursive: true });
    }

    for (const iconSpec of androidSizes) {
      const svg = this.generateEnhancedIcon(iconSpec.size);
      const filepath = path.join(androidDir, iconSpec.name);
      fs.writeFileSync(filepath, svg);
      console.log(`   ✅ Android: ${iconSpec.name} - ${iconSpec.desc} (${iconSpec.size}x${iconSpec.size})`);
    }

    // Generate adaptive icon foreground
    const adaptiveSvg = this.generateAdaptiveIcon(432); // Standard adaptive icon size
    const adaptivePath = path.join(androidDir, 'ic_launcher_foreground.svg');
    fs.writeFileSync(adaptivePath, adaptiveSvg);
    console.log('   ✅ Android: ic_launcher_foreground.svg - Adaptive icon foreground');
  }

  generateIconGuide() {
    const guide = `# Enhanced GoalStreak App Icons

## Design Improvements

The enhanced icons feature:
- **Better Visual Hierarchy**: Improved contrast and spacing
- **Modern Gradient**: Enhanced gradient with better color transitions
- **Responsive Design**: Scales appropriately for all sizes
- **Platform Optimization**: Specific designs for iOS and Android
- **Accessibility**: High contrast for better visibility

## Icon Specifications

### iOS Icons
- AppIcon-AppStore.svg (1024x1024) - App Store listing
- AppIcon-60@3x.svg (180x180) - iPhone app icon @3x
- AppIcon-60@2x.svg (120x120) - iPhone app icon @2x
- AppIcon-83.5@2x.svg (167x167) - iPad Pro app icon @2x
- AppIcon-76@2x.svg (152x152) - iPad app icon @2x
- AppIcon-76.svg (76x76) - iPad app icon @1x

### Android Icons
- ic_launcher-playstore.svg (512x512) - Google Play Store
- ic_launcher-xxxhdpi.svg (192x192) - Extra extra extra high density
- ic_launcher-xxhdpi.svg (144x144) - Extra extra high density
- ic_launcher-xhdpi.svg (96x96) - Extra high density
- ic_launcher-hdpi.svg (72x72) - High density
- ic_launcher-mdpi.svg (48x48) - Medium density
- ic_launcher_foreground.svg (432x432) - Adaptive icon foreground

## Design Elements

### Color Palette
- **Primary Gradient**: #FF894F → #FF7F3E → #4A90A4
- **Icon Elements**: #FFFFFF (white)
- **Adaptive Foreground**: #154D71 (brand blue)

### Symbolism
- **Target Circles**: Represent goals and focus
- **Flame Element**: Symbolizes streaks and motivation
- **Progress Dots**: Indicate continuous improvement (larger sizes)

## Implementation

### iOS Implementation
1. Convert SVG files to PNG using design tools
2. Add to Xcode project in Images.xcassets/AppIcon.appiconset/
3. Ensure all required sizes are included

### Android Implementation
1. Convert SVG files to PNG
2. Place in appropriate res/mipmap-* directories
3. Use adaptive icon for Android 8.0+ (API 26+)

### Conversion Tools
- **Figma**: Import SVG, export as PNG at required sizes
- **Sketch**: Similar workflow to Figma
- **Adobe Illustrator**: Professional vector editing and export
- **Online Tools**: CloudConvert, Convertio for batch conversion

## Quality Checklist
- [ ] Icons are crisp at all sizes
- [ ] Gradient renders correctly
- [ ] Sufficient contrast for accessibility
- [ ] Consistent with brand guidelines
- [ ] Optimized file sizes

Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(this.outputDir, 'ICON_GUIDE.md'), guide);
    console.log('📚 Generated enhanced icon guide');
  }

  async createAll() {
    console.log('🚀 Creating enhanced GoalStreak app icons...\n');
    
    this.generateIconSet();
    console.log('');
    
    this.generateIconGuide();
    console.log('');
    
    console.log('✅ Enhanced app icons created successfully!');
    console.log(`📁 Icons saved to: ${this.outputDir}`);
    console.log('\n📋 Next steps:');
    console.log('1. Convert SVG icons to PNG using design tools');
    console.log('2. Test icons at different sizes for clarity');
    console.log('3. Include in app bundles for submission');
    console.log('4. Update app.json with new icon paths if needed');
  }
}

// Run the creator
if (require.main === module) {
  const creator = new OptimizedIconCreator();
  creator.createAll();
}

module.exports = OptimizedIconCreator;
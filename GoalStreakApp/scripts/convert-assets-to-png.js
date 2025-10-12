#!/usr/bin/env node

/**
 * GoalStreak Asset Conversion Script
 * 
 * Converts SVG assets to PNG format and optimizes existing app icons
 * for iOS App Store and Google Play Store submission.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AssetConverter {
  constructor() {
    this.assetsDir = path.join(__dirname, '..', 'app-store-assets');
    this.originalAssetsDir = path.join(__dirname, '..', 'assets');
  }

  checkDependencies() {
    console.log('🔍 Checking conversion dependencies...');
    
    // Check if we have any SVG to PNG conversion tools available
    const tools = [
      { cmd: 'convert', name: 'ImageMagick' },
      { cmd: 'inkscape', name: 'Inkscape' },
      { cmd: 'rsvg-convert', name: 'librsvg' }
    ];

    let availableTool = null;
    
    for (const tool of tools) {
      try {
        execSync(`which ${tool.cmd}`, { stdio: 'ignore' });
        availableTool = tool;
        console.log(`   ✅ Found ${tool.name}`);
        break;
      } catch (error) {
        // Tool not available
      }
    }

    if (!availableTool) {
      console.log('⚠️  No SVG conversion tools found. Available options:');
      console.log('   • Install ImageMagick: brew install imagemagick');
      console.log('   • Install Inkscape: brew install inkscape');
      console.log('   • Install librsvg: brew install librsvg');
      console.log('   • Or use online converters for the SVG files');
      return null;
    }

    return availableTool;
  }

  convertSvgToPng(svgPath, pngPath, width, height, tool) {
    try {
      switch (tool.cmd) {
        case 'convert':
          execSync(`convert -background transparent -size ${width}x${height} "${svgPath}" "${pngPath}"`, { stdio: 'ignore' });
          break;
        case 'inkscape':
          execSync(`inkscape --export-png="${pngPath}" --export-width=${width} --export-height=${height} "${svgPath}"`, { stdio: 'ignore' });
          break;
        case 'rsvg-convert':
          execSync(`rsvg-convert -w ${width} -h ${height} -o "${pngPath}" "${svgPath}"`, { stdio: 'ignore' });
          break;
      }
      return true;
    } catch (error) {
      console.error(`   ❌ Failed to convert ${path.basename(svgPath)}: ${error.message}`);
      return false;
    }
  }

  async convertScreenshots(tool) {
    console.log('🖼️  Converting screenshots to PNG...');
    
    const screenshotDirs = [
      { dir: 'ios', platform: 'iOS' },
      { dir: 'android', platform: 'Android' }
    ];

    for (const { dir, platform } of screenshotDirs) {
      const screenshotDir = path.join(this.assetsDir, 'screenshots', dir);
      const pngDir = path.join(screenshotDir, 'png');
      
      if (!fs.existsSync(pngDir)) {
        fs.mkdirSync(pngDir, { recursive: true });
      }

      const svgFiles = fs.readdirSync(screenshotDir).filter(file => file.endsWith('.svg'));
      
      for (const svgFile of svgFiles) {
        const svgPath = path.join(screenshotDir, svgFile);
        const pngFile = svgFile.replace('.svg', '.png');
        const pngPath = path.join(pngDir, pngFile);
        
        // Extract dimensions from SVG file
        const svgContent = fs.readFileSync(svgPath, 'utf8');
        const widthMatch = svgContent.match(/width="(\d+)"/);
        const heightMatch = svgContent.match(/height="(\d+)"/);
        
        if (widthMatch && heightMatch) {
          const width = parseInt(widthMatch[1]);
          const height = parseInt(heightMatch[1]);
          
          if (this.convertSvgToPng(svgPath, pngPath, width, height, tool)) {
            console.log(`   ✅ ${platform}: ${pngFile} (${width}x${height})`);
          }
        }
      }
    }
  }

  async convertIcons(tool) {
    console.log('🎨 Converting app icons to PNG...');
    
    const iconDirs = [
      { dir: 'ios', platform: 'iOS' },
      { dir: 'android', platform: 'Android' }
    ];

    for (const { dir, platform } of iconDirs) {
      const iconDir = path.join(this.assetsDir, 'icons', dir);
      const pngDir = path.join(iconDir, 'png');
      
      if (!fs.existsSync(pngDir)) {
        fs.mkdirSync(pngDir, { recursive: true });
      }

      const svgFiles = fs.readdirSync(iconDir).filter(file => file.endsWith('.svg'));
      
      for (const svgFile of svgFiles) {
        const svgPath = path.join(iconDir, svgFile);
        const pngFile = svgFile.replace('.svg', '.png');
        const pngPath = path.join(pngDir, pngFile);
        
        // Extract size from filename or SVG content
        const svgContent = fs.readFileSync(svgPath, 'utf8');
        const widthMatch = svgContent.match(/width="(\d+)"/);
        
        if (widthMatch) {
          const size = parseInt(widthMatch[1]);
          
          if (this.convertSvgToPng(svgPath, pngPath, size, size, tool)) {
            console.log(`   ✅ ${platform}: ${pngFile} (${size}x${size})`);
          }
        }
      }
    }
  }

  async convertFeatureGraphics(tool) {
    console.log('🎨 Converting feature graphics to PNG...');
    
    const featureGraphicsDir = path.join(this.assetsDir, 'feature-graphics');
    const pngDir = path.join(featureGraphicsDir, 'png');
    
    if (!fs.existsSync(pngDir)) {
      fs.mkdirSync(pngDir, { recursive: true });
    }

    const svgFiles = fs.readdirSync(featureGraphicsDir).filter(file => file.endsWith('.svg'));
    
    for (const svgFile of svgFiles) {
      const svgPath = path.join(featureGraphicsDir, svgFile);
      const pngFile = svgFile.replace('.svg', '.png');
      const pngPath = path.join(pngDir, pngFile);
      
      // Extract dimensions from SVG file
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const widthMatch = svgContent.match(/width="(\d+)"/);
      const heightMatch = svgContent.match(/height="(\d+)"/);
      
      if (widthMatch && heightMatch) {
        const width = parseInt(widthMatch[1]);
        const height = parseInt(heightMatch[1]);
        
        if (this.convertSvgToPng(svgPath, pngPath, width, height, tool)) {
          console.log(`   ✅ Feature graphic: ${pngFile} (${width}x${height})`);
        }
      }
    }
  }

  optimizeExistingIcons() {
    console.log('🔧 Optimizing existing app icons...');
    
    const existingIcons = [
      { src: 'icon.png', desc: 'Main app icon' },
      { src: 'adaptive-icon.png', desc: 'Android adaptive icon' },
      { src: 'favicon.png', desc: 'Web favicon' },
      { src: 'splash-icon.png', desc: 'Splash screen icon' }
    ];

    const optimizedDir = path.join(this.assetsDir, 'icons', 'optimized');
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
    }

    for (const icon of existingIcons) {
      const srcPath = path.join(this.originalAssetsDir, icon.src);
      const destPath = path.join(optimizedDir, icon.src);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`   ✅ Copied ${icon.desc}: ${icon.src}`);
      } else {
        console.log(`   ⚠️  Missing ${icon.desc}: ${icon.src}`);
      }
    }
  }

  generateConversionGuide() {
    const guide = `# Asset Conversion Guide

## Converted Assets

This directory contains PNG versions of all SVG assets generated for app store submission.

### Directory Structure
\`\`\`
app-store-assets/
├── screenshots/
│   ├── ios/png/          # iOS screenshots in PNG format
│   └── android/png/      # Android screenshots in PNG format
├── icons/
│   ├── ios/png/          # iOS app icons in PNG format
│   ├── android/png/      # Android app icons in PNG format
│   └── optimized/        # Optimized existing icons
├── feature-graphics/png/ # Google Play feature graphics
└── metadata/            # App store metadata (JSON)
\`\`\`

### Usage Instructions

#### iOS App Store Connect:
1. Use screenshots from \`screenshots/ios/png/\`
2. Upload in this order for maximum conversion:
   - onboarding-* (Welcome screen)
   - habit-tracking-* (Main functionality)
   - social-features-* (Social accountability)
   - analytics-* (Progress insights)
   - habit-creation-* (Customization)

#### Google Play Console:
1. Use screenshots from \`screenshots/android/png/\`
2. Upload feature graphics from \`feature-graphics/png/\`
3. Use same screenshot order as iOS

#### App Icons:
- iOS: Use icons from \`icons/ios/png/\`
- Android: Use icons from \`icons/android/png/\`
- Include appropriate sizes in app bundles

### Quality Checklist
- [ ] All screenshots are high resolution and clear
- [ ] App icons are crisp at all sizes
- [ ] Feature graphics showcase key functionality
- [ ] Metadata is compelling and keyword-optimized
- [ ] All assets follow platform guidelines

### Next Steps
1. Review all converted assets for quality
2. Upload to respective app store consoles
3. Configure store listings with metadata
4. Submit for app store review

Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(this.assetsDir, 'CONVERSION_GUIDE.md'), guide);
    console.log('📚 Generated conversion guide');
  }

  async convertAll() {
    console.log('🚀 Starting asset conversion process...\n');
    
    const tool = this.checkDependencies();
    
    if (tool) {
      console.log('');
      await this.convertScreenshots(tool);
      console.log('');
      await this.convertIcons(tool);
      console.log('');
      await this.convertFeatureGraphics(tool);
      console.log('');
    } else {
      console.log('⏭️  Skipping SVG conversion (no tools available)');
      console.log('');
    }
    
    this.optimizeExistingIcons();
    console.log('');
    
    this.generateConversionGuide();
    console.log('');
    
    console.log('✅ Asset conversion completed!');
    console.log(`📁 Converted assets saved to: ${this.assetsDir}`);
    
    if (!tool) {
      console.log('\n💡 To convert SVG files to PNG:');
      console.log('1. Install conversion tools (ImageMagick, Inkscape, or librsvg)');
      console.log('2. Run this script again');
      console.log('3. Or use online converters like CloudConvert');
    }
  }
}

// Run the converter
if (require.main === module) {
  const converter = new AssetConverter();
  converter.convertAll();
}

module.exports = AssetConverter;
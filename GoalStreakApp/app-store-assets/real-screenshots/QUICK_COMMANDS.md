# Goalfer Screenshot Quick Commands

## 📱 Capture Screenshots

### iOS Simulator Commands:
```bash
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
```

### Android Emulator Commands:
```bash
# Start Android emulator
npx expo run:android

# Capture screenshot
# Method 1: Extended controls in emulator
# Method 2: Command line  
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ~/Desktop/
```

## 🔄 Process Screenshots with ImageMagick

### Resize to exact dimensions:
```bash
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
```

### Batch processing:
```bash
# Process all screenshots in a directory
for file in *.png; do
  magick "$file" -resize 1290x2796! "processed-$file"
done
```

## 📐 Crop Screenshots (if needed):
```bash
# Crop from top-left corner
magick input.png -crop 1290x2796+0+0 output.png

# Crop from center
magick input.png -gravity center -crop 1290x2796+0+0 output.png
```

## 🎨 Enhance Screenshots:
```bash
# Adjust brightness/contrast
magick input.png -brightness-contrast 5x10 output.png

# Sharpen image
magick input.png -unsharp 0x1 output.png

# Remove transparency (if any)
magick input.png -background white -alpha remove output.png
```

## 📱 Test App Setup Commands:

### Create test data:
```bash
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
```

## 📂 File Organization:
```bash
# Create directory structure
mkdir -p app-store-assets/real-screenshots/{raw-captures,processed,final}/{ios,android}

# Move screenshots to appropriate folders
mv screenshot1.png app-store-assets/real-screenshots/raw-captures/ios/
mv screenshot2.png app-store-assets/real-screenshots/raw-captures/android/
```

## ✅ Quality Check:
```bash
# Check image dimensions
identify screenshot.png

# Check file size (should be < 8MB)
ls -lh screenshot.png

# Verify no transparency
magick identify -verbose screenshot.png | grep -i alpha
```

Generated on: 2025-09-24T11:14:08.734Z

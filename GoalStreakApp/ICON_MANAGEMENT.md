# Icon Management Guide

## Understanding Icon Locations

Because you have a **native iOS project** (`ios/` directory), icons work differently than managed Expo projects.

### Icon Locations (3 places)

1. **Source Icon** (for generation)
   ```
   app-store-assets/icons/enhanced/ios/icon.png (500x500)
   ```

2. **Generated Icons** (intermediate)
   ```
   app-store-assets/icons/enhanced/ios/
   ├── AppIcon-AppStore.png (1024x1024)
   ├── AppIcon-60@3x.png (180x180)
   ├── AppIcon-60@2x.png (120x120)
   └── ... other sizes
   ```

3. **iOS Native Project** (ACTUAL icon used in builds) ⭐
   ```
   ios/GoalStreak/Images.xcassets/AppIcon.appiconset/
   └── App-Icon-1024x1024@1x.png
   ```

## Why This Matters

When you have an `ios/` directory:
- ❌ `app.json` icon settings are **IGNORED**
- ❌ `assets/icon.png` is **IGNORED**
- ✅ iOS uses **ONLY** `Images.xcassets/AppIcon.appiconset/`

## Complete Workflow

### 1. Generate New Icons

```bash
cd app-store-assets/icons/enhanced/ios/
./generate-icons.sh
```

This creates all icon sizes from `icon.png`.

### 2. Sync to iOS Project

```bash
npm run sync-app-icon
```

This copies the 1024x1024 icon to the iOS native project.

### 3. Commit and Build

```bash
git add ios/GoalStreak/Images.xcassets/
git commit -m "Update app icon"
npm run increment-build
git add . && git commit -m "Increment build"
npm run build:production:ios
```

## Quick Command

For future icon updates:

```bash
# Generate and sync in one go
cd app-store-assets/icons/enhanced/ios/ && ./generate-icons.sh && cd - && npm run sync-app-icon
```

## Troubleshooting

### Icon not showing in TestFlight
- **Cause:** Icon not synced to iOS project
- **Fix:** Run `npm run sync-app-icon` and rebuild

### Old icon still showing
- **Cause:** Cached build or didn't commit changes
- **Fix:** 
  1. Verify: `ls -lh ios/GoalStreak/Images.xcassets/AppIcon.appiconset/`
  2. Should be ~122KB (new) not ~59KB (old)
  3. Commit and rebuild

### Which icon file matters?
- **For builds:** `ios/GoalStreak/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`
- **For App Store listing:** `app-store-assets/icons/enhanced/ios/AppIcon-AppStore.png` (upload manually)

## File Cleanup

You can safely delete these (not used in native builds):
- `assets/icon.png` (Expo managed - ignored)
- `assets/adaptive-icon.png` (Android only)
- Old SVG icons in `app-store-assets/icons/ios/*.svg`

Keep these:
- `app-store-assets/icons/enhanced/ios/` (source and generated)
- `ios/GoalStreak/Images.xcassets/AppIcon.appiconset/` (used in builds)

## Summary

**Native iOS projects require manual icon sync!**

Always run `npm run sync-app-icon` after generating new icons.

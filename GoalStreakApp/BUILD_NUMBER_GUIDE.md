# Build Number Management Guide

## Overview

Build numbers must be synchronized between **THREE** locations:
1. **app.json** - `expo.ios.buildNumber`
2. **iOS Native Project** - `ios/GoalStreak.xcodeproj/project.pbxproj` (CURRENT_PROJECT_VERSION)
3. **Info.plist** - `ios/GoalStreak/Info.plist` (CFBundleVersion)

When you have an `ios` directory, EAS Build uses the native iOS files (#2 and #3), NOT app.json.

## Automated Scripts

### 1. Increment Build Number (Recommended)

Use this before creating a new production build:

```bash
npm run increment-build
```

**What it does:**
- Reads current build number from app.json
- Increments it by 1
- Updates ALL THREE locations:
  - app.json
  - ios/GoalStreak.xcodeproj/project.pbxproj
  - ios/GoalStreak/Info.plist
- Shows you the new build number

**When to use:**
- Before every new production build
- After a successful App Store submission

### 2. Sync Build Numbers

Use this to fix mismatched build numbers:

```bash
npm run sync-build-number
```

**What it does:**
- Checks all THREE locations for build numbers
- Uses the highest number as the source of truth
- Syncs all three files to match

**When to use:**
- When you get "already submitted this build" error
- After manual edits to either file
- To verify build numbers are in sync

## Recommended Workflow

### For New Production Builds:

```bash
# 1. Increment build number
npm run increment-build

# 2. Commit the changes (IMPORTANT!)
git add app.json ios/GoalStreak.xcodeproj/project.pbxproj ios/GoalStreak/Info.plist
git commit -m "Increment build number to X"

# 3. Build for iOS
npm run build:production:ios

# 4. Wait for build to complete (30-60 min)

# 5. Submit to App Store
npm run submit:ios
```

**⚠️ IMPORTANT:** Always commit changes before building! EAS reads from git.

### If You Get "Already Submitted" Error:

```bash
# 1. Increment build number
npm run increment-build

# 2. Rebuild
npm run build:production:ios

# 3. Submit again
npm run submit:ios
```

## Manual Build Number Update (Not Recommended)

If you need to manually update build numbers:

1. **Update app.json:**
   ```json
   {
     "expo": {
       "ios": {
         "buildNumber": "5"
       }
     }
   }
   ```

2. **Update ios/GoalStreak.xcodeproj/project.pbxproj:**
   ```
   CURRENT_PROJECT_VERSION = 5;
   ```
   (This appears twice in the file - update both)

3. **Update ios/GoalStreak/Info.plist:**
   ```xml
   <key>CFBundleVersion</key>
   <string>5</string>
   ```

4. **Verify sync:**
   ```bash
   npm run sync-build-number
   ```

## Current Build Number

To check your current build number in all locations:

```bash
# Use the sync script (shows all three)
npm run sync-build-number
```

Or check manually:
```bash
# Check app.json
grep -A 1 "buildNumber" app.json

# Check iOS project
grep "CURRENT_PROJECT_VERSION" ios/GoalStreak.xcodeproj/project.pbxproj

# Check Info.plist
grep -A 1 "CFBundleVersion" ios/GoalStreak/Info.plist
```

## Troubleshooting

### "Already submitted this build" Error
- **Cause:** Build number hasn't been incremented
- **Fix:** Run `npm run increment-build` and rebuild

### Build numbers out of sync
- **Cause:** Manual edit to only one or two locations
- **Fix:** Run `npm run sync-build-number`

### EAS using wrong build number
- **Cause:** Info.plist or Xcode project has different number
- **Fix:** EAS uses Info.plist (CFBundleVersion) as the final authority
- **Solution:** Run `npm run sync-build-number` to align all three

### Changes not picked up by EAS
- **Cause:** Changes not committed to git before building
- **Fix:** Always commit changes before running build
- **Solution:** `git add . && git commit -m "message"` then rebuild

## Best Practices

1. ✅ **Always use `npm run increment-build`** before new builds
2. ✅ **Always commit changes** before building (`git add . && git commit`)
3. ✅ **Run `npm run sync-build-number`** after manual edits
4. ✅ **Check build number** in EAS dashboard after build starts
5. ❌ **Don't manually edit** build numbers without syncing all three files
6. ❌ **Don't submit** the same build number twice
7. ❌ **Don't build** without committing changes first

## Build Number History

Keep track of your submissions:

| Build # | Date | Status | Notes |
|---------|------|--------|-------|
| 1 | Nov 2 | Submitted | Initial submission |
| 2 | Nov 8 | Submitted | Bug fixes |
| 3 | Nov 16 | Submitted | Feature updates |
| 4 | Nov 22 | In Progress | New icon |

Update this table after each submission to track your build history.

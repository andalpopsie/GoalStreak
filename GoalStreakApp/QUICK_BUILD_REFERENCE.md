# Quick Build Reference

## Current Status
- **Build Number:** 4
- **Status:** In Progress
- **Build ID:** ba05467f-6c03-484d-9f5b-4c64dfca1649

## Next Build Workflow

```bash
# 1. Increment build number
npm run increment-build

# 2. Commit changes (CRITICAL!)
git add app.json ios/GoalStreak.xcodeproj/project.pbxproj ios/GoalStreak/Info.plist
git commit -m "Increment build to 6"

# 3. Build
npm run build:production:ios

# 4. Submit (after build completes)
npm run submit:ios
```

## Quick Commands

```bash
# Check build status
cd GoalStreakApp && eas build:list --limit 1

# Check build numbers are synced
npm run sync-build-number

# Increment for next build
npm run increment-build
```

## Build Number Locations (All 3 Must Match!)

1. **app.json** → `expo.ios.buildNumber`
2. **iOS Project** → `ios/GoalStreak.xcodeproj/project.pbxproj` → `CURRENT_PROJECT_VERSION`
3. **Info.plist** → `ios/GoalStreak/Info.plist` → `CFBundleVersion`

**Important:** EAS uses Info.plist as the final authority!

## Common Issues

| Issue | Solution |
|-------|----------|
| "Already submitted this build" | `npm run increment-build` then commit |
| Build numbers out of sync | `npm run sync-build-number` |
| Wrong build number in EAS | Check Info.plist, commit before building |
| Changes not in build | Commit changes before building |

---

**See BUILD_NUMBER_GUIDE.md for detailed documentation**

---
inclusion: always
---

# GoalStreak Quick Reference

## Status
Production Ready | App Store Prep | React Native + Expo 54 + Firebase

## Critical Rules
- ❌ NO new docs/components for variations - extend existing
- ❌ NO duplicate .env files - root only
- ✅ Modify, don't multiply

## Design System
```typescript
colors = {
  primaryText: '#154D71',
  background: '#FDFDFD',
  accent1: '#B771E5',    // Purple CTA
  accent2: '#154D71',    // Dark blue
  accent3: '#4A90A4'     // Teal success
}

spacing = {
  tight: 8,        // Icon-text pairs
  base: 16,        // Related content (most common)
  comfortable: 24, // Section breaks
  loose: 32,       // Major dividers
}

// Card Recipe: 16px margin, 16-24px padding
// Touch targets: 48px minimum
```

## Structure
```
src/
├── components/  # Extend with props
├── screens/     # 11 screens
├── services/    # 14 Firebase services
└── constants/
```

## Commands
```bash
npm start
npm run ios
npm run android

# Production Build (iOS)
npm run sync-app-icon                # Copy icon to iOS project
npm run increment-build              # Updates 3 files
git add . && git commit -m "Build X" # MUST commit!
npm run build:production:ios         # 30-60 min
npm run submit:ios                   # After build done
```

## Build Numbers
3 files must match: app.json, project.pbxproj, Info.plist
- `npm run sync-build-number` - Check sync
- `npm run increment-build` - Auto-increment all 3
- Always commit before building!
- See: BUILD_NUMBER_GUIDE.md

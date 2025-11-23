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
  primaryText: '#001BB7',
  background: '#FFF6E9',
  accent1: '#FF7F3E',    // CTA
  accent2: '#80C4E9',
  accent3: '#37B5B6'     // Success
}
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

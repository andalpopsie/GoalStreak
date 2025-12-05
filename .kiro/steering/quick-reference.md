---
inclusion: always
---

# GoalStreak Quick Reference

## Status
Production Ready | App Store Prep | React Native + Expo 54 + Firebase

## Core Rules

### Code Organization: MODIFY, DON'T MULTIPLY
- ❌ NO new files for UI variations - extend with props
- ❌ NO duplicate .env files - root only
- ❌ NO new docs for summaries - update existing
- ✅ Extend existing components/services with new features

### Development Workflow
1. Make change → `git diff` to verify
2. Commit immediately → `git add . && git commit`
3. Clear cache → `rm -rf .expo node_modules/.cache`
4. Restart → `npx expo start --clear`

## Design System

### Colors
```typescript
primaryText: '#154D71'   // Dark blue
background: '#FDFDFD'    // Light gray
accent1: '#B771E5'       // Purple (CTA)
accent2: '#154D71'       // Dark blue
accent3: '#4A90A4'       // Teal (success)
```

### Spacing (4px base grid)
```typescript
tight: 8         // Icon-text pairs
base: 16         // Related content (most common)
comfortable: 24  // Section breaks
loose: 32        // Major dividers
```

### Card Recipe
```typescript
marginHorizontal: 16     // Outer margin
padding: 16              // Inner padding (24 for large)
titleMarginBottom: 16    // Title → Description
descriptionMarginBottom: 24  // Description → CTA
```

### UX Laws

**Fitts's Law** - Bigger + closer = easier + faster
- Primary buttons: 56-64px
- Bottom/edge placement for important actions
- Spacing between buttons: ≥16px

**Hick's Law** - More choices = longer decisions
- Limit to 3-7 primary options per screen
- Group related options into categories
- Hide advanced features (progressive disclosure)
- Show most-used actions first (80/20 rule)

**Jakob's Law** - Users prefer familiar patterns
- Use standard navigation (bottom tabs, back button)
- Follow platform guidelines (iOS HIG, Material Design)
- Use universal icons (home, search, settings, profile)
- Balance familiarity with brand identity
- Guide users through new patterns with tutorials

**Miller's Law** - Working memory holds 7±2 items
- Limit groups to 5-7 items maximum
- Chunk related content together
- Use headings and spacing to separate chunks
- Complex content: 3-5 items per chunk
- Familiar content: 5-7 items per chunk
- Progressive disclosure for additional items

## Project Structure
```
GoalStreakApp/
├── .env, .env.development, .env.production  # Root only!
├── src/
│   ├── components/  # Extend with props
│   ├── screens/     # 11 screens
│   ├── services/    # 14 Firebase services
│   └── constants/   # theme.ts
├── docs/            # All documentation
├── config/          # Build configs only
└── firebase/        # Firebase rules
```

## Commands

### Development
```bash
npm start
npm run ios
npm run android
```

### Production Build (iOS)
```bash
npm run sync-app-icon                # Copy icon
npm run increment-build              # Updates 3 files
git add . && git commit -m "Build X" # MUST commit!
npm run build:production:ios         # 30-60 min
npm run submit:ios                   # After build
```

### Build Numbers
3 files must match: app.json, project.pbxproj, Info.plist
- `npm run sync-build-number` - Check sync
- `npm run increment-build` - Auto-increment all 3

## Quick Checks

### Before Creating Files
1. Can this be added to existing file?
2. Does similar file already exist?
3. Will this create duplication?

### Before Committing
- [ ] `git diff` shows changes
- [ ] Changes tested locally
- [ ] No duplicate files created
- [ ] Follows spacing standards

### Before Telling User to Test
- [ ] Verified with `git diff`
- [ ] Committed changes
- [ ] Cleared cache
- [ ] Restarted server

## Common Patterns

### Component Props (not new files)
```typescript
// ✅ Good
interface Props {
  variant?: 'default' | 'compact';
  layout?: 'grid' | 'list';
}

// ❌ Bad - Don't create
CompactHabitCard.tsx
EnhancedHabitCard.tsx
```

### Spacing Usage
```typescript
// ✅ Good - 8px grid
paddingVertical: 16,    // 8 * 2
marginBottom: 24,       // 8 * 3
gap: 8,                 // 8 * 1

// ❌ Bad - arbitrary
paddingVertical: 15,
marginBottom: 22,
```

## Firebase Collections
```
users/{userId}
habits/{habitId}
completions/{completionId}
streaks/{habitId}
friends/{friendshipId}
activities/{activityId}
```

## Key Services
- `habitService` - CRUD operations
- `completionService` - Tracking
- `streakService` - Calculations
- `friendService` - Social features
- `notificationService` - Reminders

---

**Remember**: Git is source of truth. Always verify changes persist before proceeding.

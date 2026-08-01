# GoalStreak Asset Paths — Source of Truth

> Memorized: the only canonical asset locations for the Goalfer app.

## App icon (1024×1024 master)

**Canonical path:** `GoalStreakApp/assets/icon.png`

This is **the** app icon. It is referenced from `app.json` and used by:
- Expo / EAS build for the iOS and Android app icons
- App Store Connect submission
- IAP review screenshots (when 1024×1024 is required)
- Any time we need a square master icon

### Other icons in `assets/`
- `assets/adaptive-icon.png` — Android adaptive icon foreground
- `assets/splash-icon.png` — splash screen icon
- `assets/favicon.png` — web favicon

## What NOT to use

The following paths previously held duplicate copies of the icon and were
removed to avoid confusion. **Do not recreate them.** If you find a process
that writes to these paths, update it to use `GoalStreakApp/assets/`.

- ~~`app-store-assets/icons/optimized/`~~ — deleted
- ~~`app-store-assets/icons/enhanced/`~~ — deleted

## App Store screenshots

**Canonical path:** `app-store-assets/real-screenshots/app-store-ready/`

These are the 5 polished iPhone screenshots used for App Store submission:
- `01-dashboard.png`
- `02-habit-creation.png`
- `03-habit-icons.png`
- `04-social-feed.png`
- `05-analytics.png`

### Folders to consolidate later (technical debt, not blocking)
- `app-store-assets/real-screenshots/ios/` — older raw captures (superseded)
- ~~`app-store-assets/screenshots/`~~ — deleted (stale framed SVG marketing mockups + Android set; not used by any upload/build path). Do not recreate; upload PNGs live in `real-screenshots/app-store-ready/`.

## Rules

- **Single source of truth:** when adding new asset variants, extend the
  existing structure in `GoalStreakApp/assets/` — do NOT create parallel
  folders elsewhere.
- **No duplicates:** if you regenerate icons or screenshots, replace
  in-place at the canonical path. Don't add `-v2`, `-new`, `-final`, etc.
- **For iOS-specific generated icons** (e.g. `Icon-20@2x.png` etc): those
  live in `GoalStreakApp/ios/GoalStreak/Images.xcassets/AppIcon.appiconset/`
  (note: the iOS project folder is still `GoalStreak` because the bundle
  ID `com.goalstreak.app` was registered with Apple and can't change) and
  are produced by `npm run sync-app-icon` from `assets/icon.png`.
  Don't edit them by hand.

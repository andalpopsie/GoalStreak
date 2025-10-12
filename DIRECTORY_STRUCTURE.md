# GoalStreak Directory Structure

## 📁 Project Organization

```
GoalStreak/
├── 📱 GoalStreakApp/                    # Main React Native application
│   ├── src/                             # Source code
│   │   ├── components/                  # Reusable UI components
│   │   ├── screens/                     # Screen components
│   │   ├── services/                    # Firebase & API services
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── utils/                       # Utility functions
│   │   ├── types/                       # TypeScript definitions
│   │   ├── constants/                   # Theme, limits, configs
│   │   └── navigation/                  # Navigation configuration
│   ├── assets/                          # App assets (icons, images)
│   ├── ios/                             # iOS native code
│   ├── android/                         # Android native code
│   ├── scripts/                         # Build and utility scripts
│   └── app-store-assets/                # App Store submission materials
│       ├── metadata/                    # Legal docs, descriptions, configs
│       ├── screenshots/                 # App Store screenshots
│       ├── icons/                       # App icons and graphics
│       ├── marketing/                   # Marketing materials
│       └── real-screenshots/            # Screenshot capture tools
│
├── 🎨 design-images/                    # Design inspiration and assets
├── 🌐 goalstreak-landing/               # Landing page website
├── 📚 docs/                             # Project documentation
├── 🔧 development-sessions/             # Development logs and planning
├── ⚙️ .kiro/                            # Kiro IDE configuration
│   ├── specs/                           # Feature specifications
│   └── steering/                        # Development guidelines
└── 📄 Root files                        # README, gitignore, etc.
```

## 🎯 Key Directories Explained

### GoalStreakApp/
The main React Native application with all source code, native iOS/Android projects, and app store submission materials.

**Important subdirectories:**
- `src/` - All TypeScript/React Native source code
- `app-store-assets/` - Everything needed for App Store submission
- `scripts/` - Build automation and utility scripts

### app-store-assets/
Centralized location for all App Store submission materials:
- **metadata/** - Legal documents, app descriptions, configuration files
- **screenshots/** - App Store screenshots for iOS and Android
- **icons/** - App icons in all required sizes
- **marketing/** - Marketing graphics and promotional materials

### .kiro/specs/
Feature specifications and implementation plans:
- **app-store-launch/** - Current app store launch specification
- Each spec contains requirements, design, and task documents

## 🧹 Recent Cleanup

### Removed Duplicates
- ❌ `app-store/` (root) - Consolidated into `GoalStreakApp/app-store-assets/`
- ❌ Duplicate legal documents - Now centralized in `metadata/`
- ❌ Scattered documentation - Organized in proper locations

### Consolidated Files
- ✅ Privacy Policy & Terms of Service → `app-store-assets/metadata/`
- ✅ App descriptions and metadata → `app-store-assets/metadata/`
- ✅ All app store materials → `app-store-assets/`

## 📋 Working Directory Guidelines

### For App Development
**Primary working directory:** `GoalStreakApp/`
- Source code: `GoalStreakApp/src/`
- Configuration: `GoalStreakApp/app.json`, `GoalStreakApp/eas.json`

### For App Store Submission
**Primary working directory:** `GoalStreakApp/app-store-assets/`
- Legal documents: `metadata/privacy-policy.md`, `metadata/terms-of-service.md`
- App descriptions: `metadata/ios-metadata.json`
- Screenshots: `screenshots/ios/`, `screenshots/android/`

### For Feature Planning
**Primary working directory:** `.kiro/specs/`
- Current spec: `.kiro/specs/app-store-launch/`
- Requirements, design, and tasks documents

## 🎯 Quick Navigation

### Most Important Files
```
GoalStreakApp/
├── app.json                             # App configuration
├── eas.json                             # Build configuration
├── src/utils/linkingUtils.ts            # Legal document links
└── app-store-assets/metadata/
    ├── privacy-policy.md                # Privacy policy
    ├── terms-of-service.md              # Terms of service
    ├── ios-metadata.json                # App Store metadata
    └── ios-legal-compliance-checklist.md # Compliance checklist
```

### Current Task Files
```
.kiro/specs/app-store-launch/
├── requirements.md                      # App store requirements
├── design.md                           # Implementation design
└── tasks.md                            # Task list and progress
```

This structure provides clear separation of concerns and makes it easy to find exactly what you need for any aspect of the project! 🚀
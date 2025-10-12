# GoalStreak Directory Structure Guide

## 📁 Organized Project Structure

This document explains the organized directory structure for better maintainability and tracking.

### Root Level
```
GoalStreakApp/
├── 📱 App.tsx                 # Main app component
├── 📄 index.ts                # App entry point
├── 📦 package.json            # Dependencies and scripts
├── ⚙️  app.json               # Expo configuration
├── 🔧 eas.json                # EAS Build configuration
├── 📖 README.md               # Project overview
└── 🚫 .gitignore              # Git ignore rules
```

### Source Code
```
src/
├── components/                # React components
├── screens/                   # Screen components
├── services/                  # API and Firebase services
├── hooks/                     # Custom React hooks
├── contexts/                  # React contexts
├── navigation/                # Navigation configuration
├── types/                     # TypeScript definitions
├── constants/                 # App constants
├── utils/                     # Utility functions
└── __tests__/                 # Test files
```

### Configuration
```
config/
├── .env.development           # Development environment variables
├── .env.production            # Production environment variables
├── .eslintrc.js               # ESLint configuration
├── jest.config.js             # Jest testing configuration
└── tsconfig.json              # TypeScript configuration
```

### Firebase
```
firebase/
├── firebase.json              # Firebase project configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── storage.rules              # Firebase Storage rules
└── deploy-rules.sh            # Deployment script
```

### Documentation
```
docs/
├── BUILD_GUIDE.md             # Build instructions
├── IOS_TESTING_GUIDE.md       # iOS testing procedures
├── STEP-BY-STEP-IOS-SUBMISSION-GUIDE.md  # Complete submission guide
├── ios-build-and-submit-guide.md         # Build and submit process
├── app-store-connect-setup-guide.md      # App Store Connect setup
├── NOTIFICATIONS.md           # Notification system docs
├── TIMER_TEST_GUIDE.md        # Timer testing guide
└── reports/                   # Generated reports
    └── ios-pre-submission-validation-report.md
```

### Scripts
```
scripts/
├── ios-production-build-and-submit.js    # Main iOS build script
├── configure-app-store-connect.js        # App Store configuration
├── setup-eas-credentials.js              # Credential setup
├── ios-pre-submission-validation.js      # Validation script
├── cleanup-and-organize-directory.js     # This cleanup script
└── README.md                              # Scripts documentation
```

### App Store Assets
```
app-store-assets/
├── metadata/                  # App Store metadata
├── screenshots/               # App Store screenshots
├── real-screenshots/          # Actual device screenshots
├── icons/                     # App icons
├── marketing/                 # Marketing materials
└── promotional/               # Promotional graphics
```

### Assets
```
assets/
├── icon.png                   # App icon
├── adaptive-icon.png          # Android adaptive icon
├── splash-icon.png            # Splash screen icon
├── favicon.png                # Web favicon
└── fonts/                     # Custom fonts
```

### Temporary Files
```
temp/
├── coverage/                  # Test coverage reports
└── .expo/                     # Expo build cache
```

## 🎯 Benefits of This Organization

### ✅ Improved Maintainability
- **Logical grouping**: Related files are grouped together
- **Clear separation**: Configuration, documentation, and source code are separated
- **Easy navigation**: Developers can quickly find what they need

### ✅ Better Tracking
- **Focused commits**: Changes are easier to track by category
- **Clear history**: Git history is more meaningful
- **Reduced noise**: Temporary files are organized separately

### ✅ Enhanced Collaboration
- **Onboarding**: New developers can understand the structure quickly
- **Documentation**: All guides are in one place
- **Standards**: Consistent organization across the project

### ✅ Deployment Ready
- **Clean builds**: Temporary files don't interfere with builds
- **Configuration management**: Environment-specific configs are organized
- **Asset management**: App Store assets are properly structured

## 🔄 Maintenance

### Regular Cleanup
Run the cleanup script periodically:
```bash
npm run cleanup:directory
```

### Adding New Files
- **Documentation**: Add to `docs/`
- **Configuration**: Add to `config/`
- **Scripts**: Add to `scripts/`
- **Assets**: Add to appropriate asset directories

### Git Best Practices
- Commit organized files separately
- Use descriptive commit messages
- Keep temporary files out of version control

---

**Last Updated**: 10/11/2025
**Organization Script**: `scripts/cleanup-and-organize-directory.js`

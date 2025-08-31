# GoalStreak Project Structure

## Overview
This document outlines the organized project structure following development best practices to maintain clean separation between core application code and supporting files.

## Directory Structure

```
GoalStreakApp/
├── 📱 Core Application
│   ├── src/                    # Main application source code
│   ├── assets/                 # App assets (images, fonts, etc.)
│   ├── App.tsx                 # Root component
│   ├── index.ts                # Entry point
│   ├── app.json                # Expo configuration
│   ├── package.json            # Dependencies
│   └── tsconfig.json           # TypeScript configuration
│
├── 🧪 Testing & Quality
│   ├── __tests__/              # All test files (moved from src/__tests__)
│   ├── e2e/                    # End-to-end tests
│   ├── test-isolated/          # Isolated test environment
│   ├── coverage/               # Test coverage reports
│   └── jest.*.config.js        # Jest configurations
│
├── 🔧 Development Tools
│   ├── scripts/                # Build and utility scripts
│   ├── .github/                # GitHub workflows and templates
│   ├── .expo/                  # Expo build artifacts
│   └── node_modules/           # Dependencies (auto-generated)
│
├── 📚 Documentation
│   ├── docs/                   # Technical documentation
│   ├── README.md               # Project overview
│   ├── TESTING_SETUP.md        # Testing setup guide
│   ├── PERFORMANCE_TESTING.md  # Performance testing guide
│   └── SECURITY_TESTING_SUMMARY.md
│
├── 🚀 Deployment & Config
│   ├── firebase.json           # Firebase configuration
│   ├── firestore.rules         # Firestore security rules
│   ├── storage.rules           # Firebase storage rules
│   ├── firestore.indexes.json  # Firestore indexes
│   ├── eas.json.backup         # EAS build configuration backup
│   └── .detoxrc.js             # Detox E2E testing config
│
├── 📊 Reports & Analytics
│   ├── reports/                # Generated reports and analytics
│   │   ├── comprehensive-validation-report.json
│   │   ├── coverage-validation-report.json
│   │   ├── performance-reliability-report.json
│   │   └── security-test-report.json
│   └── .codecov.yml            # Code coverage configuration
│
├── 📱 App Store & Marketing
│   ├── app-store/              # App store related files
│   │   ├── app-store-checklist.md
│   │   ├── app-store-metadata.md
│   │   └── app-store-submission-guide.md
│   └── privacy-policy.md       # Privacy policy
│
└── ⚙️ Configuration Files
    ├── .eslintrc.js            # ESLint configuration
    ├── .eslintrc.security.js   # Security linting rules
    ├── .gitignore              # Git ignore rules
    ├── tsconfig.test.json      # TypeScript test configuration
    ├── security-audit.md       # Security audit documentation
    └── testing-plan.md         # Testing strategy document
```

## Key Principles

### 1. Separation of Concerns
- **Core App Code**: `src/` contains only production application code
- **Testing**: All test files moved to dedicated `__tests__/` directory
- **Documentation**: Centralized in `docs/` with key files at root level
- **Configuration**: Environment and build configs at appropriate levels

### 2. Clean Root Directory
- Only essential files remain at root level
- Configuration files grouped logically
- Generated reports moved to dedicated `reports/` directory

### 3. Developer Experience
- Clear navigation between app code and supporting files
- Logical grouping of related functionality
- Easy access to frequently used files

### 4. Build & CI/CD Friendly
- All build scripts in `scripts/` directory
- CI/CD workflows in `.github/` directory
- Test configurations clearly separated by type

## Quick Navigation

### For Development
- **Main App Code**: `src/`
- **Components**: `src/components/`
- **Screens**: `src/screens/`
- **Services**: `src/services/`

### For Testing
- **Unit Tests**: `__tests__/unit/`
- **Integration Tests**: `__tests__/integration/`
- **E2E Tests**: `e2e/`
- **Test Utilities**: `__tests__/utils/`

### For Documentation
- **API Docs**: `docs/`
- **Testing Guides**: `TESTING_SETUP.md`, `docs/TESTING_*.md`
- **Deployment**: `docs/` and root-level guides

### For Configuration
- **Firebase**: `firebase.json`, `firestore.rules`, `storage.rules`
- **Build**: `package.json`, `app.json`, `tsconfig.json`
- **Testing**: `jest.*.config.js`, `.detoxrc.js`

This structure maintains clean separation while keeping everything easily accessible for development, testing, and deployment workflows.
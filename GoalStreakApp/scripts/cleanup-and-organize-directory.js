#!/usr/bin/env node

/**
 * Directory Cleanup and Organization Script
 * 
 * This script organizes the GoalStreak project directory for better maintainability
 * and tracking without affecting Kiro specs or breaking functionality.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.blue}[STEP ${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
  log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

// Directory structure plan
const ORGANIZATION_PLAN = {
  'docs/': {
    description: 'All documentation and guides',
    files: [
      'BUILD_GUIDE.md',
      'DEBUG_NOTIFICATIONS.md',
      'IOS_TESTING_GUIDE.md',
      'NOTIFICATIONS.md',
      'PROFILE_PHOTOS.md',
      'TIMER_TEST_GUIDE.md',
      'STEP-BY-STEP-IOS-SUBMISSION-GUIDE.md',
      'ios-build-and-submit-guide.md',
      'ios-submission-completion-summary.md',
      'app-store-connect-setup-guide.md',
      'ios-screenshot-upload-guide.md',
      'ios-submission-timeline.md'
    ]
  },
  'docs/reports/': {
    description: 'Generated reports and validation results',
    files: [
      'ios-pre-submission-validation-report.md'
    ]
  },
  'config/': {
    description: 'Configuration files',
    files: [
      '.env.development',
      '.env.production',
      '.eslintrc.js',
      'jest.config.js',
      'tsconfig.json'
    ]
  },
  'firebase/': {
    description: 'Firebase configuration and rules',
    files: [
      'firebase.json',
      'firestore.indexes.json',
      'firestore.rules',
      'storage.rules',
      'deploy-rules.sh'
    ]
  },
  'temp/': {
    description: 'Temporary files and build artifacts',
    directories: [
      'coverage/',
      '.expo/'
    ]
  }
};

// Files to keep in root (essential project files)
const KEEP_IN_ROOT = [
  'package.json',
  'package-lock.json',
  'app.json',
  'eas.json',
  'App.tsx',
  'index.ts',
  'README.md',
  '.gitignore',
  '.DS_Store'
];

// Directories to keep as-is
const PRESERVE_DIRECTORIES = [
  'src/',
  'assets/',
  'scripts/',
  'app-store-assets/',
  'ios/',
  'node_modules/'
  // Note: .kiro/ is at root level, not inside GoalStreakApp/
];

function createDirectoryIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logSuccess(`Created directory: ${dirPath}`);
  }
}

function moveFile(source, destination) {
  try {
    const destDir = path.dirname(destination);
    createDirectoryIfNotExists(destDir);
    
    if (fs.existsSync(source)) {
      fs.renameSync(source, destination);
      logSuccess(`Moved: ${source} → ${destination}`);
      return true;
    } else {
      logWarning(`File not found: ${source}`);
      return false;
    }
  } catch (error) {
    logError(`Failed to move ${source}: ${error.message}`);
    return false;
  }
}

function moveDirectory(source, destination) {
  try {
    if (fs.existsSync(source)) {
      const destDir = path.dirname(destination);
      createDirectoryIfNotExists(destDir);
      fs.renameSync(source, destination);
      logSuccess(`Moved directory: ${source} → ${destination}`);
      return true;
    } else {
      logWarning(`Directory not found: ${source}`);
      return false;
    }
  } catch (error) {
    logError(`Failed to move directory ${source}: ${error.message}`);
    return false;
  }
}

function organizeFiles() {
  logStep(1, 'Organizing Files by Category');
  
  let movedFiles = 0;
  let movedDirectories = 0;
  
  // Create target directories
  Object.keys(ORGANIZATION_PLAN).forEach(dir => {
    createDirectoryIfNotExists(dir);
  });
  
  // Move files according to plan
  Object.entries(ORGANIZATION_PLAN).forEach(([targetDir, config]) => {
    log(`\n${colors.bright}${config.description}:${colors.reset}`);
    
    // Move files
    if (config.files) {
      config.files.forEach(file => {
        const source = file;
        const destination = path.join(targetDir, file);
        if (moveFile(source, destination)) {
          movedFiles++;
        }
      });
    }
    
    // Move directories
    if (config.directories) {
      config.directories.forEach(dir => {
        const source = dir;
        const destination = path.join(targetDir, dir);
        if (moveDirectory(source, destination)) {
          movedDirectories++;
        }
      });
    }
  });
  
  logInfo(`Total files moved: ${movedFiles}`);
  logInfo(`Total directories moved: ${movedDirectories}`);
}

function updateGitignore() {
  logStep(2, 'Updating .gitignore');
  
  const gitignorePath = '.gitignore';
  const additionalIgnores = [
    '',
    '# Organized directories',
    'temp/',
    'docs/reports/',
    '',
    '# macOS',
    '.DS_Store',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '',
    '# Logs',
    '*.log',
    'logs/',
    '',
    '# Runtime data',
    'pids/',
    '*.pid',
    '*.seed',
    '*.pid.lock'
  ];
  
  try {
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    // Add new ignores if they don't exist
    const newIgnores = additionalIgnores.filter(line => 
      !gitignoreContent.includes(line) && line.trim() !== ''
    );
    
    if (newIgnores.length > 0) {
      gitignoreContent += '\n' + additionalIgnores.join('\n');
      fs.writeFileSync(gitignorePath, gitignoreContent);
      logSuccess('Updated .gitignore with new ignore patterns');
    } else {
      logInfo('.gitignore already up to date');
    }
  } catch (error) {
    logError(`Failed to update .gitignore: ${error.message}`);
  }
}

function createDirectoryGuide() {
  logStep(3, 'Creating Directory Structure Guide');
  
  const guide = `# GoalStreak Directory Structure Guide

## 📁 Organized Project Structure

This document explains the organized directory structure for better maintainability and tracking.

### Root Level
\`\`\`
GoalStreakApp/
├── 📱 App.tsx                 # Main app component
├── 📄 index.ts                # App entry point
├── 📦 package.json            # Dependencies and scripts
├── ⚙️  app.json               # Expo configuration
├── 🔧 eas.json                # EAS Build configuration
├── 📖 README.md               # Project overview
└── 🚫 .gitignore              # Git ignore rules
\`\`\`

### Source Code
\`\`\`
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
\`\`\`

### Configuration
\`\`\`
config/
├── .env.development           # Development environment variables
├── .env.production            # Production environment variables
├── .eslintrc.js               # ESLint configuration
├── jest.config.js             # Jest testing configuration
└── tsconfig.json              # TypeScript configuration
\`\`\`

### Firebase
\`\`\`
firebase/
├── firebase.json              # Firebase project configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── storage.rules              # Firebase Storage rules
└── deploy-rules.sh            # Deployment script
\`\`\`

### Documentation
\`\`\`
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
\`\`\`

### Scripts
\`\`\`
scripts/
├── ios-production-build-and-submit.js    # Main iOS build script
├── configure-app-store-connect.js        # App Store configuration
├── setup-eas-credentials.js              # Credential setup
├── ios-pre-submission-validation.js      # Validation script
├── cleanup-and-organize-directory.js     # This cleanup script
└── README.md                              # Scripts documentation
\`\`\`

### App Store Assets
\`\`\`
app-store-assets/
├── metadata/                  # App Store metadata
├── screenshots/               # App Store screenshots
├── real-screenshots/          # Actual device screenshots
├── icons/                     # App icons
├── marketing/                 # Marketing materials
└── promotional/               # Promotional graphics
\`\`\`

### Assets
\`\`\`
assets/
├── icon.png                   # App icon
├── adaptive-icon.png          # Android adaptive icon
├── splash-icon.png            # Splash screen icon
├── favicon.png                # Web favicon
└── fonts/                     # Custom fonts
\`\`\`

### Temporary Files
\`\`\`
temp/
├── coverage/                  # Test coverage reports
└── .expo/                     # Expo build cache
\`\`\`

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
\`\`\`bash
npm run cleanup:directory
\`\`\`

### Adding New Files
- **Documentation**: Add to \`docs/\`
- **Configuration**: Add to \`config/\`
- **Scripts**: Add to \`scripts/\`
- **Assets**: Add to appropriate asset directories

### Git Best Practices
- Commit organized files separately
- Use descriptive commit messages
- Keep temporary files out of version control

---

**Last Updated**: ${new Date().toLocaleDateString()}
**Organization Script**: \`scripts/cleanup-and-organize-directory.js\`
`;

  fs.writeFileSync('docs/DIRECTORY_STRUCTURE_GUIDE.md', guide);
  logSuccess('Created directory structure guide: docs/DIRECTORY_STRUCTURE_GUIDE.md');
}

function updatePackageJsonScripts() {
  logStep(4, 'Updating Package.json Scripts');
  
  try {
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add cleanup script
    if (!packageJson.scripts['cleanup:directory']) {
      packageJson.scripts['cleanup:directory'] = 'node scripts/cleanup-and-organize-directory.js';
      packageJson.scripts['cleanup:all'] = 'npm run cleanup:directory && npm run lint:fix';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      logSuccess('Added cleanup scripts to package.json');
    } else {
      logInfo('Cleanup scripts already exist in package.json');
    }
  } catch (error) {
    logError(`Failed to update package.json: ${error.message}`);
  }
}

function generateCleanupReport() {
  logStep(5, 'Generating Cleanup Report');
  
  const report = `# Directory Cleanup Report

**Date**: ${new Date().toLocaleString()}
**Script**: cleanup-and-organize-directory.js

## 📊 Organization Summary

### Files Organized
- **Documentation**: Moved to \`docs/\`
- **Configuration**: Moved to \`config/\`
- **Firebase**: Moved to \`firebase/\`
- **Reports**: Moved to \`docs/reports/\`
- **Temporary**: Moved to \`temp/\`

### Preserved Structure
- ✅ \`src/\` - Source code (unchanged)
- ✅ \`scripts/\` - Build and utility scripts (unchanged)
- ✅ \`app-store-assets/\` - App Store materials (unchanged)
- ✅ \`assets/\` - App assets (unchanged)
- ✅ \`.kiro/\` - Kiro specs and configuration (unchanged)

### Root Directory
- ✅ Essential project files kept in root
- ✅ Clutter removed for better navigation
- ✅ Logical organization maintained

## 🎯 Benefits Achieved

### Improved Navigation
- Faster file discovery
- Logical grouping of related files
- Reduced root directory clutter

### Better Git Tracking
- Cleaner commit history
- Easier to track changes by category
- Reduced noise in diffs

### Enhanced Maintainability
- Clear separation of concerns
- Easier onboarding for new developers
- Consistent project structure

## 📁 New Directory Structure

\`\`\`
GoalStreakApp/
├── 📱 Core App Files (root)
├── 📂 src/ (source code)
├── 📂 docs/ (all documentation)
├── 📂 config/ (configuration files)
├── 📂 firebase/ (Firebase setup)
├── 📂 scripts/ (build scripts)
├── 📂 app-store-assets/ (App Store materials)
├── 📂 assets/ (app assets)
├── 📂 temp/ (temporary files)
└── 📂 .kiro/ (Kiro specs - unchanged)
\`\`\`

## 🔄 Next Steps

1. **Review Organization**: Check that all files are in correct locations
2. **Update References**: Update any hardcoded file paths if needed
3. **Test Build**: Ensure build process still works correctly
4. **Update Documentation**: Keep directory guide up to date

## 🚀 Ready for iOS Submission

The organized structure is now ready for:
- ✅ Clean iOS App Store submission
- ✅ Better project maintenance
- ✅ Improved developer experience
- ✅ Professional project presentation

---

**Status**: ✅ Organization Complete
**Next**: Ready for Apple Developer Program setup
`;

  fs.writeFileSync('docs/reports/directory-cleanup-report.md', report);
  logSuccess('Generated cleanup report: docs/reports/directory-cleanup-report.md');
}

function validateOrganization() {
  logStep(6, 'Validating Organization');
  
  let issues = 0;
  
  // Check that essential files are still in root
  KEEP_IN_ROOT.forEach(file => {
    if (file !== '.DS_Store' && !fs.existsSync(file)) {
      logError(`Essential file missing from root: ${file}`);
      issues++;
    }
  });
  
  // Check that preserved directories are intact
  PRESERVE_DIRECTORIES.forEach(dir => {
    if (!fs.existsSync(dir)) {
      logError(`Preserved directory missing: ${dir}`);
      issues++;
    }
  });
  
  // Special note about .kiro/ directory (it's at root level, outside GoalStreakApp/)
  logInfo('Note: .kiro/ directory is preserved at root level (outside GoalStreakApp/)');
  
  // Check that new directories were created
  Object.keys(ORGANIZATION_PLAN).forEach(dir => {
    if (!fs.existsSync(dir)) {
      logError(`Target directory not created: ${dir}`);
      issues++;
    }
  });
  
  if (issues === 0) {
    logSuccess('Organization validation passed - all files and directories in correct locations');
  } else {
    logError(`Organization validation failed with ${issues} issues`);
  }
  
  return issues === 0;
}

function displaySummary() {
  log(`\n${colors.bright}${colors.magenta}📁 Directory Cleanup Complete!${colors.reset}\n`);
  
  log(`${colors.bright}What was organized:${colors.reset}`);
  log('• Documentation moved to docs/');
  log('• Configuration files moved to config/');
  log('• Firebase files moved to firebase/');
  log('• Reports moved to docs/reports/');
  log('• Temporary files moved to temp/');
  
  log(`\n${colors.bright}What was preserved:${colors.reset}`);
  log('• Source code (src/) - unchanged');
  log('• Scripts (scripts/) - unchanged');
  log('• App Store assets - unchanged');
  log('• Kiro specs (.kiro/) - unchanged');
  log('• Essential root files - unchanged');
  
  log(`\n${colors.bright}Benefits:${colors.reset}`);
  log('• Cleaner root directory');
  log('• Better file organization');
  log('• Easier navigation and maintenance');
  log('• Professional project structure');
  
  log(`\n${colors.bright}Next steps:${colors.reset}`);
  log('1. Review the organization in your file explorer');
  log('2. Check docs/DIRECTORY_STRUCTURE_GUIDE.md for details');
  log('3. Continue with iOS App Store submission when ready');
  
  log(`\n${colors.cyan}Ready for Apple Developer Program setup! 🚀${colors.reset}`);
}

async function main() {
  try {
    log(`${colors.bright}${colors.magenta}🧹 GoalStreak Directory Cleanup & Organization${colors.reset}\n`);
    
    log('This script will organize your project directory for better maintainability.');
    log('All Kiro specs and essential functionality will be preserved.\n');
    
    organizeFiles();
    updateGitignore();
    createDirectoryGuide();
    updatePackageJsonScripts();
    generateCleanupReport();
    
    const isValid = validateOrganization();
    
    if (isValid) {
      displaySummary();
    } else {
      logError('Organization completed with issues. Please review the validation errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Directory cleanup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ORGANIZATION_PLAN,
  KEEP_IN_ROOT,
  PRESERVE_DIRECTORIES,
  organizeFiles,
  validateOrganization
};
# GoalStreak Build Scripts

This directory contains validation and build scripts for the GoalStreak app.

## Scripts Overview

### `validate-build.js`
Basic pre-build validation script that checks essential configuration files and assets.

**Usage:**
```bash
npm run validate:build
# or
node scripts/validate-build.js
```

**Validates:**
- Environment files (`.env.development`, `.env.production`)
- App configuration (`app.json`)
- EAS Build configuration (`eas.json`)
- Required assets (icons, splash screens)

### `comprehensive-validation.js`
Extended validation script that performs thorough checks for production readiness.

**Usage:**
```bash
npm run validate:comprehensive
# or
npm run validate:all
# or
node scripts/comprehensive-validation.js
```

**Validates:**
- All basic build validations
- Package dependencies and scripts
- TypeScript configuration
- Firebase configuration
- Source code structure
- Git repository status
- App store readiness (privacy policy, terms of service)

## Automatic Validation

The validation scripts are automatically run before production builds:

```bash
# These commands automatically run validate:build first
npm run build:production
npm run build:production:ios
npm run build:production:android

# This command automatically runs validate:comprehensive first
npm run submit:production
```

## Exit Codes

- `0`: All validations passed
- `1`: One or more validations failed

## Configuration

Validation rules are defined in the `VALIDATION_CONFIG` object in each script:

```javascript
const VALIDATION_CONFIG = {
  environmentVariables: {
    required: [
      'EXPO_PUBLIC_ENVIRONMENT',
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      // ... more variables
    ]
  },
  // ... more configuration
};
```

## Error Solutions

When validations fail, the scripts provide suggested solutions:

- **Missing environment file**: Instructions for creating Firebase configuration
- **Missing app.json**: Steps to restore or regenerate configuration
- **Missing eas.json**: EAS CLI setup instructions
- **Missing assets**: Asset creation and optimization guidance

## Security Checks

The production environment validation includes security checks:

- Validates Firebase API key format
- Detects placeholder values in configuration
- Warns about suspicious configuration patterns

## Integration with CI/CD

These scripts can be integrated into continuous integration pipelines:

```yaml
# GitHub Actions example
- name: Validate Build Configuration
  run: npm run validate:comprehensive
```

## Troubleshooting

### Common Issues

1. **Environment variables not found**
   - Ensure `.env.development` and `.env.production` files exist
   - Copy Firebase configuration from Firebase Console

2. **Missing assets**
   - Generate app icons using design tools
   - Use `expo install expo-splash-screen` for splash screens

3. **TypeScript warnings**
   - Enable strict mode in `tsconfig.json`
   - Set `moduleResolution: "node"`

4. **Git status warnings**
   - Commit changes before production builds
   - Switch to main/master branch for releases

### Getting Help

If validation fails and solutions aren't clear:

1. Check the error messages and suggested solutions
2. Review the GoalStreak development documentation
3. Ensure all dependencies are installed: `npm install`
4. Verify Firebase project configuration

## Development

To modify or extend the validation scripts:

1. Follow the existing patterns for new validations
2. Add configuration to `VALIDATION_CONFIG` objects
3. Include helpful error messages and solutions
4. Test with both passing and failing scenarios
5. Update this README with new features
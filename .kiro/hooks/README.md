# GoalStreak Agent Hooks

## Overview
Agent hooks provide automated assistance and quality assurance throughout the development process. They monitor file changes and trigger intelligent analysis to help maintain code quality, compliance, and project organization.

## 🔧 Development Hooks

### Code Quality Analyzer
**File**: `code-quality-analyzer.kiro.hook`
**Triggers**: Source code changes in `GoalStreakApp/src/`
**Purpose**: Analyzes code for improvements, best practices, and performance optimizations

**What it does**:
- Identifies code smells and anti-patterns
- Suggests design pattern improvements
- Checks React Native/TypeScript best practices
- Finds performance optimization opportunities
- Ensures GoalStreak coding standards compliance

### Source to Docs Sync
**File**: `source-docs-sync.kiro.hook`
**Triggers**: Changes to source files, configs, or documentation
**Purpose**: Keeps documentation synchronized with codebase changes

**What it does**:
- Updates architecture docs when components change
- Syncs development guides with build process changes
- Documents new services, hooks, and utilities
- Maintains consistency between code and documentation

## 🏪 App Store Launch Hooks

### App Store Compliance Checker
**File**: `app-store-compliance-checker.kiro.hook`
**Triggers**: Changes to app config, legal docs, or metadata
**Purpose**: Ensures App Store submission compliance

**What it does**:
- Validates iOS privacy requirements and descriptions
- Checks legal document completeness and accuracy
- Ensures metadata consistency across all files
- Verifies technical compliance with App Store guidelines
- Provides submission readiness assessment

### Legal Document Validator
**File**: `legal-document-validator.kiro.hook`
**Triggers**: Changes to privacy policy, terms of service, or compliance docs
**Purpose**: Validates legal compliance and document consistency

**What it does**:
- Checks privacy policy covers all data practices
- Validates terms of service completeness
- Ensures cross-document consistency
- Verifies regulatory compliance (GDPR, CCPA, COPPA)
- Validates technical integration of legal documents

### App Store Asset Organizer
**File**: `app-store-asset-organizer.kiro.hook`
**Triggers**: Changes to app-store-assets directory or app assets
**Purpose**: Maintains proper asset organization for App Store submission

**What it does**:
- Validates asset directory structure
- Checks screenshot requirements and quality
- Ensures icons and graphics meet standards
- Optimizes assets for submission
- Provides submission readiness checklist

## 📋 Project Management Hooks

### Spec Task Tracker
**File**: `spec-task-tracker.kiro.hook`
**Triggers**: Changes to spec files (tasks.md, requirements.md, design.md)
**Purpose**: Intelligent task management and progress tracking

**What it does**:
- Analyzes task progress and completion
- Recommends next logical tasks to work on
- Identifies dependencies and potential blockers
- Tracks milestone progress and timeline
- Ensures alignment between requirements and implementation

## 🎯 Hook Usage Guidelines

### When Hooks Trigger
- **File Edited**: Most hooks trigger when relevant files are modified
- **File Deleted**: Source-docs-sync also triggers on file deletions
- **Automatic**: Hooks run automatically when conditions are met

### Best Practices
1. **Review Hook Output**: Always review the analysis and recommendations
2. **Act on Critical Issues**: Address ❌ critical issues immediately
3. **Consider Suggestions**: Evaluate ⚠️ warnings and suggestions
4. **Track Progress**: Use ✅ confirmations to track improvements
5. **Update Regularly**: Keep hooks enabled for continuous monitoring

### File Creation Rules (CRITICAL)
**All hooks now enforce these rules to prevent file proliferation:**

1. **Documentation Updates**:
   - ❌ NEVER create new summary/report files
   - ✅ ALWAYS update existing documentation
   - ✅ ALWAYS use CHANGELOG.md for incremental updates

2. **Code Changes**:
   - ❌ NEVER suggest creating new components for UI variations
   - ✅ ALWAYS extend existing components with props/variants
   - ❌ NEVER suggest duplicate service files
   - ✅ ALWAYS add methods to existing services

3. **Configuration**:
   - ❌ NEVER create duplicate .env files
   - ✅ ALWAYS keep environment files in root directory only
   - ❌ NEVER create environment-specific config duplicates

**Before ANY file creation, hooks will verify:**
- Can this be added to an existing file?
- Does a similar file already exist?
- Will this create duplication?
- Is this truly necessary?

### Customization
- **Enable/Disable**: Set `"enabled": true/false` in hook files
- **Modify Patterns**: Update file patterns to change trigger conditions
- **Adjust Prompts**: Customize analysis focus by modifying prompts

## 🔄 Hook Maintenance

### Regular Updates
- Update file patterns when directory structure changes
- Adjust prompts when project focus shifts
- Add new hooks for emerging needs
- Remove obsolete hooks when no longer needed

### Current Status (January 2025)
- ✅ All hooks updated for optimized directory structure
- ✅ File creation rules enforced across all hooks
- ✅ Documentation consolidation guidelines implemented
- ✅ App Store launch hooks added for current phase
- ✅ Legal compliance monitoring implemented
- ✅ Asset organization automation in place
- ✅ Zero-duplication policy enforced

## 📊 Hook Performance

### Expected Benefits
- **Reduced Manual Oversight**: Automated quality checks
- **Faster Issue Detection**: Early identification of problems
- **Consistent Standards**: Automated compliance monitoring
- **Improved Documentation**: Synchronized docs and code
- **Better Organization**: Maintained asset structure

### Monitoring
- Review hook suggestions regularly
- Track improvement in code quality metrics
- Monitor compliance checklist completion
- Assess documentation synchronization effectiveness

---

**Note**: Hooks are designed to assist, not replace, human judgment. Always review recommendations and apply them thoughtfully based on project context and requirements.
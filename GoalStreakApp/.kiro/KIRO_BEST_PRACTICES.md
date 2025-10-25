# Kiro AI Development Best Practices

## 🔍 What Went Wrong: Post-Mortem Analysis

### The Issue
When implementing the dropdown time picker, we encountered a frustrating cycle:
1. ✅ Code was written using `fsWrite`
2. ✅ Code appeared correct when read back
3. ❌ **Kiro's autofix/formatter silently reverted changes**
4. ❌ App kept showing old cached version
5. ❌ Multiple troubleshooting cycles wasted time

### Root Causes
1. **Kiro Auto-Revert**: Kiro IDE's autofix feature reverted files without clear notification
2. **No Immediate Verification**: Changes weren't verified in git before proceeding
3. **Cache Confusion**: React Native cache masked the real issue
4. **Assumption of Success**: Assumed `fsWrite` success meant file was permanently saved

## ✅ Best Practices Going Forward

### 1. **ALWAYS Verify File Changes Immediately**

After ANY file modification, verify it saved:

```bash
# Verify the change exists
grep "UNIQUE_STRING_FROM_CHANGE" path/to/file.tsx

# Check git status
git diff path/to/file.tsx

# If no diff shown, the change was reverted!
```

**Rule**: Never proceed to next step without verifying the change persisted.

### 2. **Commit Critical Changes Immediately**

```bash
# After making important changes:
git add path/to/file.tsx
git commit -m "feat: specific change description"

# This locks in the change and prevents auto-revert
```

**When to commit immediately:**
- ✅ Complete feature implementations
- ✅ Major refactors
- ✅ Bug fixes
- ✅ Any change that took >5 minutes to write

**When commits can wait:**
- Small typo fixes
- Comment updates
- Minor style tweaks

### 3. **Use Git Status as Source of Truth**

```bash
# Before testing changes:
git status

# Should show:
# modified:   src/components/SomeComponent.tsx

# If it shows "nothing to commit", your changes were reverted!
```

### 4. **Handle Kiro Auto-Revert**

**If Kiro reverts your changes:**

```bash
# Option 1: Use bash to write directly (bypasses Kiro)
cat > path/to/file.tsx << 'EOF'
[your code here]
EOF

# Option 2: Use strReplace instead of fsWrite
# strReplace is more reliable for modifications

# Option 3: Commit immediately after fsWrite
git add path/to/file.tsx && git commit -m "lock in changes"
```

### 5. **Clear Cache Properly for React Native**

**Standard cache clear:**
```bash
# Clear Expo cache
rm -rf .expo

# Clear Metro bundler cache
rm -rf node_modules/.cache

# Clear temp files
rm -rf /tmp/metro-* /tmp/haste-map-*

# Start with clean cache
npx expo start --clear
```

**Nuclear option (if standard doesn't work):**
```bash
# Clear everything
rm -rf .expo node_modules/.cache ios/build android/build /tmp/metro-* /tmp/haste-map-*

# Restart with full reset
npx expo start --clear --reset-cache
```

### 6. **Verify Changes in Running App**

**Add verification logs:**
```typescript
// At the top of modified component
console.log('🔍 [ComponentName] VERSION: [unique-identifier]');

// Example:
console.log('🔍 NotificationSetup VERSION: dropdown-v2');
```

**Check console output** to confirm the new version loaded.

### 7. **Use Descriptive Commit Messages**

**Bad:**
```bash
git commit -m "fix"
git commit -m "update component"
```

**Good:**
```bash
git commit -m "feat: implement dropdown time picker in NotificationSetup"
git commit -m "fix: resolve cache issue preventing dropdown from showing"
```

**Format:**
```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code restructuring
- docs: Documentation
- style: Formatting
- test: Tests
- chore: Maintenance
```

### 8. **Workflow for Major Changes**

```bash
# 1. Make the change
[use fsWrite or strReplace]

# 2. IMMEDIATELY verify
git diff path/to/file.tsx

# 3. If diff shows changes, commit
git add path/to/file.tsx
git commit -m "feat: descriptive message"

# 4. Clear cache
rm -rf .expo node_modules/.cache

# 5. Restart server
npx expo start --clear

# 6. Force reload app
# - Shake device → Reload
# - Or force close and reopen

# 7. Verify in console
# Look for your verification log
```

## 🎯 Improved Development Flow

### Before (What We Did - Caused Issues)
```
1. Write code with fsWrite
2. Assume it saved
3. Tell user to reload
4. User reports it doesn't work
5. Troubleshoot for 30 minutes
6. Discover Kiro reverted it
7. Write again with bash
8. Finally works
```

### After (What We Should Do)
```
1. Write code with fsWrite
2. VERIFY: git diff shows changes
3. COMMIT: git add && git commit
4. VERIFY: grep for unique string
5. Clear cache properly
6. Tell user to reload
7. Works first time! ✅
```

## 📋 Checklist for Every Code Change

- [ ] Make the change (fsWrite/strReplace)
- [ ] Verify with `git diff`
- [ ] If changes shown, commit immediately
- [ ] If no changes shown, use bash to write
- [ ] Verify with `grep` for unique string
- [ ] Add console.log for version verification
- [ ] Clear cache (`rm -rf .expo node_modules/.cache`)
- [ ] Restart server (`npx expo start --clear`)
- [ ] Tell user to force close and reopen app
- [ ] Check console for verification log

## 🚨 Red Flags to Watch For

### User Says "It's Not Working"
**Don't assume cache issue first!**

1. ✅ Check: `git diff` - Are changes actually saved?
2. ✅ Check: `git log` - Was it committed?
3. ✅ Check: `grep` - Does file contain the new code?
4. ✅ Only then: Clear cache and reload

### Kiro Shows "Autofix Applied"
**This means your changes were modified!**

1. ✅ Immediately check `git diff`
2. ✅ If changes reverted, use bash to write
3. ✅ Commit immediately to lock it in

### Multiple Reload Attempts Fail
**Stop and verify the source:**

1. ✅ Check committed version: `git show HEAD:path/to/file`
2. ✅ Check disk version: `cat path/to/file`
3. ✅ If different, file wasn't committed
4. ✅ Commit it, then reload

## 💡 Pro Tips

### 1. Use Git Branches for Features
```bash
# Create feature branch
git checkout -b feature/dropdown-picker

# Make changes and commit frequently
git add .
git commit -m "feat: add dropdown component"

# When done, merge to main
git checkout main
git merge feature/dropdown-picker
```

### 2. Use Git Stash for Quick Saves
```bash
# Save work in progress
git stash save "WIP: dropdown implementation"

# List stashes
git stash list

# Restore later
git stash pop
```

### 3. Create Verification Scripts
```bash
# verify-changes.sh
#!/bin/bash
echo "Checking for uncommitted changes..."
git status --short

echo "\nChecking last commit..."
git log -1 --oneline

echo "\nVerifying file exists..."
grep -l "VERIFICATION_STRING" src/**/*.tsx
```

### 4. Use Watch Mode for Development
```bash
# Terminal 1: Watch for file changes
watch -n 1 'git status --short'

# Terminal 2: Development server
npx expo start --clear
```

## 📊 Success Metrics

**Before implementing these practices:**
- ❌ 30+ minutes troubleshooting cache issues
- ❌ Multiple reload attempts
- ❌ Frustration and confusion
- ❌ Unclear what went wrong

**After implementing these practices:**
- ✅ Changes work first time
- ✅ Clear verification at each step
- ✅ Immediate feedback if something wrong
- ✅ Faster development cycle

## 🎓 Key Lessons Learned

1. **Never trust that a file saved** - Always verify
2. **Kiro can revert changes** - Commit immediately
3. **Cache is real but not always the issue** - Check source first
4. **Git is your source of truth** - Use it constantly
5. **Verification logs save time** - Add them proactively
6. **Clear communication** - Tell user exactly what to check

## 🔄 Continuous Improvement

This document should be updated whenever we encounter new issues or discover better practices.

**Last Updated**: January 2025
**Next Review**: After next major feature implementation

---

**Remember**: The goal is to catch issues immediately, not after the user reports them!

# GoalStreak Development Workflow

## Critical Rules for AI Development

### 1. Verify Every File Change
```bash
# After ANY file modification, immediately verify:
git diff path/to/file.tsx

# If no diff shown → change was reverted by Kiro autofix!
```

**Rule**: Never proceed without confirming changes persisted.

### 2. Commit Important Changes Immediately
```bash
# After completing a feature or fix:
git add path/to/file.tsx
git commit -m "feat: specific description"
```

**Commit immediately for:**
- Complete features
- Bug fixes  
- Major refactors
- Anything taking >5 minutes

### 3. Add Verification Logs
```typescript
// In modified components:
console.log('🔍 [ComponentName] VERSION: [unique-id]');
```

This confirms the new version loaded in the app.

### 4. React Native Cache Clearing
```bash
# Standard clear:
rm -rf .expo node_modules/.cache
npx expo start --clear

# Nuclear option if needed:
rm -rf .expo node_modules/.cache ios/build /tmp/metro-*
npx expo start --clear --reset-cache
```

### 5. Workflow for Code Changes
```
1. Make change (fsWrite/strReplace)
2. ✅ VERIFY: git diff shows changes
3. ✅ COMMIT: git add && commit  
4. ✅ VERIFY: grep for unique string
5. Clear cache
6. Restart server
7. User force closes and reopens app
```

## Project-Specific Guidelines

### File Organization
- Environment files (.env*) in root ONLY
- Config files in config/ directory
- Documentation in docs/ directory
- Never create duplicate files

### Commit Messages
```
feat: add dropdown time picker
fix: resolve notification setup rendering
refactor: optimize habit card component
docs: update deployment guide
```

### Before Telling User to Test
- [ ] Verified with `git diff`
- [ ] Committed changes
- [ ] Verified with `grep`
- [ ] Cleared cache
- [ ] Added verification log

## Common Issues

### "Changes not showing"
1. Check `git diff` - are changes saved?
2. Check `git log` - was it committed?
3. Check console - does verification log appear?
4. Only then: clear cache and reload

### Kiro Auto-Revert
If Kiro reverts changes:
```bash
# Use bash to write directly:
cat > path/to/file.tsx << 'EOF'
[code here]
EOF

# Then commit immediately:
git add path/to/file.tsx && git commit -m "lock changes"
```

## Success Criteria

✅ Changes work first time
✅ Clear verification at each step
✅ No back-and-forth troubleshooting
✅ Fast development cycle

---

**Remember**: Git is the source of truth. Always verify before proceeding.

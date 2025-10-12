# 🤝 GoalStreak Contributing Guide

Complete guide for contributing to GoalStreak development including git workflow, coding standards, and best practices.

## 📁 Project Structure

```
GoalStreak/                    # Main project directory (git root)
├── GoalStreakApp/            # React Native app code
├── docs/                     # Documentation
├── development-sessions/     # Historical development logs (archived)
├── design-images/           # Design assets & inspiration
├── app-store/               # App Store assets and metadata
├── README.md                # Project overview
└── ROADMAP.md              # Future development plans
```

## 🚀 Quick Start Commands

### Daily Development Workflow
```bash
# Navigate to project root
cd /Users/popsieandal/Documents/GoalStreak

# Check current status
git status

# Start development server
cd GoalStreakApp && npm start

# Save your work (from project root)
cd /Users/popsieandal/Documents/GoalStreak
git add .
git commit -m "✨ Your descriptive commit message"
git push origin main
```

### Emergency Backup
```bash
git add .
git commit -m "🚧 WIP: saving progress"
git push origin main
```

## 📝 Git Workflow

### 1. Start Development Session
```bash
# Always work from project root
cd /Users/popsieandal/Documents/GoalStreak

# Check current status and pull latest changes
git status
git pull origin main
```

### 2. Make Changes
- Edit app code in `GoalStreakApp/`
- Update documentation in `docs/`
- Add new assets as needed

### 3. Review Changes
```bash
# See what files you've modified
git status
git diff                    # See detailed changes
```

### 4. Stage and Commit Changes
```bash
# Stage all changes
git add .

# Or stage specific files
git add GoalStreakApp/src/components/NewComponent.tsx
git add docs/DEVELOPMENT.md

# Commit with descriptive message
git commit -m "✨ Add new feature: Brief description"

# Push to GitHub
git push origin main
```

## 🏷️ Commit Message Standards

### Format
```
<emoji> <type>: <description>

[optional body]

[optional footer]
```

### Commit Types & Emojis
```bash
# New features
git commit -m "✨ Add habit timer functionality"

# Bug fixes
git commit -m "🐛 Fix streak calculation error"

# UI/UX improvements
git commit -m "🎨 Update dashboard layout"

# Performance improvements
git commit -m "⚡ Optimize habit loading performance"

# Documentation updates
git commit -m "📋 Update development guide"

# Code refactoring
git commit -m "♻️ Refactor habit service architecture"

# Dependencies
git commit -m "📦 Add react-native-reanimated dependency"

# Configuration changes
git commit -m "🔧 Update Firebase configuration"

# Work in progress
git commit -m "🚧 WIP: implementing social features"

# End of session
git commit -m "💾 End Session: social features complete"
```

### Detailed Commit Template
```bash
git commit -m "✨ Add habit completion timer

🔧 Technical changes:
- Implement countdown timer with React hooks
- Add circular progress indicator
- Integrate with habit completion system

📱 User experience:
- Users can set focus timers for habits
- Visual countdown with progress ring
- Automatic habit completion when timer ends

🎯 Impact:
- Transforms app into productivity tool
- Combines habit tracking with time management
- Increases user engagement and focus"
```

## 🔄 Common Workflows

### Feature Development
```bash
# Start new feature
cd /Users/popsieandal/Documents/GoalStreak
git pull origin main

# Work on feature...
# (edit files, test changes)

# Commit feature
git add .
git commit -m "✨ Add [Feature Name]

🔧 Implementation:
- Key technical changes
- New components/services

📱 User benefit:
- How it improves the app"

git push origin main
```

### Bug Fix
```bash
# Identify and fix bug
git add .
git commit -m "🐛 Fix [Issue Description]

🔧 Problem:
- What was broken
- How it affected users

✅ Solution:
- How it was fixed
- Testing performed"

git push origin main
```

### Documentation Update
```bash
git add docs/
git commit -m "📋 Update documentation

📝 Changes:
- Updated development guide
- Added new troubleshooting section
- Fixed broken links"

git push origin main
```

### End of Development Session
```bash
git add .
git commit -m "💾 End development session

✅ Completed:
- Major features implemented
- Bugs fixed
- Documentation updated

📊 Progress: [Brief status update]
🎯 Next: [Planned next steps]"

git push origin main
```

## 🛠️ Development Environment

### App Development Commands
```bash
# Navigate to app directory for development
cd /Users/popsieandal/Documents/GoalStreak/GoalStreakApp

# Start development server
npm start                    # Choose platform (iOS/Android/Web)
npm run ios                  # iOS simulator directly
npm run android             # Android emulator directly

# Install new dependencies
npm install package-name

# Always commit from project root
cd /Users/popsieandal/Documents/GoalStreak
git add GoalStreakApp/package.json GoalStreakApp/package-lock.json
git commit -m "📦 Add [package-name] dependency"
git push origin main
```

### Testing Before Commit
```bash
# Test the app works
cd GoalStreakApp && npm start

# Check for TypeScript errors
npm run type-check

# Run linting (if configured)
npm run lint

# Then commit from project root
cd /Users/popsieandal/Documents/GoalStreak
git add .
git commit -m "Your message"
git push origin main
```

## 🎯 Best Practices

### Commit Frequency
- **Commit early and often** - Don't wait until end of session
- **Small, focused commits** - One feature or fix per commit
- **Working state** - Each commit should leave the app in a working state
- **Meaningful messages** - Future you will thank you for clear descriptions

### Code Quality
- **Test before committing** - Ensure app runs without errors
- **TypeScript compliance** - Fix type errors before committing
- **Clean code** - Remove console.logs and debug code
- **Documentation** - Update relevant docs with code changes

### Git Hygiene
- **Pull before push** - Always get latest changes first
- **Review changes** - Use `git status` and `git diff` before committing
- **Descriptive messages** - Include both technical and user impact
- **Push regularly** - Don't let commits pile up locally

## 🆘 Troubleshooting

### Common Issues

#### Wrong Directory Error
```bash
# If you get "not a git repository" error
cd /Users/popsieandal/Documents/GoalStreak
```

#### Push Rejected
```bash
# If push fails due to remote changes
git pull origin main
git push origin main
```

#### Forgot to Commit
```bash
# Save current work quickly
git add .
git commit -m "💾 Save current progress"
git push origin main
```

#### Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
# Make corrections, then commit again
```

#### See Commit History
```bash
git log --oneline                    # Brief history
git log --graph --oneline --all      # Visual history
```

#### Check Repository Status
```bash
git status                           # Current changes
git remote -v                        # Remote repository info
git branch -v                        # Branch information
```

### Getting Help
- **Git Issues** - Check this troubleshooting section first
- **App Development** - See [Development Guide](DEVELOPMENT.md)
- **Technical Questions** - Create GitHub issue
- **Urgent Issues** - Check project README for contact info

## 📊 Development Session Template

### Session Start
```bash
cd /Users/popsieandal/Documents/GoalStreak
git status
git pull origin main

# Document session goals (optional)
# - What you plan to work on
# - Expected outcomes
# - Time estimate
```

### During Session
```bash
# Regular commits as you work
git add .
git commit -m "✨ Implement specific feature"
git push origin main

# Continue development...
```

### Session End
```bash
# Final commit with session summary
git add .
git commit -m "💾 End development session

✅ Completed:
- Major achievements
- Features implemented
- Bugs fixed

📊 Status: [Current project status]
🎯 Next: [Plans for next session]"

git push origin main
```

## 🔗 Quick Reference

### Essential Commands
```bash
cd /Users/popsieandal/Documents/GoalStreak  # Navigate to project
git status                                   # Check status
git add .                                   # Stage all changes
git commit -m "Message"                     # Commit changes
git push origin main                        # Push to GitHub
git pull origin main                        # Get latest changes
```

### Helpful Commands
```bash
git log --oneline                           # View commit history
git diff                                    # See current changes
git diff HEAD~1                            # Changes since last commit
git show [commit-hash]                     # Show specific commit
```

## 🎉 Success Tips

1. **Always work from project root** (`/Users/popsieandal/Documents/GoalStreak`)
2. **Commit frequently** with meaningful messages
3. **Test before committing** to ensure app works
4. **Push regularly** to backup your work
5. **Use descriptive commit messages** with emojis for clarity
6. **Update documentation** when making significant changes
7. **Follow the established patterns** in the codebase

---

**Remember**: Good git practices make collaboration easier and project history clearer. When in doubt, commit more frequently rather than less!

**GitHub Repository**: https://github.com/andalpopsie/GoalStreak
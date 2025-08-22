# 🚀 GoalStreak Git Workflow Guide

This guide covers all Git operations for continued GoalStreak development.

## 📁 **Project Structure**
```
GoalStreak/                    # Main project directory (THIS is your git root)
├── GoalStreakApp/            # React Native app code
├── development-sessions/     # Progress tracking & session logs
├── design-images/           # Design assets & inspiration
├── docs/                    # Documentation (this file)
├── MVP_Development_Plan.md  # Development roadmap
└── Specification & Product Design.md
```

## 🔧 **Daily Development Workflow**

### **1. Start Development Session**
Always work from the main project directory:
```bash
cd /Users/popsieandal/Documents/GoalStreak
```

### **2. Check Current Status**
Before making changes, check what's modified:
```bash
git status
```

### **3. Pull Latest Changes** (if working with others)
```bash
git pull origin main
```

### **4. Make Your Changes**
- Edit app code in `GoalStreakApp/`
- Update session logs in `development-sessions/`
- Add new documentation as needed

### **5. Review Changes**
See what files you've modified:
```bash
git status
git diff                    # See detailed changes
```

### **6. Stage Changes**
Add all changes:
```bash
git add .
```

Or add specific files:
```bash
git add GoalStreakApp/src/components/NewComponent.tsx
git add development-sessions/session-logs/session-004.md
```

### **7. Commit Changes**
Use descriptive commit messages:
```bash
git commit -m "✨ Add new feature: [Brief description]

🔧 Technical changes:
- Specific change 1
- Specific change 2

📱 User experience:
- How it improves the app"
```

### **8. Push to GitHub**
```bash
git push origin main
```

## 📝 **Commit Message Templates**

### **Feature Addition**
```bash
git commit -m "✨ Add [Feature Name]

🔧 Technical:
- Implementation details
- New components/services added

📱 UX Impact:
- How users benefit"
```

### **Bug Fix**
```bash
git commit -m "🐛 Fix [Issue Description]

🔧 Problem:
- What was broken

✅ Solution:
- How it was fixed"
```

### **UI/Design Update**
```bash
git commit -m "🎨 Update [UI Element]

🎨 Changes:
- Visual improvements
- Color/layout adjustments

📱 Impact:
- Better user experience"
```

### **Documentation Update**
```bash
git commit -m "📋 Update documentation

📝 Changes:
- Session logs updated
- Progress tracking
- New guides added"
```

### **Performance/Optimization**
```bash
git commit -m "⚡ Optimize [Component/Feature]

🚀 Improvements:
- Performance gains
- Code cleanup
- Better efficiency"
```

## 🌟 **Best Practices**

### **1. Commit Frequently**
- Commit after completing each feature
- Don't wait until end of session
- Small, focused commits are better

### **2. Meaningful Messages**
- Use emojis for quick visual identification
- Include both technical and user impact
- Be specific about what changed

### **3. Before Each Commit**
```bash
# Check what you're committing
git status
git diff

# Make sure everything works
cd GoalStreakApp && npm start  # Test the app

# Then commit
git add .
git commit -m "Your message"
git push
```

### **4. Session Documentation**
Always update your session logs:
```bash
# After each development session
git add development-sessions/
git commit -m "📋 Update Session #XXX progress

✅ Completed:
- Feature/fix descriptions

📊 Progress: XX% → XX%"
git push
```

## 🔄 **Common Workflows**

### **Starting a New Feature**
```bash
cd /Users/popsieandal/Documents/GoalStreak

# Check current status
git status
git pull origin main

# Work on your feature...
# (edit files in GoalStreakApp/, update docs, etc.)

# When feature is complete
git add .
git commit -m "✨ Add [Feature Name]"
git push origin main
```

### **End of Development Session**
```bash
# Save all work
git add .
git commit -m "💾 End of Session #XXX - [Brief summary]

✅ Completed:
- Major achievements

🎯 Next session:
- Planned next steps"
git push origin main
```

### **Emergency Backup**
If you need to quickly save work:
```bash
git add .
git commit -m "🚧 WIP: [What you're working on]"
git push origin main
```

## 🆘 **Troubleshooting**

### **If You Forget to Commit**
```bash
# Save your current work
git add .
git commit -m "💾 Save current progress"
git push
```

### **If You Make a Mistake**
```bash
# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Undo changes to a file
git checkout -- filename.tsx

# See commit history
git log --oneline
```

### **If Push Fails**
```bash
# Pull latest changes first
git pull origin main

# Then push
git push origin main
```

## 📊 **Tracking Progress**

### **View Commit History**
```bash
git log --oneline                    # Brief history
git log --graph --oneline --all      # Visual history
```

### **See Changes Between Commits**
```bash
git diff HEAD~1                      # Changes since last commit
git show [commit-hash]               # Show specific commit
```

### **Check Repository Status**
```bash
git status                           # Current changes
git remote -v                        # Remote repository info
git branch -v                        # Branch information
```

## 🎯 **Development Session Template**

For each development session:

```bash
# 1. Start session
cd /Users/popsieandal/Documents/GoalStreak
git pull origin main

# 2. Work on features...

# 3. Regular commits during session
git add .
git commit -m "✨ Implement [specific feature]"
git push

# 4. Update session documentation
# Edit: development-sessions/session-logs/session-XXX.md

# 5. End session commit
git add .
git commit -m "📋 Complete Session #XXX

✅ Achievements:
- Major features completed
- Progress made

📊 Status: XX% MVP complete
🎯 Next: Planned next steps"
git push origin main
```

## 🚀 **Quick Reference Commands**

```bash
# Essential daily commands
cd /Users/popsieandal/Documents/GoalStreak  # Navigate to project
git status                                   # Check status
git add .                                   # Stage all changes
git commit -m "Your message"               # Commit changes
git push origin main                       # Push to GitHub

# Helpful commands
git pull origin main                       # Get latest changes
git log --oneline                         # View history
git diff                                  # See changes
git remote -v                             # Check remote URL
```

## 📱 **App Development Specific**

### **When Working on App Code**
```bash
# Navigate to app directory for development
cd /Users/popsieandal/Documents/GoalStreak/GoalStreakApp
npm start                              # Start development server

# But always commit from project root
cd /Users/popsieandal/Documents/GoalStreak
git add .
git commit -m "Your message"
git push
```

### **After Installing New Packages**
```bash
cd GoalStreakApp
npm install some-package

# Commit the package changes
cd ..
git add GoalStreakApp/package.json GoalStreakApp/package-lock.json
git commit -m "📦 Add [package-name] dependency"
git push
```

---

## 🎉 **Success Tips**

1. **Always work from `/Users/popsieandal/Documents/GoalStreak`**
2. **Commit early and often**
3. **Use descriptive commit messages**
4. **Update session logs regularly**
5. **Push frequently to backup your work**
6. **Test your app before committing**

**Happy coding! Your GoalStreak app is going to be amazing! 🚀**

# ⚡ Git Quick Reference - GoalStreak

## 🚀 **Daily Commands (Copy & Paste)**

### **Start Development**
```bash
cd /Users/popsieandal/Documents/GoalStreak
git status
```

### **Save Your Work**
```bash
git add .
git commit -m "✨ Your commit message here"
git push origin main
```

### **Common Commit Messages**
```bash
# New feature
git commit -m "✨ Add [feature name]"

# Bug fix  
git commit -m "🐛 Fix [issue description]"

# UI update
git commit -m "🎨 Update [UI element]"

# Documentation
git commit -m "📋 Update session logs"

# End of session
git commit -m "💾 End Session #XXX - [summary]"
```

## 🔧 **Troubleshooting**

### **If you're in wrong directory:**
```bash
cd /Users/popsieandal/Documents/GoalStreak
```

### **If push fails:**
```bash
git pull origin main
git push origin main
```

### **Emergency save:**
```bash
git add .
git commit -m "🚧 WIP: saving progress"
git push
```

## 📱 **App Development Flow**

1. **Code in app directory:**
   ```bash
   cd /Users/popsieandal/Documents/GoalStreak/GoalStreakApp
   npm start
   ```

2. **Commit from project root:**
   ```bash
   cd /Users/popsieandal/Documents/GoalStreak
   git add .
   git commit -m "Your message"
   git push
   ```

## 🎯 **Remember**
- Always work from `/Users/popsieandal/Documents/GoalStreak`
- Commit frequently 
- Use descriptive messages
- Push regularly to backup

**Your GitHub:** https://github.com/andalpopsie/GoalStreak

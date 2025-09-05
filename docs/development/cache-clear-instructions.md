# Clear Cache and See New Icons

## Method 1: Expo CLI Cache Clear
```bash
cd /Users/popsieandal/Documents/GoalStreak/GoalStreakApp

# Stop current development server (Ctrl+C in terminal)
# Then run:
npx expo start --clear
```

## Method 2: Manual Cache Clear
```bash
cd /Users/popsieandal/Documents/GoalStreak/GoalStreakApp

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
npx expo install --fix

# Restart
npx expo start
```

## Method 3: React Native Cache Clear (if using Expo CLI)
```bash
cd /Users/popsieandal/Documents/GoalStreak/GoalStreakApp

# Clear Metro cache
npx react-native start --reset-cache
```

## Method 4: Complete Reset
```bash
cd /Users/popsieandal/Documents/GoalStreak/GoalStreakApp

# Nuclear option - clears everything
rm -rf node_modules
rm -rf .expo
npm install
npx expo start --clear
```

## In Simulator/Device
After clearing cache, also:
1. **iOS Simulator**: Device → Erase All Content and Settings
2. **Android Emulator**: Wipe data in AVD Manager
3. **Physical Device**: Delete and reinstall the Expo Go app

## Quick Test
To verify the new icons are working, check these categories:
- `fitness` should show a solid barbell icon (was outline before)
- `wellness` should show a solid heart icon (was outline before)  
- `sleep` should show a bed icon (was moon before)
- `running` should show footsteps icon (was walk before)

## Expected Changes You Should See:
1. **Solid icons instead of outline icons**
2. **Different icons for some categories** (bed for sleep, footsteps for running)
3. **Category-specific colors** (green for nutrition, purple for learning, etc.)

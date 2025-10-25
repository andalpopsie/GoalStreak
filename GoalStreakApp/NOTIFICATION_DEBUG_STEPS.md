# Notification Setup Debugging Steps

## 🎯 Current Status
The notification setup code is implemented correctly, but it's not showing after habit selection. Let's debug this step by step.

## 📋 Step-by-Step Debugging

### Step 1: Check Console Logs
1. Open your app with the console visible
2. Go through the onboarding flow
3. Look for these specific log messages:

```
Expected logs when selecting habits:
✅ Habits created, calling completeHabitSuggestions with: [...]
🔄 useOnboarding - completeHabitSuggestions called
🔄 Current state: {...}
🔄 New state to save: { onboardingStep: 'notification_setup', ... }
✅ State saved successfully
✅ completeHabitSuggestions finished - should now be on notification_setup

Then immediately after:
🎬 OnboardingScreen - Current step: notification_setup
🎬 OnboardingScreen - Full state: {...}
→ Rendering NotificationSetup
```

### Step 2: Force Notification Setup (NEW!)
If the normal flow isn't working, use the force button:

1. Go to **Profile** tab
2. Scroll to **"Testing & Development"**
3. Tap **"Force Notification Setup"**
4. Tap **"Force"** in the dialog
5. **FULLY CLOSE THE APP** (swipe up/force quit)
6. **REOPEN THE APP**
7. You should see the notification setup screen

### Step 3: Check AsyncStorage State
Add this temporary code to see what's stored:

```typescript
// Add to ProfileScreen or anywhere temporarily
const checkState = async () => {
  const state = await AsyncStorage.getItem('onboarding_state');
  console.log('📦 Stored state:', JSON.parse(state || '{}'));
  Alert.alert('State', JSON.parse(state || '{}').onboardingStep);
};
```

### Step 4: Verify Component Exists
Check that NotificationSetup component is properly imported:

```typescript
// In OnboardingScreen.tsx, verify this line exists:
import { WelcomeCarousel, HabitSuggestions, NotificationSetup } from '../components/onboarding';
```

## 🔍 Common Issues & Solutions

### Issue 1: State Updates But Screen Doesn't Change
**Symptom**: Console shows `notification_setup` but screen stays on habits

**Possible Causes**:
1. React state not updating properly
2. Component not re-rendering
3. Navigation blocking the update

**Solution**:
```typescript
// Add this to OnboardingScreen to force re-render
useEffect(() => {
  console.log('🔄 Onboarding step changed:', onboardingState.onboardingStep);
}, [onboardingState.onboardingStep]);
```

### Issue 2: AsyncStorage Not Persisting
**Symptom**: State resets on app restart

**Solution**:
```bash
# Clear AsyncStorage completely
# iOS Simulator
xcrun simctl get_app_container booted com.goalstreak.app data
# Then delete the AsyncStorage folder

# Or use the app
# Add a "Clear All Data" button that calls:
await AsyncStorage.clear();
```

### Issue 3: Component Renders But Shows Blank
**Symptom**: Screen goes white/blank

**Check**:
1. NotificationSetup component has errors
2. Props are missing
3. Styles are hiding content

**Debug**:
```typescript
// Add to NotificationSetup.tsx
useEffect(() => {
  console.log('🔔 NotificationSetup MOUNTED');
  console.log('🔔 Props:', { onComplete, onSkip });
  return () => console.log('🔔 NotificationSetup UNMOUNTED');
}, []);
```

## 🧪 Test Scenarios

### Scenario 1: Fresh User Flow
1. Delete app
2. Reinstall
3. Create account
4. Go through onboarding
5. **Expected**: See notification setup after habits

### Scenario 2: Reset Onboarding
1. Profile → Reset Onboarding
2. Restart app
3. Go through flow
4. **Expected**: See notification setup after habits

### Scenario 3: Force State
1. Profile → Force Notification Setup
2. Close app completely
3. Reopen app
4. **Expected**: See notification setup immediately

## 📊 What to Look For

### In Console:
```
✅ GOOD:
🎬 OnboardingScreen - Current step: notification_setup
→ Rendering NotificationSetup
🔔 NotificationSetup MOUNTED

❌ BAD:
🎬 OnboardingScreen - Current step: habit_suggestions (stuck)
→ Rendering WelcomeCarousel (wrong screen)
🎬 OnboardingScreen - Current step: completed (skipped notification)
```

### In AsyncStorage:
```json
✅ GOOD:
{
  "hasSeenWelcome": true,
  "hasCompletedOnboarding": false,
  "selectedHabitTemplates": ["id1", "id2"],
  "onboardingStep": "notification_setup"
}

❌ BAD:
{
  "hasSeenWelcome": true,
  "hasCompletedOnboarding": true,  // ← Should be false!
  "onboardingStep": "completed"     // ← Skipped notification!
}
```

## 🎯 Expected Behavior

### When Working Correctly:

1. **User completes welcome** → `onboardingStep: 'habit_suggestions'`
2. **User selects habits** → `onboardingStep: 'notification_setup'`
3. **Screen re-renders** → Shows NotificationSetup component
4. **User sets notification** → `onboardingStep: 'completed'`, `hasCompletedOnboarding: true`
5. **App navigates** → Shows main app

### State Transitions:
```
welcome → habit_suggestions → notification_setup → completed
   ↓              ↓                    ↓               ↓
Welcome      Habit Select      Notification      Main App
Carousel     Templates         Time Picker       Dashboard
```

## 🚨 Emergency Debugging

If nothing works, add this to OnboardingScreen temporarily:

```typescript
// TEMPORARY: Force notification setup for testing
const renderCurrentStep = () => {
  // Uncomment to test notification setup directly
  return (
    <NotificationSetup
      onComplete={handleNotificationSetupComplete}
      onSkip={handleNotificationSetupSkip}
    />
  );
  
  // Comment out the switch statement
  /*
  switch (onboardingState.onboardingStep) {
    ...
  }
  */
};
```

## 📝 Checklist Before Reporting Issue

- [ ] Checked console logs for errors
- [ ] Verified state updates in logs
- [ ] Tried "Force Notification Setup" button
- [ ] Fully restarted app (not just reloaded)
- [ ] Checked AsyncStorage state
- [ ] Verified NotificationSetup component exists
- [ ] Tried fresh install
- [ ] Checked for TypeScript errors
- [ ] Verified all imports are correct

## 🎬 Next Steps

1. **Try the "Force Notification Setup" button first**
2. **Check console logs** to see what's happening
3. **Share the console output** if it's still not working
4. **Try the emergency debugging** to verify the component works

---

**Remember**: The most important thing is to **FULLY RESTART** the app after any state changes, not just reload!

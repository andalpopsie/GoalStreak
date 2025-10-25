# Debug Onboarding State

## Quick Debug Commands

### Check Current Onboarding State
Add this temporarily to your `OnboardingScreen.tsx` to see what's happening:

```typescript
// Add at the top of the component
console.log('🔍 Onboarding State:', {
  step: onboardingState.onboardingStep,
  hasSeenWelcome: onboardingState.hasSeenWelcome,
  hasCompletedOnboarding: onboardingState.hasCompletedOnboarding,
  selectedTemplates: onboardingState.selectedHabitTemplates,
});
```

### Force Notification Setup Step
If you want to test just the notification setup screen, temporarily modify `OnboardingScreen.tsx`:

```typescript
// In renderCurrentStep(), temporarily change:
const renderCurrentStep = () => {
  // TEMPORARY: Force notification setup for testing
  return (
    <NotificationSetup
      onComplete={handleNotificationSetupComplete}
      onSkip={handleNotificationSetupSkip}
    />
  );
  
  // Comment out the switch statement temporarily
  // switch (onboardingState.onboardingStep) { ... }
};
```

### Clear AsyncStorage Manually
Add this button temporarily to ProfileScreen for easier testing:

```typescript
const clearAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    Alert.alert('Success', 'AsyncStorage cleared. Please restart the app.');
  } catch (error) {
    Alert.alert('Error', 'Failed to clear storage');
  }
};

// Add button in render:
<TouchableOpacity style={styles.menuItem} onPress={clearAsyncStorage}>
  <Ionicons name="trash-outline" size={24} color={Colors.error} />
  <Text style={[styles.menuText, { color: Colors.error }]}>Clear All Data</Text>
</TouchableOpacity>
```

## Common Issues & Solutions

### Issue 1: Onboarding State Not Resetting
**Symptom**: Reset button doesn't work, still shows main app

**Solution**:
```bash
# iOS Simulator
xcrun simctl uninstall booted com.goalstreak.app
npm run ios

# Android Emulator
adb uninstall com.goalstreak.app
npm run android
```

### Issue 2: Stuck on Habit Suggestions
**Symptom**: Can't get past habit suggestions to notification setup

**Check**:
1. Look for console errors
2. Verify `completeHabitSuggestions` is being called
3. Check if `onboardingStep` is updating to `'notification_setup'`

**Debug**:
```typescript
// In handleHabitsSelected, add logging:
console.log('✅ Habits selected:', selectedHabits.length);
console.log('📝 Calling completeHabitSuggestions...');
await completeHabitSuggestions(templateIds);
console.log('✅ Onboarding step should now be: notification_setup');
```

### Issue 3: Notification Setup Not Rendering
**Symptom**: Screen goes blank or shows welcome again

**Check**:
1. Verify `NotificationSetup` component exists
2. Check imports in `OnboardingScreen.tsx`
3. Verify the switch case includes `'notification_setup'`

**Verify**:
```typescript
// Add this before the switch statement:
console.log('🎯 Current step:', onboardingState.onboardingStep);
console.log('🎯 Should render:', 
  onboardingState.onboardingStep === 'notification_setup' 
    ? 'NotificationSetup' 
    : 'Other'
);
```

## Step-by-Step Verification

### 1. Check Hook State
```typescript
// In useOnboarding.tsx, add logging to completeHabitSuggestions:
const completeHabitSuggestions = useCallback(async (selectedTemplates: string[]) => {
  console.log('🔄 Completing habit suggestions...');
  const newState: OnboardingState = {
    ...onboardingState,
    selectedHabitTemplates: selectedTemplates,
    onboardingStep: 'notification_setup', // ← Should set this
  };
  console.log('📝 New state:', newState);
  await saveOnboardingState(newState);
  console.log('✅ State saved!');
}, [onboardingState, user?.id]);
```

### 2. Check Screen Rendering
```typescript
// In OnboardingScreen.tsx renderCurrentStep:
const renderCurrentStep = () => {
  console.log('🎬 Rendering step:', onboardingState.onboardingStep);
  
  switch (onboardingState.onboardingStep) {
    case 'welcome':
      console.log('→ Rendering WelcomeCarousel');
      return <WelcomeCarousel ... />;
    
    case 'habit_suggestions':
      console.log('→ Rendering HabitSuggestions');
      return <HabitSuggestions ... />;
    
    case 'notification_setup':
      console.log('→ Rendering NotificationSetup'); // ← Should see this
      return <NotificationSetup ... />;
    
    default:
      console.log('→ Default: Rendering WelcomeCarousel');
      return <WelcomeCarousel ... />;
  }
};
```

### 3. Check Component Mount
```typescript
// In NotificationSetup.tsx, add at the top:
useEffect(() => {
  console.log('🔔 NotificationSetup mounted!');
  return () => console.log('🔔 NotificationSetup unmounted');
}, []);
```

## Expected Console Output

When working correctly, you should see:

```
🔍 Onboarding State: { step: 'welcome', ... }
🎬 Rendering step: welcome
→ Rendering WelcomeCarousel

[User completes welcome]

🔍 Onboarding State: { step: 'habit_suggestions', ... }
🎬 Rendering step: habit_suggestions
→ Rendering HabitSuggestions

[User selects habits]

✅ Habits selected: 3
📝 Calling completeHabitSuggestions...
🔄 Completing habit suggestions...
📝 New state: { step: 'notification_setup', ... }
✅ State saved!

🔍 Onboarding State: { step: 'notification_setup', ... }
🎬 Rendering step: notification_setup
→ Rendering NotificationSetup
🔔 NotificationSetup mounted!
```

## Quick Test Script

Create a test file to verify the flow:

```typescript
// test-onboarding-flow.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function testOnboardingFlow() {
  // 1. Clear state
  await AsyncStorage.removeItem('onboarding_state');
  console.log('✅ Cleared onboarding state');
  
  // 2. Set to notification_setup step
  const testState = {
    hasSeenWelcome: true,
    hasCompletedOnboarding: false,
    selectedHabitTemplates: ['test-1', 'test-2'],
    onboardingStep: 'notification_setup',
  };
  
  await AsyncStorage.setItem('onboarding_state', JSON.stringify(testState));
  console.log('✅ Set test state:', testState);
  
  // 3. Verify
  const stored = await AsyncStorage.getItem('onboarding_state');
  console.log('✅ Verified stored state:', JSON.parse(stored || '{}'));
  
  console.log('🎉 Test complete! Restart app to see notification setup.');
}
```

## Final Checklist

Before testing:
- [ ] All files saved
- [ ] Metro bundler restarted
- [ ] App reloaded (shake → Reload)
- [ ] AsyncStorage cleared or onboarding reset
- [ ] App fully restarted (not just reloaded)

During testing:
- [ ] Console logs show correct state transitions
- [ ] Each screen renders correctly
- [ ] No error messages in console
- [ ] Notification setup appears after habits

After testing:
- [ ] Remove debug console.logs
- [ ] Remove temporary test code
- [ ] Verify production build works
- [ ] Test on both iOS and Android

---

**Remember**: The most common issue is not fully restarting the app after resetting onboarding!

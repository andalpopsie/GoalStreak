# Testing Notification Setup in Onboarding

## 🎯 What Was Fixed

The notification setup page wasn't showing in the onboarding flow because the `OnboardingScreen.tsx` was missing the rendering logic for the `notification_setup` step.

## ✅ What's Now Working

The complete onboarding flow:
1. **Welcome Carousel** (3 slides)
2. **Habit Suggestions** (choose templates)
3. **🆕 Notification Setup** (NEW - now working!)
4. **Complete** (enter app)

## 📱 How to Test

### Option 1: Reset Onboarding (Recommended)
1. Open the app
2. Go to **Profile** tab (bottom right)
3. Scroll down to "Testing & Development" section
4. Tap **"Reset Onboarding"**
5. Tap **"Reset"** in the confirmation dialog
6. **Restart the app** (close and reopen)
7. You should now see the welcome carousel
8. Complete the welcome slides
9. Select some habits
10. **You should now see the Notification Setup page!** 🎉

### Option 2: Fresh Install
1. Delete the app from your device/simulator
2. Reinstall and run: `npm run ios` or `npm run android`
3. Create a new account or login
4. Go through the onboarding flow

### Option 3: Clear AsyncStorage (Advanced)
```bash
# For iOS Simulator
xcrun simctl get_app_container booted com.goalstreak.app data

# Then manually delete the AsyncStorage files
# Or use React Native Debugger to clear AsyncStorage
```

## 🎨 What You Should See

### Notification Setup Screen Features:
- **Header**: "Stay on Track" with notification bell icon
- **Description**: "Get daily reminders to help you build lasting habits"
- **Enable Toggle**: Switch to enable/disable notifications
- **Time Picker**: Scrollable list of times (6:00 AM - 10:30 PM)
  - 34 time slots in 30-minute intervals
  - Default: 9:00 AM
  - Selected time highlighted in orange
- **Benefits List**: 
  - ✓ Never miss a day
  - ✓ Build consistency
  - ✓ Stay motivated
- **Buttons**:
  - "Continue" (bottom) - Saves settings and completes onboarding
  - "Skip" (top right) - Skips notification setup

## 🔍 Troubleshooting

### Issue: Still not seeing notification setup
**Solution**: Make sure you:
1. Saved all files
2. Restarted the Metro bundler
3. Reloaded the app (shake device → Reload)
4. Actually restarted the app after resetting onboarding

### Issue: App crashes on notification setup
**Check**:
- Console logs for errors
- Notification permissions on device
- Make sure `motivationalNotificationService` is properly imported

### Issue: Notifications not working after setup
**Verify**:
1. Notification permissions granted
2. Check device notification settings
3. Look for scheduled notifications in device settings

## 📊 Expected Behavior

### When User Enables Notifications:
1. App requests notification permissions (if not already granted)
2. Schedules daily notification at selected time
3. Saves preference to AsyncStorage
4. Completes onboarding and enters app

### When User Skips:
1. No notification permissions requested
2. No notifications scheduled
3. Completes onboarding and enters app
4. User can enable later in Profile → Notifications

## 🎯 Success Criteria

✅ Notification setup page appears after habit suggestions
✅ Time picker is scrollable and shows all times
✅ Toggle switch works and shows visual feedback
✅ Selected time is highlighted
✅ "Continue" button schedules notification
✅ "Skip" button bypasses notification setup
✅ Onboarding completes successfully either way
✅ User enters the main app after completion

## 📝 Notes

- The notification setup is **optional** - users can skip it
- Default time is 9:00 AM (optimal for morning motivation)
- Time range: 6:00 AM to 10:30 PM (30-minute intervals)
- Users can change notification settings later in Profile screen
- Notification permissions are requested when user enables notifications

## 🚀 Next Steps After Testing

Once confirmed working:
1. Test on both iOS and Android
2. Verify notification permissions flow
3. Test actual notification delivery
4. Check notification settings persistence
5. Verify analytics tracking for completion rates

---

**Last Updated**: January 2025
**Status**: ✅ Fixed and Ready for Testing

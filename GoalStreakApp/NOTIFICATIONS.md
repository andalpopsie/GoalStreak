# Notification System Documentation

## 🔔 Habit Reminder Notifications

### Overview
The app uses a best-practice approach for daily habit reminders, scheduling multiple individual notifications (7 days in advance) rather than relying on repeating triggers.

### Implementation
- **Service**: `src/services/notificationService.ts`
- **Approach**: Schedule 7 individual date-based notifications
- **Storage**: Notification IDs stored in AsyncStorage for cancellation
- **Permissions**: Automatic permission request with user feedback

### Features
- ✅ Daily reminders at user-specified times
- ✅ Timezone-aware scheduling (uses device timezone)
- ✅ Proper cancellation when habits are deleted/disabled
- ✅ Batch scheduling for 7 days ahead
- ✅ No immediate firing (waits for actual scheduled time)

## ⚠️ IMPORTANT: Testing Limitations

### Expo Go Limitations
```
WARN `expo-notifications` functionality is not fully supported in Expo Go
```

**Notifications may NOT work reliably in Expo Go during development.**

### Testing Requirements

#### ✅ For Full Testing:
1. **Development Build** (Recommended):
   ```bash
   npx expo install expo-dev-client
   npx expo run:ios
   # or
   npx expo run:android
   ```

2. **Production Build**:
   ```bash
   npx expo build:ios
   npx expo build:android
   ```

#### ⚠️ Limited Testing in Expo Go:
- Notifications may be scheduled but not fire
- Background processing is restricted
- Use only for development/debugging logs

### Verification
When properly working, you should see logs like:
```
📱 Notification permission status: granted
⏰ Scheduling notifications for 21:30
📅 Scheduled for 9/9/2025, 9:30:00PM, ID: xxx
✅ Scheduled 7 notifications for [Habit Name]
```

## 🚀 Production Deployment

### Before App Store Submission:
1. Test notifications on physical device with development build
2. Verify timezone handling across different regions
3. Test notification cancellation when habits are deleted
4. Confirm proper permission handling

### User Experience:
- Users can set any time using scrollable hour/minute/AM-PM pickers
- Notifications fire daily at the exact time in user's timezone
- No immediate notifications when creating habits
- Proper badge counting and notification stacking

## 📝 Follow-up Tasks

### High Priority:
- [ ] Test notification delivery on physical device with development build
- [ ] Verify timezone handling when device timezone changes
- [ ] Test notification persistence across app updates

### Medium Priority:
- [ ] Add notification analytics/tracking
- [ ] Implement notification action buttons (Complete/Snooze)
- [ ] Add notification sound customization

### Low Priority:
- [ ] Smart notification timing based on user behavior
- [ ] Notification grouping by habit category
- [ ] Rich notification content with habit progress

## 🔧 Troubleshooting

### Common Issues:
1. **Notifications not firing**: Likely Expo Go limitation - test with development build
2. **Immediate notifications**: Fixed - now uses proper date-based scheduling
3. **Wrong timezone**: System automatically uses device timezone
4. **Permission denied**: App automatically requests and shows user feedback

### Debug Commands:
```javascript
// Check scheduled notifications
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled:', scheduled.length);

// Check permissions
const { status } = await Notifications.getPermissionsAsync();
console.log('Permission:', status);
```

---
**Last Updated**: December 9, 2025
**Status**: ✅ Implemented with Expo Go limitations noted

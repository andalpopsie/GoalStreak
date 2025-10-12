# 🔔 Notification Debug Guide

## Quick Notification Test

### 1. Check if notifications are being scheduled:

Open your app and run this in the console (or add to a test button):

```javascript
// Test notification scheduling
import { notificationService } from './src/services/notificationService';

// Check permissions
const checkNotifications = async () => {
  const permissions = await notificationService.requestPermissions();
  console.log('📱 Notification permissions:', permissions);
  
  // Get all scheduled notifications
  const scheduled = await notificationService.getAllScheduledNotifications();
  console.log('📅 Scheduled notifications:', scheduled.length);
  scheduled.forEach(notif => {
    console.log(`- ${notif.content.title} at ${new Date(notif.trigger.dateComponents)}`);
  });
};

checkNotifications();
```

### 2. Test immediate notification (for testing):

```javascript
// Schedule a test notification for 1 minute from now
const testNotification = async () => {
  const testTime = new Date();
  testTime.setMinutes(testTime.getMinutes() + 1);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🧪 Test Notification",
      body: "This is a test notification from GoalStreak",
    },
    trigger: {
      date: testTime,
    },
  });
  
  console.log(`🧪 Test notification scheduled for ${testTime.toLocaleTimeString()}`);
};

testNotification();
```

## 🐛 Common Issues & Solutions

### Issue 1: Expo Go Limitations
**Problem**: Notifications don't fire in Expo Go
**Solution**: Use development build or production build

### Issue 2: Permissions Not Granted
**Problem**: No permission to send notifications
**Solution**: Check Settings > GoalStreak > Notifications

### Issue 3: Wrong Time Zone
**Problem**: Notification scheduled for wrong time
**Solution**: Check device timezone settings

### Issue 4: Background App Refresh Disabled
**Problem**: Notifications don't fire when app is closed
**Solution**: Enable Background App Refresh in device settings

## 🔧 Debug Commands

Add these to your app for testing:

```javascript
// 1. Check current scheduled notifications
const debugScheduled = async () => {
  const notifications = await Notifications.getAllScheduledNotificationRequestsAsync();
  console.log('All scheduled:', notifications);
};

// 2. Clear all notifications (for testing)
const clearAll = async () => {
  await Notifications.cancelAllScheduledNotificationRequestsAsync();
  console.log('All notifications cleared');
};

// 3. Test immediate notification
const testNow = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Now",
      body: "Immediate test notification",
    },
    trigger: null, // Immediate
  });
};
```

## ✅ Expected Behavior

1. **Create habit with reminder** → Notification scheduled for next 7 days
2. **Check scheduled notifications** → Should see 7 notifications listed
3. **Wait for reminder time** → Notification should fire
4. **Delete habit** → Notifications should be cancelled

## 🚨 If Still Not Working

1. **Use development build** instead of Expo Go
2. **Check device notification settings**
3. **Verify timezone is correct**
4. **Test with immediate notification first**
5. **Check console logs** for scheduling errors

/**
 * TEMPORARY TEST FILE
 * 
 * This file helps test the notification setup screen directly.
 * Add this button to ProfileScreen temporarily to force the notification setup state.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export async function forceNotificationSetupState() {
  try {
    const testState = {
      hasSeenWelcome: true,
      hasCompletedOnboarding: false, // IMPORTANT: Must be false
      selectedHabitTemplates: ['test-1', 'test-2', 'test-3'],
      onboardingStep: 'notification_setup', // Force this step
    };
    
    await AsyncStorage.setItem('onboarding_state', JSON.stringify(testState));
    
    Alert.alert(
      'Test State Set',
      'Onboarding state set to notification_setup. Please FULLY RESTART the app (close and reopen, not just reload).',
      [{ text: 'OK' }]
    );
    
    console.log('✅ Test state set:', testState);
  } catch (error) {
    console.error('Error setting test state:', error);
    Alert.alert('Error', 'Failed to set test state');
  }
}

// Add this button to ProfileScreen temporarily:
/*
<TouchableOpacity 
  style={styles.menuItem} 
  onPress={() => forceNotificationSetupState()}
>
  <Ionicons name="flask-outline" size={24} color={Colors.accent1} />
  <Text style={[styles.menuText, { color: Colors.accent1 }]}>
    Force Notification Setup
  </Text>
</TouchableOpacity>
*/

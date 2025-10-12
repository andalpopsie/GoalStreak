import { Linking, Alert } from 'react-native';

/**
 * Opens a URL in the device's default browser
 * @param url - The URL to open
 * @param fallbackMessage - Message to show if URL cannot be opened
 */
export const openURL = async (url: string, fallbackMessage?: string): Promise<void> => {
  try {
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Unable to Open Link',
        fallbackMessage || `Cannot open this link: ${url}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error opening URL:', error);
    Alert.alert(
      'Error',
      'An error occurred while trying to open the link. Please try again later.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Opens the GoalStreak privacy policy
 */
export const openPrivacyPolicy = (): Promise<void> => {
  return openURL(
    'https://goalstreak.co/privacy',
    'Please visit goalstreak.co/privacy to view our privacy policy.'
  );
};

/**
 * Opens the GoalStreak terms of service
 */
export const openTermsOfService = (): Promise<void> => {
  return openURL(
    'https://goalstreak.co/terms',
    'Please visit goalstreak.co/terms to view our terms of service.'
  );
};

/**
 * Opens the GoalStreak support page
 */
export const openSupport = (): Promise<void> => {
  return openURL(
    'https://goalstreak.co/support',
    'Please visit goalstreak.co/support for help and support.'
  );
};
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
 * Opens the Goalfer privacy policy
 */
export const openPrivacyPolicy = (): Promise<void> => {
  return openURL(
    'https://goalfer.app/privacy',
    'Please visit goalfer.app/privacy to view our privacy policy.'
  );
};

/**
 * Opens the Goalfer terms of service
 */
export const openTermsOfService = (): Promise<void> => {
  return openURL(
    'https://goalfer.app/terms',
    'Please visit goalfer.app/terms to view our terms of service.'
  );
};

/**
 * Opens the Goalfer support page
 */
export const openSupport = (): Promise<void> => {
  return openURL(
    'https://goalfer.app/support',
    'Please visit goalfer.app/support for help and support.'
  );
};
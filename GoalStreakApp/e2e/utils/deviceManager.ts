/**
 * E2E Device and Simulator Management
 * Handles device configuration, simulator management, and platform-specific setup
 */

import { device } from 'detox';

// Device configuration types
export interface DeviceConfig {
  platform: 'ios' | 'android';
  deviceName: string;
  osVersion?: string;
  screenSize?: 'small' | 'medium' | 'large';
  orientation?: 'portrait' | 'landscape';
}

// Screen size configurations
export const SCREEN_SIZES = {
  ios: {
    small: { width: 375, height: 667 }, // iPhone SE
    medium: { width: 414, height: 896 }, // iPhone 11
    large: { width: 428, height: 926 }, // iPhone 12 Pro Max
  },
  android: {
    small: { width: 360, height: 640 }, // Small Android
    medium: { width: 411, height: 731 }, // Pixel 3
    large: { width: 412, height: 915 }, // Pixel 4 XL
  },
};

// Supported device configurations
export const DEVICE_CONFIGS: Record<string, DeviceConfig> = {
  'iphone-se': {
    platform: 'ios',
    deviceName: 'iPhone SE (3rd generation)',
    screenSize: 'small',
  },
  'iphone-14': {
    platform: 'ios',
    deviceName: 'iPhone 14',
    screenSize: 'medium',
  },
  'iphone-14-pro-max': {
    platform: 'ios',
    deviceName: 'iPhone 14 Pro Max',
    screenSize: 'large',
  },
  'pixel-3': {
    platform: 'android',
    deviceName: 'Pixel_3_API_30_x86',
    screenSize: 'medium',
  },
  'pixel-4-xl': {
    platform: 'android',
    deviceName: 'Pixel_4_XL_API_30_x86',
    screenSize: 'large',
  },
};

/**
 * Get current device platform
 */
export const getCurrentPlatform = (): 'ios' | 'android' => {
  return device.getPlatform() as 'ios' | 'android';
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return getCurrentPlatform() === 'ios';
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return getCurrentPlatform() === 'android';
};

/**
 * Get device configuration
 */
export const getDeviceConfig = (): DeviceConfig | null => {
  const platform = getCurrentPlatform();
  
  // Try to determine device from environment or configuration
  const deviceName = process.env.DETOX_DEVICE || 'unknown';
  
  // Find matching configuration
  for (const [key, config] of Object.entries(DEVICE_CONFIGS)) {
    if (config.platform === platform) {
      return config;
    }
  }
  
  // Return default configuration
  return {
    platform,
    deviceName,
    screenSize: 'medium',
  };
};

/**
 * Setup device for testing
 */
export const setupDevice = async (config?: Partial<DeviceConfig>) => {
  console.log('Setting up device for E2E testing...');
  
  const deviceConfig = getDeviceConfig();
  const finalConfig = { ...deviceConfig, ...config };
  
  console.log('Device configuration:', finalConfig);
  
  // Platform-specific setup
  if (finalConfig.platform === 'ios') {
    await setupIOSDevice(finalConfig);
  } else {
    await setupAndroidDevice(finalConfig);
  }
  
  // Set orientation if specified
  if (finalConfig.orientation) {
    await setDeviceOrientation(finalConfig.orientation);
  }
  
  console.log('Device setup complete');
};

/**
 * Setup iOS device
 */
const setupIOSDevice = async (config: DeviceConfig) => {
  // iOS-specific setup
  console.log(`Setting up iOS device: ${config.deviceName}`);
  
  // Enable accessibility if needed
  try {
    // This would require additional iOS-specific setup
    console.log('iOS accessibility setup would go here');
  } catch (error) {
    console.warn('iOS accessibility setup failed:', error);
  }
  
  // Configure iOS-specific settings
  try {
    // Disable iOS animations for more reliable testing
    await device.setURLBlacklist(['.*127.0.0.1.*']);
  } catch (error) {
    console.warn('iOS URL blacklist setup failed:', error);
  }
};

/**
 * Setup Android device
 */
const setupAndroidDevice = async (config: DeviceConfig) => {
  // Android-specific setup
  console.log(`Setting up Android device: ${config.deviceName}`);
  
  // Enable accessibility if needed
  try {
    // This would require additional Android-specific setup
    console.log('Android accessibility setup would go here');
  } catch (error) {
    console.warn('Android accessibility setup failed:', error);
  }
  
  // Configure Android-specific settings
  try {
    // Disable Android animations for more reliable testing
    await device.setURLBlacklist(['.*localhost.*']);
  } catch (error) {
    console.warn('Android URL blacklist setup failed:', error);
  }
};

/**
 * Set device orientation
 */
export const setDeviceOrientation = async (orientation: 'portrait' | 'landscape') => {
  try {
    await device.setOrientation(orientation);
    console.log(`Device orientation set to: ${orientation}`);
  } catch (error) {
    console.warn('Failed to set device orientation:', error);
  }
};

/**
 * Rotate device to landscape
 */
export const rotateToLandscape = async () => {
  await setDeviceOrientation('landscape');
};

/**
 * Rotate device to portrait
 */
export const rotateToPortrait = async () => {
  await setDeviceOrientation('portrait');
};

/**
 * Take screenshot with device info
 */
export const takeDeviceScreenshot = async (name: string) => {
  const config = getDeviceConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotName = `${name}_${config?.platform}_${config?.screenSize}_${timestamp}`;
  
  try {
    await device.takeScreenshot(screenshotName);
    console.log(`Screenshot taken: ${screenshotName}`);
  } catch (error) {
    console.warn('Failed to take screenshot:', error);
  }
};

/**
 * Simulate device conditions
 */
export const simulateSlowNetwork = async () => {
  // This would require additional setup for network simulation
  console.log('Network simulation not implemented yet');
  // In a real implementation, this might use:
  // - iOS: Network Link Conditioner
  // - Android: Network simulation tools
};

export const simulateLowMemory = async () => {
  // This would require additional setup for memory simulation
  console.log('Memory simulation not implemented yet');
};

export const simulateLowBattery = async () => {
  // This would require additional setup for battery simulation
  console.log('Battery simulation not implemented yet');
};

/**
 * Reset device conditions
 */
export const resetDeviceConditions = async () => {
  console.log('Resetting device conditions...');
  
  // Reset orientation to portrait
  await rotateToPortrait();
  
  // Reset network conditions
  try {
    await device.setURLBlacklist([]);
  } catch (error) {
    console.warn('Failed to reset URL blacklist:', error);
  }
  
  console.log('Device conditions reset');
};

/**
 * Get device performance metrics
 */
export const getDeviceMetrics = async () => {
  // This would require additional setup for performance monitoring
  return {
    platform: getCurrentPlatform(),
    timestamp: new Date().toISOString(),
    // Additional metrics would be collected here
  };
};

/**
 * Wait for device to be ready
 */
export const waitForDeviceReady = async (timeout: number = 30000) => {
  console.log('Waiting for device to be ready...');
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      // Try to perform a simple device operation
      await device.getPlatform();
      console.log('Device is ready');
      return;
    } catch (error) {
      // Device not ready yet, wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Device not ready after ${timeout}ms`);
};

/**
 * Cleanup device after testing
 */
export const cleanupDevice = async () => {
  console.log('Cleaning up device...');
  
  try {
    // Reset device conditions
    await resetDeviceConditions();
    
    // Clear app data if needed
    // This might require platform-specific implementation
    
    console.log('Device cleanup complete');
  } catch (error) {
    console.warn('Device cleanup failed:', error);
  }
};

/**
 * Platform-specific test utilities
 */
export const platformSpecific = {
  ios: {
    // iOS-specific utilities
    enableAccessibility: async () => {
      console.log('iOS accessibility enabling not implemented');
    },
    
    disableAnimations: async () => {
      console.log('iOS animation disabling not implemented');
    },
  },
  
  android: {
    // Android-specific utilities
    enableAccessibility: async () => {
      console.log('Android accessibility enabling not implemented');
    },
    
    disableAnimations: async () => {
      console.log('Android animation disabling not implemented');
    },
  },
};

/**
 * Cross-platform compatibility helpers
 */
export const crossPlatform = {
  // Get platform-appropriate test ID
  getTestId: (baseId: string): string => {
    const platform = getCurrentPlatform();
    return `${baseId}-${platform}`;
  },
  
  // Get platform-appropriate timeout
  getTimeout: (baseTimeout: number): number => {
    const platform = getCurrentPlatform();
    // Android might need longer timeouts
    return platform === 'android' ? baseTimeout * 1.5 : baseTimeout;
  },
  
  // Platform-specific element selection
  selectElement: (iosSelector: string, androidSelector: string): string => {
    return isIOS() ? iosSelector : androidSelector;
  },
};
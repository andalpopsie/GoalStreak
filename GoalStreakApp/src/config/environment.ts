// Environment Configuration for GoalStreak
export interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  app: {
    version: string;
    buildNumber: string;
    name: string;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  sso: {
    appleClientId: string; // Apple Services ID (for Firebase provider match)
    googleIosClientId: string; // EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
    googleWebClientId: string; // EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Firebase audience)
  };
  analytics: {
    enabled: boolean;
  };
  debug: {
    enabled: boolean;
  };
}

// Get current environment
export const getCurrentEnvironment = (): 'development' | 'staging' | 'production' => {
  return (process.env.EXPO_PUBLIC_ENVIRONMENT as any) || 'development';
};

// Environment configuration
export const config: EnvironmentConfig = {
  environment: getCurrentEnvironment(),
  app: {
    version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
    name: 'Goalfer',
  },
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  },
  // SSO OAuth client identifiers. Sourced from EXPO_PUBLIC_* env vars provided
  // as EAS secrets; no secret values are committed to source control (R9.1, R9.3).
  // The Apple sign-in key and Services ID are configured in the Firebase Console (R9.5).
  sso: {
    appleClientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  },
  analytics: {
    enabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true',
  },
  debug: {
    enabled: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  },
};

// Enhanced validation function with detailed checks
export const validateEnvironmentConfig = (): boolean => {
  const requiredKeys = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingKeys = requiredKeys.filter((key) => !process.env[key] || process.env[key] === '');

  // Additional validation for key formats
  const validateKeyFormat = (key: string, value: string): boolean => {
    switch (key) {
      case 'EXPO_PUBLIC_FIREBASE_API_KEY':
        return /^AIza[0-9A-Za-z_-]{35}$/.test(value);
      case 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN':
        return /^[a-z0-9-]+\.firebaseapp\.com$/.test(value);
      case 'EXPO_PUBLIC_FIREBASE_PROJECT_ID':
        return /^[a-z0-9-]+$/.test(value);
      case 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID':
        return /^\d+$/.test(value);
      case 'EXPO_PUBLIC_FIREBASE_APP_ID':
        return /^1:\d+:(web|ios|android):[a-f0-9]+$/.test(value);
      default:
        return true;
    }
  };

  if (missingKeys.length > 0) {
    if (config.environment === 'development') {
      console.warn('⚠️ Missing Firebase environment variables in development mode:', missingKeys);
      console.warn('📝 This is expected in development. Analytics services will use mock data.');
      return true; // Allow development mode to continue
    } else {
      // In production, check if the config object has the values (they might be loaded differently)
      const hasConfigValues =
        config.firebase.apiKey &&
        config.firebase.authDomain &&
        config.firebase.projectId &&
        config.firebase.storageBucket &&
        config.firebase.messagingSenderId &&
        config.firebase.appId;

      if (!hasConfigValues) {
        console.error('❌ Missing required environment variables in production:', missingKeys);
        return false;
      } else {
        // Validate format of existing config values
        const invalidFormats = requiredKeys.filter((key) => {
          const configKey = key.replace('EXPO_PUBLIC_FIREBASE_', '').toLowerCase();
          const value = (config.firebase as any)[
            configKey === 'messaging_sender_id'
              ? 'messagingSenderId'
              : configKey === 'app_id'
                ? 'appId'
                : configKey === 'auth_domain'
                  ? 'authDomain'
                  : configKey === 'project_id'
                    ? 'projectId'
                    : configKey === 'storage_bucket'
                      ? 'storageBucket'
                      : configKey === 'api_key'
                        ? 'apiKey'
                        : configKey
          ];
          return value && !validateKeyFormat(key, value);
        });

        if (invalidFormats.length > 0) {
          console.warn('⚠️ Invalid format for Firebase config keys:', invalidFormats);
        }

        console.log('✅ Firebase configuration loaded successfully');
        return true;
      }
    }
  }

  return true;
};

// Helper functions
export const isProduction = () => config.environment === 'production';
export const isDevelopment = () => config.environment === 'development';
export const isStaging = () => config.environment === 'staging';
export const isAnalyticsEnabled = () => config.analytics.enabled;
export const isDebugEnabled = () => config.debug.enabled;
export const isMockMode = () => isDevelopment() && !validateEnvironmentConfig();
export const hasValidFirebaseConfig = () => validateEnvironmentConfig();

// Configuration logging helper
export const logConfig = () => {
  if (config.debug.enabled) {
    console.log('📋 Environment Configuration:', {
      environment: config.environment,
      app: config.app,
      analytics: config.analytics,
      debug: config.debug,
      firebase: {
        projectId: config.firebase.projectId,
        // Don't log sensitive keys
        hasApiKey: !!config.firebase.apiKey,
        hasAppId: !!config.firebase.appId,
      },
    });
  }
};

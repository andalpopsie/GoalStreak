import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { OnboardingProvider } from './src/hooks/useOnboarding';
import { TimerProvider } from './src/contexts/TimerContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/common';
import { Colors } from './src/constants/theme';
import { useAppFonts } from './src/hooks/useFonts';
import { notificationService } from './src/services/notificationService';
import { initializeAllServices } from './src/services/initializationService';
import { trackScreenView, trackEvent } from './src/services/enhancedAnalyticsService';

// Configure notification behavior globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Inner component to access auth context
function AppContent() {
  const { user } = useAuth();
  
  // Check for inactivity nudges when app opens
  useEffect(() => {
    if (user?.id) {
      checkInactivityNudge();
    }
  }, [user?.id]);

  const checkInactivityNudge = async () => {
    try {
      const { inactivityNudgeService } = await import('./src/services/inactivityNudgeService');
      await inactivityNudgeService.initialize();
      await inactivityNudgeService.checkAndSendNudge(user!.id);
    } catch (error) {
      console.error('Error checking inactivity nudge:', error);
    }
  };
  
  return (
    <OnboardingProvider>
      <TimerProvider userId={user?.id}>
        <AppNavigator />
        <StatusBar style="dark" backgroundColor={Colors.background} />
      </TimerProvider>
    </OnboardingProvider>
  );
}

export default function App() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    // Initialize analytics and monitoring services
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing GoalStreak services...');
        const status = await initializeAllServices();
        
        if (status.overall) {
          console.log('✅ All services initialized successfully');
          // Track successful app launch
          trackEvent('app_launch_complete', {
            startup_time: status.startupTime,
            services_status: {
              crashlytics: status.crashlytics,
              analytics: status.analytics,
              monitoring: status.monitoring,
              app_store_optimization: status.appStoreOptimization
            }
          });
          // Track initial screen view
          trackScreenView('App', { initialization_time: status.startupTime });
        } else {
          console.warn('⚠️ Some services failed to initialize:', status.errors);
          // Track partial initialization
          trackEvent('app_launch_partial', {
            startup_time: status.startupTime,
            errors: status.errors,
            services_status: {
              crashlytics: status.crashlytics,
              analytics: status.analytics,
              monitoring: status.monitoring,
              app_store_optimization: status.appStoreOptimization
            }
          });
        }
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
        // Track initialization failure with more context
        trackEvent('app_launch_failed', {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_stack: error instanceof Error ? error.stack : undefined,
          platform: Platform.OS,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Initialize services
    initializeApp();

    // Setup notification action listeners (industry standard)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { actionIdentifier, notification } = response;
      
      if (actionIdentifier) {
        notificationService.handleNotificationAction(actionIdentifier, notification);
      }
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    // Show loading screen while fonts load
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { TimerProvider } from './src/contexts/TimerContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/common';
import { Colors } from './src/constants/theme';
import { useAppFonts } from './src/hooks/useFonts';

// Inner component to access auth context
function AppContent() {
  const { user } = useAuth();
  
  return (
    <TimerProvider userId={user?.id}>
      <AppNavigator />
      <StatusBar style="dark" backgroundColor={Colors.background} />
    </TimerProvider>
  );
}

export default function App() {
  const fontsLoaded = useAppFonts();

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

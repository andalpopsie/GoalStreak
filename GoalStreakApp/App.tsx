import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { Colors } from './src/constants/theme';
import { useAppFonts } from './src/hooks/useFonts';

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
        <AppNavigator />
        <StatusBar style="dark" backgroundColor={Colors.background} />
      </AuthProvider>
    </ErrorBoundary>
  );
}

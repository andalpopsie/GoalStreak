import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import analytics for navigation tracking
import { trackScreenView } from '../services/enhancedAnalyticsService';
import { recordPerformance } from '../services/monitoringDashboardService';

// Import types
import { RootStackParamList, MainTabParamList, AuthStackParamList } from '../types';

// Import screens
import CleanHomeScreen from '../screens/CleanHomeScreen';
import SocialScreen from '../screens/SocialScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CreateHabitScreen from '../screens/CreateHabitScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Import hooks
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';

// Import theme
import { Colors } from '../constants/theme';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';  // Cuter, more playful
          } else if (route.name === 'Social') {
            iconName = focused ? 'heart' : 'heart-outline';  // Friendlier than people
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';  // Modern, rounded
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';  // Softer, rounder
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.accent1,
        tabBarInactiveTintColor: Colors.accent2,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.accent2,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primaryText,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={CleanHomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{ title: 'Social' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator (includes modal screens)
function MainStackNavigator() {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="CreateHabit"
        component={CreateHabitScreen}
        options={{
          headerShown: false,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.primaryText,
          headerTitle: '',
        }}
      />
    </Stack.Navigator>
  );
}

// Root Stack Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isOnboardingComplete, isLoading: isOnboardingLoading } = useOnboarding();
  const navigationStartTime = React.useRef<number>(0);

  // Track navigation performance
  const handleNavigationStateChange = React.useCallback((state: any) => {
    if (!state) return;

    const currentRoute = getCurrentRouteName(state);
    const navigationTime = Date.now() - navigationStartTime.current;

    if (currentRoute && navigationStartTime.current > 0) {
      // Track screen view
      trackScreenView(currentRoute, {
        navigation_time: navigationTime,
        timestamp: new Date().toISOString()
      });

      // Record navigation performance
      recordPerformance('navigation_time', navigationTime, 'navigation', {
        screen: currentRoute
      });
    }
  }, []);

  // Helper function to get current route name
  const getCurrentRouteName = (state: any): string | undefined => {
    if (!state?.routes?.length) {
      return undefined;
    }

    const route = state.routes[state.index];
    if (route?.state) {
      return getCurrentRouteName(route.state);
    }

    return route?.name;
  };

  // Track navigation start time
  const handleNavigationReady = React.useCallback(() => {
    navigationStartTime.current = Date.now();
  }, []);

  if (isLoading || isOnboardingLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavigationContainer
      onReady={handleNavigationReady}
      onStateChange={handleNavigationStateChange}
    >
      <Stack.Navigator
        id={undefined}
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          isOnboardingComplete ? (
            <Stack.Screen name="Main" component={MainStackNavigator} />
          ) : (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

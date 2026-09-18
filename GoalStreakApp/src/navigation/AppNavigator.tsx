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
import GroupDetailScreen from '../screens/GroupDetailScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import FoundingCelebrationScreen from '../screens/FoundingCelebrationScreen';

// Import hooks
import { useAuth } from '../hooks/useAuth';
import { useOnboarding, useFoundingCelebrationGate } from '../hooks/useOnboarding';

// Import theme
import { Colors, Typography } from '../constants/theme';

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
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Social') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
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
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.medium,
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primaryText,
        headerTitleStyle: {
          fontFamily: Typography.fontFamily.bold,
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={CleanHomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Social" component={SocialScreen} options={{ title: 'Social' }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
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
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.primaryText,
        }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{
          headerShown: true,
          headerTitle: 'Blocked Users',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.primaryText,
          headerTitleStyle: {
            fontFamily: Typography.fontFamily.bold,
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Pure recursive helper — outside the component so it is not re-created on
// every render.
function getCurrentRouteName(state: any): string | undefined {
  if (!state?.routes?.length) return undefined;
  const route = state.routes[state.index];
  if (route?.state) return getCurrentRouteName(route.state);
  return route?.name;
}

// Root Stack Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isOnboardingComplete, isLoading: isOnboardingLoading } = useOnboarding();
  const navigationStartTime = React.useRef<number>(0);

  // Only activate the founding gate once the user is authenticated and has
  // completed onboarding. The gate subscribes to Firestore and resolves
  // within 15 s (R9.4). While it is checking we hold on the loading screen
  // so there is no flash of the Main screen before the celebration.
  const foundingGateEnabled = isAuthenticated && isOnboardingComplete;
  const { checking: foundingChecking, outcome: foundingOutcome } = useFoundingCelebrationGate(
    user?.id ?? '',
    foundingGateEnabled
  );

  // Track navigation performance
  const handleNavigationStateChange = React.useCallback((state: any) => {
    if (!state) return;

    const currentRoute = getCurrentRouteName(state);
    const navigationTime = Date.now() - navigationStartTime.current;

    if (currentRoute && navigationStartTime.current > 0) {
      // Track screen view
      trackScreenView(currentRoute, {
        navigation_time: navigationTime,
        timestamp: new Date().toISOString(),
      });

      // Record navigation performance
      recordPerformance('navigation_time', navigationTime, 'navigation', {
        screen: currentRoute,
      });
    }
  }, []);

  // Track navigation start time
  const handleNavigationReady = React.useCallback(() => {
    navigationStartTime.current = Date.now();
  }, []);

  // Show nothing while auth, onboarding, or the founding gate is loading.
  // The founding gate check only runs when `foundingGateEnabled` is true, so
  // it is a no-op for unauthenticated users and during the onboarding flow.
  if (isLoading || isOnboardingLoading || (foundingGateEnabled && foundingChecking)) {
    return null;
  }

  // Determine which root screen to show after the gate resolves.
  const showCelebration = foundingGateEnabled && foundingOutcome?.show === true;

  // Extract the founding number before JSX so TypeScript can narrow the type
  // without an inline cast. `showCelebration` guarantees foundingOutcome.show
  // is true here, so the cast is safe and isolated to one line.
  const celebrationFoundingNumber = showCelebration
    ? (foundingOutcome as { show: true; foundingNumber: number }).foundingNumber
    : 0;

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
            showCelebration ? (
              // R9.1, R9.4: Founding member — show celebration screen first.
              // dismiss/auto-timeout inside the screen does navigation.replace('Main') (R9.5).
              <Stack.Screen
                name="FoundingCelebration"
                component={FoundingCelebrationScreen}
                initialParams={{ foundingNumber: celebrationFoundingNumber }}
              />
            ) : (
              // R9.3: Non-founding or already-seen celebration — go straight to Main.
              <Stack.Screen name="Main" component={MainStackNavigator} />
            )
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

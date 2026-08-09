import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../constants/theme';
import { WelcomeCarousel, HabitSuggestions, NotificationSetup } from '../components/onboarding';
import { motivationalNotificationService } from '../services/motivationalNotificationService';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import { trackEvent, trackScreenView } from '../services/enhancedAnalyticsService';
import { habitService } from '../services/habitService';
import { CreateHabitForm, HabitCategory } from '../types';

interface HabitTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  popularity: number;
  tips: string[];
}

export default function OnboardingScreen() {
  const { user } = useAuth();
  const { onboardingState, completeWelcome, completeHabitSuggestions, completeNotificationSetup, skipOnboarding } = useOnboarding();
  const [isCreatingHabits, setIsCreatingHabits] = useState(false);

  // DEBUG: Log when component re-renders

  useEffect(() => {
    // DEBUG: Log when step changes
    
    // Track onboarding screen view
    trackScreenView('OnboardingScreen', {
      onboarding_step: onboardingState.onboardingStep,
      user_id: user?.id,
    });

    // Track onboarding start
    if (onboardingState.onboardingStep === 'welcome') {
      trackEvent('onboarding_started', {
        user_id: user?.id,
        start_time: new Date().toISOString(),
      });
    }
  }, [onboardingState.onboardingStep, user?.id]);

  const handleWelcomeComplete = async () => {
    try {
      await completeWelcome();
    } catch (error) {
      console.error('Error completing welcome:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    }
  };

  const handleWelcomeSkip = async () => {
    try {
      // Move to habit suggestions instead of skipping everything
      await completeWelcome();
    } catch (error) {
      console.error('Error skipping welcome:', error);
      Alert.alert('Error', 'Failed to skip welcome. Please try again.');
    }
  };

  const handleHabitsSelected = async (selectedHabits: HabitTemplate[]) => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    setIsCreatingHabits(true);

    try {
      // Create habits from selected templates
      const createdHabits: string[] = [];
      const failedHabits: string[] = [];
      
      for (const template of selectedHabits) {
        try {
          const habitData: CreateHabitForm = {
            name: template.name,
            category: template.category as HabitCategory,
            frequency: 'daily',
            isPublic: false, // Default to private
            icon: template.icon,
          };

          const createdHabitId = await habitService.createHabit(user.id, habitData);
          createdHabits.push(createdHabitId);

          // Track individual habit creation
          trackEvent('onboarding_habit_created', {
            user_id: user.id,
            habit_id: createdHabitId,
            habit_name: template.name,
            habit_category: template.category,
            template_id: template.id,
            difficulty: template.difficulty,
          });
        } catch (error) {
          console.error(`Error creating habit ${template.name}:`, error);
          failedHabits.push(template.name);
          
          // Track individual habit creation failure
          trackEvent('onboarding_habit_creation_failed', {
            user_id: user.id,
            habit_name: template.name,
            habit_category: template.category,
            template_id: template.id,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
          
          // Continue with other habits even if one fails
        }
      }

      // Complete onboarding with selected template IDs
      const templateIds = selectedHabits.map(h => h.id);
      await completeHabitSuggestions(templateIds);

      // Track successful habit creation
      trackEvent('onboarding_habits_created_successfully', {
        user_id: user.id,
        created_count: createdHabits.length,
        requested_count: selectedHabits.length,
        template_ids: templateIds,
      });

      if (createdHabits.length < selectedHabits.length) {
        const failedCount = selectedHabits.length - createdHabits.length;
        Alert.alert(
          'Partial Success',
          `Created ${createdHabits.length} out of ${selectedHabits.length} habits successfully. ${failedCount} habit${failedCount > 1 ? 's' : ''} could not be created and can be added manually later.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error creating habits:', error);
      
      // Still complete onboarding even if habit creation fails
      try {
        const templateIds = selectedHabits.map(h => h.id);
        await completeHabitSuggestions(templateIds);
      } catch (onboardingError) {
        console.error('Error completing onboarding:', onboardingError);
      }

      Alert.alert(
        'Error Creating Habits',
        'There was an error creating your habits. You can create them manually from the home screen.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreatingHabits(false);
    }
  };

  const handleHabitsSkip = async () => {
    try {
      // Don't skip entire onboarding, just move to notification setup with no habits
      await completeHabitSuggestions([]); // Empty array = no habits selected
    } catch (error) {
      console.error('Error skipping habit suggestions:', error);
      Alert.alert('Error', 'Failed to skip habit suggestions. Please try again.');
    }
  };

  const handleNotificationSetupComplete = async (enabled: boolean, hour: number, minute: number) => {
    try {
      if (enabled) {
        // Initialize notification service and schedule
        const initialized = await motivationalNotificationService.initialize();
        if (initialized) {
          await motivationalNotificationService.scheduleDailyNotification(hour, minute);
        }
      }
      await completeNotificationSetup();
    } catch (error) {
      console.error('Error setting up notifications:', error);
      // Still complete onboarding even if notifications fail
      await completeNotificationSetup();
    }
  };

  const handleNotificationSetupSkip = async () => {
    await completeNotificationSetup();
  };

  const renderCurrentStep = () => {
    // DEBUG: Log current step
    
    switch (onboardingState.onboardingStep) {
      case 'welcome':
        return (
          <WelcomeCarousel
            onComplete={handleWelcomeComplete}
            onSkip={handleWelcomeSkip}
          />
        );
      
      case 'habit_suggestions':
        return (
          <HabitSuggestions
            onSelectHabits={handleHabitsSelected}
            onSkip={handleHabitsSkip}
          />
        );
      
      case 'notification_setup':
        return (
          <NotificationSetup
            onComplete={handleNotificationSetupComplete}
            onSkip={handleNotificationSetupSkip}
          />
        );
      
      default:
        // This shouldn't happen, but handle it gracefully
        return (
          <WelcomeCarousel
            onComplete={handleWelcomeComplete}
            onSkip={handleWelcomeSkip}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {renderCurrentStep()}
      </View>
      
      {/* Loading overlay for habit creation */}
      {isCreatingHabits && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>Creating your habits...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.primaryText,
    fontWeight: '500',
    fontFamily: Typography.fontFamily.medium,
  },
});
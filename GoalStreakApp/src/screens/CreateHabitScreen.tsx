import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { LIMITS } from '../constants/limits';
import { useHabits } from '../hooks/useHabits';
import { Button, SimpleInput } from '../components/common';
import { IconPicker } from '../components/habit';
import { CreateHabitForm, HabitCategory, TimerConfig } from '../types';
import { TimerToggle } from '../components/timer';
import { notificationService } from '../services/notificationService';
import { trackScreen, trackEvent, trackFeature } from '../services/enhancedAnalyticsService';
import { useAuth } from '../hooks/useAuth';
import { useHabitFormValidation } from '../hooks/useHabitFormValidation';
import { getCategoryColor } from '../utils/categoryIcons';

interface CreateHabitScreenProps {
  navigation: any;
}

interface HabitCategoryOption {
  value: HabitCategory;
  label: string;
  icon: string;
}

const HABIT_CATEGORIES: HabitCategoryOption[] = [
  { value: 'fitness', label: 'Fitness', icon: 'fitness' },           // 🟠 Orange - Exercise, workouts, running
  { value: 'wellness', label: 'Wellness', icon: 'heart' },           // 🟦 Teal - Health, meditation, sleep
  { value: 'nutrition', label: 'Nutrition', icon: 'restaurant' },    // 🟢 Light Green - Food, water, vitamins
  { value: 'social', label: 'Social', icon: 'people' },              // 🟣 Purple - Friends, family, relationships
  { value: 'productivity', label: 'Productivity', icon: 'briefcase' }, // 🔷 Navy - Work, learning, organization
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },   // 🌸 Pink - Other habits
];

// Constants for better maintainability
const DEFAULT_REMINDER_HOUR = 9;
const DEFAULT_REMINDER_MINUTE = 0;
const DEFAULT_REMINDER_PERIOD = 'AM' as const;

// Validation is handled by useHabitFormValidation hook

export default function CreateHabitScreen({ navigation }: CreateHabitScreenProps) {
  const { createHabit, isCreating, habits } = useHabits();
  const { user } = useAuth();

  // Track screen view
  useEffect(() => {
    trackScreen('CreateHabit');
    trackEvent('create_habit_screen_viewed', {
      current_habit_count: habits.length,
      user_id: user?.id
    });
  }, [habits.length, user?.id]);

  const [form, setForm] = useState<CreateHabitForm>({
    name: '',
    category: 'fitness',
    frequency: 'daily', // Always daily
    targetValue: undefined,
    unit: '',
    icon: 'checkmark-circle', // Default icon
    isPublic: false,
    timer: undefined, // Optional timer configuration
    reminderTime: undefined, // Optional reminder time
    reminderEnabled: false, // Reminder notifications disabled by default
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateHabitForm, string>>>({});

  // Icon picker state
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Time picker state
  const [selectedHour] = useState(DEFAULT_REMINDER_HOUR);
  const [selectedMinute] = useState(DEFAULT_REMINDER_MINUTE);
  const [selectedPeriod] = useState<'AM' | 'PM'>(DEFAULT_REMINDER_PERIOD);

  // Validation logic extracted for better maintainability
  const validation = useHabitFormValidation(habits);

  const validateForm = useCallback((): boolean => {
    const newErrors = validation.validateForm(form);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, validation]);

  // Helper function to format time for 24-hour storage
  const formatTimeFor24Hour = useCallback((hour: number, minute: number, period: 'AM' | 'PM'): string => {
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }, []);

  // Helper function to format time for display
  const formatTimeForDisplay = useCallback((timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }, []);

  const handleCreateHabit = async () => {
    if (!validateForm()) {
      // Track validation error
      trackEvent('habit_creation_validation_error', {
        form_data: {
          name_length: form.name.length,
          category: form.category,
          has_target_value: !!form.targetValue,
          has_timer: !!form.timer,
          reminder_enabled: form.reminderEnabled
        },
        user_id: user?.id
      });
      Alert.alert('Validation Error', 'Please check your form inputs');
      return;
    }

    try {
      // Track habit creation attempt
      trackEvent('habit_creation_started', {
        habit_name: form.name,
        habit_category: form.category,
        frequency: form.frequency,
        has_target_value: !!form.targetValue,
        has_timer: !!form.timer,
        reminder_enabled: form.reminderEnabled,
        is_public: form.isPublic,
        user_id: user?.id
      });

      // Convert selected time to 24-hour format for storage
      const reminderTime = form.reminderEnabled
        ? formatTimeFor24Hour(selectedHour, selectedMinute, selectedPeriod)
        : undefined;

      // Create the habit
      await createHabit({
        ...form,
        reminderTime,
      });

      // Schedule notification if reminders are enabled
      if (form.reminderEnabled && reminderTime) {
        try {
          console.log(`📅 Scheduling notification for "${form.name}" at ${reminderTime}`);

          // Find the newly created habit by name (since createHabit doesn't return the habit)
          const newHabit = habits.find(h => h.name === form.name && h.category === form.category);

          if (newHabit) {
            const notificationId = await notificationService.scheduleHabitReminder({
              id: newHabit.id,
              name: form.name,
              reminderTime,
              reminderEnabled: true,
            });

            if (notificationId) {
              console.log(`✅ Notification scheduled successfully: ${notificationId}`);
            }
          }
        } catch (notificationError: any) {
          console.error('❌ Failed to schedule notification:', notificationError);
          
          // Track notification error for analytics
          trackEvent('notification_scheduling_error', {
            error_message: notificationError?.message || 'Unknown notification error',
            habit_name: form.name,
            user_id: user?.id
          });
          
          // Don't fail the habit creation if notification fails
          Alert.alert(
            'Habit Created',
            'Habit created successfully, but notification scheduling failed. You can enable notifications later in settings.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
      }

      // Track successful habit creation
      trackFeature('habit_management', 'habit_created', 1);
      trackEvent('habit_created', {
        habit_name: form.name,
        habit_category: form.category,
        frequency: form.frequency,
        has_target_value: !!form.targetValue,
        has_timer: !!form.timer,
        reminder_enabled: form.reminderEnabled,
        is_public: form.isPublic,
        user_id: user?.id,
        total_habits_after_creation: habits.length + 1
      });

      Alert.alert('Success', 'Habit created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error creating habit:', error);

      // Track habit creation error
      trackEvent('habit_creation_error', {
        error_message: error.message || 'Unknown error',
        form_data: {
          name_length: form.name.length,
          category: form.category,
          has_target_value: !!form.targetValue,
          has_timer: !!form.timer,
          reminder_enabled: form.reminderEnabled
        },
        user_id: user?.id
      });

      Alert.alert('Error', error.message || 'Failed to create habit');
    }
  };

  const handleCategorySelect = useCallback((category: HabitCategory) => {
    setForm(prev => ({ ...prev, category }));
  }, []);

  // Memoize category options to prevent unnecessary re-renders
  const categoryOptions = useMemo(() => HABIT_CATEGORIES, []);

  // Memoize category colors for better performance
  const categoryColors = useMemo(() => {
    return HABIT_CATEGORIES.reduce((acc, category) => {
      acc[category.value] = getCategoryColor(category.value);
      return acc;
    }, {} as Record<HabitCategory, string>);
  }, []);

  // Render category cards with optimized performance
  const renderCategoryCard = useCallback((category: HabitCategoryOption) => {
    const categoryColor = categoryColors[category.value];
    const isSelected = form.category === category.value;

    return (
      <TouchableOpacity
        key={category.value}
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
          { borderColor: categoryColor + '30' }
        ]}
        onPress={() => handleCategorySelect(category.value)}
        accessibilityRole="button"
        accessibilityLabel={`${category.label} category`}
        accessibilityState={{ selected: isSelected }}
        accessibilityHint={`Select ${category.label} as the habit category`}
      >
        <View style={[
          styles.categoryIconContainer,
          { backgroundColor: categoryColor + '15' }
        ]}>
          <Ionicons
            name={category.icon as any}
            size={24}
            color={categoryColor}
          />
        </View>
        <Text style={[
          styles.categoryLabel,
          isSelected && { color: categoryColor }
        ]}>
          {category.label}
        </Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color={categoryColor} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [categoryColors, form.category, handleCategorySelect]);





  const handleTimerConfigChange = (timerConfig: TimerConfig | undefined) => {
    setForm({ ...form, timer: timerConfig });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Minimalist Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back to previous screen"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.title}>New Habit</Text>
          <Text style={styles.habitCounter}>{habits.length + 1}/{LIMITS.MAX_HABITS}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Habit Name - Minimalist */}
          <View style={styles.nameSection}>
            <SimpleInput
              placeholder="Habit name"
              value={form.name}
              onChangeText={(name: string) => setForm({ ...form, name })}
              error={errors.name}
            />
          </View>

          {/* Visual Category Selection */}
          <View style={styles.categoryGrid}>
            {categoryOptions.map(renderCategoryCard)}
          </View>

          {/* Icon Selection - Minimalist */}
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconPicker(true)}
          >
            <View style={styles.iconPreview}>
              <Ionicons name={form.icon as any} size={24} color={getCategoryColor(form.category)} />
            </View>
            <Text style={styles.iconText}>Choose icon</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
          </TouchableOpacity>

          {/* Timer - Minimalist */}
          <View style={styles.featureSection}>
            <TimerToggle
              timerConfig={form.timer}
              onTimerConfigChange={handleTimerConfigChange}
              habitName={form.name || 'New Habit'}
            />
          </View>

          {/* Quick Settings - Minimalist */}
          <View style={styles.settingsRow}>
            <TouchableOpacity
              style={[styles.settingCard, form.isPublic && styles.settingCardActive]}
              onPress={() => setForm({ ...form, isPublic: !form.isPublic })}
            >
              <Ionicons
                name={form.isPublic ? "people" : "people-outline"}
                size={20}
                color={form.isPublic ? Colors.accent1 : Colors.secondaryText}
              />
              <Text style={[
                styles.settingText,
                form.isPublic && styles.settingTextActive
              ]}>
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingCard, form.reminderEnabled && styles.settingCardActive]}
              onPress={() => setForm({ ...form, reminderEnabled: !form.reminderEnabled })}
            >
              <Ionicons
                name={form.reminderEnabled ? "notifications" : "notifications-outline"}
                size={20}
                color={form.reminderEnabled ? Colors.accent1 : Colors.secondaryText}
              />
              <Text style={[
                styles.settingText,
                form.reminderEnabled && styles.settingTextActive
              ]}>
                Remind
              </Text>
            </TouchableOpacity>
          </View>

          {form.reminderEnabled && (
            <TouchableOpacity
              style={styles.timeSelector}
              onPress={() => {
                const hour24 = selectedPeriod === 'PM' && selectedHour !== 12
                  ? selectedHour + 12
                  : selectedPeriod === 'AM' && selectedHour === 12
                    ? 0
                    : selectedHour;
                const timeString = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
                setForm({ ...form, reminderTime: timeString });
              }}
              accessibilityRole="button"
              accessibilityLabel="Set reminder time"
              accessibilityHint="Tap to set the time for habit reminders"
            >
              <Ionicons name="time" size={20} color={Colors.accent1} />
              <Text style={styles.timeText}>
                {form.reminderTime
                  ? formatTimeForDisplay(form.reminderTime)
                  : `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`
                }
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
            </TouchableOpacity>
          )}

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isCreating ? "Creating..." : "Create Habit"}
              onPress={handleCreateHabit}
              loading={isCreating}
              variant="primary"
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          selectedIcon={form.icon}
          onIconSelect={(iconName) => {
            setForm({ ...form, icon: iconName });
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  habitCounter: {
    fontSize: Typography.fontSize.sm,
    color: Colors.secondaryText,
    fontWeight: Typography.fontWeight.medium,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  nameSection: {
    marginBottom: Spacing.md,
  },

  // Category Grid - Compact 3x2 Layout
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray.medium,
    position: 'relative',
    minHeight: 60,
    marginBottom: Spacing.sm,
  },
  categoryCardSelected: {
    borderWidth: 2,
    backgroundColor: Colors.white,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  categoryLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: Spacing.xs,
  },

  // Icon Selector - Minimalist
  iconSelector: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray.medium,
  },
  iconPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },

  // Feature Section
  featureSection: {
    marginBottom: Spacing.md,
  },

  // Settings Row - Minimalist
  settingsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  settingCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray.medium,
  },
  settingCardActive: {
    borderColor: Colors.accent1,
    backgroundColor: Colors.accent1 + '08',
  },
  settingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.secondaryText,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  settingTextActive: {
    color: Colors.accent1,
  },

  // Time Selector - Minimalist
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray.medium,
  },
  timeText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.md,
  },

  buttonContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
});

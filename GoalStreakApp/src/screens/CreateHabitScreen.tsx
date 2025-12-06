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
  Switch,
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

  // Collapsible sections state
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [isIconExpanded, setIsIconExpanded] = useState(false);
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);

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

          {/* Collapsible Category Selection */}
          <View style={styles.collapsibleSection}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setIsCategoryExpanded(!isCategoryExpanded)}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <View style={[styles.categoryIconContainer, { backgroundColor: getCategoryColor(form.category) + '15' }]}>
                  <Ionicons
                    name={categoryOptions.find(c => c.value === form.category)?.icon as any}
                    size={20}
                    color={getCategoryColor(form.category)}
                  />
                </View>
                <View>
                  <Text style={styles.collapsibleLabel}>Category</Text>
                  <Text style={styles.collapsibleValue}>
                    {categoryOptions.find(c => c.value === form.category)?.label}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isCategoryExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>

            {isCategoryExpanded && (
              <View style={styles.categoryGrid}>
                {categoryOptions.map(renderCategoryCard)}
              </View>
            )}
          </View>

          {/* Collapsible Icon Selection */}
          <View style={styles.collapsibleSection}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setIsIconExpanded(!isIconExpanded)}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <View style={styles.iconPreview}>
                  <Ionicons name={form.icon as any} size={20} color={getCategoryColor(form.category)} />
                </View>
                <View>
                  <Text style={styles.collapsibleLabel}>Icon</Text>
                  <Text style={styles.collapsibleValue}>Tap to change</Text>
                </View>
              </View>
              <Ionicons
                name={isIconExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>

            {isIconExpanded && (
              <View style={styles.expandedContent}>
                <TouchableOpacity
                  style={styles.iconSelectorButton}
                  onPress={() => {
                    setShowIconPicker(true);
                    setIsIconExpanded(false);
                  }}
                >
                  <Text style={styles.iconSelectorButtonText}>Choose Icon</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.accent1} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Collapsible Options Section */}
          <View style={styles.collapsibleSection}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setIsOptionsExpanded(!isOptionsExpanded)}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <Ionicons name="options-outline" size={20} color={Colors.primaryText} />
                <View style={{ marginLeft: Spacing.md }}>
                  <Text style={styles.collapsibleLabel}>Options</Text>
                  <Text style={styles.collapsibleValue}>
                    {[
                      form.timer && 'Timer',
                      form.isPublic && 'Share',
                      form.reminderEnabled && 'Remind'
                    ].filter(Boolean).join(', ') || 'None selected'}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isOptionsExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>

            {isOptionsExpanded && (
              <View style={styles.expandedContent}>
                {/* Timer Option - Settings Style */}
                <View style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="timer-outline" size={20} color={Colors.accent1} />
                    </View>
                    <View>
                      <Text style={styles.optionLabel}>Timer</Text>
                      <Text style={styles.optionDescription}>Track time spent</Text>
                    </View>
                  </View>
                  <Switch
                    value={!!form.timer}
                    onValueChange={(value) => {
                      if (value) {
                        handleTimerConfigChange({ 
                          enabled: true, 
                          durationMinutes: 5, 
                          autoComplete: false 
                        });
                      } else {
                        handleTimerConfigChange(undefined);
                      }
                    }}
                    trackColor={{ false: Colors.gray.medium, true: Colors.accent1 + '40' }}
                    thumbColor={form.timer ? Colors.accent1 : Colors.white}
                  />
                </View>

                {/* Timer Duration Selector - Only show when enabled */}
                {form.timer && (
                  <View style={styles.timerDurationContainer}>
                    <Text style={styles.timerDurationLabel}>Duration</Text>
                    <View style={styles.timerDurationOptions}>
                      {[5, 10, 15, 30, 60].map((minutes) => (
                        <TouchableOpacity
                          key={minutes}
                          style={[
                            styles.durationOption,
                            form.timer?.durationMinutes === minutes && styles.durationOptionActive
                          ]}
                          onPress={() => {
                            if (form.timer) {
                              handleTimerConfigChange({
                                ...form.timer,
                                durationMinutes: minutes
                              });
                            }
                          }}
                        >
                          <Text style={[
                            styles.durationOptionText,
                            form.timer?.durationMinutes === minutes && styles.durationOptionTextActive
                          ]}>
                            {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Share Option - Settings Style */}
                <View style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="people-outline" size={20} color={Colors.accent1} />
                    </View>
                    <View>
                      <Text style={styles.optionLabel}>Share with Friends</Text>
                      <Text style={styles.optionDescription}>Make habit visible</Text>
                    </View>
                  </View>
                  <Switch
                    value={form.isPublic}
                    onValueChange={(value) => setForm({ ...form, isPublic: value })}
                    trackColor={{ false: Colors.gray.medium, true: Colors.accent1 + '40' }}
                    thumbColor={form.isPublic ? Colors.accent1 : Colors.white}
                  />
                </View>

                {/* Reminder Option - Settings Style */}
                <View style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="notifications-outline" size={20} color={Colors.accent1} />
                    </View>
                    <View>
                      <Text style={styles.optionLabel}>Daily Reminder</Text>
                      <Text style={styles.optionDescription}>Get notified</Text>
                    </View>
                  </View>
                  <Switch
                    value={form.reminderEnabled}
                    onValueChange={(value) => setForm({ ...form, reminderEnabled: value })}
                    trackColor={{ false: Colors.gray.medium, true: Colors.accent1 + '40' }}
                    thumbColor={form.reminderEnabled ? Colors.accent1 : Colors.white}
                  />
                </View>

                {/* Reminder Time Selector - Only show when enabled */}
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
                    <Ionicons name="time-outline" size={20} color={Colors.accent1} />
                    <Text style={styles.timeText}>
                      {form.reminderTime
                        ? formatTimeForDisplay(form.reminderTime)
                        : `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`
                      }
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

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
    padding: 16,                    // 8 * 2 (base)
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: 8,                     // 8 * 1 (tight)
    minHeight: 44,                  // Touch target
    minWidth: 44,                   // Touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,                   // subheading
    fontWeight: '600',              // semibold
    color: Colors.primaryText,
  },
  habitCounter: {
    fontSize: 14,                   // caption
    color: Colors.secondaryText,
    fontWeight: '500',              // medium
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,                    // 8 * 2 (base)
  },
  section: {
    marginBottom: 16,               // 8 * 2 (base)
  },
  nameSection: {
    marginBottom: 16,               // 8 * 2 (base)
  },

  // Collapsible Section Styles
  collapsibleSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,               // 8 * 2 (comfortable rounded)
    marginBottom: 16,               // 8 * 2 (base)
    borderWidth: 1,
    borderColor: Colors.gray.medium,
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,                    // 8 * 2 (base)
    minHeight: 64,                  // 8 * 8 (good touch target)
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapsibleLabel: {
    fontSize: 14,                   // caption
    color: Colors.secondaryText,
    marginBottom: 4,                // 8 * 0.5
  },
  collapsibleValue: {
    fontSize: 16,                   // body
    color: Colors.primaryText,
    fontWeight: '500',              // medium
  },
  expandedContent: {
    paddingHorizontal: 16,          // 8 * 2 (base)
    paddingBottom: 16,              // 8 * 2 (base)
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },

  // Category Grid - Compact 3x2 Layout (inside collapsible)
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,                    // 8 * 2 (base)
    paddingTop: 8,                  // 8 * 1 (tight)
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 12,               // 8 * 1.5
    padding: 12,                    // 8 * 1.5
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray.light,
    position: 'relative',
    minHeight: 56,                  // 8 * 7 (touch target)
    marginBottom: 8,                // 8 * 1 (tight)
  },
  categoryCardSelected: {
    borderWidth: 2,
    backgroundColor: Colors.white,
  },
  categoryIconContainer: {
    width: 40,                      // 8 * 5
    height: 40,                     // 8 * 5
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,                 // 8 * 1 (tight)
  },
  categoryLabel: {
    fontSize: 16,                   // body
    fontWeight: '600',              // semibold
    color: Colors.primaryText,
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: 4,                  // 8 * 0.5
  },

  // Icon Selector - Minimalist
  iconPreview: {
    width: 40,                      // 8 * 5
    height: 40,                     // 8 * 5
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,                // 8 * 2 (base)
  },
  iconSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 16,                    // 8 * 2 (base)
    borderRadius: 12,               // 8 * 1.5
    marginTop: 8,                   // 8 * 1 (tight)
    minHeight: 56,                  // 8 * 7 (touch target)
  },
  iconSelectorButtonText: {
    fontSize: 16,                   // body
    color: Colors.accent1,
    fontWeight: '500',              // medium
  },

  // Option Row - iOS Settings Style
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,            // 8 * 1.5
    paddingHorizontal: 16,          // 8 * 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 12,               // 8 * 1.5
    marginBottom: 8,                // 8 * 1 (tight)
    minHeight: 64,                  // 8 * 8 (good touch target)
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,                      // 8 * 5
    height: 40,                     // 8 * 5
    borderRadius: 20,
    backgroundColor: Colors.accent1 + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,                // 8 * 1.5
  },
  optionLabel: {
    fontSize: 16,                   // body
    fontWeight: '500',              // medium
    color: Colors.primaryText,
    marginBottom: 2,                // Tight spacing
  },
  optionDescription: {
    fontSize: 14,                   // caption
    color: Colors.secondaryText,
  },

  // Timer Duration Selector
  timerDurationContainer: {
    paddingHorizontal: 16,          // 8 * 2 (base)
    paddingVertical: 12,            // 8 * 1.5
    backgroundColor: Colors.background,
    borderRadius: 12,               // 8 * 1.5
    marginBottom: 8,                // 8 * 1 (tight)
  },
  timerDurationLabel: {
    fontSize: 14,                   // caption
    color: Colors.secondaryText,
    marginBottom: 8,                // 8 * 1 (tight)
    fontWeight: '500',              // medium
  },
  timerDurationOptions: {
    flexDirection: 'row',
    gap: 8,                         // 8 * 1 (tight)
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,            // 8 * 1.5
    paddingHorizontal: 8,           // 8 * 1 (tight)
    backgroundColor: Colors.white,
    borderRadius: 8,                // 8 * 1
    borderWidth: 1,
    borderColor: Colors.gray.medium,
    alignItems: 'center',
    minHeight: 48,                  // 8 * 6 (touch target)
    justifyContent: 'center',
  },
  durationOptionActive: {
    backgroundColor: Colors.accent1 + '10',
    borderColor: Colors.accent1,
    borderWidth: 2,
  },
  durationOptionText: {
    fontSize: 16,                   // body
    color: Colors.primaryText,
    fontWeight: '500',              // medium
  },
  durationOptionTextActive: {
    color: Colors.accent1,
    fontWeight: '600',              // semibold
  },

  // Time Selector - Minimalist
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,               // 8 * 2
    padding: 16,                    // 8 * 2 (base)
    marginBottom: 16,               // 8 * 2 (base)
    borderWidth: 1,
    borderColor: Colors.gray.medium,
    minHeight: 56,                  // 8 * 7 (touch target)
  },
  timeText: {
    flex: 1,
    fontSize: 16,                   // body
    color: Colors.primaryText,
    fontWeight: '500',              // medium
    marginLeft: 16,                 // 8 * 2 (base)
  },

  buttonContainer: {
    marginTop: 16,                  // 8 * 2 (base)
    marginBottom: 16,               // 8 * 2 (base)
  },
});

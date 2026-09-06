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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { LIMITS } from '../constants/limits';
import { useHabits } from '../hooks/useHabits';
import { Button, SimpleInput } from '../components/common';
import ProPaywallModal from '../components/common/ProPaywallModal';
import { IconPicker } from '../components/habit';
import { CreateHabitForm, HabitCategory, TimerConfig } from '../types';
import { TimerToggle } from '../components/timer';
import { notificationService } from '../services/notificationService';
import { trackScreen, trackEvent, trackFeature } from '../services/enhancedAnalyticsService';
import { useAuth } from '../hooks/useAuth';
import { useHabitFormValidation } from '../hooks/useHabitFormValidation';
import { getCategoryColor } from '../utils/categoryIcons';
import { HabitLimitError } from '../types/subscription';

interface CreateHabitScreenProps {
  navigation: any;
}

interface HabitCategoryOption {
  value: HabitCategory;
  label: string;
  icon: string;
}

const HABIT_CATEGORIES: HabitCategoryOption[] = [
  { value: 'fitness', label: 'Fitness', icon: 'fitness' }, // 🟠 Orange - Exercise, workouts, running
  { value: 'wellness', label: 'Wellness', icon: 'heart' }, // 🟦 Teal - Health, meditation, sleep
  { value: 'nutrition', label: 'Nutrition', icon: 'restaurant' }, // 🟢 Light Green - Food, water, vitamins
  { value: 'social', label: 'Social', icon: 'people' }, // 🟣 Purple - Friends, family, relationships
  { value: 'productivity', label: 'Productivity', icon: 'briefcase' }, // 🔷 Navy - Work, learning, organization
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' }, // 🌸 Pink - Other habits
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
      user_id: user?.id,
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

  // Timer duration picker state
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  // Reminder time picker state
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  // Paywall state — Free users hitting the habit limit see ProPaywallModal
  // instead of the legacy alert. `pendingForm` preserves the in-flight form
  // payload so the post-purchase retry uses the exact same data the user
  // submitted (Req 4.3, 4.4).
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingForm, setPendingForm] = useState<CreateHabitForm | null>(null);

  // Time picker state
  const [selectedHour] = useState(DEFAULT_REMINDER_HOUR);
  const [selectedMinute] = useState(DEFAULT_REMINDER_MINUTE);
  const [selectedPeriod] = useState<'AM' | 'PM'>(DEFAULT_REMINDER_PERIOD);

  // Validation logic extracted for better maintainability.
  // Note: the habit-limit check now lives in `habitService.createHabit` and
  // is tier-aware (Free: 6, Pro: 15). The screen no longer pre-blocks
  // submission; the service decides and we branch on `HabitLimitError`.
  const validation = useHabitFormValidation(habits);

  const validateForm = useCallback((): boolean => {
    const newErrors = validation.validateForm(form);

    // Drop the legacy `limit` validator output: the tier-based limit is now
    // enforced by `habitService.createHabit`, which throws `HabitLimitError`
    // on rejection. The screen branches on that error to show the paywall
    // (free user) or a terminal alert (Pro user already at 15).
    if (newErrors.limit) {
      delete newErrors.limit;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, validation]);

  // Helper function to format time for 24-hour storage
  const formatTimeFor24Hour = useCallback(
    (hour: number, minute: number, period: 'AM' | 'PM'): string => {
      let hour24 = hour;
      if (period === 'PM' && hour !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour === 12) {
        hour24 = 0;
      }
      return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    },
    []
  );

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
          reminder_enabled: form.reminderEnabled,
        },
        user_id: user?.id,
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
        user_id: user?.id,
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
          const newHabit = habits.find((h) => h.name === form.name && h.category === form.category);

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
            user_id: user?.id,
          });

          // Don't fail the habit creation if notification fails
          Alert.alert(
            'Habit Created',
            'Habit created successfully, but notification scheduling failed. You can enable notifications later in settings.',
            [
              {
                text: 'OK',
                onPress: () =>
                  navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'),
              },
            ]
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
        total_habits_after_creation: habits.length + 1,
      });

      Alert.alert('Success', 'Habit created successfully!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating habit:', error);

      // Free user hit the 6-habit limit → present the paywall and capture
      // the form so we can retry the exact same payload after a successful
      // purchase (Req 4.1, 4.3, 4.4).
      if (error instanceof HabitLimitError && !error.isPro) {
        trackEvent('habit_creation_paywall_triggered', {
          current_habit_count: habits.length,
          limit: error.limit,
          user_id: user?.id,
        });
        setPendingForm(form);
        setShowPaywall(true);
        return;
      }

      // Pro user hit the 15-habit ceiling → terminal limit alert; no upsell
      // is appropriate because they're already on the Pro tier (Req 4.2).
      if (error instanceof HabitLimitError && error.isPro) {
        Alert.alert('Habit Limit Reached', error.message);
        return;
      }

      // Track habit creation error
      trackEvent('habit_creation_error', {
        error_message: error.message || 'Unknown error',
        form_data: {
          name_length: form.name.length,
          category: form.category,
          has_target_value: !!form.targetValue,
          has_timer: !!form.timer,
          reminder_enabled: form.reminderEnabled,
        },
        user_id: user?.id,
      });

      Alert.alert('Error', error.message || 'Failed to create habit');
    }
  };

  // Retry the original habit creation after a successful Pro purchase or
  // restore. We dismiss the paywall first so the success alert that may
  // follow is rendered over the form, not the modal.
  const handlePaywallSuccess = useCallback(async () => {
    setShowPaywall(false);

    if (!pendingForm) return;

    // Build the same `reminderTime` payload `handleCreateHabit` would have
    // produced; the original payload is kept untouched so the user's
    // selection survives the paywall round-trip.
    const reminderTime = pendingForm.reminderEnabled
      ? formatTimeFor24Hour(selectedHour, selectedMinute, selectedPeriod)
      : undefined;

    try {
      await createHabit({
        ...pendingForm,
        reminderTime,
      });
      setPendingForm(null);

      trackFeature('habit_management', 'habit_created', 1);
      trackEvent('habit_created_after_paywall', {
        habit_name: pendingForm.name,
        habit_category: pendingForm.category,
        user_id: user?.id,
      });

      Alert.alert('Success', 'Habit created successfully!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating habit after paywall:', error);
      Alert.alert('Error', error?.message || 'Failed to create habit');
    }
  }, [
    pendingForm,
    createHabit,
    formatTimeFor24Hour,
    selectedHour,
    selectedMinute,
    selectedPeriod,
    navigation,
    user?.id,
  ]);

  // Closing the paywall keeps `pendingForm` so the user can retry from the
  // existing form contents without losing their progress (Req 4.3).
  const handlePaywallClose = useCallback(() => {
    setShowPaywall(false);
  }, []);

  const handleCategorySelect = useCallback((category: HabitCategory) => {
    setForm((prev) => ({ ...prev, category }));
  }, []);

  // Memoize category options to prevent unnecessary re-renders
  const categoryOptions = useMemo(() => HABIT_CATEGORIES, []);

  // Memoize category colors for better performance
  const categoryColors = useMemo(() => {
    return HABIT_CATEGORIES.reduce(
      (acc, category) => {
        acc[category.value] = getCategoryColor(category.value);
        return acc;
      },
      {} as Record<HabitCategory, string>
    );
  }, []);

  // Render category cards with optimized performance
  const renderCategoryCard = useCallback(
    (category: HabitCategoryOption) => {
      const categoryColor = categoryColors[category.value];
      const isSelected = form.category === category.value;

      return (
        <TouchableOpacity
          key={category.value}
          style={[
            styles.categoryCard,
            isSelected && styles.categoryCardSelected,
            { borderColor: categoryColor + '30' },
          ]}
          onPress={() => handleCategorySelect(category.value)}
          accessibilityRole="button"
          accessibilityLabel={`${category.label} category`}
          accessibilityState={{ selected: isSelected }}
          accessibilityHint={`Select ${category.label} as the habit category`}
        >
          <View style={[styles.categoryIconContainer, { backgroundColor: categoryColor + '15' }]}>
            <Ionicons name={category.icon as any} size={24} color={categoryColor} />
          </View>
          <Text style={[styles.categoryLabel, isSelected && { color: categoryColor }]}>
            {category.label}
          </Text>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color={categoryColor} />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [categoryColors, form.category, handleCategorySelect]
  );

  const handleTimerConfigChange = (timerConfig: TimerConfig | undefined) => {
    setForm({ ...form, timer: timerConfig });
  };

  // Derive the active category color for the hero preview
  const activeCategoryColor = getCategoryColor(form.category);
  const activeCategoryLabel =
    categoryOptions.find((c) => c.value === form.category)?.label || 'Fitness';
  const activeCategoryIcon =
    categoryOptions.find((c) => c.value === form.category)?.icon || 'fitness';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs');
              }
            }}
            style={styles.backButton}
            accessibilityLabel="Go back to previous screen"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.title}>New Habit</Text>
          <View style={styles.habitCounterBadge}>
            <Text style={styles.habitCounter}>
              {habits.length + 1}/{LIMITS.MAX_HABITS}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Preview Card */}
          <View style={[styles.heroCard, { borderColor: activeCategoryColor + '30' }]}>
            <View style={[styles.heroIconCircle, { backgroundColor: activeCategoryColor + '15' }]}>
              <Ionicons name={form.icon as any} size={32} color={activeCategoryColor} />
            </View>
            <Text style={styles.heroName} numberOfLines={1}>
              {form.name || 'Your new habit'}
            </Text>
            <View
              style={[styles.heroCategoryPill, { backgroundColor: activeCategoryColor + '12' }]}
            >
              <Ionicons name={activeCategoryIcon as any} size={14} color={activeCategoryColor} />
              <Text style={[styles.heroCategoryText, { color: activeCategoryColor }]}>
                {activeCategoryLabel}
              </Text>
            </View>
          </View>

          {/* Habit Name Input */}
          <View style={styles.nameSection}>
            <Text style={styles.sectionLabel}>NAME</Text>
            <SimpleInput
              placeholder="e.g. Morning Meditation"
              value={form.name}
              onChangeText={(name: string) => setForm({ ...form, name })}
              error={errors.name}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setIsCategoryExpanded(!isCategoryExpanded)}
            >
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[styles.cardHeaderIcon, { backgroundColor: activeCategoryColor + '12' }]}
                >
                  <Ionicons
                    name={activeCategoryIcon as any}
                    size={18}
                    color={activeCategoryColor}
                  />
                </View>
                <View>
                  <Text style={styles.cardHeaderTitle}>Category</Text>
                  <Text style={[styles.cardHeaderValue, { color: activeCategoryColor }]}>
                    {activeCategoryLabel}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isCategoryExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>

            {isCategoryExpanded && (
              <View style={styles.categoryGrid}>{categoryOptions.map(renderCategoryCard)}</View>
            )}
          </View>

          {/* Icon Selection */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setIsIconExpanded(!isIconExpanded)}
            >
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[styles.cardHeaderIcon, { backgroundColor: activeCategoryColor + '12' }]}
                >
                  <Ionicons name={form.icon as any} size={18} color={activeCategoryColor} />
                </View>
                <View>
                  <Text style={styles.cardHeaderTitle}>Icon</Text>
                  <Text style={styles.cardHeaderValue}>Tap to change</Text>
                </View>
              </View>
              <Ionicons
                name={isIconExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
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
                  <View style={styles.iconSelectorLeft}>
                    <Ionicons name="grid-outline" size={18} color={Colors.accent1} />
                    <Text style={styles.iconSelectorButtonText}>Browse Icons</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.accent1} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Options Section */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setIsOptionsExpanded(!isOptionsExpanded)}
            >
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardHeaderIcon, { backgroundColor: Colors.accent1 + '12' }]}>
                  <Ionicons name="settings-outline" size={18} color={Colors.accent1} />
                </View>
                <View>
                  <Text style={styles.cardHeaderTitle}>Options</Text>
                  <Text style={styles.cardHeaderValue}>
                    {[
                      form.timer && 'Timer',
                      form.isPublic && 'Share',
                      form.reminderEnabled && 'Remind',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'None selected'}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isOptionsExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>

            {isOptionsExpanded && (
              <View style={styles.expandedContent}>
                {/* Timer Option */}
                <View style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIconContainer, { backgroundColor: '#F3E8FF' }]}>
                      <Ionicons name="timer-outline" size={18} color={Colors.accent1} />
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
                          autoComplete: false,
                        });
                      } else {
                        handleTimerConfigChange(undefined);
                      }
                    }}
                    trackColor={{ false: Colors.gray.light, true: Colors.accent1 + '40' }}
                    thumbColor={form.timer ? Colors.accent1 : '#F4F4F4'}
                  />
                </View>

                {/* Timer Duration Selector */}
                {form.timer && (
                  <TouchableOpacity
                    style={styles.timerDurationSelector}
                    onPress={() => setShowTimerPicker(true)}
                  >
                    <View style={styles.timerDurationLeft}>
                      <Ionicons name="time-outline" size={18} color={Colors.accent1} />
                      <Text style={styles.timerDurationLabel}>Duration</Text>
                    </View>
                    <View style={styles.timerDurationRight}>
                      <Text style={styles.timerDurationValue}>
                        {form.timer.durationMinutes}{' '}
                        {form.timer.durationMinutes === 1 ? 'min' : 'mins'}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.secondaryText} />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Share Option */}
                <View style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIconContainer, { backgroundColor: '#E8F4F8' }]}>
                      <Ionicons name="people-outline" size={18} color={Colors.accent3} />
                    </View>
                    <View>
                      <Text style={styles.optionLabel}>Share with Friends</Text>
                      <Text style={styles.optionDescription}>Visible on social feed</Text>
                    </View>
                  </View>
                  <Switch
                    value={form.isPublic}
                    onValueChange={(value) => setForm({ ...form, isPublic: value })}
                    trackColor={{ false: Colors.gray.light, true: Colors.accent3 + '40' }}
                    thumbColor={form.isPublic ? Colors.accent3 : '#F4F4F4'}
                  />
                </View>

                {/* Reminder Option */}
                <View style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIconContainer, { backgroundColor: '#FFF4E8' }]}>
                      <Ionicons name="notifications-outline" size={18} color="#FF9013" />
                    </View>
                    <View>
                      <Text style={styles.optionLabel}>Daily Reminder</Text>
                      <Text style={styles.optionDescription}>Get notified daily</Text>
                    </View>
                  </View>
                  <Switch
                    value={form.reminderEnabled}
                    onValueChange={(value) => setForm({ ...form, reminderEnabled: value })}
                    trackColor={{ false: Colors.gray.light, true: '#FF9013' + '40' }}
                    thumbColor={form.reminderEnabled ? '#FF9013' : '#F4F4F4'}
                  />
                </View>

                {/* Reminder Time Selector */}
                {form.reminderEnabled && (
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => setShowReminderPicker(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Set reminder time"
                    accessibilityHint="Tap to set the time for habit reminders"
                  >
                    <Ionicons name="time-outline" size={18} color="#FF9013" />
                    <Text style={styles.timeText}>
                      {form.reminderTime
                        ? formatTimeForDisplay(form.reminderTime)
                        : `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isCreating ? 'Creating...' : 'Create Habit'}
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

      {/* Timer Duration Picker Modal */}
      <Modal
        visible={showTimerPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimerPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimerPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Timer Duration (in minutes)</Text>
              <TouchableOpacity onPress={() => setShowTimerPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {Array.from({ length: 60 }, (_, i) => i + 1).map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.durationOption,
                    form.timer?.durationMinutes === minutes && styles.durationOptionSelected,
                  ]}
                  onPress={() => {
                    if (form.timer) {
                      handleTimerConfigChange({
                        ...form.timer,
                        durationMinutes: minutes,
                      });
                    }
                    setShowTimerPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.durationOptionText,
                      form.timer?.durationMinutes === minutes && styles.durationOptionTextSelected,
                    ]}
                  >
                    {minutes}
                  </Text>
                  {form.timer?.durationMinutes === minutes && (
                    <Ionicons name="checkmark" size={24} color={Colors.accent1} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reminder Time Picker Modal */}
      <Modal
        visible={showReminderPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReminderPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReminderPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reminder Time</Text>
              <TouchableOpacity onPress={() => setShowReminderPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {/* Morning times (6 AM - 11 AM) */}
              {Array.from({ length: 6 }, (_, i) => i + 6).map((hour) => (
                <TouchableOpacity
                  key={`${hour}-AM`}
                  style={[
                    styles.durationOption,
                    form.reminderTime === `${hour.toString().padStart(2, '0')}:00` &&
                      styles.durationOptionSelected,
                  ]}
                  onPress={() => {
                    setForm({ ...form, reminderTime: `${hour.toString().padStart(2, '0')}:00` });
                    setShowReminderPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.durationOptionText,
                      form.reminderTime === `${hour.toString().padStart(2, '0')}:00` &&
                        styles.durationOptionTextSelected,
                    ]}
                  >
                    {hour === 12 ? 12 : hour} AM
                  </Text>
                  {form.reminderTime === `${hour.toString().padStart(2, '0')}:00` && (
                    <Ionicons name="checkmark" size={24} color={Colors.accent1} />
                  )}
                </TouchableOpacity>
              ))}
              {/* Noon */}
              <TouchableOpacity
                key="12-PM"
                style={[
                  styles.durationOption,
                  form.reminderTime === '12:00' && styles.durationOptionSelected,
                ]}
                onPress={() => {
                  setForm({ ...form, reminderTime: '12:00' });
                  setShowReminderPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.durationOptionText,
                    form.reminderTime === '12:00' && styles.durationOptionTextSelected,
                  ]}
                >
                  12 PM
                </Text>
                {form.reminderTime === '12:00' && (
                  <Ionicons name="checkmark" size={24} color={Colors.accent1} />
                )}
              </TouchableOpacity>
              {/* Afternoon/Evening times (1 PM - 11 PM) */}
              {Array.from({ length: 11 }, (_, i) => i + 13).map((hour) => (
                <TouchableOpacity
                  key={`${hour}-PM`}
                  style={[
                    styles.durationOption,
                    form.reminderTime === `${hour.toString().padStart(2, '0')}:00` &&
                      styles.durationOptionSelected,
                  ]}
                  onPress={() => {
                    setForm({ ...form, reminderTime: `${hour.toString().padStart(2, '0')}:00` });
                    setShowReminderPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.durationOptionText,
                      form.reminderTime === `${hour.toString().padStart(2, '0')}:00` &&
                        styles.durationOptionTextSelected,
                    ]}
                  >
                    {hour - 12} PM
                  </Text>
                  {form.reminderTime === `${hour.toString().padStart(2, '0')}:00` && (
                    <Ionicons name="checkmark" size={24} color={Colors.accent1} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pro Paywall Modal — shown when a free user hits the 6-habit limit. */}
      <ProPaywallModal
        visible={showPaywall}
        onClose={handlePaywallClose}
        onSuccess={handlePaywallSuccess}
      />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // 8 × 2
    paddingVertical: 12, // 8 × 1.5
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  backButton: {
    width: 40, // 8 × 5
    height: 40, // 8 × 5
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20, // subheading
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    letterSpacing: -0.3,
  },
  habitCounterBadge: {
    backgroundColor: Colors.accent1 + '12',
    paddingHorizontal: 10, // 8 × 1.25
    paddingVertical: 4,
    borderRadius: 12,
  },
  habitCounter: {
    fontSize: 12, // small
    color: Colors.accent1,
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16, // 8 × 2
    paddingBottom: 32, // 8 × 4
  },

  // Hero Preview Card
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 20, // 8 × 2.5
    padding: 24, // 8 × 3
    marginBottom: 24, // 8 × 3
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroIconCircle: {
    width: 64, // 8 × 8
    height: 64, // 8 × 8
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12, // 8 × 1.5
  },
  heroName: {
    fontSize: 20, // subheading
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    marginBottom: 8, // 8 × 1
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // 8 × 1.5
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  heroCategoryText: {
    fontSize: 12, // small
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
  },

  // Section Label
  sectionLabel: {
    fontSize: 12, // small
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.secondaryText,
    letterSpacing: 1,
    marginBottom: 8, // 8 × 1
  },
  nameSection: {
    marginBottom: 8, // 8 × 1
  },

  // Card (replaces collapsibleSection)
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16, // 8 × 2
    marginBottom: 12, // 8 × 1.5
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, // 8 × 2
    minHeight: 64, // 8 × 8
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderIcon: {
    width: 36, // 8 × 4.5
    height: 36, // 8 × 4.5
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // 8 × 1.5
  },
  cardHeaderTitle: {
    fontSize: 12, // small
    color: Colors.secondaryText,
    fontWeight: '500', // medium
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  cardHeaderValue: {
    fontSize: 16, // body
    color: Colors.primaryText,
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
  expandedContent: {
    paddingHorizontal: 12, // 8 × 1.5
    paddingBottom: 12, // 8 × 1.5
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
    paddingTop: 12, // 8 × 1.5
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12, // 8 × 1.5
    paddingBottom: 12, // 8 × 1.5
    paddingTop: 8, // 8 × 1
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 12, // 8 × 1.5
    padding: 10, // 8 × 1.25
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 48, // 8 × 6
    marginBottom: 8, // 8 × 1
  },
  categoryCardSelected: {
    borderWidth: 1.5,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 32, // 8 × 4
    height: 32, // 8 × 4
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8, // 8 × 1
  },
  categoryLabel: {
    fontSize: 14, // caption
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: 4,
  },

  // Icon Selector
  iconSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.accent1 + '08',
    padding: 14, // 8 × 1.75
    borderRadius: 12, // 8 × 1.5
    minHeight: 48, // 8 × 6
  },
  iconSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 8 × 1
  },
  iconSelectorButtonText: {
    fontSize: 14, // caption
    color: Colors.accent1,
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
  },

  // Option Row
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, // 8 × 1.25
    paddingHorizontal: 4,
    minHeight: 56, // 8 × 7
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light + '80',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 36, // 8 × 4.5
    height: 36, // 8 × 4.5
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // 8 × 1.5
  },
  optionLabel: {
    fontSize: 16, // body
    fontWeight: '500', // medium
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryText,
    marginBottom: 1,
  },
  optionDescription: {
    fontSize: 14, // caption
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryText,
  },

  // Timer Duration Selector
  timerDurationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, // 8 × 1.25
    paddingHorizontal: 4,
    minHeight: 48, // 8 × 6
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light + '80',
  },
  timerDurationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // 8 × 1.5
  },
  timerDurationLabel: {
    fontSize: 16, // body
    color: Colors.primaryText,
    fontWeight: '500', // medium
    fontFamily: Typography.fontFamily.medium,
  },
  timerDurationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerDurationValue: {
    fontSize: 16, // body
    color: Colors.accent1,
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
  },

  // Time Selector
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E8',
    borderRadius: 12, // 8 × 1.5
    padding: 12, // 8 × 1.5
    marginTop: 8, // 8 × 1
    minHeight: 48, // 8 × 6
  },
  timeText: {
    flex: 1,
    fontSize: 16, // body
    color: Colors.primaryText,
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
    marginLeft: 10,
  },

  // Create Button
  buttonContainer: {
    marginTop: 24, // 8 × 3
    marginBottom: 16, // 8 × 2
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, // 8 × 3
    borderTopRightRadius: 24, // 8 × 3
    height: '50%',
    paddingBottom: 32, // 8 × 4
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, // 8 × 2
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  modalTitle: {
    fontSize: 20, // subheading
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
  },
  modalScroll: {
    flex: 1,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, // 8 × 1.75
    paddingHorizontal: 24, // 8 × 3
    minHeight: 52, // 8 × 6.5
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  durationOptionSelected: {
    backgroundColor: Colors.accent1 + '08',
  },
  durationOptionText: {
    fontSize: 16, // body
    color: Colors.primaryText,
    fontWeight: '400', // regular
    fontFamily: Typography.fontFamily.regular,
  },
  durationOptionTextSelected: {
    color: Colors.accent1,
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
  },
});

import React, { useState } from 'react';
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

interface CreateHabitScreenProps {
  navigation: any;
}

const HABIT_CATEGORIES: { value: HabitCategory; label: string; icon: string }[] = [
  { value: 'fitness', label: 'Fitness', icon: 'fitness' },
  { value: 'wellness', label: 'Wellness', icon: 'heart' },
  { value: 'nutrition', label: 'Nutrition', icon: 'restaurant' },
  { value: 'productivity', label: 'Productivity', icon: 'briefcase' },
  { value: 'mindfulness', label: 'Mindfulness', icon: 'leaf' },
  { value: 'social', label: 'Social', icon: 'people' },
  { value: 'learning', label: 'Learning', icon: 'book' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function CreateHabitScreen({ navigation }: CreateHabitScreenProps) {
  const { createHabit, isCreating, habits } = useHabits();
  
  const [form, setForm] = useState<CreateHabitForm>({
    name: '',
    category: 'fitness',
    frequency: 'daily', // Always daily
    targetValue: undefined,
    unit: '',
    icon: 'checkmark-circle', // Default icon
    isPublic: false,
    timer: undefined, // Optional timer configuration
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    frequency?: string;
    targetValue?: string;
    unit?: string;
    icon?: string;
    isPublic?: string;
  }>({});
  
  // Icon picker state
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // Category dropdown state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      category?: string;
      frequency?: string;
      targetValue?: string;
      unit?: string;
      icon?: string;
      isPublic?: string;
    } = {};

    if (!form.name.trim()) {
      newErrors.name = 'Habit name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Habit name must be at least 2 characters';
    }

    if (form.targetValue !== undefined && form.targetValue <= 0) {
      newErrors.targetValue = 'Target value must be greater than 0';
    }

    if (form.targetValue !== undefined && !form.unit?.trim()) {
      newErrors.unit = 'Unit is required when target value is set';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateHabit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check your form inputs');
      return;
    }

    try {
      await createHabit(form);
      
      Alert.alert('Success', 'Habit created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error creating habit:', error);
      Alert.alert('Error', error.message || 'Failed to create habit');
    }
  };

  const handleCategorySelect = (category: HabitCategory) => {
    setForm({ ...form, category });
  };

  const handleTimerConfigChange = (timerConfig: TimerConfig | undefined) => {
    setForm({ ...form, timer: timerConfig });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.title}>Create New Habit</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Habit Counter */}
        <View style={styles.habitCounterSection}>
          <Text style={styles.habitCounterText}>
            Creating habit {habits.length + 1} of {LIMITS.MAX_HABITS}
          </Text>
          {habits.length >= LIMITS.MAX_HABITS - 1 && (
            <Text style={styles.habitCounterWarning}>
              {habits.length === LIMITS.MAX_HABITS - 1 ? 'This will be your last habit!' : 'Habit limit reached'}
            </Text>
          )}
          {habits.length < LIMITS.MAX_HABITS - 1 && (
            <Text style={styles.habitCounterSubtext}>
              {LIMITS.MAX_HABITS - 1 - habits.length} more habits available after this
            </Text>
          )}
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setShowCategoryDropdown(false)}
        >
          {/* Habit Name */}
          <View style={styles.inputSection}>
            <SimpleInput
              label="What habit do you want to build?"
              placeholder="e.g., Morning meditation, Daily run"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
              error={errors.name}
            />
          </View>

          {/* Icon & Category Selection */}
          <View style={styles.selectionSection}>
            <Text style={styles.sectionTitle}>Icon & Category</Text>
            
            <View style={styles.iconCategoryRow}>
              <View style={styles.iconContainer}>
                <TouchableOpacity 
                style={styles.categorySelector}
                onPress={() => setShowIconPicker(true)}
              >
                <View style={styles.categoryContent}>
                  <Ionicons name="happy-outline" size={24} color={Colors.accent1} />
                  <Text style={styles.categoryText}>Icon</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.accent2} />
              </TouchableOpacity>
              </View>

              <View style={styles.categoryContainer}>
                <TouchableOpacity 
                  style={styles.categorySelector}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                <View style={styles.categoryContent}>
                  <Ionicons name="grid-outline" size={24} color={Colors.accent1} />
                  <Text style={styles.categoryText}>
                    Category
                  </Text>
                </View>
                <Ionicons
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={Colors.accent2}
                />
              </TouchableOpacity>
              </View>
            </View>
            
            {showCategoryDropdown && (
              <View style={styles.categoryDropdown}>
                {HABIT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.dropdownItem,
                      form.category === category.value && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      handleCategorySelect(category.value);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={form.category === category.value ? Colors.accent1 : Colors.primaryText}
                    />
                    <Text style={[
                      styles.dropdownItemText,
                      form.category === category.value && styles.dropdownItemTextSelected
                    ]}>
                      {category.label}
                    </Text>
                    {form.category === category.value && (
                      <Ionicons name="checkmark" size={16} color={Colors.accent1} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Timer Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timer</Text>
            <TimerToggle
              timerConfig={form.timer}
              onTimerConfigChange={handleTimerConfigChange}
              habitName={form.name || 'New Habit'}
            />
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visibility</Text>
            <TouchableOpacity
              style={styles.privacyOption}
              onPress={() => setForm({ ...form, isPublic: !form.isPublic })}
            >
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Share with friends</Text>
                <Text style={styles.privacyDescription}>
                  Let your friends see this habit in their activity feed
                </Text>
              </View>
              <View style={[
                styles.toggle,
                form.isPublic && styles.toggleActive
              ]}>
                {form.isPublic && (
                  <Ionicons name="checkmark" size={16} color={Colors.white} />
                )}
              </View>
            </TouchableOpacity>
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
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent2,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  habitCounterSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent2 + '20',
  },
  habitCounterText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  habitCounterSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
    marginTop: 2,
  },
  habitCounterWarning: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent1,
    marginTop: 2,
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
  inputSection: {
    marginBottom: Spacing.md,
  },
  selectionSection: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  iconCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  iconContainer: {
    flex: 1,
  },
  categoryContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  categorySelector: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.gray.light,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
  },
  categoryDropdown: {
    position: 'absolute',
    top: 80,
    right: 0,
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    marginBottom: Spacing.md,
  },
  dropdownButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.accent2 + '30',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  dropdownMenu: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.accent2 + '30',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent2 + '20',
  },
  dropdownItemSelected: {
    backgroundColor: Colors.accent1 + '10',
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: Colors.accent1,
    fontWeight: Typography.fontWeight.medium,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  privacyDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.accent3,
  },
  buttonContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  // Icon Selection Styles
  iconSelector: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray.light,
  },
  selectedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  iconSelectorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
  },
});

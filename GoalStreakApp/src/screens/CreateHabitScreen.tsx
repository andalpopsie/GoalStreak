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
import { useHabits } from '../hooks/useHabits';
import Button from '../components/Button';
import SimpleInput from '../components/SimpleInput';
import { CreateHabitForm, HabitCategory, HabitFrequency } from '../types';

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

const HABIT_FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function CreateHabitScreen({ navigation }: CreateHabitScreenProps) {
  const { createHabit, isCreating } = useHabits();
  
  const [form, setForm] = useState<CreateHabitForm>({
    name: '',
    description: '',
    category: 'fitness',
    frequency: 'daily',
    targetValue: undefined,
    unit: '',
    isPublic: false,
  });
  
  const [errors, setErrors] = useState<Partial<CreateHabitForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateHabitForm> = {};

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

  const handleFrequencySelect = (frequency: HabitFrequency) => {
    setForm({ ...form, frequency });
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

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <SimpleInput
              label="Habit Name"
              placeholder="e.g., Morning meditation, Daily run"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
              error={errors.name}
            />

            <SimpleInput
              label="Description (Optional)"
              placeholder="Add more details about your habit"
              value={form.description || ''}
              onChangeText={(description) => setForm({ ...form, description })}
              multiline
              error={errors.description}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoriesGrid}>
              {HABIT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryCard,
                    form.category === category.value && styles.categoryCardSelected
                  ]}
                  onPress={() => handleCategorySelect(category.value)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color={form.category === category.value ? Colors.white : Colors.primaryText}
                  />
                  <Text style={[
                    styles.categoryText,
                    form.category === category.value && styles.categoryTextSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Frequency Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequency</Text>
            <View style={styles.frequencyContainer}>
              {HABIT_FREQUENCIES.map((frequency) => (
                <TouchableOpacity
                  key={frequency.value}
                  style={[
                    styles.frequencyButton,
                    form.frequency === frequency.value && styles.frequencyButtonSelected
                  ]}
                  onPress={() => handleFrequencySelect(frequency.value)}
                >
                  <Text style={[
                    styles.frequencyText,
                    form.frequency === frequency.value && styles.frequencyTextSelected
                  ]}>
                    {frequency.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Value (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Value (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Set a specific target like "30 minutes" or "10 push-ups"
            </Text>
            
            <View style={styles.targetContainer}>
              <View style={styles.targetValueContainer}>
                <SimpleInput
                  placeholder="e.g., 30"
                  value={form.targetValue?.toString() || ''}
                  onChangeText={(value) => setForm({ 
                    ...form, 
                    targetValue: value ? parseInt(value) || undefined : undefined 
                  })}
                  keyboardType="numeric"
                  error={errors.targetValue}
                />
              </View>
              <View style={styles.targetUnitContainer}>
                <SimpleInput
                  placeholder="e.g., minutes"
                  value={form.unit || ''}
                  onChangeText={(unit) => setForm({ ...form, unit })}
                  error={errors.unit}
                />
              </View>
            </View>
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1,
  },
  categoryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryText,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: Colors.white,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyButtonSelected: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1,
  },
  frequencyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  frequencyTextSelected: {
    color: Colors.white,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  targetValueContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  targetUnitContainer: {
    flex: 2,
    marginLeft: Spacing.sm,
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});

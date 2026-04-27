// GroupCreateForm Component - Modal form for creating a new accountability group
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';
import { CreateGroupForm } from '../../types/social';
import { HabitCategory } from '../../types/index';
import groupService from '../../services/groupService';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';

interface GroupCreateFormProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (form: CreateGroupForm) => Promise<void>;
  isCreating: boolean;
}

const CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'fitness', label: 'Fitness' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'social', label: 'Social' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'other', label: 'Other' },
];

export default function GroupCreateForm({
  visible,
  onClose,
  onCreate,
  isCreating,
}: GroupCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('fitness');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  });

  // Validation state
  const nameValidation = name.length > 0 ? groupService.validateGroupName(name) : null;
  const descValidation = description.length > 0 ? groupService.validateGroupDescription(description) : null;
  const endDateValidation = hasEndDate ? groupService.validateEndDate(endDate) : null;

  const isFormValid =
    (nameValidation?.valid ?? false) &&
    (descValidation?.valid ?? true) &&
    (!hasEndDate || (endDateValidation?.valid ?? false));

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isCreating) return;

    const form: CreateGroupForm = {
      name: name.trim(),
      description: description.trim(),
      category,
      ...(hasEndDate && { endDate }),
    };

    try {
      await onCreate(form);
      // Reset form on success
      setName('');
      setDescription('');
      setCategory('fitness');
      setHasEndDate(false);
      setEndDate(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d;
      });
    } catch {
      // Error handled by parent
    }
  }, [isFormValid, isCreating, name, description, category, hasEndDate, endDate, onCreate]);

  const resetAndClose = () => {
    setName('');
    setDescription('');
    setCategory('fitness');
    setHasEndDate(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={resetAndClose}
            style={styles.closeButton}
            accessibilityLabel="Close create group form"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Group</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Group Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Group Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                nameValidation && !nameValidation.valid && styles.inputError,
                nameValidation?.valid && styles.inputSuccess,
              ]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Morning Runners"
              placeholderTextColor={Colors.gray.medium}
              maxLength={50}
              accessibilityLabel="Group name"
            />
            <View style={styles.validationRow}>
              {nameValidation && !nameValidation.valid ? (
                <Text style={styles.errorText}>{nameValidation.error}</Text>
              ) : nameValidation?.valid ? (
                <Text style={styles.successText}>Looks good!</Text>
              ) : null}
              <Text style={styles.charCount}>{name.trim().length}/50</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                descValidation && !descValidation.valid && styles.inputError,
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this group about?"
              placeholderTextColor={Colors.gray.medium}
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Group description"
            />
            <View style={styles.validationRow}>
              {descValidation && !descValidation.valid ? (
                <Text style={styles.errorText}>{descValidation.error}</Text>
              ) : null}
              <Text style={styles.charCount}>{description.length}/200</Text>
            </View>
          </View>

          {/* Category Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                const catColor = getCategoryColor(cat.value);
                const catIcon = getCategoryIcon(cat.value);
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: catColor, borderColor: catColor },
                    ]}
                    onPress={() => setCategory(cat.value)}
                    accessibilityLabel={`${cat.label} category`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Ionicons
                      name={catIcon as any}
                      size={16}
                      color={isSelected ? Colors.white : catColor}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* End Date Toggle */}
          <View style={styles.fieldContainer}>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity
                style={[styles.toggle, hasEndDate && styles.toggleActive]}
                onPress={() => setHasEndDate(!hasEndDate)}
                accessibilityLabel="Toggle end date"
                accessibilityRole="switch"
                accessibilityState={{ checked: hasEndDate }}
              >
                <View style={[styles.toggleThumb, hasEndDate && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {hasEndDate
                ? 'Group will end on the selected date'
                : 'Group will run indefinitely'}
            </Text>

            {hasEndDate && (
              <View style={styles.datePickerContainer}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    // Increment date by 1 day
                    const newDate = new Date(endDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setEndDate(newDate);
                  }}
                  accessibilityLabel="Select end date"
                  accessibilityRole="button"
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.primaryText} />
                  <Text style={styles.dateButtonText}>
                    {endDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>
                <View style={styles.dateAdjustRow}>
                  <TouchableOpacity
                    style={styles.dateAdjustButton}
                    onPress={() => {
                      const newDate = new Date(endDate);
                      newDate.setDate(newDate.getDate() - 7);
                      const minDate = new Date();
                      minDate.setDate(minDate.getDate() + 2);
                      if (newDate > minDate) setEndDate(newDate);
                    }}
                    accessibilityLabel="Subtract 7 days"
                    accessibilityRole="button"
                  >
                    <Text style={styles.dateAdjustText}>-7 days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateAdjustButton}
                    onPress={() => {
                      const newDate = new Date(endDate);
                      newDate.setDate(newDate.getDate() - 1);
                      const minDate = new Date();
                      minDate.setDate(minDate.getDate() + 2);
                      if (newDate > minDate) setEndDate(newDate);
                    }}
                    accessibilityLabel="Subtract 1 day"
                    accessibilityRole="button"
                  >
                    <Text style={styles.dateAdjustText}>-1 day</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateAdjustButton}
                    onPress={() => {
                      const newDate = new Date(endDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setEndDate(newDate);
                    }}
                    accessibilityLabel="Add 1 day"
                    accessibilityRole="button"
                  >
                    <Text style={styles.dateAdjustText}>+1 day</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateAdjustButton}
                    onPress={() => {
                      const newDate = new Date(endDate);
                      newDate.setDate(newDate.getDate() + 7);
                      setEndDate(newDate);
                    }}
                    accessibilityLabel="Add 7 days"
                    accessibilityRole="button"
                  >
                    <Text style={styles.dateAdjustText}>+7 days</Text>
                  </TouchableOpacity>
                </View>
                {endDateValidation && !endDateValidation.valid && (
                  <Text style={styles.errorText}>{endDateValidation.error}</Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || isCreating}
            accessibilityLabel="Create group"
            accessibilityRole="button"
          >
            {isCreating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="people" size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>Create Group</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 16,               // 8 × 2 (base)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 48,                          // 8 × 6 (touch target)
    height: 48,                         // 8 × 6 (touch target)
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,                       // subheading
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
  },
  headerSpacer: {
    width: 48,                          // Balance the close button
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,                        // 8 × 2 (base)
    paddingBottom: 32,                  // 8 × 4 (loose)
  },
  fieldContainer: {
    marginBottom: 24,                   // 8 × 3 (comfortable)
  },
  label: {
    fontSize: 14,                       // caption
    fontWeight: '600',                  // semibold
    color: Colors.primaryText,
    marginBottom: 8,                    // 8 × 1 (tight)
  },
  required: {
    color: Colors.error,               // Red (#FF4444)
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: 12,
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 12,
    fontSize: 16,                       // body
    color: Colors.primaryText,
    minHeight: 48,                      // 8 × 6 (touch target)
  },
  textArea: {
    minHeight: 80,                      // 8 × 10
    paddingTop: 12,
  },
  inputError: {
    borderColor: Colors.error,         // Red (#FF4444)
  },
  inputSuccess: {
    borderColor: Colors.accent3,       // Teal (#4A90A4)
  },
  validationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,                       // small
    color: Colors.error,               // Red (#FF4444)
    flex: 1,
  },
  successText: {
    fontSize: 12,                       // small
    color: Colors.accent3,             // Teal (#4A90A4)
    flex: 1,
  },
  charCount: {
    fontSize: 12,                       // small
    color: Colors.secondaryText,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,                             // 8 × 1 (tight)
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                             // 8 × 1 (tight)
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 10,
    borderRadius: 24,                   // Pill
    borderWidth: 1,
    borderColor: Colors.gray.light,
    backgroundColor: Colors.white,
    minHeight: 40,                      // 8 × 5
  },
  categoryChipText: {
    fontSize: 14,                       // caption
    fontWeight: '500',                  // medium
    color: Colors.primaryText,
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  toggle: {
    width: 48,                          // 8 × 6
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray.light,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.accent3,   // Teal
  },
  toggleThumb: {
    width: 24,                          // 8 × 3
    height: 24,                         // 8 × 3
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  helperText: {
    fontSize: 12,                       // small
    color: Colors.secondaryText,
    marginTop: 4,
  },
  datePickerContainer: {
    marginTop: 16,                      // 8 × 2 (base)
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                             // 8 × 1 (tight)
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: 12,
    paddingHorizontal: 16,             // 8 × 2 (base)
    paddingVertical: 12,
    minHeight: 48,                      // 8 × 6 (touch target)
  },
  dateButtonText: {
    fontSize: 16,                       // body
    color: Colors.primaryText,
  },
  dateAdjustRow: {
    flexDirection: 'row',
    gap: 8,                             // 8 × 1 (tight)
    marginTop: 8,                       // 8 × 1 (tight)
  },
  dateAdjustButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,                // 8 × 1 (tight)
    borderRadius: 8,
    backgroundColor: Colors.gray.light,
    minHeight: 36,
  },
  dateAdjustText: {
    fontSize: 12,                       // small
    fontWeight: '500',                  // medium
    color: Colors.primaryText,
  },
  footer: {
    padding: 16,                        // 8 × 2 (base)
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
    backgroundColor: Colors.white,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,                             // 8 × 1 (tight)
    backgroundColor: Colors.accent1,   // Purple CTA (#B771E5)
    borderRadius: 16,
    minHeight: 56,                      // 8 × 7 (primary button)
    paddingVertical: 16,               // 8 × 2 (base)
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,                       // body
    fontWeight: '700',                  // bold
  },
});

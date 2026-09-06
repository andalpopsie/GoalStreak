import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { TimerConfig, TimerConfigForm, TimerConfigModalProps } from '../../types/timer';
import { validateTimerForm, timerConfigToForm } from '../../utils/timerValidation';
import { TIMER_CONSTANTS } from '../../constants/timer';
import Button from '../common/Button';
import SimpleInput from '../common/SimpleInput';

export default function TimerConfigModal({
  habit,
  isVisible,
  initialConfig,
  onSave,
  onCancel,
}: TimerConfigModalProps) {
  const [form, setForm] = useState<TimerConfigForm>({
    enabled: false,
    hours: 0,
    minutes: 25, // Default to 25 minutes (Pomodoro)
    autoComplete: true,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with existing config or defaults
  useEffect(() => {
    if (initialConfig) {
      setForm(timerConfigToForm(initialConfig));
    } else {
      setForm({
        enabled: false,
        hours: 0,
        minutes: 25,
        autoComplete: true,
      });
    }
  }, [initialConfig, isVisible]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrors([]);

    try {
      // Enhanced validation with better error messages
      const validation = validateTimerForm(form);

      if (!validation.isValid) {
        const errorMessages = validation.errors.map((error) => {
          // Provide more user-friendly error messages
          switch (error.code) {
            case 'INVALID_HOURS':
              return 'Please enter a valid number of hours (0-23)';
            case 'INVALID_MINUTES':
              return 'Please enter a valid number of minutes (0-59)';
            case 'DURATION_TOO_SHORT':
              return 'Timer must be at least 1 minute long';
            case 'DURATION_TOO_LONG':
              return 'Timer cannot be longer than 24 hours';
            default:
              return error.message;
          }
        });

        setErrors(errorMessages);
        setIsSaving(false);
        return;
      }

      if (!validation.sanitizedData) {
        setErrors(['Invalid timer configuration. Please check your inputs.']);
        setIsSaving(false);
        return;
      }

      // Additional validation for edge cases
      const totalMinutes = form.hours * 60 + form.minutes;
      if (form.enabled && totalMinutes === 0) {
        setErrors(['Please set a timer duration when timer is enabled']);
        setIsSaving(false);
        return;
      }

      const timerConfig: TimerConfig = {
        enabled: validation.sanitizedData.enabled!,
        durationMinutes: validation.sanitizedData.durationMinutes!,
        autoComplete: validation.sanitizedData.autoComplete!,
        createdAt: validation.sanitizedData.createdAt,
        updatedAt: validation.sanitizedData.updatedAt,
      };

      await onSave(timerConfig);

      // Success feedback
    } catch (error: any) {
      console.error('Error saving timer config:', error);

      // Enhanced error handling with specific error types
      let errorMessage = 'Failed to save timer configuration';

      if (error.name === 'INVALID_DURATION') {
        errorMessage =
          'Invalid timer duration. Please choose a duration between 1 minute and 24 hours.';
      } else if (error.name === 'TIMER_ALREADY_ACTIVE') {
        errorMessage =
          'Cannot modify timer settings while timer is active. Please stop the timer first.';
      } else if (error.name === 'STORAGE_QUOTA_EXCEEDED') {
        errorMessage =
          'Unable to save timer settings due to storage limitations. Please free up some space.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show error in both state and alert for better UX
      setErrors([errorMessage]);

      // Only show alert for critical errors
      if (error.name === 'STORAGE_QUOTA_EXCEEDED' || error.name === 'TIMER_PERSISTENCE_FAILED') {
        Alert.alert('Error', errorMessage, [
          { text: 'OK', style: 'default' },
          { text: 'Retry', style: 'default', onPress: () => handleSave() },
        ]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setErrors([]);
    onCancel();
  };

  const handleToggleEnabled = () => {
    setForm((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleHoursChange = (text: string) => {
    const hours = parseInt(text) || 0;
    setForm((prev) => ({ ...prev, hours: Math.max(0, Math.min(23, hours)) }));
  };

  const handleMinutesChange = (text: string) => {
    const minutes = parseInt(text) || 0;
    setForm((prev) => ({ ...prev, minutes: Math.max(0, Math.min(59, minutes)) }));
  };

  const handleQuickDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    setForm((prev) => ({ ...prev, hours, minutes: remainingMinutes }));
  };

  const totalMinutes = form.hours * 60 + form.minutes;
  const isValidDuration =
    totalMinutes >= TIMER_CONSTANTS.MIN_DURATION_MINUTES &&
    totalMinutes <= TIMER_CONSTANTS.MAX_DURATION_MINUTES;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Timer Settings</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isSaving || !isValidDuration}
          >
            <Text
              style={[styles.saveText, (!isValidDuration || isSaving) && styles.saveTextDisabled]}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Habit Info */}
          {habit && (
            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={styles.habitDescription}>
                Add a timer to track time spent on this habit
              </Text>
            </View>
          )}

          {/* Timer Toggle */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.toggleContainer} onPress={handleToggleEnabled}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Enable Timer</Text>
                <Text style={styles.toggleDescription}>
                  Track time spent on this habit with a visual countdown
                </Text>
              </View>
              <View style={[styles.toggle, form.enabled && styles.toggleActive]}>
                {form.enabled && <Ionicons name="checkmark" size={16} color={Colors.white} />}
              </View>
            </TouchableOpacity>
          </View>

          {form.enabled && (
            <>
              {/* Duration Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Duration</Text>
                <Text style={styles.sectionDescription}>
                  Set how long you want to spend on this habit
                </Text>

                <View style={styles.durationContainer}>
                  <View style={styles.durationInput}>
                    <SimpleInput
                      label="Hours"
                      placeholder="0"
                      value={form.hours.toString()}
                      onChangeText={handleHoursChange}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.durationSeparator}>
                    <Text style={styles.durationSeparatorText}>:</Text>
                  </View>
                  <View style={styles.durationInput}>
                    <SimpleInput
                      label="Minutes"
                      placeholder="25"
                      value={form.minutes.toString()}
                      onChangeText={handleMinutesChange}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Duration Validation */}
                {!isValidDuration && totalMinutes > 0 && (
                  <Text style={styles.validationText}>
                    Duration must be between {TIMER_CONSTANTS.MIN_DURATION_MINUTES} minute and{' '}
                    {TIMER_CONSTANTS.MAX_DURATION_MINUTES / 60} hours
                  </Text>
                )}

                {/* Total Duration Display */}
                {isValidDuration && (
                  <View style={styles.totalDuration}>
                    <Text style={styles.totalDurationText}>
                      Total: {totalMinutes} minute{totalMinutes !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Duration Buttons */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Select</Text>
                <View style={styles.quickDurationContainer}>
                  {TIMER_CONSTANTS.ALLOWED_INCREMENTS.slice(0, 8).map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      style={[
                        styles.quickDurationButton,
                        totalMinutes === minutes && styles.quickDurationButtonSelected,
                      ]}
                      onPress={() => handleQuickDuration(minutes)}
                    >
                      <Text
                        style={[
                          styles.quickDurationText,
                          totalMinutes === minutes && styles.quickDurationTextSelected,
                        ]}
                      >
                        {minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Auto-Complete Setting */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.toggleContainer}
                  onPress={() => setForm((prev) => ({ ...prev, autoComplete: !prev.autoComplete }))}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>Auto-complete habit</Text>
                    <Text style={styles.toggleDescription}>
                      Automatically mark habit as complete when timer finishes
                    </Text>
                  </View>
                  <View style={[styles.toggle, form.autoComplete && styles.toggleActive]}>
                    {form.autoComplete && (
                      <Ionicons name="checkmark" size={16} color={Colors.white} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <View style={styles.errorContainer}>
              {errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isSaving ? 'Saving...' : 'Save Timer Settings'}
              onPress={handleSave}
              loading={isSaving}
              disabled={!isValidDuration}
              variant="primary"
              size="lg"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  saveButton: {
    padding: Spacing.sm,
  },
  saveText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.semibold,
  },
  saveTextDisabled: {
    color: Colors.gray.medium,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  habitInfo: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  habitName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  habitDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  toggleDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
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
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  durationInput: {
    flex: 1,
  },
  durationSeparator: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  durationSeparatorText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  validationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  totalDuration: {
    backgroundColor: Colors.accent1 + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  totalDurationText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.medium,
  },
  quickDurationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickDurationButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    minWidth: 60,
    alignItems: 'center',
  },
  quickDurationButtonSelected: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1,
  },
  quickDurationText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.medium,
  },
  quickDurationTextSelected: {
    color: Colors.white,
  },
  errorContainer: {
    backgroundColor: Colors.error + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});

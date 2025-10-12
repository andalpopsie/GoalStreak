import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface TimePickerProps {
  selectedHour: number;
  selectedMinute: number;
  selectedPeriod: 'AM' | 'PM';
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onPeriodChange: (period: 'AM' | 'PM') => void;
}

export default function TimePicker({
  selectedHour,
  selectedMinute,
  selectedPeriod,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}: TimePickerProps) {
  return (
    <View style={styles.timePickerRow}>
      {/* Hour Picker */}
      <View style={styles.pickerColumn}>
        <Text style={styles.pickerTitle}>Hour</Text>
        <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.pickerOption,
                selectedHour === hour && styles.pickerOptionSelected
              ]}
              onPress={() => onHourChange(hour)}
              accessibilityRole="button"
              accessibilityLabel={`Select hour ${hour}`}
              accessibilityState={{ selected: selectedHour === hour }}
            >
              <Text style={[
                styles.pickerText,
                selectedHour === hour && styles.pickerTextSelected
              ]}>
                {hour}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Minute Picker */}
      <View style={styles.pickerColumn}>
        <Text style={styles.pickerTitle}>Min</Text>
        <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
            <TouchableOpacity
              key={minute}
              style={[
                styles.pickerOption,
                selectedMinute === minute && styles.pickerOptionSelected
              ]}
              onPress={() => onMinuteChange(minute)}
              accessibilityRole="button"
              accessibilityLabel={`Select minute ${minute.toString().padStart(2, '0')}`}
              accessibilityState={{ selected: selectedMinute === minute }}
            >
              <Text style={[
                styles.pickerText,
                selectedMinute === minute && styles.pickerTextSelected
              ]}>
                {minute.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* AM/PM Picker */}
      <View style={styles.pickerColumn}>
        <Text style={styles.pickerTitle}>Period</Text>
        <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
          {['AM', 'PM'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.pickerOption,
                selectedPeriod === period && styles.pickerOptionSelected
              ]}
              onPress={() => onPeriodChange(period as 'AM' | 'PM')}
              accessibilityRole="button"
              accessibilityLabel={`Select ${period}`}
              accessibilityState={{ selected: selectedPeriod === period }}
            >
              <Text style={[
                styles.pickerText,
                selectedPeriod === period && styles.pickerTextSelected
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  pickerTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  picker: {
    maxHeight: 100,
    backgroundColor: Colors.accent1,
    borderRadius: BorderRadius.md,
  },
  pickerOption: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primary,
  },
  pickerText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
  },
  pickerTextSelected: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
});
// NotificationSetup Component - DROPDOWN VERSION with 8pt Grid System
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface NotificationSetupProps {
  onComplete: (enabled: boolean, hour: number, minute: number) => void;
  onSkip: () => void;
}

interface TimeOption {
  label: string;
  hour: number;
  minute: number;
}

const generateTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 22 && minute > 0) break;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const displayMinute = minute.toString().padStart(2, '0');
      options.push({
        label: `${displayHour}:${displayMinute} ${period}`,
        hour,
        minute,
      });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export default function NotificationSetup({ onComplete, onSkip }: NotificationSetupProps) {
  const [enabled, setEnabled] = useState(true);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  console.log('🎯 NotificationSetup - 8pt Grid Version');

  const getSelectedTimeLabel = () => {
    const period = selectedHour >= 12 ? 'PM' : 'AM';
    const displayHour = selectedHour > 12 ? selectedHour - 12 : selectedHour === 0 ? 12 : selectedHour;
    const displayMinute = selectedMinute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleContinue = () => {
    onComplete(enabled, selectedHour, selectedMinute);
  };

  const handleTimeSelect = (option: TimeOption) => {
    setSelectedHour(option.hour);
    setSelectedMinute(option.minute);
    setShowPicker(false);
  };

  const isSelected = (option: TimeOption) => {
    return option.hour === selectedHour && option.minute === selectedMinute;
  };

  const renderTimeOption = ({ item }: { item: TimeOption }) => {
    const selected = isSelected(item);
    return (
      <TouchableOpacity
        style={[styles.timeOption, selected && styles.timeOptionSelected]}
        onPress={() => handleTimeSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.timeOptionText, selected && styles.timeOptionTextSelected]}>
          {item.label}
        </Text>
        {selected && <Ionicons name="checkmark-circle" size={24} color={Colors.white} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={60} color={Colors.accent1} />
          </View>
          <Text style={styles.title}>Stay on Track</Text>
          <Text style={styles.subtitle}>Tap the time selector below to choose your reminder time</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.toggleContainer}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Ionicons name={enabled ? "notifications" : "notifications-off"} size={24} color={enabled ? Colors.accent1 : Colors.gray.medium} />
              <Text style={styles.toggleText}>Enable Daily Reminders</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: Colors.gray.light, true: Colors.accent1 }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.gray.light}
            />
          </View>
        </Animated.View>

        {enabled && (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.timePickerContainer}>
            <Text style={styles.timeLabel}>Reminder Time</Text>
            <TouchableOpacity style={styles.timeSelector} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
              <View style={styles.timeSelectorContent}>
                <Ionicons name="time-outline" size={24} color={Colors.accent1} />
                <Text style={styles.timeText}>{getSelectedTimeLabel()}</Text>
              </View>
              <Ionicons name="chevron-down" size={24} color={Colors.gray.medium} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(400)} style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Why enable reminders?</Text>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.accent3} />
            <Text style={styles.benefitText}>Never miss a day</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.accent3} />
            <Text style={styles.benefitText}>Build consistency</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.accent3} />
            <Text style={styles.benefitText}>Stay motivated</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(500)} style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={22} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={showPicker} transparent={true} animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Time</Text>
              <View style={{ width: 60 }} />
            </View>
            <FlatList
              data={TIME_OPTIONS}
              renderItem={renderTimeOption}
              keyExtractor={(item) => `${item.hour}:${item.minute}`}
              style={styles.timeList}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Styles following 8pt Grid System
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 64,                              // 8 * 8
    right: Spacing.base,                  // 16px
    zIndex: 10,
    padding: Spacing.tight,               // 8px
    minHeight: 48,                        // Touch target
  },
  skipButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,   // 16px
    color: Colors.accent2,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,      // 16px
    paddingTop: 96,                       // 8 * 12
    paddingBottom: 120,                   // 8 * 15
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.spacious,       // 48px
  },
  iconContainer: {
    width: 120,                           // 8 * 15
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent1 + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.comfortable,    // 24px
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.heading, // 24px
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.tight,          // 8px
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,   // 16px
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: 24,                       // 16 * 1.5
    paddingHorizontal: Spacing.base,      // 16px
  },
  toggleContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,                     // 8 * 2
    padding: Spacing.base,                // 16px
    marginBottom: Spacing.comfortable,    // 24px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,                        // Touch target
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.tight,                   // 8px
    flex: 1,
  },
  toggleText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.subheading, // 20px
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  timePickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,                     // 8 * 2
    padding: Spacing.base,                // 16px
    marginBottom: Spacing.comfortable,    // 24px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timeLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.caption, // 14px
    fontWeight: Typography.fontWeight.medium,
    color: Colors.gray.dark,
    marginBottom: Spacing.tight,          // 8px
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.base,                // 16px
    minHeight: 56,                        // 8 * 7 (touch target)
    borderWidth: 2,
    borderColor: Colors.accent1 + '40',
  },
  timeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.tight,                   // 8px
  },
  timeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.subheading, // 20px
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent1,
  },
  benefitsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,                     // 8 * 2
    padding: Spacing.base,                // 16px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitsTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.subheading, // 20px
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.base,           // 16px
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.tight,                   // 8px
    marginBottom: Spacing.tight,          // 8px
    minHeight: 32,                        // 8 * 4
  },
  benefitText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,   // 16px
    color: Colors.gray.dark,
    lineHeight: 24,                       // 16 * 1.5
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,                // 16px
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent1,
    paddingVertical: 16,                  // 8 * 2
    paddingHorizontal: Spacing.comfortable, // 24px
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.tight,                   // 8px
    minHeight: 56,                        // 8 * 7 (touch target)
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.subheading, // 20px
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,      // 16px
    paddingVertical: Spacing.base,        // 16px
    minHeight: 56,                        // 8 * 7
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.subheading, // 20px
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  modalCancelText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,   // 16px
    color: Colors.gray.dark,
  },
  timeList: {
    maxHeight: 400,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,        // 16px
    paddingHorizontal: Spacing.comfortable, // 24px
    minHeight: 56,                        // 8 * 7 (touch target)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  timeOptionSelected: {
    backgroundColor: Colors.accent1,
  },
  timeOptionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.subheading, // 20px
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  timeOptionTextSelected: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
});

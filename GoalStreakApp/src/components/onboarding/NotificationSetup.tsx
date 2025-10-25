// NotificationSetup Component - Onboarding notification preferences
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NotificationSetupProps {
  onComplete: (enabled: boolean, hour: number, minute: number) => void;
  onSkip: () => void;
}

// Generate time options (every 30 minutes)
const generateTimeOptions = () => {
  const options: { hour: number; minute: number; label: string }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      options.push({ hour, minute, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export default function NotificationSetup({ onComplete, onSkip }: NotificationSetupProps) {
  const [enabled, setEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState(
    TIME_OPTIONS.findIndex(t => t.hour === 9 && t.minute === 0) // Default 9:00 AM
  );

  const handleContinue = () => {
    const time = TIME_OPTIONS[selectedTime];
    onComplete(enabled, time.hour, time.minute);
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <Animated.View 
          entering={FadeInUp.delay(200)}
          style={[styles.iconContainer, { backgroundColor: Colors.accent1 + '20' }]}
        >
          <Ionicons name="notifications" size={64} color={Colors.accent1} />
        </Animated.View>

        {/* Title */}
        <Animated.Text 
          entering={FadeInUp.delay(400)}
          style={styles.title}
        >
          Stay Motivated Daily
        </Animated.Text>

        {/* Description */}
        <Animated.Text 
          entering={FadeInUp.delay(500)}
          style={styles.description}
        >
          Get a daily motivational message to keep you inspired and on track with your habits
        </Animated.Text>

        {/* Enable/Disable Toggle */}
        <Animated.View 
          entering={FadeInUp.delay(600)}
          style={styles.toggleContainer}
        >
          <TouchableOpacity
            style={[
              styles.toggleButton,
              enabled && styles.toggleButtonActive
            ]}
            onPress={() => setEnabled(true)}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color={enabled ? Colors.white : Colors.gray.medium} 
            />
            <Text style={[
              styles.toggleText,
              enabled && styles.toggleTextActive
            ]}>
              Yes, motivate me!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              !enabled && styles.toggleButtonActive
            ]}
            onPress={() => setEnabled(false)}
          >
            <Ionicons 
              name="close-circle" 
              size={24} 
              color={!enabled ? Colors.white : Colors.gray.medium} 
            />
            <Text style={[
              styles.toggleText,
              !enabled && styles.toggleTextActive
            ]}>
              No thanks
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Time Picker (only show if enabled) */}
        {enabled && (
          <Animated.View 
            entering={FadeInUp.delay(700)}
            style={styles.timePickerContainer}
          >
            <Text style={styles.timePickerLabel}>Choose your reminder time:</Text>
            
            <ScrollView 
              style={styles.timeScroller}
              showsVerticalScrollIndicator={false}
            >
              {TIME_OPTIONS.map((time, index) => (
                <TouchableOpacity
                  key={`${time.hour}-${time.minute}`}
                  style={[
                    styles.timeOption,
                    selectedTime === index && styles.timeOptionSelected
                  ]}
                  onPress={() => setSelectedTime(index)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    selectedTime === index && styles.timeOptionTextSelected
                  ]}>
                    {time.label}
                  </Text>
                  {selectedTime === index && (
                    <Ionicons name="checkmark" size={20} color={Colors.white} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Benefits */}
        <Animated.View 
          entering={FadeInUp.delay(800)}
          style={styles.benefitsContainer}
        >
          <View style={styles.benefitItem}>
            <Ionicons name="time" size={20} color={Colors.accent1} />
            <Text style={styles.benefitText}>Daily reminder at your chosen time</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="heart" size={20} color={Colors.accent1} />
            <Text style={styles.benefitText}>Encouraging messages to keep you going</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="settings" size={20} color={Colors.accent1} />
            <Text style={styles.benefitText}>Change anytime in settings</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Continue Button */}
      <Animated.View 
        entering={FadeInDown.delay(900)}
        style={styles.footer}
      >
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={24} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white + '90',
    borderRadius: 20,
  },
  skipText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 120,
    paddingBottom: 120,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 18,
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray.light,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  toggleButtonActive: {
    borderColor: Colors.accent1,
    backgroundColor: Colors.accent1,
  },
  toggleText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gray.dark,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  timePickerContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  timePickerLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  timeScroller: {
    maxHeight: 200,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.sm,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.white,
  },
  timeOptionSelected: {
    backgroundColor: Colors.accent1,
  },
  timeOptionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
  },
  timeOptionTextSelected: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  benefitText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 50,
    paddingTop: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light + '40',
  },
  continueButton: {
    backgroundColor: Colors.accent1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    minWidth: 200,
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

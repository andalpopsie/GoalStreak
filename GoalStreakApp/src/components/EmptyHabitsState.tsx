import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/theme';

interface EmptyHabitsStateProps {
  onCreateHabit: () => void;
}

export default function EmptyHabitsState({ onCreateHabit }: EmptyHabitsStateProps) {
  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(600)}>
      {/* Illustration */}
      <Animated.View 
        style={styles.iconContainer}
        entering={FadeInUp.delay(200).duration(500)}
      >
        <Ionicons name="rocket" size={80} color={Colors.accent1} />
      </Animated.View>

      {/* Main Message */}
      <Animated.View 
        style={styles.textContainer}
        entering={FadeInUp.delay(400).duration(500)}
      >
        <Text style={styles.title}>Ready to build great habits?</Text>
        <Text style={styles.subtitle}>
          Start your journey by creating your first habit. Small steps lead to big changes!
        </Text>
      </Animated.View>

      {/* Tips */}
      <Animated.View 
        style={styles.tipsContainer}
        entering={FadeInUp.delay(600).duration(500)}
      >
        <View style={styles.tip}>
          <Ionicons name="bulb" size={16} color={Colors.accent2} />
          <Text style={styles.tipText}>Start small - even 5 minutes counts</Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="calendar" size={16} color={Colors.accent2} />
          <Text style={styles.tipText}>Consistency beats perfection</Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="trending-up" size={16} color={Colors.accent2} />
          <Text style={styles.tipText}>Track your progress daily</Text>
        </View>
      </Animated.View>

      {/* Call to Action */}
      <Animated.View 
        style={styles.ctaContainer}
        entering={FadeInUp.delay(800).duration(500)}
      >
        <TouchableOpacity style={styles.createButton} onPress={onCreateHabit}>
          <Ionicons name="add-circle" size={24} color={Colors.white} />
          <Text style={styles.createButtonText}>Create Your First Habit</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.5,
  },
  tipsContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryText,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: Colors.accent1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 25,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
});

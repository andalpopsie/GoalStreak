// MilestoneCelebration Component - Celebrates achievements with confetti
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors, Typography, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Milestone {
  type: 'completion' | 'streak' | 'achievement';
  value: number;
  title: string;
  message: string;
  icon: string;
  color: string;
}

interface MilestoneCelebrationProps {
  visible: boolean;
  milestone: Milestone | null;
  onClose: () => void;
}

export default function MilestoneCelebration({
  visible,
  milestone,
  onClose,
}: MilestoneCelebrationProps) {
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible && confettiRef.current) {
      // Trigger confetti after a short delay
      setTimeout(() => {
        confettiRef.current?.start();
      }, 300);
    }
  }, [visible]);

  if (!milestone) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Confetti */}
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
          autoStart={false}
          fadeOut
          fallSpeed={2500}
          colors={[Colors.accent1, Colors.accent2, Colors.accent3, '#FF9013', '#48B3AF', '#A7E399']}
        />

        {/* Celebration Card */}
        <Animated.View
          entering={ZoomIn.delay(200).duration(600)}
          exiting={FadeOut.duration(300)}
          style={styles.card}
        >
          {/* Icon */}
          <Animated.View
            entering={ZoomIn.delay(400).duration(600)}
            style={[styles.iconContainer, { backgroundColor: milestone.color + '20' }]}
          >
            <Ionicons name={milestone.icon as any} size={64} color={milestone.color} />
          </Animated.View>

          {/* Title */}
          <Animated.Text entering={FadeIn.delay(600)} style={styles.title}>
            {milestone.title}
          </Animated.Text>

          {/* Value */}
          <Animated.View entering={ZoomIn.delay(700).duration(500)} style={styles.valueContainer}>
            <Text style={[styles.value, { color: milestone.color }]}>{milestone.value}</Text>
            <Text style={styles.valueLabel}>
              {milestone.type === 'completion' && 'Completions'}
              {milestone.type === 'streak' && 'Day Streak'}
              {milestone.type === 'achievement' && 'Achievement'}
            </Text>
          </Animated.View>

          {/* Message */}
          <Animated.Text entering={FadeIn.delay(800)} style={styles.message}>
            {milestone.message}
          </Animated.Text>

          {/* Close Button */}
          <Animated.View entering={FadeIn.delay(1000)}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: milestone.color }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Awesome!</Text>
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  value: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.black,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: 56,
  },
  valueLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: Typography.fontSize.lg * 1.5,
    marginBottom: Spacing.xl,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  closeButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
});

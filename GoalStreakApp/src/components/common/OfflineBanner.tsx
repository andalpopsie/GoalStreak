import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface OfflineBannerProps {
  isVisible: boolean;
}

export default function OfflineBanner({ isVisible }: OfflineBannerProps) {
  if (!isVisible) return null;

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
    >
      <Ionicons name="cloud-offline" size={16} color={Colors.white} />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  text: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.xs,
  },
});

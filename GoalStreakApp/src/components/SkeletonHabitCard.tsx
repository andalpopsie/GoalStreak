import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';

export default function SkeletonHabitCard() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, animatedStyle]} />
      <Animated.View style={[styles.textLine, animatedStyle]} />
      <Animated.View style={[styles.textLineSmall, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray.light,
    marginBottom: Spacing.md,
  },
  textLine: {
    width: '80%',
    height: 14,
    backgroundColor: Colors.gray.light,
    borderRadius: 7,
    marginBottom: Spacing.xs,
  },
  textLineSmall: {
    width: '60%',
    height: 12,
    backgroundColor: Colors.gray.light,
    borderRadius: 6,
  },
});

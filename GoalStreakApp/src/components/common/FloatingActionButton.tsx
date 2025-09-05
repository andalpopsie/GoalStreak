import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Shadows } from '../../constants/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function FloatingActionButton({
  onPress,
  icon = 'add',
  size = 24,
  color = Colors.white,
  backgroundColor = Colors.accent1,
  style,
  disabled = false,
}: FloatingActionButtonProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePress = () => {
    if (disabled) return;

    // Scale and rotation animation
    scale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    
    rotation.value = withSequence(
      withSpring(15, { damping: 15, stiffness: 300 }),
      withSpring(0, { damping: 15, stiffness: 300 })
    );

    // Haptic feedback
    runOnJS(triggerHapticFeedback)();
    
    // Call the onPress function
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
    };
  });

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.container,
        { backgroundColor },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Add new habit"
      accessibilityHint="Double tap to create a new habit"
    >
      <Ionicons name={icon} size={size} color={color} />
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
    shadowColor: Colors.primaryText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 2,
  },
});
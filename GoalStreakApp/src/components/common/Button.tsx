import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ButtonProps } from '../../types';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    (disabled || loading) && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
  ];

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID="button"
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.primaryText}
          size="small"
          testID="loading-indicator"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 32, // Fully rounded (pill-shaped)
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  // Variants
  primary: {
    backgroundColor: Colors.accent1,
  },
  secondary: {
    backgroundColor: Colors.accent2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.accent1,
  },

  // Sizes (Fitts's Law - larger touch targets)
  sm: {
    paddingHorizontal: 16, // 8 * 2
    paddingVertical: 12, // 8 * 1.5
    minHeight: 48, // 8 * 6 (minimum touch target)
  },
  md: {
    paddingHorizontal: 24, // 8 * 3
    paddingVertical: 16, // 8 * 2
    minHeight: 56, // 8 * 7 (recommended)
  },
  lg: {
    paddingHorizontal: 32, // 8 * 4
    paddingVertical: 20, // 8 * 2.5
    minHeight: 64, // 8 * 8 (optimal)
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: '600', // semibold
    textAlign: 'center',
  },

  // Text variants
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.accent1,
  },

  // Text sizes (simplified scale)
  smText: {
    fontSize: 14, // caption
  },
  mdText: {
    fontSize: 16, // body
  },
  lgText: {
    fontSize: 16, // body (use weight for hierarchy)
  },

  // Disabled text
  disabledText: {
    opacity: 0.7,
  },
});

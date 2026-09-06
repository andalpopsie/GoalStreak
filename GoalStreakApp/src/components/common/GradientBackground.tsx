import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'subtle' | 'warm';
}

export default function GradientBackground({
  children,
  style,
  variant = 'default',
}: GradientBackgroundProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'subtle':
        return '#F8F9FA';
      case 'warm':
        return '#FFF9F5';
      default:
        return Colors.background;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

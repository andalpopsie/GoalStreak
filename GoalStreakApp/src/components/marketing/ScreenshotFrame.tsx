import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ScreenshotFrameProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  variant?: 'gradient' | 'solid' | 'minimal';
  accentColor?: string;
}

export default function ScreenshotFrame({ 
  title, 
  subtitle, 
  children, 
  variant = 'gradient',
  accentColor = Colors.accent1 
}: ScreenshotFrameProps) {
  
  const renderBackground = () => {
    switch (variant) {
      case 'gradient':
        return (
          <LinearGradient
            colors={[accentColor + '20', Colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        );
      case 'solid':
        return (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />
        );
      case 'minimal':
      default:
        return (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.white }]} />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderBackground()}
      
      {/* Header with title and subtitle */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Footer with app branding */}
      <View style={styles.footer}>
        <View style={styles.brandContainer}>
          <View style={[styles.brandIcon, { backgroundColor: accentColor }]}>
            <Text style={styles.brandIconText}>G</Text>
          </View>
          <Text style={styles.brandText}>GoalStreak</Text>
        </View>
      </View>
    </View>
  );
}

// Pre-configured screenshot variants for different features
export const HabitTrackingScreenshot = ({ children }: { children: React.ReactNode }) => (
  <ScreenshotFrame
    title="Track Your Progress"
    subtitle="Beautiful visual progress tracking with streaks"
    variant="gradient"
    accentColor={Colors.accent1}
  >
    {children}
  </ScreenshotFrame>
);

export const SocialScreenshot = ({ children }: { children: React.ReactNode }) => (
  <ScreenshotFrame
    title="Stay Accountable"
    subtitle="Connect with friends for motivation and support"
    variant="gradient"
    accentColor={Colors.accent2}
  >
    {children}
  </ScreenshotFrame>
);

export const AnalyticsScreenshot = ({ children }: { children: React.ReactNode }) => (
  <ScreenshotFrame
    title="Insights & Analytics"
    subtitle="Understand your habits with detailed analytics"
    variant="gradient"
    accentColor={Colors.accent3}
  >
    {children}
  </ScreenshotFrame>
);

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenHeight,
    position: 'relative',
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 18,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 60,
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  brandIconText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  brandText: {
    ...Typography.h4,
    color: Colors.primaryText,
  },
});
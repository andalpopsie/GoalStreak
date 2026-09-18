/**
 * FoundingCelebrationScreen
 *
 * Shown once, immediately after signup, when the user has been assigned a
 * founding slot (R9.1). Displays the founding number prominently and
 * auto-dismisses after 8 seconds (R9.5). The user can also tap anywhere to
 * dismiss early. Both paths navigate to the normal post-signup screen ('Main').
 *
 * The screen may receive `foundingNumber` via nav params when the number is
 * already known at push time (R9.2). If the record is still resolving when
 * onboarding completes, callers can push this screen without the param and the
 * screen will await the record via `useFoundingMember` (R9.4).
 *
 * This screen must NEVER be pushed for non-founding accounts (R9.1, R9.3).
 * That invariant is enforced by Task 20 (the post-signup flow wiring).
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { Colors, Typography, Spacing, Layout } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFoundingMember } from '../hooks/useFoundingMember';
import { RootStackParamList } from '../types';
import FoundingBadge from '../components/common/FoundingBadge';

// ---------------------------------------------------------------------------
// Navigation types
// ---------------------------------------------------------------------------

type CelebrationNavigationProp = StackNavigationProp<RootStackParamList, 'FoundingCelebration'>;
type CelebrationRouteProp = RouteProp<RootStackParamList, 'FoundingCelebration'>;

interface Props {
  navigation: CelebrationNavigationProp;
  route: CelebrationRouteProp;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Auto-dismiss after 8 seconds (R9.5). */
const AUTO_DISMISS_MS = 8_000;

/** Font size for the large hero number — intentionally larger than the heading
 *  scale (24) for a celebratory "hero" feel. Annotated with 8pt reasoning. */
const HERO_NUMBER_SIZE = 96; // 8 × 12

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FoundingCelebrationScreen({ navigation, route }: Props) {
  const { user } = useAuth();

  // The foundingNumber may be passed via nav params when known at push time (R9.2).
  // If not yet available the hook below will resolve it (R9.4).
  const paramNumber: number | undefined = route.params?.foundingNumber;

  // Subscribe to the profile so the number is always fresh. If the param is
  // already present the hook still runs but the param takes precedence until the
  // snapshot arrives (consistent read). (R9.4)
  const { foundingNumber: hookNumber, loading } = useFoundingMember(user?.id ?? '');

  // Use param if present; fall back to what the hook resolves.
  const foundingNumber: number | null = paramNumber ?? hookNumber;

  // ---------------------------------------------------------------------------
  // Fade-in animation
  // ---------------------------------------------------------------------------
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ---------------------------------------------------------------------------
  // Auto-dismiss + cleanup
  // ---------------------------------------------------------------------------
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didDismissRef = useRef(false);

  const dismiss = useCallback(() => {
    if (didDismissRef.current) return;
    didDismissRef.current = true;

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    // Navigate to the normal post-signup screen (R9.5).
    // 'Main' renders MainStackNavigator → MainTabNavigator (Home + tabs).
    navigation.replace('Main');
  }, [navigation]);

  useEffect(() => {
    dismissTimerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [dismiss]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TouchableWithoutFeedback
      onPress={dismiss}
      accessibilityRole="button"
      accessibilityLabel="Dismiss celebration screen"
      accessibilityHint="Double tap to continue to the app"
    >
      {/* SafeAreaView is a View under the hood so TouchableWithoutFeedback wraps it correctly */}
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* ── Star decoration ────────────────────────────────────────── */}
          <Text style={styles.starDecoration} accessibilityElementsHidden>
            ★
          </Text>

          {/* ── Hero founding number ────────────────────────────────────── */}
          {foundingNumber != null && (
            <View style={styles.heroNumberContainer}>
              <Text style={styles.heroNumberHash} accessibilityElementsHidden>
                #
              </Text>
              <Text style={styles.heroNumber} accessible={false}>
                {foundingNumber}
              </Text>
            </View>
          )}

          {/* Show a subtle placeholder while the snapshot is loading and no
              param was provided yet — avoids layout jump (R9.4). */}
          {foundingNumber == null && loading && <View style={styles.heroPlaceholder} />}

          {/* ── Congratulations copy ────────────────────────────────────── */}
          <Text style={styles.headline} accessible accessibilityRole="header">
            You're a Founding Member!
          </Text>

          {foundingNumber != null && (
            <Text
              style={styles.subheadline}
              accessible
              accessibilityLabel={`You are founding member number ${foundingNumber} of 100`}
            >
              {`You're #${foundingNumber} of 100`}
            </Text>
          )}

          <Text style={styles.body}>
            You get 1 year of Goalfer Pro — free. Welcome to the founding circle.
          </Text>

          {/* ── FoundingBadge preview ────────────────────────────────────── */}
          <View style={styles.badgeContainer}>
            <FoundingBadge variant="profile" foundingNumber={foundingNumber} />
          </View>

          {/* ── Dismiss hint ────────────────────────────────────────────── */}
          <Text style={styles.dismissHint}>Tap anywhere to continue</Text>
        </Animated.View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// ---------------------------------------------------------------------------
// Styles — all spacing is 8pt-grid; all colours from theme
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.accent1, // #B771E5 — purple hero (R9)
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.comfortable, // 24 — 8 × 3
    paddingVertical: Spacing.spacious, // 48 — 8 × 6
  },

  // Star decoration above the number
  starDecoration: {
    fontSize: 48, // 8 × 6 — visual decoration
    color: Colors.white,
    marginBottom: Spacing.comfortable, // 24 — 8 × 3
    opacity: 0.85,
  },

  // Hero number row: "#" prefix + big number
  heroNumberContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.comfortable, // 24 — 8 × 3
  },
  heroNumberHash: {
    fontSize: 40, // 8 × 5 — proportional prefix
    fontFamily: Typography.fontFamily.black,
    color: Colors.white,
    marginTop: 8, // 8 × 1 — optical top offset
    marginRight: 4, // 8 × 0.5 — tighten hash–number gap
    opacity: 0.85,
  },
  heroNumber: {
    fontSize: HERO_NUMBER_SIZE, // 96 — 8 × 12 custom hero scale
    fontFamily: Typography.fontFamily.black,
    color: Colors.white,
    lineHeight: HERO_NUMBER_SIZE * 1.0, // flush line height for numerals
    includeFontPadding: false,
  },

  // Placeholder keeps vertical space while loading
  heroPlaceholder: {
    height: HERO_NUMBER_SIZE, // 96
    marginBottom: Spacing.comfortable, // 24
  },

  headline: {
    fontSize: Typography.fontSize.heading, // 24
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.tight, // 8 — 8 × 1
  },

  subheadline: {
    fontSize: Typography.fontSize.subheading, // 20
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.comfortable, // 24 — 8 × 3
  },

  body: {
    fontSize: Typography.fontSize.body, // 16
    fontFamily: Typography.fontFamily.regular,
    fontWeight: '400',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: Typography.fontSize.body * Typography.lineHeight.normal, // 16 × 1.5 = 24
    opacity: 0.9,
    marginBottom: Spacing.loose, // 32 — 8 × 4
    paddingHorizontal: Spacing.base, // 16 — 8 × 2
  },

  badgeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.spacious, // 48 — 8 × 6
    minHeight: Layout.minTouchTarget, // 48 — accessibilty guard
  },

  dismissHint: {
    fontSize: Typography.fontSize.caption, // 14
    fontFamily: Typography.fontFamily.regular,
    fontWeight: '400',
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.7,
    position: 'absolute',
    bottom: Spacing.loose, // 32 — 8 × 4
  },
});

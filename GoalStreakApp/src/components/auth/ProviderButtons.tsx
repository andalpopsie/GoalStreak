// ProviderButtons — the "Continue with Apple" / "Continue with Google" controls.
//
// Presentational only: it renders the SSO buttons and reports taps upward. All
// orchestration (obtaining credentials, signing in, provisioning) lives in the
// hook layer and is wired in a later task; this component never imports useAuth.
//
// Behavior (see design §5, requirements R1 + R2):
//  - Rendered only on iOS (R1.4); on Android it renders nothing.
//  - A provider's button is omitted when that provider is unavailable (R1.5).
//  - Apple is at least as prominent as Google — equal touch-target height/width
//    and positioned above it (R1.2) — and both start unselected (R1.3).
//  - While consent is unchecked the buttons appear disabled (reduced opacity)
//    and a tap fires onBlockedPress WITHOUT starting auth (R2.1, R2.5); while
//    consent is accepted a tap calls onApple / onGoogle (R2.2).
//  - loadingProvider shows a spinner on the active button and blocks duplicate
//    presses on either button.
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { SsoProviderId } from '../../services/ssoService';
import GoogleGlyph from './GoogleGlyph';

interface ProviderButtonsProps {
  /** Consent gate: buttons are non-interactive for auth while this is false (R2.1). */
  consentAccepted: boolean;
  /** Per-provider availability; an unavailable provider's button is omitted (R1.5). */
  availability: { apple: boolean; google: boolean };
  /** Which provider (if any) has an in-flight auth request; shows a spinner. */
  loadingProvider: SsoProviderId | null;
  /** Invoked when Apple is tapped while consent is accepted (R2.2). */
  onApple: () => void;
  /** Invoked when Google is tapped while consent is accepted (R2.2). */
  onGoogle: () => void;
  /** Invoked when either button is tapped while consent is unchecked (R2.5). */
  onBlockedPress: () => void;
}

export default function ProviderButtons({
  consentAccepted,
  availability,
  loadingProvider,
  onApple,
  onGoogle,
  onBlockedPress,
}: ProviderButtonsProps) {
  // iOS-only surface: Android keeps the email/password controls only (R1.4).
  if (Platform.OS !== 'ios') {
    return null;
  }

  // Nothing to render if neither provider is available (R1.5).
  if (!availability.apple && !availability.google) {
    return null;
  }

  const anyLoading = loadingProvider !== null;

  // A tap while consent is unchecked never starts auth — it prompts instead
  // (R2.5). A tap while any provider is loading is ignored to prevent duplicate
  // requests. Otherwise the provider action runs (R2.2).
  const makePressHandler = (startAuth: () => void) => () => {
    if (anyLoading) {
      return;
    }
    if (!consentAccepted) {
      onBlockedPress();
      return;
    }
    startAuth();
  };

  return (
    <View style={styles.container} testID="provider-buttons">
      {/* Apple first so it sits at or above Google (R1.2). */}
      {availability.apple && (
        <TouchableOpacity
          style={[styles.button, styles.appleButton, !consentAccepted && styles.disabledVisual]}
          onPress={makePressHandler(onApple)}
          // Only block taps while loading; taps while consent is unchecked must
          // still register so onBlockedPress can fire (R2.5).
          disabled={anyLoading}
          activeOpacity={0.7}
          testID="sso-apple-button"
          accessible
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          accessibilityState={{
            disabled: !consentAccepted || anyLoading,
            busy: loadingProvider === 'apple.com',
          }}
        >
          {loadingProvider === 'apple.com' ? (
            <ActivityIndicator color={Colors.white} size="small" testID="sso-apple-loading" />
          ) : (
            <>
              <Ionicons name="logo-apple" size={20} color={Colors.white} style={styles.icon} />
              <Text style={[styles.buttonText, styles.appleButtonText]}>Continue with Apple</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {availability.google && (
        <TouchableOpacity
          style={[styles.button, styles.googleButton, !consentAccepted && styles.disabledVisual]}
          onPress={makePressHandler(onGoogle)}
          disabled={anyLoading}
          activeOpacity={0.7}
          testID="sso-google-button"
          accessible
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{
            disabled: !consentAccepted || anyLoading,
            busy: loadingProvider === 'google.com',
          }}
        >
          {loadingProvider === 'google.com' ? (
            <ActivityIndicator
              color={Colors.primaryText}
              size="small"
              testID="sso-google-loading"
            />
          ) : (
            <>
              <View style={styles.icon}>
                <GoogleGlyph size={18} />
              </View>
              <Text style={[styles.buttonText, styles.googleButtonText]}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.tight, // 8px between the two controls (8pt grid)
  },
  // Shared button shape. Both buttons are full-width and share the same
  // minHeight so Apple's touch target is >= Google's (equal satisfies R1.2).
  button: {
    width: '100%',
    minHeight: 56, // 8 × 7 (recommended primary touch target)
    paddingVertical: Spacing.base, // 16px
    paddingHorizontal: Spacing.comfortable, // 24px
    borderRadius: 32, // Pill shape, matching common Button.tsx
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Apple's Human Interface Guidelines require the Sign in with Apple button to
  // use Apple's own black brand color, so this is an intentional brand-mandated
  // value rather than an arbitrary hex. Colors.black is the theme's black token.
  appleButton: {
    backgroundColor: Colors.black,
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Visually distinct "cannot activate yet" state while consent is unchecked
  // (R2.1). Color is not the only signal — the accessibilityState.disabled flag
  // and the blocked-press prompt also convey it.
  disabledVisual: {
    opacity: 0.5,
  },
  // Leading brand glyph; 8px gap to the label (8pt grid, icon-label pair).
  icon: {
    marginRight: Spacing.tight, // 8px
  },
  buttonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.body, // 16px
    fontWeight: '600',
    textAlign: 'center',
  },
  appleButtonText: {
    color: Colors.white,
  },
  googleButtonText: {
    color: Colors.primaryText,
  },
});

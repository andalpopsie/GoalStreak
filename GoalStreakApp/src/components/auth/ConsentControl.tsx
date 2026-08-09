import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/theme';
import { openPrivacyPolicy, openTermsOfService } from '../../utils/linkingUtils';

interface ConsentControlProps {
  /** Whether the Terms/Privacy consent is currently accepted (controlled). */
  checked: boolean;
  /** Emits the toggled value upward; the parent owns the state (R2.1). */
  onChange: (checked: boolean) => void;
}

/**
 * Consent gate for the auth screen (R2.3, R2.4). Presentational and controlled:
 * it renders a tappable checkbox row with Terms of Service / Privacy Policy
 * links and emits toggles upward so the parent can gate the SSO buttons.
 *
 * Mirrors the existing SignUpScreen accept-row pattern (accessibilityRole
 * "checkbox", link presentation via linkingUtils).
 */
export default function ConsentControl({ checked, onChange }: ConsentControlProps) {
  return (
    <TouchableOpacity
      style={styles.acceptRow}
      onPress={() => onChange(!checked)}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel="I agree to the Terms and Privacy Policy."
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color={Colors.white} />}
      </View>
      <Text style={styles.acceptText}>
        I agree to the{' '}
        <Text
          style={styles.acceptLink}
          onPress={openTermsOfService}
          accessibilityRole="link"
        >
          Terms
        </Text>
        {' '}and{' '}
        <Text
          style={styles.acceptLink}
          onPress={openPrivacyPolicy}
          accessibilityRole="link"
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Lightweight, centered consent row placed beneath the SSO buttons. Compact
  // by design (small checkbox, caption text, muted color) so it reads as a
  // quiet footnote while remaining an explicit, tappable affirmative gate (R2).
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minHeight: 44,                    // touch target
    paddingVertical: Spacing.tight,   // 8
    marginTop: Spacing.tight,         // 8 — small gap under the SSO buttons
  },
  checkbox: {
    width: 20,                        // 8 * 2.5 (compact)
    height: 20,                       // 8 * 2.5
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.gray.medium,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.tight,       // 8
  },
  checkboxChecked: {
    backgroundColor: Colors.accent1,  // Purple CTA color
    borderColor: Colors.accent1,
  },
  acceptText: {
    flexShrink: 1,                    // hug content + wrap gracefully, stays centered
    fontSize: 13,                     // caption-small, quiet footnote
    color: Colors.gray.dark,
    lineHeight: 18,                   // ~1.4 line height
  },
  acceptLink: {
    color: Colors.accent1,
    fontWeight: '600',                // semibold
    textDecorationLine: 'underline',
  },
});

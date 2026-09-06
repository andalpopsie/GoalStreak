// Goalfer Pro Paywall Modal
//
// Single source of paywall surface for the MVP. Presented when a free user
// hits the habit creation limit (or any other Pro feature gate). Renders
// benefits, monthly / annual plan cards, a primary purchase CTA, and a
// restore-purchases link, then delegates the actual purchase / restore
// calls to the `useSubscription` hook.
//
// Design contract (see design.md > ProPaywallModal):
// - Defaults to the annual plan as the recommended option
// - Never unmounts itself on error; only `onClose` and `onSuccess` (handled
//   by the parent) dismiss the modal
// - All design tokens come from `theme.ts`; no hardcoded design values

import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  Colors,
  getCategoryBackgroundColor,
  Shadows,
  Spacing,
  Typography,
} from '../../constants/theme';

// Tinted background for the selected plan card. Derived from `accent1`
// (#B771E5) via the shared `getCategoryBackgroundColor` helper so the value
// stays in lockstep with the design system rather than being hardcoded
// here. (`Colors.accent1 === Colors.fitnessOrange`.)
const SELECTED_PLAN_TINT = getCategoryBackgroundColor('fitness');
import { useSubscription } from '../../hooks/useSubscription';
import { PRO_PRODUCT_IDS, ProProductId, PurchaseResult } from '../../types/subscription';

/**
 * Failure variant of `PurchaseResult`. Extracted as a named type so we can
 * cast a narrowed result inside an `if (!result.success)` branch — the
 * project's tsconfig disables `strictNullChecks`, which prevents TypeScript
 * from automatically narrowing discriminated unions in some contexts.
 */
type PurchaseFailure = Extract<PurchaseResult, { success: false }>;

interface ProPaywallModalProps {
  /** Controls modal visibility. */
  visible: boolean;
  /** Called when the user dismisses the modal via the close button. */
  onClose: () => void;
  /**
   * Called when a purchase or restore completes successfully and the user
   * now has the Pro entitlement. Parent should dismiss the modal and retry
   * the action that triggered the paywall.
   */
  onSuccess: () => void;
}

type PlanKey = 'monthly' | 'annual';

interface PlanDescriptor {
  key: PlanKey;
  productId: ProProductId;
  priceLabel: string;
  ctaPriceLabel: string;
  badge?: string;
}

const PLANS: Record<PlanKey, PlanDescriptor> = {
  monthly: {
    key: 'monthly',
    productId: PRO_PRODUCT_IDS.monthly,
    priceLabel: '$3.99 / month',
    ctaPriceLabel: '$3.99/month',
  },
  annual: {
    key: 'annual',
    productId: PRO_PRODUCT_IDS.annual,
    priceLabel: '$23.99 / year',
    ctaPriceLabel: '$23.99/year',
    badge: 'Save 50%',
  },
};

// Benefits actually delivered by Pro today. Keep this list honest — only
// list what a subscriber gets right now. Aspirational features go in
// COMING_SOON below (clearly labelled) to avoid App Store Guideline 2.3.1 /
// 3.1.2 issues around advertising unbuilt functionality.
const BENEFITS: ReadonlyArray<string> = ['Track up to 15 habits (6 on Free)'];

// Roadmap features — shown as "coming soon", not as included benefits.
const COMING_SOON: ReadonlyArray<string> = [
  'Streak freeze',
  'Advanced analytics & insights',
  'Custom themes & icons',
];

export default function ProPaywallModal({
  visible,
  onClose,
  onSuccess,
}: ProPaywallModalProps): React.JSX.Element {
  const subscription = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const [inlineError, setInlineError] = useState<string | null>(null);

  const isLoading = subscription.isLoading;

  const handleSelectPlan = useCallback(
    (plan: PlanKey) => {
      if (isLoading) return;
      setSelectedPlan(plan);
      setInlineError(null);
    },
    [isLoading]
  );

  const handlePurchase = useCallback(async () => {
    if (isLoading) return;
    setInlineError(null);

    const plan = PLANS[selectedPlan];
    const result = await subscription.purchase(plan.productId);

    if (result.success) {
      onSuccess();
      return;
    }

    // `result.success === false` here, but the project's tsconfig disables
    // `strictNullChecks`, which breaks automatic discriminated-union
    // narrowing. Cast explicitly so `error` and `message` are visible.
    const failure = result as PurchaseFailure;

    switch (failure.error) {
      case 'PURCHASE_CANCELLED':
        // User intentionally dismissed the StoreKit sheet; modal stays open
        // with no error message per Req 7.1.
        return;
      case 'NO_NETWORK':
        setInlineError('No internet connection. Please try again.');
        return;
      default: {
        const friendly =
          failure.message && failure.message.trim().length > 0
            ? `Purchase failed: ${failure.message}`
            : 'Purchase failed. Please try again.';
        setInlineError(friendly);
      }
    }
  }, [isLoading, onSuccess, selectedPlan, subscription]);

  const handleRestore = useCallback(async () => {
    if (isLoading) return;
    setInlineError(null);

    try {
      const restored = await subscription.restore();
      if (restored) {
        onSuccess();
        return;
      }
      setInlineError('No previous purchases found.');
    } catch {
      // The hook catches typed errors, but defend against an unexpected
      // throw and surface the network message regardless.
      setInlineError('No internet connection. Please try again.');
    }
  }, [isLoading, onSuccess, subscription]);

  const selectedCtaLabel = `Subscribe for ${PLANS[selectedPlan].ctaPriceLabel}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Close button — top-right, 48×48 touch target */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close paywall"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="close" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Text style={styles.title}>Goalfer Pro</Text>
          <Text style={styles.subtitle}>Unlock your full potential</Text>

          {/* Benefits checklist — what Pro delivers today */}
          <View style={styles.benefitsList}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.accent3}
                  style={styles.benefitIcon}
                />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Coming soon — roadmap features, clearly not part of what's
              delivered today. Muted styling + "Coming soon" label. */}
          <Text style={styles.comingSoonHeading}>Coming soon to Pro</Text>
          <View style={styles.comingSoonList}>
            {COMING_SOON.map((item) => (
              <View key={item} style={styles.benefitRow}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={Colors.secondaryText}
                  style={styles.benefitIcon}
                />
                <Text style={styles.comingSoonText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Plan cards */}
          <View style={styles.plansRow}>
            <PlanCard
              plan={PLANS.monthly}
              selected={selectedPlan === 'monthly'}
              disabled={isLoading}
              onPress={() => handleSelectPlan('monthly')}
            />
            <PlanCard
              plan={PLANS.annual}
              selected={selectedPlan === 'annual'}
              disabled={isLoading}
              onPress={() => handleSelectPlan('annual')}
            />
          </View>
        </ScrollView>

        {/* Bottom CTA + restore + inline error */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
            onPress={handlePurchase}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={selectedCtaLabel}
          >
            <Text style={styles.continueButtonText}>{selectedCtaLabel}</Text>
          </TouchableOpacity>

          {inlineError !== null && (
            <Text style={styles.inlineError} accessibilityLiveRegion="polite">
              {inlineError}
            </Text>
          )}

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
          >
            <Text style={[styles.restoreText, isLoading && styles.restoreTextDisabled]}>
              Restore purchases
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

interface PlanCardProps {
  plan: PlanDescriptor;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}

function PlanCard({ plan, selected, disabled, onPress }: PlanCardProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        selected ? styles.planCardSelected : styles.planCardUnselected,
        disabled && styles.planCardDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${plan.key === 'annual' ? 'Annual' : 'Monthly'} plan, ${plan.priceLabel}`}
      activeOpacity={0.85}
    >
      {plan.badge && (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{plan.badge}</Text>
        </View>
      )}
      <Text style={styles.planLabel}>{plan.key === 'annual' ? 'Annual' : 'Monthly'}</Text>
      <Text style={styles.planPrice}>{plan.priceLabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.base, // 16
    paddingTop: Spacing.tight, // 8
  },
  closeButton: {
    width: 48, // touch target ≥ 48px
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.comfortable, // 24
    paddingBottom: Spacing.loose, // 32
  },
  title: {
    fontSize: Typography.fontSize.heading, // 24
    fontWeight: Typography.fontWeight.bold, // '700'
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.tight, // 8
  },
  subtitle: {
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.regular, // '400'
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.tight, // 8
    marginBottom: Spacing.loose, // 32
  },
  benefitsList: {
    marginBottom: Spacing.loose, // 32
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.tight, // 8
    minHeight: Spacing.comfortable, // 24 — keeps icon + text vertically centred
  },
  benefitIcon: {
    marginRight: Spacing.base, // 16
  },
  benefitText: {
    flex: 1,
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.regular, // '400'
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.regular,
  },
  comingSoonHeading: {
    fontSize: Typography.fontSize.caption, // 14
    fontWeight: Typography.fontWeight.semibold, // '600'
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.tight, // 8
  },
  comingSoonList: {
    marginBottom: Spacing.loose, // 32
    opacity: 0.85,
  },
  comingSoonText: {
    flex: 1,
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.regular, // '400'
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
  },
  plansRow: {
    flexDirection: 'row',
    gap: Spacing.base, // 16
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.base, // 16
    backgroundColor: Colors.white,
    borderWidth: 2,
    minHeight: 96, // 8 × 12 — keeps layout consistent across cards
    ...Shadows.sm,
  },
  planCardUnselected: {
    borderColor: Colors.gray.light,
  },
  planCardSelected: {
    borderColor: Colors.accent1, // #B771E5
    backgroundColor: SELECTED_PLAN_TINT, // Derived from theme (accent1 tint)
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  planBadge: {
    position: 'absolute',
    top: Spacing.tight, // 8
    right: Spacing.tight, // 8
    backgroundColor: Colors.accent1,
    paddingHorizontal: Spacing.tight, // 8
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: Typography.fontSize.small, // 12
    fontWeight: Typography.fontWeight.semibold, // '600'
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  planLabel: {
    fontSize: Typography.fontSize.caption, // 14
    fontWeight: Typography.fontWeight.semibold, // '600'
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: Spacing.tight, // 8
  },
  planPrice: {
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.bold, // '700'
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  footer: {
    paddingHorizontal: Spacing.comfortable, // 24
    paddingTop: Spacing.base, // 16
    paddingBottom: Spacing.base, // 16
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
    backgroundColor: Colors.background,
  },
  continueButton: {
    minHeight: 56, // 8 × 7 (primary CTA)
    borderRadius: 12,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.comfortable, // 24
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.body, // 16
    fontWeight: Typography.fontWeight.bold, // '700'
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  inlineError: {
    marginTop: Spacing.base, // 16
    fontSize: Typography.fontSize.caption, // 14
    fontWeight: Typography.fontWeight.regular, // '400'
    color: Colors.error,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
  restoreButton: {
    minHeight: 48, // touch target ≥ 48px
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.tight, // 8
  },
  restoreText: {
    fontSize: Typography.fontSize.caption, // 14
    fontWeight: Typography.fontWeight.semibold, // '600'
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
  restoreTextDisabled: {
    opacity: 0.5,
  },
});

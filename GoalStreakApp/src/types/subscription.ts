// Goalfer Pro subscription types and constants
//
// RevenueCat is the source of truth for entitlements; the values exported here
// are the contract between the subscription service, the useSubscription hook,
// the paywall modal, and the habit service.

/** RevenueCat entitlement identifier used for all Pro feature gates. */
export const PRO_ENTITLEMENT_ID = 'pro' as const;

/** RevenueCat offering identifier containing the monthly and annual packages. */
export const DEFAULT_OFFERING_ID = 'default' as const;

/** RevenueCat / App Store product identifiers. */
export const PRO_PRODUCT_IDS = {
  monthly: 'goalfer_pro_monthly',
  annual: 'goalfer_pro_annual',
} as const;

/** Union of valid Pro product identifiers. */
export type ProProductId = (typeof PRO_PRODUCT_IDS)[keyof typeof PRO_PRODUCT_IDS];

/** Tier label used for habit-limit lookups and analytics. */
export type HabitLimitTier = 'free' | 'pro';

/** Typed error codes surfaced from purchase and restore attempts. */
export type PurchaseErrorCode =
  | 'PURCHASE_CANCELLED'
  | 'NO_NETWORK'
  | 'PRODUCT_NOT_FOUND'
  | 'PAYMENT_PENDING'
  | 'STORE_PROBLEM'
  | 'UNKNOWN';

/** Result envelope returned by `subscriptionService.purchasePro`. */
export type PurchaseResult =
  | { success: true }
  | { success: false; error: PurchaseErrorCode; message?: string };

/** Error code surfaced from `habitService.createHabit` when the tier limit is hit. */
export const HABIT_LIMIT_REACHED = 'HABIT_LIMIT_REACHED' as const;

/**
 * Thrown by `habitService.createHabit` when the authenticated user is at or
 * above their tier-specific habit limit. The screen layer branches on
 * `isPro` to decide between showing the paywall (free user) or a terminal
 * "limit reached" alert (Pro user already at 15).
 */
export class HabitLimitError extends Error {
  readonly code: typeof HABIT_LIMIT_REACHED = HABIT_LIMIT_REACHED;
  readonly isPro: boolean;
  readonly limit: number;

  constructor(isPro: boolean, limit: number) {
    super(
      isPro
        ? `You've reached the maximum of ${limit} habits.`
        : `Free users can create up to ${limit} habits. Upgrade to Pro for ${15} habits.`
    );
    this.isPro = isPro;
    this.limit = limit;
    this.name = 'HabitLimitError';

    // Preserve prototype chain so `instanceof HabitLimitError` works after
    // transpilation to ES5 targets.
    Object.setPrototypeOf(this, HabitLimitError.prototype);
  }
}

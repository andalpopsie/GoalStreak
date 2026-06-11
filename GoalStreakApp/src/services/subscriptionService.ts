// Goalfer Pro Subscription Service
//
// Wraps `react-native-purchases` (RevenueCat) and exposes a clean, typed API
// to the `useSubscription` hook, the paywall modal, and the habit service.
//
// Design notes:
// - RevenueCat is the **source of truth** for entitlements. Pro status is
//   mirrored to Firestore for backend reference only; feature gating always
//   reads from RevenueCat.
// - Implementation is **iOS only**. On non-iOS platforms (Android, web,
//   simulators without StoreKit) we treat the user as Free and never call
//   RevenueCat purchase / restore APIs.
// - All public methods are safe to call before `initialize()`; they return
//   conservative defaults (false / null / 'UNKNOWN') so the rest of the app
//   keeps working when RevenueCat is unavailable.
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import {
  PRO_ENTITLEMENT_ID,
  DEFAULT_OFFERING_ID,
  PRO_PRODUCT_IDS,
  ProProductId,
  PurchaseErrorCode,
  PurchaseResult,
} from '../types/subscription';

class SubscriptionService {
  /** True once RevenueCat has been configured for the current user. */
  private initialized = false;

  /** App user id RevenueCat is currently identified as, or null. */
  private currentUserId: string | null = null;

  // ──────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Configure RevenueCat with the iOS API key and identify the user.
   *
   * iOS-only: silently returns on non-iOS platforms or when the API key is
   * missing (the user is treated as Free in those cases).
   *
   * Idempotent: a subsequent call with the same `userId` is a no-op; a call
   * with a different `userId` issues `Purchases.logIn(userId)` to switch
   * the identified app user without re-configuring the SDK.
   */
  async initialize(userId: string): Promise<void> {
    if (!this.isPlatformSupported()) {
      console.error(
        '[subscriptionService] RevenueCat not initialized: ' +
          (Platform.OS !== 'ios'
            ? `unsupported platform "${Platform.OS}"`
            : 'EXPO_PUBLIC_REVENUECAT_IOS_KEY is not configured')
      );
      this.initialized = false;
      return;
    }

    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY as string;

    try {
      if (!this.initialized) {
        Purchases.configure({ apiKey, appUserID: userId });
        this.initialized = true;
        this.currentUserId = userId;
        return;
      }

      // Already initialized; switch app user if needed.
      if (this.currentUserId !== userId) {
        await Purchases.logIn(userId);
        this.currentUserId = userId;
      }
    } catch (error) {
      console.error(
        '[subscriptionService] Failed to initialize RevenueCat:',
        error
      );
      // Keep `initialized = false` so subsequent calls fall back to Free.
      this.initialized = false;
    }
  }

  /**
   * Returns `true` iff RevenueCat reports an active Pro entitlement for the
   * current user. Returns `false` on non-iOS platforms, when RevenueCat has
   * not been initialized, or when the network call fails.
   *
   * Pro status is **never** read from Firestore; RevenueCat is the source
   * of truth.
   */
  async getProStatus(): Promise<boolean> {
    if (!this.isPlatformSupported() || !this.initialized) {
      return false;
    }

    const info = await this.fetchCustomerInfo();
    return this.hasProEntitlement(info);
  }

  /**
   * Returns the monthly + annual packages from the default offering.
   * Returns `{ monthly: null, annual: null }` when offerings are
   * unavailable (offline, misconfigured, or non-iOS).
   */
  async getOfferings(): Promise<{
    monthly: PurchasesPackage | null;
    annual: PurchasesPackage | null;
  }> {
    if (!this.isPlatformSupported() || !this.initialized) {
      return { monthly: null, annual: null };
    }

    try {
      const offerings = await Purchases.getOfferings();
      const offering =
        offerings.all[DEFAULT_OFFERING_ID] ?? offerings.current ?? null;
      if (!offering) {
        return { monthly: null, annual: null };
      }

      const monthly =
        offering.availablePackages.find(
          (p) => p.product.identifier === PRO_PRODUCT_IDS.monthly
        ) ?? null;
      const annual =
        offering.availablePackages.find(
          (p) => p.product.identifier === PRO_PRODUCT_IDS.annual
        ) ?? null;

      return { monthly, annual };
    } catch (error) {
      console.error('[subscriptionService] Failed to fetch offerings:', error);
      return { monthly: null, annual: null };
    }
  }

  /**
   * Initiate a purchase for the given product id.
   *
   * - If the user already has Pro, returns `{ success: true }` without
   *   invoking the purchase sheet (Req 7.3).
   * - On user cancel, returns `{ success: false, error: 'PURCHASE_CANCELLED' }`.
   * - On network failure, returns `{ success: false, error: 'NO_NETWORK' }`.
   * - On success, mirrors `{ isPro: true, proSince }` to Firestore.
   */
  async purchasePro(productId: ProProductId): Promise<PurchaseResult> {
    if (!this.isPlatformSupported() || !this.initialized) {
      return {
        success: false,
        error: 'STORE_PROBLEM',
        message: 'In-app purchases are not available on this device.',
      };
    }

    // Pre-check: skip the purchase sheet if the user already has Pro.
    const alreadyPro = await this.getProStatus();
    if (alreadyPro) {
      if (this.currentUserId) {
        await this.mirrorProToFirestore(this.currentUserId);
      }
      return { success: true };
    }

    // Locate the package for the requested product id.
    const { monthly, annual } = await this.getOfferings();
    const pkg =
      productId === PRO_PRODUCT_IDS.monthly
        ? monthly
        : productId === PRO_PRODUCT_IDS.annual
          ? annual
          : null;

    if (!pkg) {
      return {
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: `Could not find product "${productId}" in the default offering.`,
      };
    }

    try {
      const result = await Purchases.purchasePackage(pkg);
      if (this.hasProEntitlement(result.customerInfo)) {
        if (this.currentUserId) {
          await this.mirrorProToFirestore(this.currentUserId);
        }
        return { success: true };
      }

      // Edge case: purchase resolved but the entitlement is not active.
      return {
        success: false,
        error: 'STORE_PROBLEM',
        message: 'Purchase completed but Pro entitlement is not active yet.',
      };
    } catch (error) {
      const code = this.mapPurchaseError(error);
      const message =
        (error as { message?: string })?.message ?? 'Purchase failed.';
      return { success: false, error: code, message };
    }
  }

  /**
   * Trigger RevenueCat restore. Returns `true` iff the Pro entitlement is
   * active after the restore call. On `true`, mirrors Pro status to
   * Firestore. Network failures throw a typed error so the hook can surface
   * a "no internet" message to the user.
   */
  async restorePurchases(): Promise<boolean> {
    if (!this.isPlatformSupported() || !this.initialized) {
      return false;
    }

    try {
      const info = await Purchases.restorePurchases();
      const isPro = this.hasProEntitlement(info);
      if (isPro && this.currentUserId) {
        await this.mirrorProToFirestore(this.currentUserId);
      }
      return isPro;
    } catch (error) {
      const code = this.mapPurchaseError(error);
      // Surface network failures to the caller; for everything else, treat
      // restore as a "no purchases found" result.
      if (code === 'NO_NETWORK') {
        const networkError = new Error(
          'No internet connection. Please try again.'
        ) as Error & { code: PurchaseErrorCode };
        networkError.code = 'NO_NETWORK';
        throw networkError;
      }
      console.error('[subscriptionService] Restore failed:', error);
      return false;
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────────────────────────────

  /** True only on iOS with the RevenueCat API key configured. */
  private isPlatformSupported(): boolean {
    return (
      Platform.OS === 'ios' && !!process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    );
  }

  /**
   * Map a RevenueCat error to a typed `PurchaseErrorCode`. The RevenueCat
   * SDK exposes both an enum `code` and a deprecated `userCancelled`
   * boolean; we honor `code` first and fall back to `userCancelled`.
   */
  private mapPurchaseError(error: unknown): PurchaseErrorCode {
    if (!error || typeof error !== 'object') {
      return 'UNKNOWN';
    }
    const e = error as {
      code?: string | number;
      userCancelled?: boolean | null;
    };

    if (e.userCancelled === true) {
      return 'PURCHASE_CANCELLED';
    }

    // RevenueCat error codes are string-encoded numbers (e.g. "1", "10").
    const code = e.code != null ? String(e.code) : '';
    switch (code) {
      case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
        return 'PURCHASE_CANCELLED';
      case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
        return 'NO_NETWORK';
      case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
        return 'PRODUCT_NOT_FOUND';
      case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
        return 'PAYMENT_PENDING';
      case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      case PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR:
        return 'STORE_PROBLEM';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Read `CustomerInfo` from RevenueCat. Returns `null` on failure so the
   * caller can fall back to the Free tier without throwing.
   */
  private async fetchCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error(
        '[subscriptionService] Failed to fetch customer info:',
        error
      );
      return null;
    }
  }

  /** True iff the given `CustomerInfo` contains an active Pro entitlement. */
  private hasProEntitlement(info: CustomerInfo | null): boolean {
    if (!info) return false;
    const entitlement = info.entitlements?.active?.[PRO_ENTITLEMENT_ID];
    return !!entitlement;
  }

  /**
   * Mirror Pro status to `users/{uid}` in Firestore.
   *
   * Behavior:
   * - If `proSince` already exists on the document, write only `{ isPro: true }`
   *   (preserves the original conversion timestamp for analytics).
   * - If `proSince` is absent, write `{ isPro: true, proSince: serverTimestamp() }`.
   *
   * Failures are logged and swallowed; RevenueCat remains the source of
   * truth so the caller does not need to know that the Firestore write
   * failed.
   */
  private async mirrorProToFirestore(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      const hasExistingProSince = snapshot.exists() && !!snapshot.data()?.proSince;

      if (hasExistingProSince) {
        await setDoc(userRef, { isPro: true }, { merge: true });
      } else {
        await setDoc(
          userRef,
          { isPro: true, proSince: serverTimestamp() },
          { merge: true }
        );
      }
    } catch (error) {
      console.error(
        '[subscriptionService] Failed to mirror Pro status to Firestore:',
        error
      );
      // Intentionally swallow — RevenueCat is the source of truth.
    }
  }
}

/** Shared singleton used across hooks, screens, and services. */
export const subscriptionService = new SubscriptionService();
export default subscriptionService;

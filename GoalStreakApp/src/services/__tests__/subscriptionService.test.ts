/**
 * Unit tests for `subscriptionService` core logic.
 *
 * Validates the behaviors required by Pro Subscription tasks 3.8:
 *  - `getProStatus` returns `false` when not initialized, when
 *    `Platform.OS !== 'ios'`, and when the RevenueCat API key is missing.
 *  - `purchasePro` short-circuits to `{ success: true }` without invoking
 *    `Purchases.purchasePackage` when the user already has Pro (Req 7.3).
 *  - `purchasePro` maps a `userCancelled` error from RevenueCat to the
 *    typed `PURCHASE_CANCELLED` code (Req 7.1).
 *  - `mirrorProToFirestore` (exercised through `purchasePro` on an
 *    already-Pro user) does NOT overwrite an existing `proSince` value
 *    (Req 9.3).
 *
 * Requirements: 2.1, 2.2, 6.3, 7.1, 7.3, 9.3, 11.3
 */

// ── Module-level mocks (hoisted by Jest) ────────────────────────────────────

// Mock `react-native-purchases` with controllable jest.fn() implementations.
// We export a `PURCHASES_ERROR_CODE` enum that mirrors the real package so
// `mapPurchaseError` lookups work the same way they do in production.
jest.mock('react-native-purchases', () => {
  const PURCHASES_ERROR_CODE = {
    UNKNOWN_ERROR: '0',
    PURCHASE_CANCELLED_ERROR: '1',
    STORE_PROBLEM_ERROR: '2',
    PURCHASE_NOT_ALLOWED_ERROR: '3',
    PURCHASE_INVALID_ERROR: '4',
    PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: '5',
    NETWORK_ERROR: '10',
    PAYMENT_PENDING_ERROR: '20',
    OFFLINE_CONNECTION_ERROR: '35',
  } as const;

  const Purchases = {
    configure: jest.fn(),
    logIn: jest.fn().mockResolvedValue({}),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  };

  return {
    __esModule: true,
    default: Purchases,
    PURCHASES_ERROR_CODE,
  };
});

// Override the global firebase/firestore mock from `src/__tests__/setup.ts`
// so this file controls `doc`, `getDoc`, `setDoc`, and `serverTimestamp`
// behavior precisely. The sentinel returned by `serverTimestamp()` lets us
// assert exactly what `setDoc` is called with.
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// `subscriptionService` imports `db` from `./firebase`. We don't need a real
// Firestore instance during tests, so just expose a placeholder.
jest.mock('../firebase', () => ({
  db: { __mock: 'db' },
}));

// ── Imports (resolved against the mocks above) ──────────────────────────────

import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { subscriptionService } from '../subscriptionService';
import {
  PRO_ENTITLEMENT_ID,
  PRO_PRODUCT_IDS,
} from '../../types/subscription';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Sentinel returned by the mocked `serverTimestamp()`. */
const SERVER_TIMESTAMP_SENTINEL = { __sentinel: 'serverTimestamp' };

/** Build a minimal CustomerInfo-shaped object with the requested Pro state. */
function makeCustomerInfo(isPro: boolean) {
  return {
    entitlements: {
      active: isPro
        ? {
            [PRO_ENTITLEMENT_ID]: {
              identifier: PRO_ENTITLEMENT_ID,
              isActive: true,
            },
          }
        : {},
    },
  };
}

/** Build a Firestore DocumentSnapshot-shaped object for `getDoc`. */
function makeSnapshot(data: Record<string, unknown> | null) {
  return {
    exists: () => data !== null,
    data: () => data ?? undefined,
  };
}

/** Reset the singleton's private state so each test starts from a clean slate. */
function resetService() {
  // Cast to `any` to bypass private field access — this matches the pattern
  // used elsewhere in the codebase for testing class-based singletons.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (subscriptionService as any).initialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (subscriptionService as any).currentUserId = null;
}

const TEST_USER_ID = 'test-user-1';
const FAKE_API_KEY = 'rc_fake_test_key';

// ── Test setup ──────────────────────────────────────────────────────────────

const originalEnvKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;

beforeEach(() => {
  jest.clearAllMocks();
  resetService();

  // Default platform: iOS with a configured API key. Individual tests
  // override these to exercise the unsupported / missing-key branches.
  Platform.OS = 'ios';
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = FAKE_API_KEY;

  // Reasonable defaults for firestore mocks; tests override per case.
  (doc as jest.Mock).mockReturnValue({ __ref: 'users/test-user-1' });
  (serverTimestamp as jest.Mock).mockReturnValue(SERVER_TIMESTAMP_SENTINEL);
  (setDoc as jest.Mock).mockResolvedValue(undefined);
  (getDoc as jest.Mock).mockResolvedValue(makeSnapshot({}));
});

afterAll(() => {
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = originalEnvKey;
});

// ── getProStatus ────────────────────────────────────────────────────────────

describe('subscriptionService.getProStatus', () => {
  it('returns false when the service has not been initialized', async () => {
    // Service is reset in beforeEach; initialize() is never called.
    const isPro = await subscriptionService.getProStatus();

    expect(isPro).toBe(false);
    expect(Purchases.getCustomerInfo).not.toHaveBeenCalled();
  });

  it('returns false when Platform.OS is not iOS', async () => {
    // Initialize successfully on iOS first so we know the not-initialized
    // guard isn't what's producing the `false` result.
    await subscriptionService.initialize(TEST_USER_ID);
    expect(Purchases.configure).toHaveBeenCalledTimes(1);

    Platform.OS = 'android' as typeof Platform.OS;
    const isPro = await subscriptionService.getProStatus();

    expect(isPro).toBe(false);
    expect(Purchases.getCustomerInfo).not.toHaveBeenCalled();
  });

  it('returns false when EXPO_PUBLIC_REVENUECAT_IOS_KEY is missing', async () => {
    // Initialize successfully first, then unset the API key to isolate the
    // missing-key branch from the not-initialized branch.
    await subscriptionService.initialize(TEST_USER_ID);
    expect(Purchases.configure).toHaveBeenCalledTimes(1);

    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = '';
    const isPro = await subscriptionService.getProStatus();

    expect(isPro).toBe(false);
    expect(Purchases.getCustomerInfo).not.toHaveBeenCalled();
  });

  it('returns true when initialized on iOS and customer info contains an active Pro entitlement', async () => {
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValue(
      makeCustomerInfo(true)
    );

    await subscriptionService.initialize(TEST_USER_ID);
    const isPro = await subscriptionService.getProStatus();

    expect(isPro).toBe(true);
    expect(Purchases.getCustomerInfo).toHaveBeenCalledTimes(1);
  });
});

// ── purchasePro: already-Pro short-circuit ──────────────────────────────────

describe('subscriptionService.purchasePro — already Pro', () => {
  it('returns { success: true } without calling purchasePackage when user already has Pro', async () => {
    // Customer already holds the Pro entitlement.
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValue(
      makeCustomerInfo(true)
    );
    // proSince is already set on the user document, so the Firestore mirror
    // will write only `{ isPro: true }` and won't depend on serverTimestamp.
    (getDoc as jest.Mock).mockResolvedValue(
      makeSnapshot({ proSince: { seconds: 1, nanoseconds: 0 } })
    );

    await subscriptionService.initialize(TEST_USER_ID);
    const result = await subscriptionService.purchasePro(
      PRO_PRODUCT_IDS.monthly
    );

    expect(result).toEqual({ success: true });
    expect(Purchases.purchasePackage).not.toHaveBeenCalled();
    // Offerings shouldn't be fetched either, since we short-circuit before
    // resolving a package.
    expect(Purchases.getOfferings).not.toHaveBeenCalled();
  });
});

// ── purchasePro: error mapping ──────────────────────────────────────────────

describe('subscriptionService.purchasePro — error mapping', () => {
  it('maps a userCancelled error to PURCHASE_CANCELLED', async () => {
    // Not currently Pro — the purchase flow should proceed to the StoreKit
    // sheet (mocked) and surface the cancel.
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValue(
      makeCustomerInfo(false)
    );

    // Build a minimal package shape that matches what `getOfferings` returns
    // on the production code path.
    const monthlyPackage = {
      identifier: 'monthly_pkg',
      product: { identifier: PRO_PRODUCT_IDS.monthly },
    };
    (Purchases.getOfferings as jest.Mock).mockResolvedValue({
      all: {
        default: { availablePackages: [monthlyPackage] },
      },
      current: { availablePackages: [monthlyPackage] },
    });

    // RevenueCat surfaces user-cancellation via the `userCancelled` flag on
    // the thrown error (the SDK still exposes this even though the typed
    // path is `code === PURCHASE_CANCELLED_ERROR`).
    const cancelError = Object.assign(new Error('User cancelled'), {
      userCancelled: true,
    });
    (Purchases.purchasePackage as jest.Mock).mockRejectedValue(cancelError);

    await subscriptionService.initialize(TEST_USER_ID);
    const result = await subscriptionService.purchasePro(
      PRO_PRODUCT_IDS.monthly
    );

    expect(result).toMatchObject({
      success: false,
      error: 'PURCHASE_CANCELLED',
    });
    expect(Purchases.purchasePackage).toHaveBeenCalledWith(monthlyPackage);
    // The Firestore mirror must not run on a cancelled purchase.
    expect(setDoc).not.toHaveBeenCalled();
  });
});

// ── mirrorProToFirestore — write-once `proSince` ────────────────────────────

describe('subscriptionService.mirrorProToFirestore (via purchasePro)', () => {
  it('does NOT overwrite an existing proSince value', async () => {
    // Triggering `mirrorProToFirestore` through the already-Pro short-circuit
    // is the most natural public entry point and avoids needing to mock the
    // entire offerings + purchase flow.
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValue(
      makeCustomerInfo(true)
    );

    const existingProSince = { seconds: 1700000000, nanoseconds: 0 };
    (getDoc as jest.Mock).mockResolvedValue(
      makeSnapshot({ proSince: existingProSince, displayName: 'Test User' })
    );

    await subscriptionService.initialize(TEST_USER_ID);
    const result = await subscriptionService.purchasePro(
      PRO_PRODUCT_IDS.annual
    );

    expect(result).toEqual({ success: true });

    // setDoc must be called with only `{ isPro: true }` — never with a new
    // `proSince` that would clobber the original conversion timestamp.
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, payload, options] = (setDoc as jest.Mock).mock.calls[0];
    expect(payload).toEqual({ isPro: true });
    expect(payload).not.toHaveProperty('proSince');
    expect(options).toEqual({ merge: true });

    // serverTimestamp() should not have been invoked on this code path.
    expect(serverTimestamp).not.toHaveBeenCalled();
  });

  it('writes proSince when the user document has no existing value', async () => {
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValue(
      makeCustomerInfo(true)
    );
    // Document exists but has no proSince yet (e.g. brand-new Pro user).
    (getDoc as jest.Mock).mockResolvedValue(
      makeSnapshot({ displayName: 'Test User' })
    );

    await subscriptionService.initialize(TEST_USER_ID);
    const result = await subscriptionService.purchasePro(
      PRO_PRODUCT_IDS.annual
    );

    expect(result).toEqual({ success: true });
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, payload, options] = (setDoc as jest.Mock).mock.calls[0];
    expect(payload).toEqual({
      isPro: true,
      proSince: SERVER_TIMESTAMP_SENTINEL,
    });
    expect(options).toEqual({ merge: true });
    expect(serverTimestamp).toHaveBeenCalledTimes(1);
  });
});

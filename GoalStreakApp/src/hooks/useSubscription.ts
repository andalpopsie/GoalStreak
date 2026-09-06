// useSubscription Hook
//
// Thin wrapper around the `subscriptionService` singleton that exposes Pro
// status and purchase / restore actions to UI. The hook does not duplicate
// state — every state update reflects a fresh read of `getProStatus()` from
// the service after a purchase or restore completes.
//
// Contract (see design.md > useSubscription):
// - `isPro`     boolean, true iff RevenueCat reports an active Pro entitlement
// - `isLoading` true during the initial Pro-status read or while a purchase
//               or restore call is in flight
// - `error`     last `PurchaseErrorCode` from a failed attempt, cleared at
//               the start of every new attempt
// - `purchase`  initiates a purchase and re-reads Pro status afterward
// - `restore`   triggers RevenueCat restore and re-reads Pro status afterward
// - `refresh`   forces a manual re-read of Pro status
import { useCallback, useEffect, useRef, useState } from 'react';
import subscriptionService from '../services/subscriptionService';
import { ProProductId, PurchaseErrorCode, PurchaseResult } from '../types/subscription';

interface UseSubscriptionReturn {
  /** True iff RevenueCat reports an active Pro entitlement. */
  isPro: boolean;
  /** True during the initial Pro-status read or while a purchase or restore is in flight. */
  isLoading: boolean;
  /** Last error code from a purchase or restore attempt, cleared on next attempt. */
  error: PurchaseErrorCode | null;
  /** Initiate a purchase for the given product id. */
  purchase: (productId: ProProductId) => Promise<PurchaseResult>;
  /** Trigger restore. Resolves with `true` iff Pro entitlement is active afterward. */
  restore: () => Promise<boolean>;
  /** Force a re-read of Pro status from the service. */
  refresh: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<PurchaseErrorCode | null>(null);

  // Avoid setState calls after unmount (purchase / restore can take seconds
  // while the StoreKit sheet is open).
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Read the latest Pro status from the service and update local state.
   * Safe to call any time; never throws.
   */
  const readProStatus = useCallback(async (): Promise<void> => {
    try {
      const status = await subscriptionService.getProStatus();
      if (isMountedRef.current) {
        setIsPro(status);
      }
    } catch (err) {
      // `getProStatus` already swallows network errors and returns false,
      // but guard anyway so a future change can't crash the hook.
      console.error('[useSubscription] Failed to read Pro status:', err);
      if (isMountedRef.current) {
        setIsPro(false);
      }
    }
  }, []);

  // On mount, read Pro status once. `isLoading` starts as `true` and is
  // cleared after the first read completes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await readProStatus();
      if (!cancelled && isMountedRef.current) {
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [readProStatus]);

  const refresh = useCallback(async (): Promise<void> => {
    if (isMountedRef.current) {
      setIsLoading(true);
    }
    await readProStatus();
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  }, [readProStatus]);

  const purchase = useCallback(
    async (productId: ProProductId): Promise<PurchaseResult> => {
      // Clear any prior error and mark the attempt as in-flight.
      if (isMountedRef.current) {
        setError(null);
        setIsLoading(true);
      }

      let result: PurchaseResult;
      try {
        result = await subscriptionService.purchasePro(productId);
      } catch (err) {
        // `purchasePro` is designed to never throw, but defend against it.
        console.error('[useSubscription] purchase threw unexpectedly:', err);
        result = {
          success: false,
          error: 'UNKNOWN',
          message: (err as Error)?.message ?? 'Purchase failed.',
        };
      }

      if (!result.success && isMountedRef.current) {
        // Cast to the failure variant so `error` is visible. The project's
        // tsconfig disables `strictNullChecks`, which suppresses automatic
        // discriminated-union narrowing in this branch.
        const failure = result as Extract<PurchaseResult, { success: false }>;
        setError(failure.error);
      }

      // Re-read Pro status regardless of success/failure so `isPro` reflects
      // the latest entitlement (e.g. a previously-active subscription that
      // was detected during the pre-check).
      await readProStatus();

      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return result;
    },
    [readProStatus]
  );

  const restore = useCallback(async (): Promise<boolean> => {
    // Clear any prior error and mark the attempt as in-flight.
    if (isMountedRef.current) {
      setError(null);
      setIsLoading(true);
    }

    let restored = false;
    try {
      restored = await subscriptionService.restorePurchases();
    } catch (err) {
      // The service throws a typed error with `code` for network failures so
      // the hook can surface a "no internet" message. Other errors are
      // logged and returned as `false`.
      const code = (err as { code?: PurchaseErrorCode })?.code;
      if (isMountedRef.current) {
        setError(code ?? 'UNKNOWN');
      }
      restored = false;
    }

    // Re-read Pro status so `isPro` reflects the post-restore entitlement.
    await readProStatus();

    if (isMountedRef.current) {
      setIsLoading(false);
    }
    return restored;
  }, [readProStatus]);

  return {
    isPro,
    isLoading,
    error,
    purchase,
    restore,
    refresh,
  };
};

export default useSubscription;

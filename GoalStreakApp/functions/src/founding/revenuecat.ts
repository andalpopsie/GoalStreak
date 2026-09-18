/**
 * revenuecat.ts — RevenueCat REST client for the Founding Member program.
 *
 * Grants a promotional `pro` entitlement to a Firebase UID via the RevenueCat
 * REST API. Implements timeout (R5.1), exponential-backoff retry (R5.2), and
 * graceful pending fallback (R5.3).
 *
 * Requirements covered: R4.1, R4.2, R4.3, R5.1, R5.2, R5.3
 *
 * Intentionally free of Firebase or other project-internal imports so this
 * module remains independently unit-testable.
 */

const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1';

/** Maximum number of total attempts (1 initial + 4 retries). R5.2 */
const MAX_ATTEMPTS = 5;

/** Per-attempt timeout in milliseconds. R5.1 */
const TIMEOUT_MS = 10_000;

/** Initial backoff delay in milliseconds. R5.2 */
const INITIAL_BACKOFF_MS = 1_000;

/** Maximum backoff delay cap in milliseconds. R5.2 */
const MAX_BACKOFF_MS = 30_000;

/** One year expressed in milliseconds. R4.3 */
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GrantResult {
  status: 'granted';
  proExpiresAt: Date;
}

export interface PendingResult {
  status: 'pending';
}

export type ProGrantResult = GrantResult | PendingResult;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Resolves after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Computes the wait before attempt N (0-indexed).
 * Attempt 0 → 0 ms (no pre-wait for the first attempt).
 * Attempt N > 0 → min(1000 * 2^(N-1), 30_000) ms.
 *
 * R5.2: "starting at 1 s, doubling each attempt, capped at 30 s"
 */
function backoffMs(attemptIndex: number): number {
  if (attemptIndex === 0) return 0;
  return Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attemptIndex - 1), MAX_BACKOFF_MS);
}

/**
 * Returns true for HTTP status codes that should trigger a retry:
 * - 5xx server errors
 * - 429 rate limit
 *
 * 4xx (except 429) are treated as permanent failures — no retry.
 */
function isRetryable(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Grants a RevenueCat `pro` promotional entitlement to the given Firebase uid.
 *
 * @param uid           - Firebase Auth UID (used as RevenueCat app user ID)
 * @param secretKey     - RevenueCat secret key (from Functions secrets, never logged). R4.2
 * @param entitlementId - e.g. 'pro'
 * @returns GrantResult on success; PendingResult after all retries are exhausted. R5.3
 */
export async function grantProEntitlement(
  uid: string,
  secretKey: string,
  entitlementId: string,
): Promise<ProGrantResult> {
  // Compute expiry once before the first attempt so all retry attempts share
  // the same proExpiresAt. R4.3
  const proExpiresAt = new Date(Date.now() + ONE_YEAR_MS);
  const endTimeMs = proExpiresAt.getTime();

  const url = `${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(uid)}/entitlements/${encodeURIComponent(entitlementId)}/promotional`;

  const body = JSON.stringify({
    duration: 'custom',
    end_time_ms: endTimeMs,
  });

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Wait before the attempt (0 ms for the first one). R5.2
    const delay = backoffMs(attempt);
    if (delay > 0) {
      await sleep(delay);
    }

    // Per-attempt timeout via AbortController. R5.1
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            // R4.2: secret key is passed as a header and never logged or
            // embedded in error messages.
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        // HTTP 200 — grant succeeded. R4.1, R4.3
        return { status: 'granted', proExpiresAt };
      }

      // Non-2xx response.
      if (!isRetryable(response.status)) {
        // Permanent client-side error (4xx except 429) — stop retrying. R5.3
        return { status: 'pending' };
      }

      // Retryable status (5xx or 429) — fall through to the next attempt.
    } catch {
      // Network error or AbortError (timeout) — retryable. R5.1, R5.2
      // The secretKey must NOT appear in any thrown or logged error.
      // We simply let the loop continue to the next attempt.
    }
  }

  // All attempts exhausted without a successful grant. R5.3
  return { status: 'pending' };
}

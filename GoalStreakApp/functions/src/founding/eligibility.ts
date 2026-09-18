/**
 * eligibility.ts — Pure, I/O-free eligibility helpers for the Founding Member program.
 *
 * No imports from Firebase, external packages, or other modules in this codebase.
 * All functions are fully unit-testable without mocks.
 *
 * Requirements covered: R1.3, R1.4, R2.2–R2.6, R3.2, R15.1
 */

/**
 * Parses an ISO 8601 UTC timestamp string and returns its value in UTC
 * milliseconds, or null if the input is absent or invalid. (R2.2)
 *
 * Acceptance rules:
 * - Must be a non-empty string
 * - Must parse as a valid date (getTime() is not NaN)
 * - Must be a full datetime string — bare date strings like "2025-01-20"
 *   without a time component are rejected (ambiguous timezone semantics)
 * - Must be explicitly UTC — must end with 'Z' or contain '+00:00'
 */
export function parseLaunchTimestamp(raw: unknown): number | null {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }

  // Enforce explicit UTC indicator: must end with 'Z' or contain '+00:00'
  const isUtc = raw.endsWith('Z') || raw.includes('+00:00');
  if (!isUtc) {
    return null;
  }

  // Require a time component — reject bare dates like "2025-01-20Z"
  // A valid ISO 8601 datetime includes a 'T' separator between date and time
  if (!raw.includes('T')) {
    return null;
  }

  const date = new Date(raw);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}

/**
 * The inputs required to evaluate founding member eligibility.
 */
export type EligibilityInput = {
  /** Account creation time as UTC milliseconds. */
  accountCreatedAtUtcMs: number;
  /** Launch timestamp as UTC milliseconds, or null if config is missing/invalid. */
  launchTimestampUtcMs: number | null;
  /** Current value of the Founding_Counter `claimed` field. */
  claimed: number;
  /** The Founding_Cap (should be 100). */
  cap: number;
};

/**
 * The outcome of a founding membership eligibility evaluation.
 */
export type EligibilityOutcome =
  | { kind: 'eligible' }       // Account should proceed to claim a slot
  | { kind: 'before-launch' }  // Account was created before T0 (R1.3, R2.6)
  | { kind: 'sold-out' }       // All founding slots have been claimed (R1.5, R3.5)
  | { kind: 'config-invalid' }; // T0 config is absent or unparseable (R2.2, R2.3)

/**
 * Pure eligibility decision function. No I/O, no side effects.
 *
 * Ordering is significant:
 *   1. config-invalid — checked first so we never leak counter state when
 *      config is broken (R2.2, R2.3)
 *   2. sold-out — checked before before-launch so we return the correct
 *      outcome even if T0 is valid but all slots are gone (R3.5)
 *   3. before-launch — account was created strictly before T0 (R1.3, R2.6)
 *   4. eligible — created at or after T0 with slots available (R1.4, R2.5)
 *
 * Critical: a timestamp exactly equal to T0 is ELIGIBLE (inclusive lower
 * bound). Only strictly before T0 yields 'before-launch'. (R1.4, R2.5)
 */
export function evaluateEligibility(input: EligibilityInput): EligibilityOutcome {
  const { accountCreatedAtUtcMs, launchTimestampUtcMs, claimed, cap } = input;

  // 1. Config invalid — T0 is missing or couldn't be parsed (R2.2)
  if (launchTimestampUtcMs === null) {
    return { kind: 'config-invalid' };
  }

  // 2. Sold out — all founding slots have been claimed (R3.5)
  if (claimed >= cap) {
    return { kind: 'sold-out' };
  }

  // 3. Before launch — account was created strictly before T0 (R1.3, R2.6)
  // Note: strictly less than (<). Equal to T0 falls through to 'eligible' (R1.4, R2.5).
  if (accountCreatedAtUtcMs < launchTimestampUtcMs) {
    return { kind: 'before-launch' };
  }

  // 4. Eligible — created at or after T0 with at least one slot remaining (R1.4)
  return { kind: 'eligible' };
}

/**
 * Returns the founding number to assign given the current (pre-increment)
 * `claimed` counter value.
 *
 * Founding numbers run from 1..100 inclusive. When claimed=0, the first
 * account gets number 1; when claimed=99, the last account gets number 100.
 * (R3.2)
 */
export function assignNumberFrom(claimed: number): number {
  return claimed + 1;
}

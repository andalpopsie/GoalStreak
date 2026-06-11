// App limits and constraints
//
// The Goalfer Pro tier raises the per-user habit limit from 6 (free) to 15 (Pro).
// Feature gating reads the applicable limit via `getHabitLimit(isPro)`; existing
// call sites that read `LIMITS.MAX_HABITS` continue to work because the constant
// is preserved (equal to `MAX_HABITS_FREE`).
export const LIMITS = {
  /**
   * Maximum number of habits a free user can create.
   *
   * Reasoning: 6 habits allows users to focus on what matters most while
   * preventing overwhelm. Research shows people can effectively maintain
   * 3-7 habits simultaneously.
   */
  MAX_HABITS_FREE: 6,

  /** Maximum number of habits a Goalfer Pro user can create. */
  MAX_HABITS_PRO: 15,

  /**
   * @deprecated Use `MAX_HABITS_FREE` for free-tier limits or
   * `getHabitLimit(isPro)` for tier-aware lookups. Kept for backwards
   * compatibility with call sites written before the Pro tier shipped;
   * always equal to `MAX_HABITS_FREE`.
   */
  MAX_HABITS: 6,
} as const;

/**
 * Returns the applicable habit limit for the given Pro status.
 *
 * Pro users may create up to `LIMITS.MAX_HABITS_PRO` habits; everyone else
 * is capped at `LIMITS.MAX_HABITS_FREE`.
 */
export function getHabitLimit(isPro: boolean): number {
  return isPro ? LIMITS.MAX_HABITS_PRO : LIMITS.MAX_HABITS_FREE;
}

export default LIMITS;

import { describe, it, expect } from "vitest"
import { computeCounterView } from "../components/founding-counter"

/**
 * Unit tests for `computeCounterView` — the pure view-model helper for the
 * landing page founding counter.
 *
 * Validates: Requirements R10.2, R10.4, R10.6, R11.1, R11.4, R15.4
 */
describe("computeCounterView", () => {
  // -------------------------------------------------------------------------
  // Nominal cases
  // -------------------------------------------------------------------------

  it("claimed = 0 → available, remaining 100", () => {
    const result = computeCounterView(0, 100)
    expect(result.status).toBe("available")
    expect(result.remaining).toBe(100)
  })

  it("claimed = 50 → available, remaining 50", () => {
    const result = computeCounterView(50, 100)
    expect(result.status).toBe("available")
    expect(result.remaining).toBe(50)
  })

  it("claimed = 99 → available, remaining 1", () => {
    const result = computeCounterView(99, 100)
    expect(result.status).toBe("available")
    expect(result.remaining).toBe(1)
  })

  it("claimed = 100 → sold-out, remaining 0 (R10.6, R11.1)", () => {
    const result = computeCounterView(100, 100)
    expect(result.status).toBe("sold-out")
    expect(result.remaining).toBe(0)
  })

  it("claimed = null (read failure) → hidden (R10.4)", () => {
    const result = computeCounterView(null, 100)
    expect(result.status).toBe("hidden")
  })

  it("cap = 0 → sold-out (R11.4)", () => {
    const result = computeCounterView(0, 0)
    expect(result.status).toBe("sold-out")
    expect(result.remaining).toBe(0)
  })

  // -------------------------------------------------------------------------
  // Property 8: Landing counter reflects the authoritative counter
  //
  // remaining/sold-out state is derived from the same `claimed` value the
  // function maintains; shows cap − claimed when below cap and sold-out at
  // cap or when cap === 0.
  //
  // Validates: Requirements R10.2, R11.1, R11.4, R15.4
  // -------------------------------------------------------------------------

  it("Property 8: remaining equals cap − claimed for all in-range values", () => {
    const cap = 100
    for (let claimed = 0; claimed < cap; claimed++) {
      const result = computeCounterView(claimed, cap)
      expect(result.status).toBe("available")
      expect(result.remaining).toBe(cap - claimed)
    }
  })

  it("Property 8: sold-out at exactly cap", () => {
    const result = computeCounterView(100, 100)
    expect(result.status).toBe("sold-out")
    expect(result.remaining).toBe(0)
  })

  it("Property 8: remaining is clamped ≥ 0 even if claimed exceeds cap", () => {
    const result = computeCounterView(101, 100)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
    expect(result.status).toBe("sold-out")
  })

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  it("claimed = 1 with cap = 1 → sold-out, remaining 0", () => {
    const result = computeCounterView(1, 1)
    expect(result.status).toBe("sold-out")
    expect(result.remaining).toBe(0)
  })

  it("claimed = 0 with cap = 1 → available, remaining 1", () => {
    const result = computeCounterView(0, 1)
    expect(result.status).toBe("available")
    expect(result.remaining).toBe(1)
  })
})

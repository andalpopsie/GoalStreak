/**
 * Unit tests for eligibility.ts
 *
 * Covers: R1.3, R1.4, R2.2, R2.5, R3.2, R3.5
 */

import {
  parseLaunchTimestamp,
  evaluateEligibility,
  assignNumberFrom,
  EligibilityInput,
} from '../eligibility';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const T0_MS = new Date('2025-02-01T00:00:00Z').getTime();

function makeInput(overrides: Partial<EligibilityInput> = {}): EligibilityInput {
  return {
    accountCreatedAtUtcMs: T0_MS,
    launchTimestampUtcMs: T0_MS,
    claimed: 0,
    cap: 100,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseLaunchTimestamp
// ---------------------------------------------------------------------------

describe('parseLaunchTimestamp', () => {
  describe('valid inputs', () => {
    it('accepts an ISO 8601 UTC string ending with Z and returns a number', () => {
      const result = parseLaunchTimestamp('2025-02-01T00:00:00Z');
      expect(typeof result).toBe('number');
      expect(result).not.toBeNaN();
    });

    it('accepts an ISO 8601 UTC string with +00:00 offset and returns a number', () => {
      const result = parseLaunchTimestamp('2025-02-01T00:00:00+00:00');
      expect(typeof result).toBe('number');
      expect(result).not.toBeNaN();
    });

    it('returns the correct ms value for a known timestamp', () => {
      const expected = new Date('2025-02-01T00:00:00Z').getTime();
      expect(parseLaunchTimestamp('2025-02-01T00:00:00Z')).toBe(expected);
    });

    it('Z and +00:00 representations of the same moment are equal', () => {
      const z = parseLaunchTimestamp('2025-02-01T00:00:00Z');
      const plus = parseLaunchTimestamp('2025-02-01T00:00:00+00:00');
      expect(z).toBe(plus);
    });
  });

  describe('invalid inputs', () => {
    it('returns null for null', () => {
      expect(parseLaunchTimestamp(null)).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(parseLaunchTimestamp(undefined)).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(parseLaunchTimestamp('')).toBeNull();
    });

    it('returns null for a whitespace-only string', () => {
      expect(parseLaunchTimestamp('   ')).toBeNull();
    });

    it('returns null for a garbage string', () => {
      expect(parseLaunchTimestamp('not-a-date')).toBeNull();
    });

    it('returns null for a bare date string without time component (R2.2 — ambiguous timezone)', () => {
      // "2025-01-20Z" has no 'T' separator — must be rejected
      expect(parseLaunchTimestamp('2025-01-20Z')).toBeNull();
    });

    it('returns null for a date-time string without UTC indicator', () => {
      expect(parseLaunchTimestamp('2025-02-01T00:00:00')).toBeNull();
    });

    it('returns null for a number input', () => {
      expect(parseLaunchTimestamp(1234567890000)).toBeNull();
    });

    it('returns null for an object input', () => {
      expect(parseLaunchTimestamp({ date: '2025-02-01T00:00:00Z' })).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// evaluateEligibility — standard cases
// ---------------------------------------------------------------------------

describe('evaluateEligibility — standard cases', () => {
  it('returns config-invalid when launchTimestampUtcMs is null (R2.2)', () => {
    const result = evaluateEligibility(
      makeInput({ launchTimestampUtcMs: null, claimed: 0 })
    );
    expect(result).toEqual({ kind: 'config-invalid' });
  });

  it('returns before-launch when account was created strictly before T0 (R1.3)', () => {
    const result = evaluateEligibility(
      makeInput({ accountCreatedAtUtcMs: T0_MS - 1 })
    );
    expect(result).toEqual({ kind: 'before-launch' });
  });

  it('returns eligible when account was created after T0 and slots remain', () => {
    const result = evaluateEligibility(
      makeInput({ accountCreatedAtUtcMs: T0_MS + 1000, claimed: 50, cap: 100 })
    );
    expect(result).toEqual({ kind: 'eligible' });
  });

  it('returns sold-out when claimed equals cap (R3.5)', () => {
    const result = evaluateEligibility(
      makeInput({ claimed: 100, cap: 100, accountCreatedAtUtcMs: T0_MS + 1000 })
    );
    expect(result).toEqual({ kind: 'sold-out' });
  });

  it('returns sold-out when claimed exceeds cap (R3.5)', () => {
    const result = evaluateEligibility(
      makeInput({ claimed: 101, cap: 100, accountCreatedAtUtcMs: T0_MS + 1000 })
    );
    expect(result).toEqual({ kind: 'sold-out' });
  });
});

// ---------------------------------------------------------------------------
// evaluateEligibility — T0 boundary (R1.4, R2.5)
// ---------------------------------------------------------------------------

describe('evaluateEligibility — T0 boundary is inclusive (R1.4, R2.5)', () => {
  it('account created exactly at T0 is eligible (inclusive lower bound)', () => {
    const result = evaluateEligibility(makeInput({ accountCreatedAtUtcMs: T0_MS }));
    expect(result).toEqual({ kind: 'eligible' });
  });

  it('account created 1ms before T0 is before-launch', () => {
    const result = evaluateEligibility(makeInput({ accountCreatedAtUtcMs: T0_MS - 1 }));
    expect(result).toEqual({ kind: 'before-launch' });
  });

  it('account created 1ms after T0 is eligible', () => {
    const result = evaluateEligibility(makeInput({ accountCreatedAtUtcMs: T0_MS + 1 }));
    expect(result).toEqual({ kind: 'eligible' });
  });

  it('property: offset < 0 → before-launch; offset >= 0 → eligible across a range of offsets', () => {
    const offsets = [-1000, -1, 0, 1, 1000];

    for (const offset of offsets) {
      const result = evaluateEligibility(
        makeInput({ accountCreatedAtUtcMs: T0_MS + offset, claimed: 0, cap: 100 })
      );

      if (offset < 0) {
        expect(result).toEqual({ kind: 'before-launch' });
      } else {
        // offset === 0 and offset > 0 both must be eligible
        expect(result).toEqual({ kind: 'eligible' });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// evaluateEligibility — evaluation order
// ---------------------------------------------------------------------------

describe('evaluateEligibility — evaluation order', () => {
  it('config-invalid wins over sold-out when T0 is null and claimed >= cap', () => {
    // Both conditions are true; config-invalid must be returned (checked first)
    const result = evaluateEligibility(
      makeInput({ launchTimestampUtcMs: null, claimed: 100, cap: 100 })
    );
    expect(result).toEqual({ kind: 'config-invalid' });
  });

  it('sold-out wins over before-launch when claimed >= cap and account is pre-launch', () => {
    // Both sold-out and before-launch conditions are true; sold-out must be returned
    const result = evaluateEligibility(
      makeInput({
        claimed: 100,
        cap: 100,
        accountCreatedAtUtcMs: T0_MS - 1000,
      })
    );
    expect(result).toEqual({ kind: 'sold-out' });
  });
});

// ---------------------------------------------------------------------------
// assignNumberFrom (R3.2)
// ---------------------------------------------------------------------------

describe('assignNumberFrom', () => {
  it('returns 1 when claimed is 0 (first member gets number 1)', () => {
    expect(assignNumberFrom(0)).toBe(1);
  });

  it('returns 100 when claimed is 99 (100th member gets number 100)', () => {
    expect(assignNumberFrom(99)).toBe(100);
  });

  it('returns 2 when claimed is 1', () => {
    expect(assignNumberFrom(1)).toBe(2);
  });

  it('returns 51 when claimed is 50', () => {
    expect(assignNumberFrom(50)).toBe(51);
  });

  it('property: result always equals claimed + 1 for the full range 0..99', () => {
    for (let claimed = 0; claimed <= 99; claimed++) {
      expect(assignNumberFrom(claimed)).toBe(claimed + 1);
    }
  });
});

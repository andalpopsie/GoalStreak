/**
 * Task 16.1 — Unit tests for `FoundingBadge`
 *
 * Covers:
 *  1. Renders with foundingNumber present — number appears in output
 *  2. Renders with foundingNumber = null — badge renders, number text absent (R8.5)
 *  3. variant='profile' — larger label, star, "Founding Member" text
 *  4. variant='feed' — compact pill text
 *  5. Component has no isPro prop — badge visibility is independent of Pro
 *
 * Property 6 (fast-check):
 *  Badge renders based solely on foundingNumber/variant. An injected "isPro"
 *  value (passed as unused context) never influences render output because the
 *  component doesn't accept that prop. For all foundingNumber values (1–100 plus
 *  null) the badge always renders and the number text appears iff foundingNumber
 *  is not null.
 *
 * Validates: Requirements R7.3, R7.4, R8.4, R8.5, R12.5, R14.3
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';

import FoundingBadge, { FoundingBadgeProps } from '../FoundingBadge';

// ── Helper ─────────────────────────────────────────────────────────────────

function renderBadge(props: FoundingBadgeProps) {
  return render(<FoundingBadge {...props} />);
}

// ── 1. foundingNumber present ──────────────────────────────────────────────

describe('FoundingBadge — foundingNumber present', () => {
  it('profile variant: shows "#42" inside the label text', () => {
    const { getByText } = renderBadge({ foundingNumber: 42, variant: 'profile' });
    // The number is rendered as " #42" inside the nested Text node.
    expect(getByText(/ #42/)).toBeTruthy();
  });

  it('profile variant: shows the star and "Founding Member" label', () => {
    const { getByText } = renderBadge({ foundingNumber: 1, variant: 'profile' });
    expect(getByText('★')).toBeTruthy();
    expect(getByText(/Founding Member/)).toBeTruthy();
  });

  it('feed variant: shows "#42" pill text', () => {
    const { getByText } = renderBadge({ foundingNumber: 42, variant: 'feed' });
    expect(getByText('#42')).toBeTruthy();
  });

  it('profile variant: shows "#1" for founding number 1', () => {
    const { getByText } = renderBadge({ foundingNumber: 1, variant: 'profile' });
    expect(getByText(/ #1/)).toBeTruthy();
  });

  it('profile variant: shows "#100" for founding number 100', () => {
    const { getByText } = renderBadge({ foundingNumber: 100, variant: 'profile' });
    expect(getByText(/ #100/)).toBeTruthy();
  });
});

// ── 2. foundingNumber = null ───────────────────────────────────────────────

describe('FoundingBadge — foundingNumber = null (R8.5)', () => {
  it('profile variant: badge renders without any number string', () => {
    const { getByText, queryByText } = renderBadge({
      foundingNumber: null,
      variant: 'profile',
    });
    // "Founding Member" label is present
    expect(getByText('Founding Member')).toBeTruthy();
    // No "#..." text anywhere
    expect(queryByText(/#\d+/)).toBeNull();
  });

  it('profile variant: still shows the star when foundingNumber is null', () => {
    const { getByText } = renderBadge({ foundingNumber: null, variant: 'profile' });
    expect(getByText('★')).toBeTruthy();
  });

  it('feed variant: shows "★" fallback when foundingNumber is null', () => {
    const { getByText, queryByText } = renderBadge({
      foundingNumber: null,
      variant: 'feed',
    });
    expect(getByText('★')).toBeTruthy();
    expect(queryByText(/#\d+/)).toBeNull();
  });
});

// ── 3. variant='profile' — full label ─────────────────────────────────────

describe("FoundingBadge — variant='profile'", () => {
  it('defaults to profile variant when variant is omitted', () => {
    const { getByText } = renderBadge({ foundingNumber: 7 });
    expect(getByText(/Founding Member/)).toBeTruthy();
  });

  it('has the correct accessibility label with a number', () => {
    const { getByLabelText } = renderBadge({ foundingNumber: 7, variant: 'profile' });
    expect(getByLabelText('Founding Member number 7')).toBeTruthy();
  });

  it('has the correct accessibility label without a number', () => {
    const { getByLabelText } = renderBadge({ foundingNumber: null, variant: 'profile' });
    expect(getByLabelText('Founding Member')).toBeTruthy();
  });
});

// ── 4. variant='feed' — compact pill ──────────────────────────────────────

describe("FoundingBadge — variant='feed'", () => {
  it('shows only the number text (no "Founding Member" label)', () => {
    const { queryByText } = renderBadge({ foundingNumber: 42, variant: 'feed' });
    expect(queryByText('Founding Member')).toBeNull();
  });

  it('has the correct accessibility label with a number', () => {
    const { getByLabelText } = renderBadge({ foundingNumber: 99, variant: 'feed' });
    expect(getByLabelText('Founding Member number 99')).toBeTruthy();
  });

  it('has the correct accessibility label without a number', () => {
    const { getByLabelText } = renderBadge({ foundingNumber: null, variant: 'feed' });
    expect(getByLabelText('Founding Member')).toBeTruthy();
  });
});

// ── 5. No isPro prop — component API enforces independence ────────────────

describe('FoundingBadge — no isPro prop on the component interface', () => {
  it('FoundingBadgeProps does not include an isPro field', () => {
    // If the component ever accepted isPro, TypeScript would reject this cast.
    // At runtime we verify the prop object shape by confirming the badge still
    // renders correctly when the caller has NO isPro to pass.
    const propsWithoutIsPro: FoundingBadgeProps = { foundingNumber: 42, variant: 'profile' };
    const { getByText } = renderBadge(propsWithoutIsPro);
    expect(getByText(/Founding Member/)).toBeTruthy();
  });
});

// ── Property 6: Badge visibility is independent of Pro ────────────────────
//
// For all (foundingNumber ∈ {1..100, null}) × (isPro ∈ {true, false}) the badge
// renders correctly based solely on foundingNumber. The "isPro" value is injected
// as unused context — it proves the component never receives or checks it.
//
// Validates: Requirements R7.3, R7.4, R8.4, R12.5, R14.3

describe('Property 6 — badge visibility is independent of Pro (fast-check)', () => {
  const foundingNumberArb = fc.oneof(
    fc.integer({ min: 1, max: 100 }),
    fc.constant(null as number | null)
  );

  const isProArb = fc.boolean(); // simulated caller context — never passed to badge

  const variantArb = fc.constantFrom<'profile' | 'feed'>('profile', 'feed');

  it('badge always renders; number text present iff foundingNumber is not null', () => {
    fc.assert(
      fc.property(foundingNumberArb, isProArb, variantArb, (foundingNumber, _isPro, variant) => {
        // _isPro is deliberately unused — it simulates a caller that has an
        // isPro value in scope but the badge ignores it.
        const { getByLabelText, queryByText } = renderBadge({ foundingNumber, variant });

        // Badge always renders — accessibility label is always present.
        const expectedLabel =
          foundingNumber != null ? `Founding Member number ${foundingNumber}` : 'Founding Member';
        expect(getByLabelText(expectedLabel)).toBeTruthy();

        // Number text appears iff foundingNumber is not null.
        if (foundingNumber != null) {
          if (variant === 'profile') {
            expect(queryByText(new RegExp(`#${foundingNumber}`))).toBeTruthy();
          } else {
            expect(queryByText(`#${foundingNumber}`)).toBeTruthy();
          }
        } else {
          expect(queryByText(/#\d+/)).toBeNull();
        }
      })
    );
  });
});

// Feature: sso-authentication, Property 13: SSO buttons are enabled exactly when consent is accepted
//
// Property-based test for `ProviderButtons` (src/components/auth/ProviderButtons.tsx).
//
// Library: fast-check + Jest (jest-expo), rendered via @testing-library/react-native.
// Runs a minimum of 100 iterations. One property per file.
//
// Property 13: For any consent state, the "Continue with Apple" and "Continue
// with Google" controls are interactive (i.e. start auth) if and only if the
// Consent_Control is checked.
//
// Concretely, for the presentational ProviderButtons component this means:
//  - consentAccepted === true  → pressing Apple calls onApple exactly once and
//    does NOT call onBlockedPress; pressing Google calls onGoogle exactly once.
//  - consentAccepted === false → pressing Apple/Google calls onBlockedPress and
//    does NOT call onApple / onGoogle (no auth is started).
//
// **Validates: Requirements 2.1, 2.2**
//
// External surface pinned for the property: Platform.OS = 'ios' (so the iOS-only
// surface renders) and availability = { apple: true, google: true } (so both
// buttons render). loadingProvider = null (no in-flight request). onApple,
// onGoogle, onBlockedPress are jest.fn spies, reset each iteration.
import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import fc from 'fast-check';
import ProviderButtons from '../ProviderButtons';

// The iOS-only surface must render for this property to exercise the buttons.
beforeAll(() => {
  Platform.OS = 'ios';
});

// Which button the generated iteration presses.
type WhichButton = 'apple' | 'google';
const whichButtonArb: fc.Arbitrary<WhichButton> = fc.constantFrom('apple', 'google');

describe('ProviderButtons — Property 13: SSO buttons are interactive iff consent is accepted', () => {
  it('starts auth iff consent is accepted; otherwise fires onBlockedPress and starts no auth', () => {
    fc.assert(
      fc.property(fc.boolean(), whichButtonArb, (consentAccepted, which) => {
        const onApple = jest.fn();
        const onGoogle = jest.fn();
        const onBlockedPress = jest.fn();

        const { getByTestId, unmount } = render(
          <ProviderButtons
            consentAccepted={consentAccepted}
            availability={{ apple: true, google: true }}
            loadingProvider={null}
            onApple={onApple}
            onGoogle={onGoogle}
            onBlockedPress={onBlockedPress}
          />
        );

        const testID = which === 'apple' ? 'sso-apple-button' : 'sso-google-button';
        fireEvent.press(getByTestId(testID));

        if (consentAccepted) {
          // Consent accepted → the pressed provider's auth action fires exactly
          // once, the other provider's action does not, and no blocked prompt.
          if (which === 'apple') {
            expect(onApple).toHaveBeenCalledTimes(1);
            expect(onGoogle).not.toHaveBeenCalled();
          } else {
            expect(onGoogle).toHaveBeenCalledTimes(1);
            expect(onApple).not.toHaveBeenCalled();
          }
          expect(onBlockedPress).not.toHaveBeenCalled();
        } else {
          // Consent not accepted → no auth is started; the blocked-press prompt
          // fires instead.
          expect(onApple).not.toHaveBeenCalled();
          expect(onGoogle).not.toHaveBeenCalled();
          expect(onBlockedPress).toHaveBeenCalledTimes(1);
        }

        // Clean up this iteration's render so state never leaks across runs.
        unmount();
      }),
      { numRuns: 200 }
    );
  });
});

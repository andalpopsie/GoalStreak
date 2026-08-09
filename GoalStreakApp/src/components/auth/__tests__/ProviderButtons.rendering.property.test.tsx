// Feature: sso-authentication, Property 12: Only available providers render, email/password always renders
//
// Property-based test for ProviderButtons SSO-control rendering. Library:
// fast-check + Jest (jest-expo). Minimum 100 iterations, one property per file.
//
// Property 12 (design.md): For any combination of Apple and Google availability
// flags on iOS, the Auth_Screen renders an SSO control if and only if that
// provider is available, and always renders the email/password controls
// regardless of SSO availability.
//
// Validates: Requirements 1.5 (and 1.4 via iOS gating)
//
// Scope: ProviderButtons is the SSO-control renderer — the testable unit for
// the "only available providers render" half of the property. This test drives
// availability = { apple, google } and consentAccepted across their full
// boolean space (on Platform.OS === 'ios') and asserts:
//   - the Apple SSO control is present iff availability.apple
//   - the Google SSO control is present iff availability.google
//   - when neither provider is available the component renders nothing (null)
// The "email/password always renders" half is a screen-level concern verified
// where ProviderButtons is wired into the auth screen (task 6.5); ProviderButtons
// itself never touches the email/password controls, so their presence is
// independent of any availability combination it is given here.

import React from 'react';
import fc from 'fast-check';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import ProviderButtons from '../ProviderButtons';

// ProviderButtons renders its SSO controls only on iOS (R1.4). Pin the platform
// to iOS so the availability-driven rendering (R1.5) is what is under test.
beforeAll(() => {
  Platform.OS = 'ios';
});

describe('ProviderButtons rendering — Property 12: only available providers render', () => {
  it('renders each SSO control iff its provider is available (iOS)', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // availability.apple
        fc.boolean(), // availability.google
        fc.boolean(), // consentAccepted (must not affect which controls render)
        (apple, google, consentAccepted) => {
          const { queryByTestId, unmount } = render(
            <ProviderButtons
              consentAccepted={consentAccepted}
              availability={{ apple, google }}
              loadingProvider={null}
              onApple={() => {}}
              onGoogle={() => {}}
              onBlockedPress={() => {}}
            />
          );

          const appleButton = queryByTestId('sso-apple-button');
          const googleButton = queryByTestId('sso-google-button');
          const container = queryByTestId('provider-buttons');

          // Each SSO control is present iff its provider is available (R1.5).
          expect(appleButton !== null).toBe(apple);
          expect(googleButton !== null).toBe(google);

          if (!apple && !google) {
            // With no available provider there is nothing to render — the whole
            // control group is omitted rather than shown empty (R1.5).
            expect(container).toBeNull();
          } else {
            expect(container).not.toBeNull();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

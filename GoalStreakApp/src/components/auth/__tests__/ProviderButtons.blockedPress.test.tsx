// Feature: sso-authentication — focused EXAMPLE test for the tap-while-disabled
// prompt behavior of `ProviderButtons` (src/components/auth/ProviderButtons.tsx).
//
// Library: Jest (jest-expo) + @testing-library/react-native.
//
// Behavior under test (R2.5): while consent is unchecked the SSO buttons are
// visually disabled, but a tap must still register and fire onBlockedPress
// WITHOUT starting auth (onApple / onGoogle are never called). This complements
// the broader consent-gate property test (ProviderButtons.consentGate.property.test.tsx)
// with a small, concrete example targeting the blocked-press prompt specifically.
//
// **Validates: Requirements 2.5**
//
// External surface pinned: Platform.OS = 'ios' (so the iOS-only surface renders)
// and availability = { apple: true, google: true } (so both buttons render).
// loadingProvider = null (no in-flight request).
import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ProviderButtons from '../ProviderButtons';

// The iOS-only surface must render for the buttons to exist.
beforeAll(() => {
  Platform.OS = 'ios';
});

describe('ProviderButtons — tap-while-disabled prompt (R2.5)', () => {
  it('fires onBlockedPress and starts no auth when Apple is tapped with consent unchecked', () => {
    const onApple = jest.fn();
    const onGoogle = jest.fn();
    const onBlockedPress = jest.fn();

    const { getByTestId } = render(
      <ProviderButtons
        consentAccepted={false}
        availability={{ apple: true, google: true }}
        loadingProvider={null}
        onApple={onApple}
        onGoogle={onGoogle}
        onBlockedPress={onBlockedPress}
      />
    );

    fireEvent.press(getByTestId('sso-apple-button'));

    expect(onBlockedPress).toHaveBeenCalledTimes(1);
    expect(onApple).not.toHaveBeenCalled();
    expect(onGoogle).not.toHaveBeenCalled();
  });

  it('fires onBlockedPress and starts no auth when Google is tapped with consent unchecked', () => {
    const onApple = jest.fn();
    const onGoogle = jest.fn();
    const onBlockedPress = jest.fn();

    const { getByTestId } = render(
      <ProviderButtons
        consentAccepted={false}
        availability={{ apple: true, google: true }}
        loadingProvider={null}
        onApple={onApple}
        onGoogle={onGoogle}
        onBlockedPress={onBlockedPress}
      />
    );

    fireEvent.press(getByTestId('sso-google-button'));

    expect(onBlockedPress).toHaveBeenCalledTimes(1);
    expect(onApple).not.toHaveBeenCalled();
    expect(onGoogle).not.toHaveBeenCalled();
  });

  // Positive control: the prompt only happens while disabled. Once consent is
  // accepted, tapping Apple starts auth and does NOT fire the blocked prompt.
  it('starts Apple auth (no blocked prompt) when consent is accepted', () => {
    const onApple = jest.fn();
    const onGoogle = jest.fn();
    const onBlockedPress = jest.fn();

    const { getByTestId } = render(
      <ProviderButtons
        consentAccepted={true}
        availability={{ apple: true, google: true }}
        loadingProvider={null}
        onApple={onApple}
        onGoogle={onGoogle}
        onBlockedPress={onBlockedPress}
      />
    );

    fireEvent.press(getByTestId('sso-apple-button'));

    expect(onApple).toHaveBeenCalledTimes(1);
    expect(onBlockedPress).not.toHaveBeenCalled();
    expect(onGoogle).not.toHaveBeenCalled();
  });
});

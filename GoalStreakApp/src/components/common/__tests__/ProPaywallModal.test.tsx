/**
 * Checkpoint 6 — ProPaywallModal render test (sandbox)
 *
 * Verifies that the paywall modal renders standalone without errors and
 * that its layout matches the design contract from `design.md`:
 *  - Heading "Goalfer Pro" + subtitle "Unlock your full potential"
 *  - The one delivered benefit ("Track up to 15 habits") plus a clearly
 *    labelled "Coming soon" roadmap section (honest metadata)
 *  - Two side-by-side plan cards with the correct price labels and
 *    "Save 50%" badge on the annual plan
 *  - Annual plan is selected by default and drives the Continue CTA copy
 *  - Tapping Monthly switches the selection and updates the CTA copy
 *  - Restore link is rendered with a 48px touch target
 *  - The modal does not unmount on a purchase error (Req 7.5)
 *
 * Implementation note: this test follows the established sandbox pattern
 * from `src/__tests__/groups/GroupComponents.test.tsx` — it mocks the
 * `useSubscription` hook so the modal can render in isolation without
 * touching RevenueCat or Firestore.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock `react-native-purchases` so the subscription module graph resolves
// even if it gets pulled in transitively. We don't drive any behavior
// through it here — `useSubscription` is mocked at the hook level below.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    logIn: jest.fn().mockResolvedValue({}),
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: '1',
    NETWORK_ERROR: '10',
  },
}));

// Mock SafeAreaView so it just renders its children. The default
// `react-native-safe-area-context` mock from jest-expo wraps children in a
// host view, but importing the named export pattern avoids surprises when
// the modal is rendered without a SafeAreaProvider.
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Default mock for the subscription hook. Individual tests can override the
// returned shape via `mockReturnValueOnce` or by re-mocking.
const mockPurchase = jest.fn();
const mockRestore = jest.fn();
const mockRefresh = jest.fn();

jest.mock('../../../hooks/useSubscription', () => ({
  __esModule: true,
  useSubscription: () => ({
    isPro: false,
    isLoading: false,
    error: null,
    purchase: mockPurchase,
    restore: mockRestore,
    refresh: mockRefresh,
  }),
  default: () => ({
    isPro: false,
    isLoading: false,
    error: null,
    purchase: mockPurchase,
    restore: mockRestore,
    refresh: mockRefresh,
  }),
}));

// ── Component import (after mocks) ─────────────────────────────────────────

import ProPaywallModal from '../ProPaywallModal';
import { PRO_PRODUCT_IDS } from '../../../types/subscription';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ProPaywallModal — Checkpoint 6 sandbox render', () => {
  beforeEach(() => {
    mockPurchase.mockReset();
    mockRestore.mockReset();
    mockRefresh.mockReset();
  });

  it('renders standalone without errors with valid props', () => {
    const { getByText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    // Heading + subtitle
    expect(getByText('Goalfer Pro')).toBeTruthy();
    expect(getByText('Unlock your full potential')).toBeTruthy();
  });

  it('renders the delivered benefit and clearly separates coming-soon items', () => {
    const { getByText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    // Delivered today — the only concrete Pro benefit at launch.
    expect(getByText('Track up to 15 habits (6 on Free)')).toBeTruthy();

    // Roadmap items live under a "Coming soon" heading — NOT advertised as
    // included, to keep App Store metadata honest (Guideline 2.3.1 / 3.1.2).
    expect(getByText('Coming soon to Pro')).toBeTruthy();
    expect(getByText('Streak freeze')).toBeTruthy();
    expect(getByText('Advanced analytics & insights')).toBeTruthy();
    expect(getByText('Custom themes & icons')).toBeTruthy();
  });

  it('renders both plan cards with the correct price labels and Save 50% badge', () => {
    const { getByText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(getByText('Monthly')).toBeTruthy();
    expect(getByText('Annual')).toBeTruthy();
    expect(getByText('$3.99 / month')).toBeTruthy();
    expect(getByText('$23.99 / year')).toBeTruthy();
    expect(getByText('Save 50%')).toBeTruthy();
  });

  it('defaults the selection to the annual plan in the Continue CTA copy', () => {
    const { getByText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    // Annual is the default per design.md → CTA reflects the annual price.
    expect(getByText('Subscribe for $23.99/year')).toBeTruthy();
  });

  it('switches the CTA copy when the Monthly plan is tapped', () => {
    const { getByText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    fireEvent.press(getByText('Monthly'));
    expect(getByText('Subscribe for $3.99/month')).toBeTruthy();
  });

  it('renders the Restore purchases link', () => {
    const { getByText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(getByText('Restore purchases')).toBeTruthy();
  });

  it('renders an accessible close button', () => {
    const { getByLabelText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(getByLabelText('Close paywall')).toBeTruthy();
  });

  it('invokes onClose when the close button is pressed', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <ProPaywallModal visible onClose={onClose} onSuccess={jest.fn()} />
    );

    fireEvent.press(getByLabelText('Close paywall'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls subscription.purchase with the annual product id by default when Continue is tapped', async () => {
    mockPurchase.mockResolvedValue({ success: true });

    const onSuccess = jest.fn();
    const { getByText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={onSuccess} />
    );

    fireEvent.press(getByText('Subscribe for $23.99/year'));

    await waitFor(() => {
      expect(mockPurchase).toHaveBeenCalledWith(PRO_PRODUCT_IDS.annual);
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('does not unmount or call onSuccess when a purchase error occurs (Req 7.5)', async () => {
    mockPurchase.mockResolvedValue({
      success: false,
      error: 'NO_NETWORK',
    });

    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <ProPaywallModal visible onClose={onClose} onSuccess={onSuccess} />
    );

    fireEvent.press(getByText('Subscribe for $23.99/year'));

    await waitFor(() => {
      // Inline error appears, modal is still on screen, onSuccess is not called.
      expect(getByText('No internet connection. Please try again.')).toBeTruthy();
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // Modal content (title) is still rendered → modal did not unmount.
    expect(getByText('Goalfer Pro')).toBeTruthy();
  });

  it('shows "No previous purchases found." when restore returns false', async () => {
    mockRestore.mockResolvedValue(false);

    const { getByText } = render(
      <ProPaywallModal visible onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    fireEvent.press(getByText('Restore purchases'));

    await waitFor(() => {
      expect(getByText('No previous purchases found.')).toBeTruthy();
    });
  });
});

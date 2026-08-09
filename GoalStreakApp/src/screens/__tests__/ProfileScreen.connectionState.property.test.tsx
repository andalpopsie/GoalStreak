// Feature: sso-authentication, Property 9: Connection state reflects linked-provider membership
//
// Property-based test for the Settings connect/disconnect surface in
// ProfileScreen. Library: fast-check + Jest (jest-expo), rendered via
// @testing-library/react-native. Minimum 100 iterations, one property per file.
//
// Property 9 (design.md): For any set of linked provider ids on the current
// user, each Settings connect option is shown as "connected" if and only if its
// provider id is a member of that set.
//
// Validates: Requirements 8.3
//
// Scope: ProfileScreen derives each provider row's connection state purely from
// `connectedProviders.includes(provider)` (the linked-provider set exposed by
// useAuth). This test varies `connectedProviders` across the full subset space
// of { 'apple.com', 'google.com' } (plus the always-present 'password' provider,
// which must never make Apple/Google appear connected) and asserts, for each
// provider row, that its status indicator reports "Connected" iff that provider
// id is a member of the set, and "Not connected" otherwise.
//
// The Connected Accounts section renders only on iOS for the user's own profile
// (Platform.OS === 'ios' && isOwnProfile), so the platform is pinned to iOS and
// the route carries no `userId` param (own profile). All external boundaries
// (useAuth, sibling hooks, navigation, services, child components) are mocked so
// rendering is side-effect-free and each iteration is cheap.

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import fc from 'fast-check';
import type { SsoProviderId } from '../../services/ssoService';

// ── Mutable linked-provider set the mocked useAuth reports each iteration ──
// Named with the `mock` prefix so the jest.mock factory may reference it.
let mockConnectedProviders: Array<SsoProviderId | 'password'> = [];

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'u@example.com', displayName: 'U', username: 'u' },
    isAuthenticated: false, // keep the notification/profile-load effect from running
    logout: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteAccount: jest.fn(),
    connectedProviders: mockConnectedProviders,
    linkProvider: jest.fn(),
    unlinkProvider: jest.fn(),
  }),
}));

// Sibling hooks used by ProfileScreen.
jest.mock('../../hooks/useHabits', () => ({
  useHabits: () => ({ habits: [], streaks: {} }),
}));
jest.mock('../../hooks/useFriends', () => ({
  useFriends: () => ({ friends: [] }),
}));
jest.mock('../../hooks/useModeration', () => ({
  useModeration: () => ({ blockUser: jest.fn(), reportContent: jest.fn() }),
}));

// Navigation: own profile => no route params.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }),
  useRoute: () => ({ params: undefined }),
}));

// Services / utils (side-effect boundaries).
jest.mock('../../services/firebase', () => ({ auth: { currentUser: null } }));
jest.mock('../../services/photoService', () => ({ photoService: {} }));
jest.mock('../../services/enhancedAnalyticsService', () => ({
  trackScreen: jest.fn(),
  trackEvent: jest.fn(),
}));
jest.mock('../../services/motivationalNotificationService', () => ({
  motivationalNotificationService: {},
  notificationPreferencesService: { getPreferences: jest.fn(() => Promise.resolve({})) },
}));
jest.mock('../../utils/linkingUtils', () => ({
  openPrivacyPolicy: jest.fn(),
  openTermsOfService: jest.fn(),
  openSupport: jest.fn(),
}));
jest.mock('../../utils/usernameUtils', () => ({
  validateUsername: jest.fn(() => ({ valid: true })),
  isUsernameAvailable: jest.fn(() => Promise.resolve(true)),
  reserveUsername: jest.fn(() => Promise.resolve()),
  releaseUsername: jest.fn(() => Promise.resolve()),
}));

// Child components mocked to trivial renderers (their internals are irrelevant
// to the connection-state property).
jest.mock('../../components/profile/BadgeShowcase', () => () => null);
jest.mock('../../components/feedback/FeedbackModal', () => () => null);
jest.mock('../../components/common/ProPaywallModal', () => () => null);
jest.mock('../../components/social/ReportReasonSheet', () => () => null);

// SafeAreaView passthrough so no provider context is required.
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, SafeAreaProvider: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

// expo-notifications needs getPermissionsAsync if the guarded effect ever runs.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

import ProfileScreen from '../ProfileScreen';

beforeAll(() => {
  Platform.OS = 'ios';
});

// The two SSO providers the Settings surface exposes, with the testID key and
// human label ProfileScreen uses for each.
const PROVIDERS: Array<{ id: SsoProviderId; key: 'apple' | 'google'; label: string }> = [
  { id: 'apple.com', key: 'apple', label: 'Apple' },
  { id: 'google.com', key: 'google', label: 'Google' },
];

describe('ProfileScreen Connected Accounts — Property 9: connection state reflects linked-provider membership', () => {
  it('shows each provider row as Connected iff its provider id is in the linked set', () => {
    fc.assert(
      fc.property(
        // Arbitrary subset of the SSO providers that are linked...
        fc.subarray(['apple.com', 'google.com'] as SsoProviderId[]),
        // ...and whether the always-present email/password provider is present
        // too (it must never make an SSO row appear connected).
        fc.boolean(),
        (linkedSso, hasPassword) => {
          mockConnectedProviders = hasPassword
            ? [...linkedSso, 'password']
            : [...linkedSso];

          const { getByTestId, unmount } = render(<ProfileScreen />);

          // Section must be present (iOS + own profile).
          expect(getByTestId('sso-connected-accounts')).toBeTruthy();

          for (const provider of PROVIDERS) {
            const expectedConnected = linkedSso.includes(provider.id);
            const statusView = getByTestId(`sso-status-${provider.key}`);

            // The status indicator conveys state via accessibilityLabel AND text
            // (never color alone). Assert on the accessibilityLabel, which is
            // exactly "{Provider} connected" / "{Provider} not connected".
            const expectedLabel = expectedConnected
              ? `${provider.label} connected`
              : `${provider.label} not connected`;
            expect(statusView.props.accessibilityLabel).toBe(expectedLabel);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

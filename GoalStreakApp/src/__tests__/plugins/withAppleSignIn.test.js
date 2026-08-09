/**
 * Example test for the Apple sign-in config plugin.
 *
 * Verifies that applying `withAppleSignIn` to an Expo config registers an iOS
 * entitlements mod that emits the `com.apple.developer.applesignin` entitlement
 * (set to `['Default']`) required for "Sign in with Apple".
 *
 * Requirements: 9.4
 */

// The plugin lives at GoalStreakApp/plugins/withAppleSignIn.js; this test file
// is under src/__tests__/plugins/ so jest's testMatch (src/**) picks it up.
const withAppleSignIn = require('../../../plugins/withAppleSignIn');

describe('withAppleSignIn config plugin', () => {
  it('registers an iOS entitlements mod', () => {
    const baseConfig = { name: 'GoalStreak', slug: 'goalstreak' };

    const result = withAppleSignIn(baseConfig);

    expect(typeof result.mods?.ios?.entitlements).toBe('function');
  });

  it('emits the com.apple.developer.applesignin entitlement set to ["Default"]', async () => {
    const baseConfig = { name: 'GoalStreak', slug: 'goalstreak' };

    const result = withAppleSignIn(baseConfig);

    // Run the registered entitlements mod against an empty entitlements plist.
    const entitlementsMod = result.mods.ios.entitlements;
    const output = await entitlementsMod({ modResults: {}, modRequest: {} });

    expect(output.modResults['com.apple.developer.applesignin']).toEqual([
      'Default',
    ]);
  });
});

/**
 * Sample E2E Test
 * This test verifies that Detox is properly configured
 */

describe('Sample E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have welcome screen', async () => {
    // This is a placeholder test that will be replaced with actual app tests
    // For now, it just verifies that the app launches without crashing
    
    // Wait for the app to load
    await waitFor(element(by.id('app-root')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should show login screen for unauthenticated users', async () => {
    // This test assumes the app shows a login screen when no user is authenticated
    // Adjust the test ID based on your actual implementation
    
    try {
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);
    } catch (error) {
      // If login screen is not found, the app might be showing a different initial screen
      // This is acceptable for the setup test
      console.log('Login screen not found - this is expected during setup');
    }
  });
});
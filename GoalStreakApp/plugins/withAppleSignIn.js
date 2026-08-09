const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * Config plugin that adds the "Sign in with Apple" entitlement
 * (com.apple.developer.applesignin) to the iOS app so Apple SSO works.
 */
function withAppleSignIn(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.applesignin"] = ["Default"];
    return config;
  });
}

module.exports = withAppleSignIn;

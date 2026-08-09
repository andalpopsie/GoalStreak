#!/usr/bin/env node

/**
 * SSO Release-Gate Build Guard
 *
 * Enforces the SSO release gate (Requirement 10): the SSO feature must NOT ship
 * in a build that would cancel the in-review App Store build 21. The first build
 * that may include SSO is build number >= 22.
 *
 * How it works:
 *   1. Reads the iOS build number from app.json (expo.ios.buildNumber).
 *   2. Detects whether the SSO feature is present in the build using a reliable
 *      heuristic: the SSO source files exist
 *      (src/services/ssoService.ts and src/components/auth/ProviderButtons.tsx).
 *   3. Decision:
 *        - SSO present AND buildNumber < 22  -> FAIL (exit 1). Including SSO now
 *          would require a new build, which cancels the in-review build 21.
 *        - buildNumber >= 22                 -> PASS (exit 0).
 *        - SSO source absent                 -> PASS (exit 0). Nothing to gate.
 *
 * Usage: npm run check:sso-release-gate   (or: node scripts/check-sso-release-gate.js)
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

const fs = require('fs');
const path = require('path');

const APP_JSON_PATH = path.join(__dirname, '../app.json');

// The first build number allowed to include the SSO feature (build 21 is in review).
const MIN_SSO_BUILD_NUMBER = 22;

// SSO source files whose presence indicates the feature is part of the build.
const SSO_SOURCE_FILES = [
  path.join(__dirname, '../src/services/ssoService.ts'),
  path.join(__dirname, '../src/components/auth/ProviderButtons.tsx'),
];

function isSsoPresent() {
  return SSO_SOURCE_FILES.some((file) => fs.existsSync(file));
}

function checkSsoReleaseGate() {
  console.log('🚦 Checking SSO release gate...\n');

  // Read app.json build number
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  const buildNumber = parseInt(appJson.expo.ios.buildNumber, 10);

  if (Number.isNaN(buildNumber)) {
    console.error('❌ Could not read a valid iOS build number from app.json (expo.ios.buildNumber)');
    process.exit(1);
  }

  const ssoPresent = isSsoPresent();

  console.log(`📱 iOS build number: ${buildNumber}`);
  console.log(`🔐 SSO feature present: ${ssoPresent ? 'yes' : 'no'}`);
  console.log(`🎯 Minimum build for SSO: ${MIN_SSO_BUILD_NUMBER}\n`);

  // Nothing to gate if SSO source is absent.
  if (!ssoPresent) {
    console.log('✅ SSO source not present in this build — nothing to gate. Passing.\n');
    return;
  }

  // SSO is present: enforce the build-number floor.
  if (buildNumber < MIN_SSO_BUILD_NUMBER) {
    console.error('❌ Release gate FAILED: SSO is present but the build number is too low.\n');
    console.error(
      `   Including SSO requires build number >= ${MIN_SSO_BUILD_NUMBER}, but app.json is set to ${buildNumber}.`
    );
    console.error(
      '   App Store build 21 is currently in review. Submitting a new build now would cancel that review.'
    );
    console.error('\n📋 To ship SSO:');
    console.error('   1. Wait for build 21 to reach a terminal review outcome (approved/rejected/withdrawn).');
    console.error(`   2. Bump the build number to >= ${MIN_SSO_BUILD_NUMBER} (npm run increment-build).`);
    console.error('   3. Commit, then build and submit.\n');
    process.exit(1);
  }

  console.log(
    `✅ Release gate PASSED: build ${buildNumber} is >= ${MIN_SSO_BUILD_NUMBER}, SSO is cleared to ship.\n`
  );
}

try {
  checkSsoReleaseGate();
} catch (error) {
  console.error('❌ Error checking SSO release gate:', error.message);
  process.exit(1);
}

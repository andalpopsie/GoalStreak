/**
 * SSO configuration & secrets smoke checks
 *
 * Feature: sso-authentication — Task 10.2
 *
 * These checks assert two release-gate facts:
 *   1. config.sso wires the three SSO client identifiers from the
 *      EXPO_PUBLIC_* env vars (EAS secrets), with an empty-string fallback
 *      when the var is absent.  (R9.3)
 *   2. No SSO secret values are committed to the repo's env files — the
 *      client ids are injected from EAS secrets at build time, never checked
 *      in.  (R9.3)
 *
 * INFRA PREREQUISITE (verified out-of-band, NOT assertable by a unit test) —
 * (R9.5): the Firebase Console must have both the Apple and Google providers
 * enabled, with the Apple Services ID + sign-in key configured and the Google
 * OAuth client set up, and the matching EXPO_PUBLIC_* values must exist as EAS
 * secrets for the build profile. A unit test runs with no network/Console
 * access, so provider enablement is confirmed manually during release prep and
 * is intentionally out of scope here.
 */

import * as fs from 'fs';
import * as path from 'path';

// The three env vars that back config.sso.
const SSO_ENV_KEYS = [
  'EXPO_PUBLIC_APPLE_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
] as const;

/**
 * Load a fresh copy of the environment module so it re-reads process.env.
 * environment.ts builds `config` at module-eval time, so we must reset the
 * module registry before requiring it again.
 */
function loadFreshConfig() {
  let loaded: typeof import('../environment');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    loaded = require('../environment');
  });
  // @ts-expect-error assigned inside isolateModules callback
  return loaded.config;
}

describe('SSO config & secrets smoke checks', () => {
  // Snapshot and restore the SSO env vars around each test so we never leak
  // fabricated values into other suites.
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of SSO_ENV_KEYS) {
      savedEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of SSO_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
    jest.resetModules();
  });

  describe('config.sso reads from EXPO_PUBLIC_* env vars (R9.3)', () => {
    it('maps each EXPO_PUBLIC_* var onto the matching config.sso field', () => {
      process.env.EXPO_PUBLIC_APPLE_CLIENT_ID = 'com.goalstreak.app.service';
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '111-ios.apps.googleusercontent.com';
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = '222-web.apps.googleusercontent.com';

      const config = loadFreshConfig();

      expect(config.sso.appleClientId).toBe('com.goalstreak.app.service');
      expect(config.sso.googleIosClientId).toBe('111-ios.apps.googleusercontent.com');
      expect(config.sso.googleWebClientId).toBe('222-web.apps.googleusercontent.com');
    });

    it('falls back to empty strings when the env vars are unset', () => {
      for (const key of SSO_ENV_KEYS) {
        delete process.env[key];
      }

      const config = loadFreshConfig();

      expect(config.sso.appleClientId).toBe('');
      expect(config.sso.googleIosClientId).toBe('');
      expect(config.sso.googleWebClientId).toBe('');
    });

    it('reflects changes independently per field (no cross-wiring)', () => {
      // Only the Google web client id is set; the other two must stay empty.
      delete process.env.EXPO_PUBLIC_APPLE_CLIENT_ID;
      delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = '333-web.apps.googleusercontent.com';

      const config = loadFreshConfig();

      expect(config.sso.appleClientId).toBe('');
      expect(config.sso.googleIosClientId).toBe('');
      expect(config.sso.googleWebClientId).toBe('333-web.apps.googleusercontent.com');
    });
  });

  describe('no SSO secret values are committed (R9.3)', () => {
    // Committed env files live at the app root, one level up from src/.
    const appRoot = path.resolve(__dirname, '..', '..', '..');
    const envFiles = ['.env', '.env.production', '.env.development'];

    // Match a non-empty assignment: KEY=<something that isn't just whitespace>.
    // A key that is absent, or present with an empty value, is acceptable —
    // SSO client ids come from EAS secrets injected at build time.
    const assignmentRegexFor = (key: string) => new RegExp(`^\\s*${key}\\s*=\\s*(\\S+)`, 'm');

    for (const fileName of envFiles) {
      it(`${fileName} does not commit non-empty SSO client ids`, () => {
        const filePath = path.join(appRoot, fileName);

        let contents: string;
        try {
          contents = fs.readFileSync(filePath, 'utf8');
        } catch {
          // Tolerant: if the file can't be read in this environment (not
          // present, sandboxed FS, etc.) we skip rather than fail. The
          // env-mapping assertions above remain the strict guarantee.
          console.warn(`[sso smoke] skipping ${fileName}: not readable in this environment`);
          return;
        }

        for (const key of SSO_ENV_KEYS) {
          const match = contents.match(assignmentRegexFor(key));
          const committedValue = match ? match[1] : undefined;
          expect(committedValue).toBeUndefined();
        }
      });
    }
  });
});

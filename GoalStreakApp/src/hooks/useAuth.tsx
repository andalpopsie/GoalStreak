import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  getAdditionalUserInfo,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  linkWithCredential,
  reauthenticateWithCredential,
  unlink
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import { User as AppUser, AuthState } from '../types';
import { generateUsername, isUsernameAvailable, reserveUsername } from '../utils/usernameUtils';
import { isNewUser, provisionNewUser } from '../services/userProvisioningService';
import {
  assertSsoConfig,
  getAppleCredential,
  getGoogleCredential,
  isAppleAvailable,
  mapAuthError,
  SsoError,
  type SsoCredentialResult,
  type SsoProviderId,
} from '../services/ssoService';
import { config } from '../config/environment';
import { accountDeletionService } from '../services/accountDeletionService';
import subscriptionService from '../services/subscriptionService';
import { trackEvent } from '../services/enhancedAnalyticsService';

// The current Terms of Service version persisted at acceptance time (EULA_Version).
const EULA_VERSION = '1.0';

// A Firebase session is considered "stale" for the purpose of linking a new
// provider once its most recent successful authentication is older than this
// window (R8.2). Firebase itself enforces a similar recent-login requirement
// for security-sensitive operations; we check proactively so the user is
// prompted to re-authenticate before we ever call linkWithCredential.
const STALE_LOGIN_MS = 5 * 60 * 1000; // 5 minutes

/** True when a client-id string is present and non-empty. */
function isConfigPresent(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Whether the most recent successful authentication is older than the stale
 * window (R8.2). A missing or unparseable timestamp is treated as stale so we
 * err on the side of re-authenticating before linking. Exported (pure, no side
 * effects) so it can be exercised directly by tests.
 */
export function isLoginStale(
  lastSignInTime: string | undefined | null,
  now: number = Date.now(),
): boolean {
  if (!lastSignInTime) {
    return true;
  }
  const last = Date.parse(lastSignInTime);
  if (Number.isNaN(last)) {
    return true;
  }
  return now - last > STALE_LOGIN_MS;
}

/**
 * Last-provider guard (R8.6, R8.7): unlinking `providerToRemove` is permitted if
 * and only if at least one sign-in provider would remain linked afterwards.
 * Pure and exported so the property test for Property 10 can target it directly
 * without driving the full unlinkProvider flow.
 */
export function canUnlinkProvider(
  linkedProviders: readonly string[],
  providerToRemove: string,
): boolean {
  return linkedProviders.filter((id) => id !== providerToRemove).length >= 1;
}

/** Reads a comparable Firebase/SDK error code from the shapes errors take. */
function readErrorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const anyErr = error as { code?: unknown };
    if (typeof anyErr.code === 'string') {
      return anyErr.code;
    }
  }
  return '';
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  // Provider-aware: password is required only for the email/password branch;
  // Apple/Google users re-authenticate through their native provider flow (R6.1).
  deleteAccount: (password?: string) => Promise<void>;
  // SSO (Phase 1). Sign-in resolves once the credential is exchanged and any
  // first-time provisioning completes; onAuthStateChanged then hydrates state.
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  // Drives R1.5 button omission: a provider is available only when its SDK
  // reports available (Apple) or its client ids are configured on iOS (Google).
  ssoAvailability: { apple: boolean; google: boolean };
  // Account linking (Phase 2). linkProvider connects an additional provider to
  // the current account (R8.1, R8.2, R8.5); unlinkProvider disconnects one while
  // guaranteeing at least one sign-in provider remains (R8.6, R8.7).
  linkProvider: (provider: SsoProviderId) => Promise<void>;
  unlinkProvider: (provider: SsoProviderId) => Promise<void>;
  // The set of sign-in providers currently linked to the account, read from
  // Firebase's providerData (`apple.com`, `google.com`, `password`). Drives the
  // Settings connect/disconnect display (R8.3).
  connectedProviders: Array<SsoProviderId | 'password'>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Provider availability drives whether each SSO button is rendered (R1.5).
  // Apple resolves asynchronously via the native service; Google is derived
  // synchronously from platform + configured client ids.
  const [ssoAvailability, setSsoAvailability] = useState<{ apple: boolean; google: boolean }>({
    apple: false,
    google: false,
  });

  // The providers currently linked to the signed-in account (R8.3). Kept in
  // sync with Firebase's providerData: hydrated by onAuthStateChanged and
  // refreshed after every successful link/unlink so the Settings surface
  // reflects the true linked set.
  const [connectedProviders, setConnectedProviders] = useState<
    Array<SsoProviderId | 'password'>
  >([]);

  // Google's id token is obtained through expo-auth-session's useAuthRequest
  // hook, which must live at the component/hook level rather than inside an
  // async callback (see design "Google auth-session constraint"). The web
  // client id is Firebase's audience; the iOS client id is used on-device.
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: isConfigPresent(config.sso.googleIosClientId)
      ? config.sso.googleIosClientId
      : undefined,
    clientId: isConfigPresent(config.sso.googleWebClientId)
      ? config.sso.googleWebClientId
      : undefined,
    webClientId: isConfigPresent(config.sso.googleWebClientId)
      ? config.sso.googleWebClientId
      : undefined,
  });

  // Bridges the imperative signInWithGoogle() call to the declarative
  // useAuthRequest response: signInWithGoogle stores the pending settlers here,
  // and the response useEffect below resolves/rejects them once Google returns.
  const googleFlow = useRef<{
    resolve: () => void;
    reject: (error: unknown) => void;
  } | null>(null);

  // Parallel settler for the deletion re-auth path (R6.3): unlike googleFlow —
  // which drives a full signInWithCredential — this resolves with the raw Google
  // id token so accountDeletionService can build a fresh credential for
  // reauthenticateWithCredential. Same useAuthRequest/promptAsync mechanism.
  const googleTokenFlow = useRef<{
    resolve: (idToken: string) => void;
    reject: (error: unknown) => void;
  } | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // If Firebase is not configured, set loading to false and return
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();

          const appUser: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || userData?.displayName || '',
            username: userData?.username,
            profilePicture: firebaseUser.photoURL || userData?.profilePicture,
            createdAt: userData?.createdAt?.toDate() || new Date(),
            updatedAt: userData?.updatedAt?.toDate() || new Date(),
          };

          // Backfill username for existing users who don't have one
          if (!userData?.username && firebaseUser.displayName) {
            let username = generateUsername(firebaseUser.displayName);
            let attempts = 0;
            while (!(await isUsernameAvailable(username)) && attempts < 5) {
              username = generateUsername(firebaseUser.displayName);
              attempts++;
            }
            await setDoc(doc(db, 'users', firebaseUser.uid), { username, updatedAt: new Date() }, { merge: true });
            await reserveUsername(username, firebaseUser.uid);
            appUser.username = username;
          }

          setAuthState({
            user: appUser,
            isLoading: false,
            isAuthenticated: true,
          });

          // Hydrate the linked-provider set from Firebase so the Settings
          // connect/disconnect surface reflects the account's true state (R8.3).
          setConnectedProviders(
            firebaseUser.providerData.map(
              (p) => p.providerId as SsoProviderId | 'password',
            ),
          );

          // Fire-and-forget: initialize RevenueCat for the signed-in user.
          // Intentionally not awaited so it does not block sign-in or the
          // first render of the home screen. If initialization fails, the
          // user is treated as Free until the next `getProStatus` call
          // resolves (Req 1.1, 1.2, 1.3, 1.4).
          subscriptionService.initialize(appUser.id).catch((err) => {
            console.error('Failed to initialize subscription service:', err);
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
          setConnectedProviders([]);
        }
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        setConnectedProviders([]);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Convert Firebase errors to user-friendly messages
      const errorCode = error.code;
      let userMessage = 'Failed to sign in. Please try again.';
      
      switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          userMessage = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/invalid-email':
          userMessage = 'Invalid email address. Please enter a valid email.';
          break;
        case 'auth/user-disabled':
          userMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Too many failed attempts. Please try again later or reset your password.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          // Log technical error for debugging, but show user-friendly message
          console.error('Sign in error:', errorCode, error.message);
          userMessage = 'Unable to sign in. Please try again later.';
      }
      
      throw new Error(userMessage);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(firebaseUser, { displayName });

      // Delegate all first-time-user record creation (users/{uid} doc, username
      // generation + reservation, userProfiles doc, and EULA fields) to the
      // shared provisioning path so email sign-up and first-time SSO create
      // records the exact same way (R5.1). The SignUpScreen gate guarantees the
      // user has accepted the EULA (zero-tolerance clause) before we reach here.
      await provisionNewUser({ firebaseUser, displayName, eulaVersion: '1.0' });
    } catch (error: any) {
      // Convert Firebase errors to user-friendly messages
      const errorCode = error.code;
      let userMessage = 'Failed to create account. Please try again.';
      
      switch (errorCode) {
        case 'auth/email-already-in-use':
          userMessage = 'This email is already registered. Please sign in or use a different email.';
          break;
        case 'auth/invalid-email':
          userMessage = 'Invalid email address. Please enter a valid email.';
          break;
        case 'auth/weak-password':
          userMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/operation-not-allowed':
          userMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          // Log technical error for debugging, but show user-friendly message
          console.error('Sign up error:', errorCode, error.message);
          userMessage = 'Unable to create account. Please try again later.';
      }
      
      throw new Error(userMessage);
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured()) {
      return;
    }

    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      // Convert Firebase errors to user-friendly messages
      const errorCode = error.code;
      let userMessage = 'Failed to send password reset email. Please try again.';
      
      switch (errorCode) {
        case 'auth/invalid-email':
          userMessage = 'Invalid email address. Please enter a valid email.';
          break;
        case 'auth/user-not-found':
          userMessage = 'No account found with this email address.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          // Log technical error for debugging, but show user-friendly message
          console.error('Password reset error:', errorCode, error.message);
          userMessage = 'Unable to send reset email. Please try again later.';
      }
      
      throw new Error(userMessage);
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!authState.user || !isFirebaseConfigured()) {
      throw new Error('User not authenticated or Firebase not configured');
    }

    try {
      const userRef = doc(db, 'users', authState.user.id);
      await setDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      }, { merge: true });

      // Update local state
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  /**
   * Obtain a fresh Google id token for re-authentication (R6.3) and for
   * linking/re-auth in the account-linking flow (R8.2). The id token can only be
   * produced through expo-auth-session's useAuthRequest/promptAsync (which live
   * at the hook level), so this mirrors the signInWithGoogle settler pattern but
   * resolves with the raw id token instead of completing a full sign-in. Callers
   * turn the token into a credential and call reauthenticateWithCredential or
   * linkWithCredential.
   */
  const promptFreshGoogleIdToken = (): Promise<string> => {
    if (!googleRequest) {
      return Promise.reject(
        new SsoError('generic', 'Google sign-in is not ready yet, please try again.'),
      );
    }

    return new Promise<string>((resolve, reject) => {
      // If a previous token flow is somehow still pending, cancel it out.
      if (googleTokenFlow.current) {
        googleTokenFlow.current.reject(new SsoError('cancelled', 'Sign-in was cancelled.'));
      }
      googleTokenFlow.current = { resolve, reject };
      googlePromptAsync().catch(async (error) => {
        googleTokenFlow.current = null;
        reject(await mapAuthError(error));
      });
    });
  };

  /**
   * Permanently deletes the current user's account and all associated data
   * (Apple Guideline 5.1.1(v)). Re-authentication is provider-aware (R6.1):
   *   - password provider → requires the collected `password` (R6.4).
   *   - apple.com          → native Apple sheet re-auth, no password (R6.2).
   *   - google.com         → Google prompt re-auth via the id-token callback (R6.3).
   * The service deletes all data before removing the auth user (R6.5); on a
   * mid-cleanup failure the error surfaces so the user can retry (R6.9).
   */
  const deleteAccount = async (password?: string) => {
    if (!authState.user || !isFirebaseConfigured()) {
      throw new Error('User not authenticated or Firebase not configured');
    }

    const providerId = auth.currentUser?.providerData[0]?.providerId;

    try {
      if (providerId === 'password') {
        if (!password) {
          throw new Error('Please enter your password to confirm.');
        }
        await accountDeletionService.reauthenticateAndDeleteAccount(password);
      } else if (providerId === 'google.com') {
        // No password; supply the id-token callback for the Google re-auth branch.
        await accountDeletionService.reauthenticateAndDeleteAccount(
          undefined,
          promptFreshGoogleIdToken,
        );
      } else {
        // apple.com re-runs its native sheet inside the service; an absent or
        // unsupported provider surfaces as SsoError('unavailable') (R6.7).
        await accountDeletionService.reauthenticateAndDeleteAccount();
      }
      // Auth state will update via onAuthStateChanged after deletion.
    } catch (error: any) {
      // Provider re-auth failures arrive as classified SsoErrors (R6.6, R6.7, R6.8).
      if (error instanceof SsoError) {
        switch (error.kind) {
          case 'cancelled':
            // User backed out of the provider sheet — abort softly, data retained.
            throw new Error('Account deletion was cancelled.');
          case 'network':
            throw new Error('Network error. Please check your connection and try again.');
          case 'timeout':
            throw new Error('The request timed out. Please try again.');
          case 'unavailable':
            throw new Error(
              error.message ||
                'Account deletion is unavailable for this sign-in method. Please try again.',
            );
          default:
            throw new Error(error.message || 'Unable to delete account. Please try again later.');
        }
      }

      const errorCode = error.code;
      let userMessage = 'Failed to delete account. Please try again.';

      switch (errorCode) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          userMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/user-mismatch':
          userMessage = 'That sign-in did not match this account. Please try again.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your connection and try again.';
          break;
        case 'auth/requires-recent-login':
          userMessage = 'For security, please sign out and sign back in before deleting your account.';
          break;
        default:
          console.error('Account deletion error:', errorCode, error.message);
          userMessage = error.message || 'Unable to delete account. Please try again later.';
      }

      throw new Error(userMessage);
    }
  };

  // Compute SSO availability once on mount. Google is available only on iOS
  // when both client ids are configured; Apple depends on the native service.
  useEffect(() => {
    let isMounted = true;
    const googleAvailable =
      Platform.OS === 'ios' &&
      isConfigPresent(config.sso.googleIosClientId) &&
      isConfigPresent(config.sso.googleWebClientId);

    isAppleAvailable()
      .then((apple) => {
        if (isMounted) {
          setSsoAvailability({ apple, google: googleAvailable });
        }
      })
      .catch(() => {
        if (isMounted) {
          setSsoAvailability({ apple: false, google: googleAvailable });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Emit SSO analytics with parity to the email flow (R11.1, R11.2). SSO sign-in
   * reuses the email sign-in event name/properties (`login_completed`), and a
   * newly provisioned user reuses the email sign-up event (`signup_completed`),
   * each tagged with a `provider` property set to the Provider_Id. Emission is
   * wrapped so any thrown error is caught and only logged — analytics must never
   * block or surface in the auth/provisioning flow (R11.3), mirroring the
   * existing fire-and-forget pattern used elsewhere in this hook.
   */
  const emitSsoAuthAnalytics = (
    providerId: SsoProviderId,
    newUser: boolean,
    firebaseUser: User,
  ): void => {
    try {
      const email = firebaseUser.email ?? undefined;
      // Match the email flow's `email_domain` property when an email is present.
      const emailDomain =
        email && email.includes('@') ? email.split('@')[1] : undefined;

      // Sign-in event, parity with LoginScreen's `login_completed` (R11.1).
      trackEvent('login_completed', {
        email_domain: emailDomain,
        provider: providerId,
      });

      // Account-creation event, parity with SignUpScreen's `signup_completed`
      // (R11.2), emitted only when this authentication provisioned a new user.
      if (newUser) {
        trackEvent('signup_completed', {
          email_domain: emailDomain,
          provider: providerId,
        });
      }
    } catch (error) {
      // Swallow analytics failures so they never block or surface in the
      // authentication or provisioning flow (R11.3).
      console.error('Failed to emit SSO analytics event:', error);
    }
  };

  /**
   * Shared credential completion for both providers: exchange the credential,
   * detect first-time users, and provision their records. onAuthStateChanged
   * handles hydration, so no manual setState here (R3.2, R4.2–R4.4, R5.2).
   */
  const finishCredentialSignIn = async (
    credentialResult: SsoCredentialResult,
  ): Promise<void> => {
    const result = await signInWithCredential(auth, credentialResult.credential);
    const newUser = await isNewUser(result.user, getAdditionalUserInfo(result)?.isNewUser);
    if (newUser) {
      // Provisioning only runs after a successful sign-in and only for new
      // users, so any failure/cancel upstream leaves no records behind (R2.7).
      await provisionNewUser({
        firebaseUser: result.user,
        displayName: credentialResult.profile.displayName,
        photoURL: credentialResult.profile.photoURL,
        eulaVersion: EULA_VERSION,
      });
    }
    // Analytics parity for SSO, emitted once per successful sign-in after any
    // first-time provisioning completes (R11.1, R11.2, R11.3).
    emitSsoAuthAnalytics(credentialResult.providerId, newUser, result.user);
  };

  /**
   * Sign in with Apple (R3.2, R3.4). Obtains an Apple credential, exchanges it
   * for a Firebase session, and provisions first-time users. SsoErrors (cancel,
   * network, timeout, collision, generic) are rethrown as-is so the UI can
   * branch on `.kind`; any other error is normalized through mapAuthError.
   * A failed or cancelled attempt performs no writes and leaves the user
   * unauthenticated (R2.7): provisioning only runs after a successful exchange.
   */
  const signInWithApple = async (): Promise<void> => {
    try {
      assertSsoConfig('apple.com');
      const credentialResult = await getAppleCredential();
      // Route through the shared completion path so the credential exchange,
      // first-time provisioning, and analytics parity live in one place and
      // fire identically for Apple and Google (R11.1, R11.2).
      await finishCredentialSignIn(credentialResult);
    } catch (error) {
      // Already-classified SSO errors pass through unchanged (UI branches on
      // .kind: cancelled → silent, collision → link guidance, else message).
      if (error instanceof SsoError) {
        throw error;
      }
      // Anything else (e.g. a raw Firebase sign-in error) is normalized.
      throw await mapAuthError(error);
    }
  };

  /**
   * Sign in with Google (R4.1, R4.3, R4.4). Google's id token is obtained via
   * the useAuthRequest hook, so this method only asserts config and triggers
   * the prompt; the response useEffect below completes the exchange and
   * provisioning and settles the promise returned here.
   */
  const signInWithGoogle = async (): Promise<void> => {
    assertSsoConfig('google.com');
    if (!googleRequest) {
      // The auth request has not finished loading yet.
      throw new SsoError('generic', 'Google sign-in is not ready yet, please try again.');
    }

    return new Promise<void>((resolve, reject) => {
      // If a previous flow is somehow still pending, cancel it out.
      if (googleFlow.current) {
        googleFlow.current.reject(new SsoError('cancelled', 'Sign-in was cancelled.'));
      }
      googleFlow.current = { resolve, reject };
      // promptAsync resolves to an AuthSessionResult which is also delivered to
      // googleResponse; the useEffect handles both success and failure paths.
      googlePromptAsync().catch(async (error) => {
        googleFlow.current = null;
        reject(await mapAuthError(error));
      });
    });
  };

  /** Re-reads the linked-provider set from Firebase into local state (R8.3). */
  const refreshConnectedProviders = (): void => {
    setConnectedProviders(
      (auth.currentUser?.providerData ?? []).map(
        (p) => p.providerId as SsoProviderId | 'password',
      ),
    );
  };

  /**
   * Obtains a fresh credential for `provider` to feed linkWithCredential /
   * reauthenticateWithCredential. Apple runs its native sheet; Google obtains an
   * id token via the useAuthRequest hook and converts it. Failures arrive as
   * classified SsoErrors from the adapters.
   */
  const getCredentialForProvider = async (
    provider: SsoProviderId,
  ): Promise<SsoCredentialResult> => {
    if (provider === 'apple.com') {
      return getAppleCredential();
    }
    const idToken = await promptFreshGoogleIdToken();
    return getGoogleCredential(idToken);
  };

  /**
   * Re-authenticates the current user with their primary sign-in provider so a
   * security-sensitive operation (linking) can proceed after a stale login
   * (R8.2). Branches on providerData[0].providerId, reusing the same credential
   * adapters as sign-in and deletion. The password branch cannot re-authenticate
   * silently from Settings (no password on hand), so it asks the user to sign in
   * again — mirroring Firebase's own requires-recent-login guidance.
   */
  const reauthenticateCurrentUser = async (): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new SsoError('generic', 'You are not signed in. Please sign in and try again.');
    }
    const primary = currentUser.providerData[0]?.providerId;
    if (primary === 'apple.com') {
      const { credential } = await getAppleCredential();
      await reauthenticateWithCredential(currentUser, credential);
      return;
    }
    if (primary === 'google.com') {
      const idToken = await promptFreshGoogleIdToken();
      const { credential } = getGoogleCredential(idToken);
      await reauthenticateWithCredential(currentUser, credential);
      return;
    }
    // password (or any provider we can't re-run non-interactively here).
    throw new SsoError(
      'generic',
      'For security, please sign out and sign back in, then connect the provider again.',
    );
  };

  /**
   * Links an additional provider to the currently signed-in account (R8.1).
   *
   * Flow:
   *  1. Assert the provider's config is present so the flow never half-starts.
   *  2. If the current session is stale (> 5 min), re-authenticate first so
   *     linkWithCredential doesn't fail on requires-recent-login (R8.2).
   *  3. Obtain a fresh credential for the provider being linked.
   *  4. linkWithCredential; if Firebase still reports requires-recent-login,
   *     re-authenticate once and retry (belt-and-suspenders for R8.2).
   *  5. On auth/credential-already-in-use, reject with the current account and
   *     its existing linked providers left unchanged (R8.5).
   *  6. On success, refresh connectedProviders; the caller (Settings) shows the
   *     confirmation that the provider is connected (R8.1).
   */
  const linkProvider = async (provider: SsoProviderId): Promise<void> => {
    if (!auth.currentUser || !isFirebaseConfigured()) {
      throw new Error('User not authenticated or Firebase not configured');
    }
    assertSsoConfig(provider);

    try {
      // Proactive stale-login re-auth so we only ever call link on a fresh
      // session (R8.2).
      if (isLoginStale(auth.currentUser.metadata.lastSignInTime)) {
        await reauthenticateCurrentUser();
      }

      const { credential } = await getCredentialForProvider(provider);

      try {
        await linkWithCredential(auth.currentUser, credential);
      } catch (error) {
        const code = readErrorCode(error);
        if (code === 'auth/requires-recent-login') {
          // Session went stale between the check and the call — re-auth and
          // retry exactly once (R8.2). Re-obtaining the credential is required
          // because the provider credential from the first attempt is consumed.
          await reauthenticateCurrentUser();
          const retry = await getCredentialForProvider(provider);
          await linkWithCredential(auth.currentUser, retry.credential);
        } else if (code === 'auth/credential-already-in-use') {
          // The provider credential belongs to a different account. Reject and
          // leave the current account + its linked providers untouched (R8.5).
          throw new SsoError(
            'generic',
            'That account is already linked to another Goalfer account. ' +
              'Please use a different Apple or Google account.',
          );
        } else {
          throw error;
        }
      }

      refreshConnectedProviders();
    } catch (error) {
      if (error instanceof SsoError) {
        throw error;
      }
      throw await mapAuthError(error);
    }
  };

  /**
   * Disconnects a linked provider (R8.6), guarded so the last remaining sign-in
   * provider can never be removed (R8.7). The guard is a pure, tested predicate
   * (canUnlinkProvider); when it forbids removal the linked set is left
   * unchanged and an SsoError is surfaced for the UI to display.
   */
  const unlinkProvider = async (provider: SsoProviderId): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !isFirebaseConfigured()) {
      throw new Error('User not authenticated or Firebase not configured');
    }

    const linked = currentUser.providerData.map((p) => p.providerId);
    if (!canUnlinkProvider(linked, provider)) {
      // Removing this provider would leave the account with no way to sign in.
      throw new SsoError(
        'generic',
        'At least one sign-in method must remain connected. Connect another provider before disconnecting this one.',
      );
    }

    try {
      await unlink(currentUser, provider);
    } catch (error) {
      if (error instanceof SsoError) {
        throw error;
      }
      throw await mapAuthError(error);
    }

    refreshConnectedProviders();
  };

  // Idiomatic expo-auth-session completion: react to the Google response,
  // convert the id token to a credential, and finish the sign-in. Cancels and
  // dismisses surface as an SsoError('cancelled') so the UI can stay silent.
  useEffect(() => {
    if (!googleResponse) {
      return;
    }
    const pendingToken = googleTokenFlow.current;
    const pending = googleFlow.current;
    googleTokenFlow.current = null;
    googleFlow.current = null;

    // Deletion re-auth path: resolve with the raw id token instead of running a
    // full sign-in. Takes precedence when a token flow is awaiting (R6.3).
    if (pendingToken) {
      (async () => {
        try {
          if (googleResponse.type === 'success') {
            const idToken =
              googleResponse.params?.id_token ??
              googleResponse.authentication?.idToken ??
              undefined;
            if (!idToken) {
              throw new SsoError('generic', 'Authentication failed, please try again.');
            }
            pendingToken.resolve(idToken);
            return;
          }

          if (googleResponse.type === 'cancel' || googleResponse.type === 'dismiss') {
            pendingToken.reject(new SsoError('cancelled', 'Sign-in was cancelled.'));
            return;
          }

          const rawError =
            googleResponse.type === 'error' ? googleResponse.error : undefined;
          pendingToken.reject(await mapAuthError(rawError));
        } catch (error) {
          if (error instanceof SsoError) {
            pendingToken.reject(error);
          } else {
            pendingToken.reject(await mapAuthError(error));
          }
        }
      })();
      return;
    }

    // No caller is awaiting (e.g. a stale response) — nothing to settle.
    if (!pending) {
      return;
    }

    (async () => {
      try {
        if (googleResponse.type === 'success') {
          const idToken =
            googleResponse.params?.id_token ??
            googleResponse.authentication?.idToken ??
            undefined;
          if (!idToken) {
            throw new SsoError('generic', 'Authentication failed, please try again.');
          }
          await finishCredentialSignIn(getGoogleCredential(idToken));
          pending.resolve();
          return;
        }

        if (googleResponse.type === 'cancel' || googleResponse.type === 'dismiss') {
          // Cancellation is surfaced as an SsoError('cancelled') so the UI can
          // branch identically to Apple and silently return to idle (R4.5).
          pending.reject(new SsoError('cancelled', 'Sign-in was cancelled.'));
          return;
        }

        // type === 'error' (or any other terminal state) → map and surface.
        const rawError =
          googleResponse.type === 'error' ? googleResponse.error : undefined;
        pending.reject(await mapAuthError(rawError));
      } catch (error) {
        if (error instanceof SsoError) {
          pending.reject(error);
        } else {
          pending.reject(await mapAuthError(error));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const value: AuthContextType = {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
    deleteAccount,
    signInWithApple,
    signInWithGoogle,
    ssoAvailability,
    linkProvider,
    unlinkProvider,
    connectedProviders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

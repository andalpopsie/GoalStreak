// SSO error → user-facing display mapping.
//
// This is the presentation half of collision handling (task 7.1) and, more
// generally, of every SSO failure kind. `ssoService.mapAuthError` already
// normalizes raw SDK/Firebase errors into a single `SsoError` carrying a
// `kind` and a human-readable `message` (naming the existing sign-in method on
// a collision when it can be resolved — R7.1 — or falling back to a generic
// "sign in with your existing account" message when it cannot — R7.5). This
// helper maps that `SsoError` to what the UI should show: a title, a message,
// and whether the failure is silent (cancellations show nothing).
//
// It is a pure, side-effect-free function so it is trivially unit-testable and
// can be consumed by the auth screen wiring (task 6.5) without pulling in the
// SSO service's platform dependencies at call sites that only need presentation.
//
// No-write / no-identity guarantees (R7.2, R7.3) are NOT enforced here — they
// hold *structurally*: on an account collision Firebase neither creates nor
// signs in a user, and `useAuth` runs provisioning only after a *successful*
// `signInWithCredential`. So the collision path performs no Firestore writes
// and leaves any existing account and its data unchanged. This helper only
// decides how the resulting error is presented.
import type { SsoError, SsoErrorKind } from '../services/ssoService';

/** What the UI should render for a given SSO error. */
export interface SsoErrorDisplay {
  /** Optional heading for the message (e.g. an alert title). */
  title?: string;
  /** The user-facing body text. Empty when `silent` is true. */
  message: string;
  /** When true, the UI shows nothing at all (used for user cancellations). */
  silent: boolean;
}

// Fallback copy per kind, used only when the SsoError carries no message of its
// own. `mapAuthError` normally supplies a good message, so these are defensive.
const FALLBACK_MESSAGE: Record<SsoErrorKind, string> = {
  cancelled: '',
  network: 'Network error, please try again.',
  timeout: 'Request timed out, please try again.',
  collision: 'An account already exists for this email. Please sign in with your existing account.',
  unavailable: 'This sign-in option is unavailable.',
  'missing-config': 'This sign-in option is unavailable.',
  generic: 'Authentication failed, please try again.',
};

// Optional titles per kind. Kinds without an entry get no title.
const TITLE: Partial<Record<SsoErrorKind, string>> = {
  collision: 'Account already exists',
};

/**
 * Maps an `SsoError` to its user-facing display.
 *
 *  - `cancelled`     → silent (UI shows nothing) — the user backed out (R3.5/R4.5).
 *  - `collision`     → visible; `error.message` already names the existing method
 *                      when known (R7.1) or gives the generic "sign in with your
 *                      existing account" fallback when not (R7.5). Titled
 *                      "Account already exists".
 *  - `network`       → the network message.
 *  - `timeout`       → the timeout message.
 *  - `unavailable`   → the unavailable message.
 *  - `missing-config`→ generic unavailable message.
 *  - `generic`       → generic "Authentication failed, please try again." message.
 *
 * `error.message` is preferred whenever it is non-empty; the per-kind fallback
 * is used only when `SsoError` carries no message.
 */
export function getSsoErrorDisplay(error: SsoError): SsoErrorDisplay {
  if (error.kind === 'cancelled') {
    return { silent: true, message: '' };
  }

  const message = hasText(error.message) ? error.message : FALLBACK_MESSAGE[error.kind];

  return {
    title: TITLE[error.kind],
    message,
    silent: false,
  };
}

function hasText(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

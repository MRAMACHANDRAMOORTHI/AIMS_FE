// Where the session token lives, and how the rest of the app hears that it
// stopped working.
//
// Kept out of React state on purpose: `client.ts` needs the token on every
// request, including ones fired outside a component's render, and threading it
// through props would put a credential in a dozen signatures.

const STORAGE_KEY = "aims.platform_token";

let token: string | null = null;
let listener: () => void = () => {};

/**
 * Reads the stored token back at start-up.
 *
 * `localStorage` throws outright in some contexts — a browser set to block
 * site data, a private window with storage disabled — so a failure here means
 * "not signed in", never a crash.
 */
export function loadToken(): string | null {
  try {
    token = localStorage.getItem(STORAGE_KEY);
  } catch {
    token = null;
  }
  return token;
}

export function setToken(value: string): void {
  token = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The session still works for this tab; it just will not survive a reload.
  }
}

export function clearToken(): void {
  token = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if it was never stored.
  }
}

export function currentToken(): string | null {
  return token;
}

/** Registers the callback that runs when the API rejects our token. */
export function onSessionLost(fn: () => void): void {
  listener = fn;
}

/**
 * Called by the API client on a 401.
 *
 * Clears the token first so nothing retries with a credential the server has
 * already refused.
 */
export function sessionLost(): void {
  clearToken();
  listener();
}

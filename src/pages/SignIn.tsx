import { useState } from "react";
import { ApiError, api, describe } from "../api/client";
import { setToken } from "../api/auth";
import type { PlatformAdmin } from "../api/types";
import { Alert, Button, Field, Input } from "../components/ui";

interface SignInResponse {
  token: string;
  expires_in_days: number;
  admin: PlatformAdmin;
}

/**
 * The console's front door.
 *
 * This signs in a **platform administrator** — the principal that manages
 * institutes across tenants. Users of a single institute sign in against their
 * own institute, which is the ERP's job, not this console's.
 */
export function SignIn({ onSignedIn }: { onSignedIn: (admin: PlatformAdmin) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const session = await api.signIn<SignInResponse>("/platform/session", {
        email,
        password,
      });
      setToken(session.token);
      onSignedIn(session.admin);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="font-mono text-base font-semibold tracking-tight text-ink-900">
            AIMS
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink-900">
            Tenant management
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Sign in as a platform administrator.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-5 rounded-lg border border-ink-200 bg-white p-6 shadow-sm"
        >
          {error != null && <Alert tone="error">{explain(error)}</Alert>}

          <Field label="Email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="admin@aims.local"
              required
              autoFocus
            />
          </Field>

          <Field label="Password" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>

          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-xs leading-relaxed text-ink-400">
          There is no sign-up. A platform administrator can create and destroy
          every tenant, so accounts are made on the server with{" "}
          <code className="font-mono">mix aims.admin create</code>.
        </p>
      </div>
    </div>
  );
}

// A 401 here means the credentials were wrong, which is an answer rather than
// a fault — say so plainly instead of showing the raw API message.
function explain(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "invalid_credentials") {
      return "That email and password do not match an account.";
    }
    if (error.code === "account_inactive") {
      return "That account has been deactivated. Ask another administrator to reinstate it.";
    }
    return error.detail;
  }
  return describe(error);
}

import { useState } from "react";
import { ApiError, api, formatTime, ValidationError } from "../api/client";
import { useAction, useApi } from "../api/hooks";
import type { PlatformAdmin } from "../api/types";
import {
  Alert,
  Button,
  Card,
  ErrorBox,
  Field,
  Input,
  Loading,
  PageHeader,
  Table,
  Td,
  Th,
} from "../components/ui";

const BLANK = { email: "", name: "", password: "" };

/**
 * Platform administrators.
 *
 * Exists so a departing administrator can be taken offline from here rather
 * than needing a shell on the server, which was the only way until recently.
 */
export function Administrators({ me }: { me: PlatformAdmin }) {
  const { data, error, loading, reload } = useApi<PlatformAdmin[]>("/platform/admins");
  const action = useAction();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(BLANK);

  const validation =
    action.error instanceof ValidationError ? action.error : null;

  const rows = data ?? [];
  const activeCount = rows.filter((a) => a.active).length;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const created = await action.run(() =>
      api.post<PlatformAdmin>("/platform/admins", draft),
    );
    if (created) {
      setDraft(BLANK);
      setOpen(false);
      void reload();
    }
  }

  async function setActive(admin: PlatformAdmin, active: boolean) {
    const done = active
      ? await action.run(() =>
          api.patch<PlatformAdmin>(`/platform/admins/${admin.id}`, { active: true }),
        )
      : await action.run(() => api.del<PlatformAdmin>(`/platform/admins/${admin.id}`));

    if (done) void reload();
  }

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Administrators"
        description="Accounts that manage institutes across every tenant. There is no sign-up — accounts are created here or with mix aims.admin."
        actions={
          <Button
            variant={open ? "secondary" : "primary"}
            onClick={() => {
              action.clearError();
              setOpen(!open);
            }}
          >
            {open ? "Cancel" : "Add administrator"}
          </Button>
        }
      />

      {action.error != null && !validation ? (
        <div className="mb-5">
          <AdminError error={action.error} />
        </div>
      ) : null}

      {open && (
        <div className="mb-6">
          <Card title="New administrator">
            <form onSubmit={create} className="flex flex-col gap-5 px-5 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" required error={validation?.on("email")}>
                  <Input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    placeholder="colleague@example.com"
                    invalid={!!validation?.on("email")}
                    required
                  />
                </Field>

                <Field label="Name" required error={validation?.on("name")}>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Their Name"
                    invalid={!!validation?.on("name")}
                    required
                  />
                </Field>

                <Field
                  label="Password"
                  required
                  error={validation?.on("password")}
                  hint="They can change it themselves after signing in. It cannot be reset for them — there is no password reset yet."
                >
                  <Input
                    type="password"
                    value={draft.password}
                    onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                    autoComplete="new-password"
                    invalid={!!validation?.on("password")}
                    required
                  />
                </Field>
              </div>

              <div>
                <Button type="submit" variant="primary" disabled={action.busy}>
                  {action.busy ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Card
        title={`${rows.length} ${rows.length === 1 ? "administrator" : "administrators"}`}
        subtitle={`${activeCount} can sign in`}
      >
        {error ? (
          <div className="p-5">
            <Alert tone="error">Could not load administrators.</Alert>
          </div>
        ) : loading ? (
          <Loading />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Name</Th>
                <Th>Added</Th>
                <Th align="right">Status</Th>
                <Th align="right">{""}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((admin) => {
                const isMe = admin.id === me.id;

                return (
                  <tr key={admin.id} className="hover:bg-ink-50/60">
                    <Td>
                      <span className="font-mono text-sm text-ink-900">
                        {admin.email}
                      </span>
                      {isMe && (
                        <span className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-[0.65rem] text-ink-600">
                          you
                        </span>
                      )}
                    </Td>
                    <Td className="text-ink-800">{admin.name}</Td>
                    <Td className="tabular text-xs text-ink-500">
                      {formatTime(admin.inserted_at)}
                    </Td>
                    <Td align="right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          admin.active
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            : "bg-ink-100 text-ink-600 ring-ink-500/20"
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current opacity-70" />
                        {admin.active ? "active" : "inactive"}
                      </span>
                    </Td>
                    <Td align="right">
                      {admin.active ? (
                        <Button
                          variant="danger"
                          disabled={action.busy || isMe}
                          onClick={() => setActive(admin, false)}
                          title={
                            isMe
                              ? "You cannot deactivate your own account"
                              : "Revokes their sessions immediately"
                          }
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          disabled={action.busy}
                          onClick={() => setActive(admin, true)}
                        >
                          Reinstate
                        </Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        <p className="border-t border-ink-100 bg-ink-50/50 px-5 py-3 text-xs leading-relaxed text-ink-500">
          Deactivating revokes every live session at once and never deletes the
          account — the record of what it did has to survive. The last
          administrator who can still sign in cannot be taken offline, because
          with no password reset there would be no way back in.
        </p>
      </Card>
    </>
  );
}

// The two refusals here are rules rather than faults, so they read as
// explanations instead of errors.
function AdminError({ error }: { error: unknown }) {
  if (error instanceof ApiError && error.code === "cannot_deactivate_yourself") {
    return (
      <Alert tone="warning" title="That would lock you out">
        {error.detail}
      </Alert>
    );
  }

  if (error instanceof ApiError && error.code === "last_active_admin") {
    return (
      <Alert tone="warning" title="Someone has to be able to sign in">
        {error.detail}
      </Alert>
    );
  }

  return <ErrorBox error={error} />;
}

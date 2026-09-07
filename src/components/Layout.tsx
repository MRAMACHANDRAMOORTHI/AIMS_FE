import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useApi } from "../api/hooks";
import type { Health, PlatformAdmin } from "../api/types";
import { Button } from "./ui";

const NAV = [
  { to: "/", label: "Overview", end: true },
  { to: "/institutes", label: "Institutes", end: false },
  { to: "/universities", label: "Affiliating universities", end: false },
  { to: "/framework", label: "NAAC framework", end: false },
  { to: "/administrators", label: "Administrators", end: false },
];

export function Layout({
  children,
  admin,
  onSignOut,
}: {
  children: ReactNode;
  admin: PlatformAdmin;
  onSignOut: () => void;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar admin={admin} onSignOut={onSignOut} />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function Sidebar({
  admin,
  onSignOut,
}: {
  admin: PlatformAdmin;
  onSignOut: () => void;
}) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white md:flex">
      <div className="border-b border-ink-100 px-5 py-5">
        <p className="font-mono text-sm font-semibold tracking-tight text-ink-900">
          AIMS
        </p>
        <p className="mt-0.5 text-xs text-ink-500">Tenant management</p>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-ink-900 font-medium text-white"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <ServerStatus />

      <div className="border-t border-ink-100 px-5 py-4">
        <p className="truncate text-xs font-medium text-ink-800" title={admin.email}>
          {admin.name}
        </p>
        <p className="mb-2 truncate text-xs text-ink-400" title={admin.email}>
          {admin.email}
        </p>
        <Button variant="ghost" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </aside>
  );
}

/** Live footer: whether the API is reachable, and what it reports. */
function ServerStatus() {
  const { data, error } = useApi<Health>("/health");

  return (
    <div className="mt-auto border-t border-ink-100 px-5 py-4 text-xs">
      {error ? (
        <p className="text-rose-700">
          API unreachable. Start it with{" "}
          <code className="font-mono">mix phx.server</code> in{" "}
          <code className="font-mono">AIMS_BE</code>.
        </p>
      ) : data ? (
        <dl className="flex flex-col gap-1 text-ink-500">
          <div className="flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            API {data.status}
          </div>
          <div className="flex justify-between gap-2">
            <dt>Institutes</dt>
            <dd className="tabular text-ink-700">{data.institutes}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Tenant migration</dt>
            <dd className="tabular font-mono text-[0.65rem] text-ink-700">
              {data.tenant_migration_version}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Server time</dt>
            <dd className="tabular text-ink-700">
              {data.server_time_local.slice(11, 16)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-ink-400">Checking API…</p>
      )}
    </div>
  );
}

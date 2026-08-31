import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { describe } from "../api/client";
import type { InstituteStatus } from "../api/types";

// ── Layout primitives ───────────────────────────────────────────────────────

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-ink-200 bg-white shadow-sm ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start gap-3 border-b border-ink-100 px-5 py-3.5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="ml-auto flex gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-400">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="ml-auto flex gap-2">{actions}</div>}
    </header>
  );
}

// ── State ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<InstituteStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  provisioning: "bg-sky-50 text-sky-700 ring-sky-600/20",
  suspended: "bg-amber-50 text-amber-800 ring-amber-600/20",
  archived: "bg-ink-100 text-ink-600 ring-ink-500/20",
  failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function StatusBadge({ status }: { status: InstituteStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STATUS_STYLES[status] ?? STATUS_STYLES.archived
      }`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  const styles =
    tone === "accent"
      ? "bg-brass-50 text-brass-700 ring-brass-600/20"
      : "bg-ink-50 text-ink-600 ring-ink-300/40";
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[0.7rem] ring-1 ring-inset ${styles}`}
    >
      {children}
    </span>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  title?: string;
};

const BUTTON_STYLES = {
  primary: "bg-ink-900 text-white hover:bg-ink-800 focus-visible:outline-ink-900",
  secondary:
    "bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 focus-visible:outline-ink-900",
  danger:
    "bg-white text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 focus-visible:outline-rose-700",
  ghost: "text-ink-600 hover:bg-ink-100 focus-visible:outline-ink-900",
};

export function Button({
  children,
  onClick,
  type = "button",
  variant = "secondary",
  disabled,
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant]}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-brass-600">*</span>}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-rose-700">{error}</span>
      ) : (
        hint && <span className="text-xs leading-relaxed text-ink-500">{hint}</span>
      )}
    </label>
  );
}

const CONTROL =
  "w-full rounded-md border-0 bg-white px-3 py-1.5 text-sm text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-300 focus:ring-2 focus:ring-inset focus:ring-ink-700 disabled:bg-ink-50 disabled:text-ink-400";

export function Input({
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={`${CONTROL} ${invalid ? "ring-rose-400" : ""}`}
    />
  );
}

export function Select({
  invalid,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      className={`${CONTROL} ${invalid ? "ring-rose-400" : ""}`}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 rounded border-ink-300 text-ink-900 focus:ring-ink-700"
      />
      <span className="text-sm">
        <span className="font-medium text-ink-800">{label}</span>
        {hint && <span className="block text-xs text-ink-500">{hint}</span>}
      </span>
    </label>
  );
}

// ── Feedback ────────────────────────────────────────────────────────────────

export function Alert({
  tone = "error",
  title,
  children,
}: {
  tone?: "error" | "warning" | "info";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-ink-200 bg-ink-50 text-ink-700",
  }[tone];

  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

/** Renders whatever a hook threw, without the caller unpacking it. */
export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  return <Alert tone="error">{describe(error)}</Alert>;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-8 text-sm text-ink-400">
      <span className="size-3 animate-spin rounded-full border-2 border-ink-200 border-t-ink-500" />
      {label}…
    </div>
  );
}

export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-500">{children}</div>}
    </div>
  );
}

// ── Tables ──────────────────────────────────────────────────────────────────

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap border-b border-ink-200 bg-ink-50/60 px-4 py-2.5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.1em] text-ink-400 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`border-b border-ink-100 px-4 py-2.5 align-middle ${
        align === "right" ? "text-right" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}

/** A label/value row, for detail panels. */
export function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-ink-100 px-5 py-2.5 last:border-b-0">
      <dt className="w-44 shrink-0 text-xs font-medium text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-ink-900">{children}</dd>
    </div>
  );
}

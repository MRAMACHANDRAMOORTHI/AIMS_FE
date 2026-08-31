// The one place that knows how the API is shaped: everything lives under
// `data`, and failures come back in one of two error shapes.

/**
 * A failure the API named — `tenant_not_found`, `only_failed_can_be_deleted`.
 * `errors.code` is a string in this shape and absent in the validation shape,
 * which is enough to tell them apart.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

/**
 * A 422 keyed by field: `{"code": ["has already been taken"]}`.
 * Forms render these next to the input they belong to.
 */
export class ValidationError extends Error {
  constructor(readonly fields: Record<string, string[]>) {
    super("The server rejected this request.");
    this.name = "ValidationError";
  }

  /** All messages for one field, joined — or `undefined` if it is fine. */
  on(field: string): string | undefined {
    const messages = this.fields[field];
    return messages?.length ? messages.join(", ") : undefined;
  }

  /** Errors for fields the form does not render, so nothing is swallowed. */
  unclaimed(rendered: string[]): string[] {
    return Object.entries(this.fields)
      .filter(([field]) => !rendered.includes(field))
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`);
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // A network failure is not an API error, and saying so beats a bare
    // "Failed to fetch" that reads like a bug in the console.
    throw new ApiError(
      0,
      "unreachable",
      "Could not reach the API. Is `mix phx.server` running on port 4000?",
    );
  }

  // 204 No Content, and any empty body.
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (response.ok) {
    return (payload as { data: T } | null)?.data as T;
  }

  const errors = (payload as { errors?: unknown } | null)?.errors;

  if (isNamedError(errors)) {
    throw new ApiError(response.status, errors.code, errors.detail);
  }

  if (errors && typeof errors === "object") {
    throw new ValidationError(errors as Record<string, string[]>);
  }

  throw new ApiError(
    response.status,
    "unexpected",
    `The server returned ${response.status} with no error body.`,
  );
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isNamedError(
  errors: unknown,
): errors is { code: string; detail: string } {
  return (
    !!errors &&
    typeof errors === "object" &&
    typeof (errors as { code?: unknown }).code === "string"
  );
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/** Turns any thrown value into something safe to render. */
export function describe(error: unknown): string {
  if (error instanceof ValidationError) {
    return Object.entries(error.fields)
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join(" · ");
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

/** `2026-08-31T16:26:15+05:30` → `31 Aug 2026, 16:26`. */
export function formatTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `2026-08-31` → `31 Aug 2026`. */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** `affiliated_college` → `Affiliated college`, for values with no label. */
export function humanise(value: string | null | undefined): string {
  if (!value) return "—";
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

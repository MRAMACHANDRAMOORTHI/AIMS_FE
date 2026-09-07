# AIMS_FE — tenant management console

React 19, Vite, Tailwind 4, TypeScript. Manages affiliating universities and
institutes: onboarding, provisioning, configuration, lifecycle, and the NAAC
mark scale each institute is assessed against.

Scope is **tenant management only**. Departments and the rest of the academic
domain are the AIMS ERP, and come later.

---

## Running it

The API has to be up first:

```bash
cd ../AIMS_BE
mix ecto.setup      # once
mix phx.server      # http://localhost:4000
```

Then:

```bash
npm install
npm run dev         # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with the API proxied |
| `npm run build` | Typecheck, then a production build into `dist/` |
| `npm run typecheck` | Types only |
| `npm run preview` | Serves `dist/` — **no API proxy**, see below |

---

## Signing in

The console signs in a **platform administrator** — the principal that manages
institutes across tenants. Users of a single institute sign in against their own
institute, which is the ERP's job, not this console's.

There is no sign-up screen, because there is no sign-up. Make an account on the
server:

```bash
cd ../AIMS_BE
mix aims.admin create you@example.com "Your Name"
```

`mix ecto.setup` seeds `admin@aims.com` / `AIMS@123` for development.

The token lives in `localStorage` and is sent as `Authorization: Bearer` on
every request. A stored token is **not trusted on start-up** — the app calls
`GET /platform/me` and falls back to the sign-in screen if the server refuses
it, because a token can expire or be revoked while the tab is closed. Any 401
from any request drops the token and returns the whole console to sign-in,
rather than each panel showing its own error.

Signing out revokes the token server-side, so it is dead everywhere and not
just in this browser.

---

## How it talks to the API

Vite **proxies** `/api` to `http://localhost:4000`, so the browser stays on one
origin. That means the backend needs no CORS configuration, and it is why
`npm run preview` cannot reach the API — the proxy is a dev-server feature.
For production, serve `dist/` from the same origin as the API.

Point it somewhere else with an environment variable:

```bash
AIMS_API_URL=http://staging.internal:4000 npm run dev
```

### One module knows the API's shape

[`src/api/client.ts`](src/api/client.ts) is the only place that knows responses
live under `data` and that failures come back in one of two shapes:

```ts
// Named failure → ApiError
{ "errors": { "code": "university_has_institutes", "detail": "…" } }

// Validation failure → ValidationError, keyed by field
{ "errors": { "code": ["has already been taken"] } }
```

`errors.code` is a string in the first and absent in the second, which is how
they are told apart. Forms catch `ValidationError` and render each message
against its own input; `unclaimed()` surfaces errors for fields a form does not
render, so nothing is silently swallowed.

A network failure is turned into a readable message rather than a bare
`Failed to fetch`.

### Data loading

[`src/api/hooks.ts`](src/api/hooks.ts) has three small hooks — `useApi`,
`useAction`, `useClassification` — and no query library. The pattern here is
load → act → reload, which `reload()` covers, and a cache layer would be an
abstraction the team has to learn for no gain at this size. `useApi` guards
against a slow response for an old path landing after a newer one.

---

## The forms drive themselves off the backend

`GET /api/v1/reference/classification` returns every valid value **and the
per-category rules**:

```json
{
  "hei_categories": [{ "value": "affiliated_college", "label": "Affiliated College" }],
  "rules": {
    "university_kind_required_for": ["university"],
    "affiliating_university_required_for": [
      "autonomous_college", "constituent_college", "affiliated_college"
    ]
  }
}
```

[`InstituteForm`](src/components/InstituteForm.tsx) reads those rules rather
than hardcoding them, so:

- choosing **University** shows *University kind* and hides *Affiliating
  university*;
- choosing any **college** does the opposite — autonomous colleges included,
  because an autonomous college holds curricular autonomy but its degrees are
  still awarded by its affiliating university;
- switching category **clears** whichever field the new category forbids, so a
  stale value cannot produce a confusing 422.

If NAAC adds a category, this form follows without a frontend change. No
vocabulary is duplicated here.

---

## Screens

| Route | What it does |
| --- | --- |
| `/` | Counts by status, institutes needing attention, recent activity, framework and migration version |
| `/institutes` | Filter by status and HEI category; migrate every serving institute |
| `/institutes/new` | Onboard — creates the row, the schema, and runs the tenant migrations |
| `/institutes/:id` | Mark scale, resolved configuration, registration details, lifecycle actions |
| `/universities` | Affiliating universities, with inline create |
| `/universities/:id` | One university, its inherited settings, and the colleges naming it |
| `/framework` | The NAAC framework: three manuals, seven criteria, marks at UG and PG |
| `/administrators` | Platform administrators — create, deactivate, reinstate |

The institute list uses the API's **summary** shape and the detail page uses the
**full** shape. That is deliberate on the backend's side — resolving a mark
scale costs a query per institute, so listings do not carry one.

---

## Structure

```
src/
  api/
    types.ts       hand-written types mirroring the API
    client.ts      fetch wrapper, the two error shapes, formatters
    hooks.ts       useApi, useAction, useClassification
  components/
    ui.tsx         Card, Table, Field, Button, StatusBadge, Alert…
    Layout.tsx     sidebar nav + live API status footer
    InstituteForm.tsx    create and edit, driven by the reference rules
  pages/           one file per screen
```

Types are hand-written rather than generated: the API is small, and a mismatch
then shows up as a type error at the one place that reads it.

---

## Notes

**Authentication is in.** Every route except `GET /health` and the two
sign-in endpoints needs a token, and the console holds a platform
administrator's. What is *not* in yet: password reset, multi-factor, rate
limiting on sign-in attempts, and any audit log of who changed what.

**Status colour is semantic, not decorative.** `active` reads green,
`suspended` amber, `failed` rose, `archived` neutral — so what needs attention
is visible without reading a single row.

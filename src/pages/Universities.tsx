import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ValidationError } from "../api/client";
import { useAction, useApi, useClassification } from "../api/hooks";
import type { AffiliatingUniversity } from "../api/types";
import {
  Alert,
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  Input,
  Loading,
  PageHeader,
  Select,
  Table,
  Tag,
  Td,
  Th,
} from "../components/ui";

const BLANK = {
  code: "",
  name: "",
  university_kind: "",
  aishe_code: "",
  city: "",
  state: "",
  website: "",
};

export function Universities() {
  const { data, error, loading, reload } = useApi<AffiliatingUniversity[]>(
    "/affiliating-universities",
  );
  const { classification } = useClassification();
  const action = useAction();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(BLANK);

  const validation =
    action.error instanceof ValidationError ? action.error : null;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const result = await action.run(() =>
      api.post<AffiliatingUniversity>("/affiliating-universities", {
        ...draft,
        aishe_code: draft.aishe_code || null,
        city: draft.city || null,
        state: draft.state || null,
        website: draft.website || null,
      }),
    );
    if (result) {
      setDraft(BLANK);
      setOpen(false);
      void reload();
    }
  }

  const rows = data ?? [];
  const set = (key: keyof typeof BLANK, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <>
      <PageHeader
        eyebrow="Tenant management"
        title="Affiliating universities"
        description="Reference records, not owners. Each names the body awarding its colleges' degrees, and supplies the settings they inherit."
        actions={
          <Button
            variant={open ? "secondary" : "primary"}
            onClick={() => {
              action.clearError();
              setOpen(!open);
            }}
          >
            {open ? "Cancel" : "Add university"}
          </Button>
        }
      />

      {open && (
        <div className="mb-6">
          <Card title="New affiliating university">
            <form onSubmit={create} className="flex flex-col gap-5 px-5 py-5">
              {action.error != null && !validation ? (
                <ErrorBox error={action.error} />
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Code"
                  required
                  error={validation?.on("code")}
                  hint="Stored upper case."
                >
                  <Input
                    value={draft.code}
                    onChange={(e) => set("code", e.target.value)}
                    placeholder="ANNA"
                    invalid={!!validation?.on("code")}
                    required
                  />
                </Field>

                <Field label="Name" required error={validation?.on("name")}>
                  <Input
                    value={draft.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Anna University"
                    invalid={!!validation?.on("name")}
                    required
                  />
                </Field>

                <Field
                  label="University kind"
                  required
                  error={validation?.on("university_kind")}
                >
                  <Select
                    value={draft.university_kind}
                    onChange={(e) => set("university_kind", e.target.value)}
                    invalid={!!validation?.on("university_kind")}
                    required
                  >
                    <option value="">Choose…</option>
                    {(classification?.university_kinds ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="AISHE code"
                  error={validation?.on("aishe_code")}
                  hint="Format U-0123."
                >
                  <Input
                    value={draft.aishe_code}
                    onChange={(e) => set("aishe_code", e.target.value)}
                    placeholder="U-0123"
                    invalid={!!validation?.on("aishe_code")}
                  />
                </Field>

                <Field label="City">
                  <Input
                    value={draft.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Chennai"
                  />
                </Field>

                <Field label="State">
                  <Input
                    value={draft.state}
                    onChange={(e) => set("state", e.target.value)}
                    placeholder="Tamil Nadu"
                  />
                </Field>

                <Field
                  label="Website"
                  error={validation?.on("website")}
                >
                  <Input
                    value={draft.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://www.annauniv.edu"
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
        title={`${rows.length} ${rows.length === 1 ? "university" : "universities"}`}
      >
        {error ? (
          <div className="p-5">
            <Alert tone="error">Could not load universities.</Alert>
          </div>
        ) : loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title="No affiliating universities yet">
            A college cannot be onboarded without one.
          </Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Kind</Th>
                <Th>Location</Th>
                <Th align="right">AISHE</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((university) => (
                <tr key={university.id} className="hover:bg-ink-50/60">
                  <Td>
                    <Link
                      to={`/universities/${university.id}`}
                      className="font-mono text-sm font-medium text-ink-900 underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900"
                    >
                      {university.code}
                    </Link>
                  </Td>
                  <Td className="text-ink-800">{university.name}</Td>
                  <Td>
                    <Tag>{university.university_kind.replace(/_/g, " ")}</Tag>
                  </Td>
                  <Td className="text-ink-600">
                    {[university.city, university.state]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </Td>
                  <Td align="right" className="font-mono text-xs text-ink-500">
                    {university.aishe_code ?? "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ValidationError } from "../api/client";
import { useApi, useClassification } from "../api/hooks";
import type {
  AffiliatingUniversity,
  HeiCategory,
  Institute,
  ProgrammeLevel,
  UniversityKind,
} from "../api/types";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Loading,
  Select,
} from "./ui";

export interface InstituteDraft {
  code: string;
  name: string;
  hei_category: HeiCategory | "";
  university_kind: UniversityKind | "";
  affiliating_university_id: string;
  programme_level: ProgrammeLevel;
  discipline: string;
  aishe_code: string;
  ugc_section_2f: boolean;
  ugc_section_12b: boolean;
  established_on: string;
}

const BLANK: InstituteDraft = {
  code: "",
  name: "",
  hei_category: "",
  university_kind: "",
  affiliating_university_id: "",
  programme_level: "ug",
  discipline: "",
  aishe_code: "",
  ugc_section_2f: false,
  ugc_section_12b: false,
  established_on: "",
};

export function draftFrom(institute: Institute): InstituteDraft {
  return {
    code: institute.code,
    name: institute.name,
    hei_category: institute.hei_category,
    university_kind: institute.university_kind ?? "",
    affiliating_university_id: institute.affiliating_university
      ? String(institute.affiliating_university.id)
      : "",
    programme_level: institute.programme_level,
    discipline: institute.discipline,
    aishe_code: institute.aishe_code ?? "",
    ugc_section_2f: institute.ugc_section_2f,
    ugc_section_12b: institute.ugc_section_12b,
    established_on: institute.established_on ?? "",
  };
}

/** The fields this form renders, so nothing in a 422 goes unreported. */
const RENDERED = [
  "code",
  "name",
  "hei_category",
  "university_kind",
  "affiliating_university_id",
  "affiliating_university",
  "programme_level",
  "discipline",
  "aishe_code",
  "established_on",
];

export function InstituteForm({
  mode,
  initial,
  error,
  busy,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: Institute;
  error: unknown;
  busy: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const { classification, error: refError } = useClassification();
  const { data: universities } = useApi<AffiliatingUniversity[]>(
    "/affiliating-universities",
  );

  const [draft, setDraft] = useState<InstituteDraft>(
    initial ? draftFrom(initial) : BLANK,
  );

  // The two conditional rules come from the backend, not from a constant here.
  // If NAAC adds a category tomorrow, this form follows without a change.
  const needsKind = useMemo(
    () =>
      !!draft.hei_category &&
      !!classification?.rules.university_kind_required_for.includes(
        draft.hei_category,
      ),
    [classification, draft.hei_category],
  );

  const needsUniversity = useMemo(
    () =>
      !!draft.hei_category &&
      !!classification?.rules.affiliating_university_required_for.includes(
        draft.hei_category,
      ),
    [classification, draft.hei_category],
  );

  // Clear whichever field the chosen category forbids. The API rejects a
  // college carrying a kind, or a university carrying an affiliation, so
  // leaving a stale value behind would produce a confusing 422.
  useEffect(() => {
    setDraft((current) => ({
      ...current,
      university_kind: needsKind ? current.university_kind : "",
      affiliating_university_id: needsUniversity
        ? current.affiliating_university_id
        : "",
    }));
  }, [needsKind, needsUniversity]);

  const validation = error instanceof ValidationError ? error : null;
  const other = error && !validation ? error : null;
  const unclaimed = validation?.unclaimed(RENDERED) ?? [];

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const payload: Record<string, unknown> = {
      name: draft.name,
      hei_category: draft.hei_category,
      programme_level: draft.programme_level,
      discipline: draft.discipline,
      ugc_section_2f: draft.ugc_section_2f,
      ugc_section_12b: draft.ugc_section_12b,
      aishe_code: draft.aishe_code || null,
      established_on: draft.established_on || null,
      university_kind: needsKind ? draft.university_kind : null,
      affiliating_university_id: needsUniversity
        ? Number(draft.affiliating_university_id)
        : null,
    };

    // The code names the PostgreSQL schema and is fixed after creation, so it
    // is only ever sent on create.
    if (mode === "create") payload.code = draft.code;

    onSubmit(payload);
  }

  if (refError) {
    return (
      <Alert tone="error" title="Could not load the reference data">
        The form cannot be built without it. Check that the API is running and
        that <code className="font-mono">mix aims.naac.install</code> has been
        run.
      </Alert>
    );
  }

  if (!classification) return <Loading label="Loading reference data" />;

  const set = <K extends keyof InstituteDraft>(
    key: K,
    value: InstituteDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {other != null && (
        <Alert tone="error">
          {other instanceof Error ? other.message : String(other)}
        </Alert>
      )}

      {unclaimed.length > 0 && (
        <Alert tone="error" title="The server rejected some fields">
          <ul className="list-inside list-disc">
            {unclaimed.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card title="Identity">
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
          <Field
            label="Code"
            required
            error={validation?.on("code")}
            hint={
              mode === "edit"
                ? "Fixed after creation — it names the PostgreSQL schema holding this institute's data."
                : "Lowercase letters, digits and underscore. Becomes the schema name: tenant_<code>."
            }
          >
            <Input
              value={draft.code}
              onChange={(e) => set("code", e.target.value)}
              disabled={mode === "edit"}
              placeholder="cit"
              invalid={!!validation?.on("code")}
              required
            />
          </Field>

          <Field label="Name" required error={validation?.on("name")}>
            <Input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Coimbatore Institute of Technology"
              invalid={!!validation?.on("name")}
              required
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Classification"
        subtitle="Decides which NAAC manual assesses this institute, and which of its weightage columns applies."
      >
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
          <Field
            label="HEI category"
            required
            error={validation?.on("hei_category")}
          >
            <Select
              value={draft.hei_category}
              onChange={(e) =>
                set("hei_category", e.target.value as HeiCategory)
              }
              invalid={!!validation?.on("hei_category")}
              required
            >
              <option value="">Choose…</option>
              {classification.hei_categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Programme level"
            required
            hint="The level this institute is assessed at, not the catalogue of levels it teaches."
          >
            <Select
              value={draft.programme_level}
              onChange={(e) =>
                set("programme_level", e.target.value as ProgrammeLevel)
              }
            >
              {classification.programme_levels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          {needsKind && (
            <Field
              label="University kind"
              required
              error={validation?.on("university_kind")}
              hint="Required for a university, and rejected for a college."
            >
              <Select
                value={draft.university_kind}
                onChange={(e) =>
                  set("university_kind", e.target.value as UniversityKind)
                }
                invalid={!!validation?.on("university_kind")}
                required
              >
                <option value="">Choose…</option>
                {classification.university_kinds.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {needsUniversity && (
            <Field
              label="Affiliating university"
              required
              error={
                validation?.on("affiliating_university_id") ??
                validation?.on("affiliating_university")
              }
              hint="Every college names one — an autonomous college holds curricular autonomy, but its degrees are still awarded by its affiliating university."
            >
              <Select
                value={draft.affiliating_university_id}
                onChange={(e) =>
                  set("affiliating_university_id", e.target.value)
                }
                invalid={!!validation?.on("affiliating_university_id")}
                required
              >
                <option value="">Choose…</option>
                {(universities ?? []).map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.code} — {university.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field
            label="Discipline"
            required
            error={validation?.on("discipline")}
            hint="Descriptive only. NAAC does not weight by discipline."
          >
            <Select
              value={draft.discipline}
              onChange={(e) => set("discipline", e.target.value)}
              invalid={!!validation?.on("discipline")}
              required
            >
              <option value="">Choose…</option>
              {classification.disciplines.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {draft.hei_category && (
          <p className="border-t border-ink-100 bg-ink-50/50 px-5 py-3 text-xs text-ink-500">
            {needsUniversity
              ? "A college is affiliated to a university and carries no university kind."
              : "A university is assessed in its own right, so it carries a kind and no affiliation."}
          </p>
        )}
      </Card>

      <Card
        title="Government identifiers"
        subtitle="Optional here, but NAAC requires them before an institute can apply."
      >
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
          <Field
            label="AISHE code"
            error={validation?.on("aishe_code")}
            hint="Format C-12345."
          >
            <Input
              value={draft.aishe_code}
              onChange={(e) => set("aishe_code", e.target.value)}
              placeholder="C-12345"
              invalid={!!validation?.on("aishe_code")}
            />
          </Field>

          <Field
            label="Established on"
            error={validation?.on("established_on")}
            hint="NAAC's first cycle needs six years, or two graduated batches."
          >
            <Input
              type="date"
              value={draft.established_on}
              onChange={(e) => set("established_on", e.target.value)}
            />
          </Field>

          <div className="flex flex-col gap-3 sm:col-span-2">
            <Checkbox
              label="Recognised under UGC Act Section 2(f)"
              checked={draft.ugc_section_2f}
              onChange={(value) => set("ugc_section_2f", value)}
            />
            <Checkbox
              label="Recognised under UGC Act Section 12(B)"
              checked={draft.ugc_section_12b}
              onChange={(value) => set("ugc_section_12b", value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy
            ? mode === "create"
              ? "Provisioning…"
              : "Saving…"
            : mode === "create"
              ? "Create and provision"
              : "Save changes"}
        </Button>
        <Button onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        {mode === "create" && busy && (
          <span className="text-xs text-ink-500">
            Creating the schema and running tenant migrations…
          </span>
        )}
      </div>
    </form>
  );
}

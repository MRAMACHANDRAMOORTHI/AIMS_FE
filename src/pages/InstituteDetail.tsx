import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatDate, formatTime, humanise } from "../api/client";
import { useAction, useApi } from "../api/hooks";
import type { Accreditation, Institute, InstituteStatus } from "../api/types";
import { InstituteForm } from "../components/InstituteForm";
import {
  Alert,
  Button,
  Card,
  Detail,
  ErrorBox,
  Loading,
  PageHeader,
  StatusBadge,
  Table,
  Tag,
  Td,
  Th,
} from "../components/ui";

export function InstituteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const { data, error, loading, reload } = useApi<Institute>(
    id ? `/institutes/${id}` : null,
  );
  const action = useAction();

  if (loading) return <Loading label="Loading institute" />;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  const institute = data;

  async function setStatus(status: InstituteStatus) {
    const result = await action.run(() =>
      api.put<Institute>(`/institutes/${institute.id}/status`, { status }),
    );
    if (result) void reload();
  }

  async function provision() {
    const result = await action.run(() =>
      api.post<Institute>(`/institutes/${institute.id}/provision`),
    );
    if (result) void reload();
  }

  async function migrate() {
    const result = await action.run(() =>
      api.post<Institute>(`/institutes/${institute.id}/migrate`),
    );
    if (result) void reload();
  }

  async function save(payload: Record<string, unknown>) {
    const result = await action.run(() =>
      api.patch<Institute>(`/institutes/${institute.id}`, payload),
    );
    if (result) {
      setEditing(false);
      void reload();
    }
  }

  if (editing) {
    return (
      <>
        <PageHeader
          eyebrow={institute.code}
          title="Edit institute"
          description="The code cannot change — it names the PostgreSQL schema holding this institute's data."
        />
        <InstituteForm
          mode="edit"
          initial={institute}
          error={action.error}
          busy={action.busy}
          onSubmit={save}
          onCancel={() => {
            action.clearError();
            setEditing(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={institute.schema}
        title={institute.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={institute.status} />
            <Tag tone="accent">{institute.code}</Tag>
            <Tag>{institute.hei_category.replace(/_/g, " ")}</Tag>
            <Tag>{institute.programme_level}</Tag>
          </span>
        }
        actions={
          <>
            <Button onClick={() => navigate("/institutes")}>Back</Button>
            <Button variant="primary" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </>
        }
      />

      <ErrorBox error={action.error} />

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-6">
          <ScaleCard accreditation={institute.accreditation} />

          <Card title="Configuration" subtitle="Category defaults, then the affiliating university's settings, then this institute's own.">
            <dl>
              <Detail label="Term pattern">{institute.config.term_pattern}</Detail>
              <Detail label="Terms per year">
                {institute.config.terms_per_year}
              </Detail>
              <Detail label="Academic year starts">
                Month {institute.config.academic_year_start_month}
              </Detail>
            </dl>
            <div className="border-t border-ink-100 px-5 py-4">
              <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-400">
                Features
              </p>
              <ul className="flex flex-col gap-1.5">
                {Object.entries(institute.config.features).map(
                  ([feature, enabled]) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span
                        className={`size-1.5 rounded-full ${
                          enabled ? "bg-emerald-600" : "bg-ink-300"
                        }`}
                      />
                      <span
                        className={enabled ? "text-ink-800" : "text-ink-400"}
                      >
                        {humanise(feature)}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Registration">
            <dl>
              <Detail label="Affiliating university">
                {institute.affiliating_university ? (
                  <Link
                    to={`/universities/${institute.affiliating_university.id}`}
                    className="underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900"
                  >
                    {institute.affiliating_university.code} —{" "}
                    {institute.affiliating_university.name}
                  </Link>
                ) : (
                  <span className="text-ink-500">
                    None — assessed in its own right
                  </span>
                )}
              </Detail>
              {institute.university_kind && (
                <Detail label="University kind">
                  {humanise(institute.university_kind)}
                </Detail>
              )}
              <Detail label="Discipline">
                {humanise(institute.discipline)}
              </Detail>
              <Detail label="AISHE code">
                {institute.aishe_code ?? "—"}
              </Detail>
              <Detail label="UGC recognition">
                <span className="flex gap-2">
                  <Tag tone={institute.ugc_section_2f ? "accent" : "neutral"}>
                    {institute.ugc_section_2f ? "2(f) ✓" : "2(f) ✗"}
                  </Tag>
                  <Tag tone={institute.ugc_section_12b ? "accent" : "neutral"}>
                    {institute.ugc_section_12b ? "12(B) ✓" : "12(B) ✗"}
                  </Tag>
                </span>
              </Detail>
              <Detail label="Established">
                {formatDate(institute.established_on)}
              </Detail>
              <Detail label="Time zone">{institute.time_zone}</Detail>
              <Detail label="Schema">
                <code className="font-mono text-xs">{institute.schema}</code>
              </Detail>
              <Detail label="Created">
                {formatTime(institute.inserted_at)}
              </Detail>
              <Detail label="Updated">{formatTime(institute.updated_at)}</Detail>
            </dl>
          </Card>

          <Card
            title="Lifecycle"
            subtitle="Only an active institute serves requests."
          >
            <div className="flex flex-wrap gap-2 px-5 py-4">
              {institute.status !== "active" && (
                <Button onClick={() => setStatus("active")} disabled={action.busy}>
                  Activate
                </Button>
              )}
              {institute.status === "active" && (
                <Button
                  onClick={() => setStatus("suspended")}
                  disabled={action.busy}
                >
                  Suspend
                </Button>
              )}
              {institute.status !== "archived" && (
                <Button
                  onClick={() => setStatus("archived")}
                  disabled={action.busy}
                >
                  Archive
                </Button>
              )}
              <Button onClick={provision} disabled={action.busy}>
                Re-provision
              </Button>
              <Button onClick={migrate} disabled={action.busy}>
                Migrate schema
              </Button>
            </div>
            <p className="border-t border-ink-100 bg-ink-50/50 px-5 py-3 text-xs leading-relaxed text-ink-500">
              Re-provisioning an institute that already has a schema{" "}
              <strong>repairs</strong> it — it brings migrations up to date and
              never rebuilds, so no data is lost. An institute that has served
              requests is never deleted: it holds accreditation records, and is
              archived instead.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function ScaleCard({ accreditation }: { accreditation: Accreditation }) {
  if (accreditation.status === "unavailable") {
    return (
      <Card title="NAAC assessment scale">
        <div className="p-5">
          <Alert tone="warning" title="No scale could be resolved">
            <p>{accreditation.detail}</p>
            <p className="mt-1 font-mono text-xs">
              reason: {accreditation.reason}
            </p>
          </Alert>
        </div>
      </Card>
    );
  }

  const peak = Math.max(...accreditation.criteria.map((c) => c.marks));

  return (
    <Card
      title="NAAC assessment scale"
      subtitle={`${accreditation.manual_name} · assessed at ${accreditation.programme_level.toUpperCase()}`}
      actions={
        <span className="tabular rounded-md bg-ink-900 px-2.5 py-1 text-sm font-semibold text-white">
          {accreditation.total_marks}
        </span>
      }
    >
      <Table>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Criterion</Th>
            <Th align="right">Marks</Th>
          </tr>
        </thead>
        <tbody>
          {accreditation.criteria.map((criterion) => (
            <tr key={criterion.number}>
              <Td className="tabular w-8 font-mono text-xs text-ink-400">
                {criterion.number}
              </Td>
              <Td>
                <span className="text-sm text-ink-800">{criterion.name}</span>
                <span className="mt-1 block h-1 rounded-full bg-ink-100">
                  <span
                    className="block h-1 rounded-full bg-brass-500"
                    style={{ width: `${(criterion.marks / peak) * 100}%` }}
                  />
                </span>
              </Td>
              <Td align="right" className="tabular font-medium text-ink-900">
                {criterion.marks}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="border-t border-ink-100 bg-ink-50/50 px-5 py-3 text-xs leading-relaxed text-ink-500">
        Resolved from seeded reference data, not decided in code — the category
        selects the manual and the programme level selects its column. Framework{" "}
        <code className="font-mono">{accreditation.framework}</code>, scored on
        the {accreditation.scoring_model.toUpperCase()} model, with weightages
        checked against the NAAC manual for this category.
      </p>
    </Card>
  );
}

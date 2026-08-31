import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, describe } from "../api/client";
import { useAction, useApi, useClassification } from "../api/hooks";
import type { InstituteSummary, MigrationReport } from "../api/types";
import {
  Alert,
  Button,
  Card,
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  Select,
  StatusBadge,
  Table,
  Tag,
  Td,
  Th,
} from "../components/ui";

export function Institutes() {
  const navigate = useNavigate();
  const { classification } = useClassification();

  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (category) query.set("hei_category", category);
  const suffix = query.toString() ? `?${query}` : "";

  const { data, error, loading, reload } = useApi<InstituteSummary[]>(
    `/institutes${suffix}`,
  );

  const migrate = useAction();
  const [report, setReport] = useState<MigrationReport | null>(null);

  async function migrateAll() {
    const result = await migrate.run(() =>
      api.post<MigrationReport>("/institutes/migrate"),
    );
    if (result) {
      setReport(result);
      void reload();
    }
  }

  const rows = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Tenant management"
        title="Institutes"
        description="Each one is a Higher Education Institution and a tenant, with its own PostgreSQL schema."
        actions={
          <>
            <Button onClick={migrateAll} disabled={migrate.busy}>
              {migrate.busy ? "Migrating…" : "Migrate all"}
            </Button>
            <Button variant="primary" onClick={() => navigate("/institutes/new")}>
              Onboard institute
            </Button>
          </>
        }
      />

      <ErrorBox error={migrate.error} />

      {report && (
        <div className="mb-5">
          <Alert tone={report.failed.length ? "warning" : "info"}>
            <p>
              Migrated {report.migrated.length}{" "}
              {report.migrated.length === 1 ? "institute" : "institutes"}
              {report.failed.length > 0 && `, ${report.failed.length} failed`}.
              Archived and failed institutes are skipped.
            </p>
            {report.failed.length > 0 && (
              <ul className="mt-1.5 list-inside list-disc font-mono text-xs">
                {report.failed.map((failure) => (
                  <li key={failure.code}>
                    {failure.code}: {failure.reason}
                  </li>
                ))}
              </ul>
            )}
          </Alert>
        </div>
      )}

      <Card
        title={`${rows.length} ${rows.length === 1 ? "institute" : "institutes"}`}
        actions={
          <div className="flex gap-2">
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by HEI category"
            >
              <option value="">All categories</option>
              {(classification?.hei_categories ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {(classification?.statuses ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        {error ? (
          <div className="p-5">
            <Alert tone="error">{describe(error)}</Alert>
          </div>
        ) : loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title="No institutes match">
            {status || category
              ? "Try clearing the filters."
              : "Onboard one to get started."}
          </Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Level</Th>
                <Th>Affiliated to</Th>
                <Th align="right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((institute) => (
                <tr key={institute.id} className="hover:bg-ink-50/60">
                  <Td>
                    <Link
                      to={`/institutes/${institute.id}`}
                      className="font-mono text-sm font-medium text-ink-900 underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900"
                    >
                      {institute.code}
                    </Link>
                    <span className="mt-0.5 block font-mono text-[0.65rem] text-ink-400">
                      {institute.schema}
                    </span>
                  </Td>
                  <Td className="text-ink-800">{institute.name}</Td>
                  <Td className="text-ink-600">
                    {institute.hei_category.replace(/_/g, " ")}
                    {institute.university_kind && (
                      <span className="mt-0.5 block text-xs text-ink-400">
                        {institute.university_kind.replace(/_/g, " ")}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <Tag>{institute.programme_level}</Tag>
                  </Td>
                  <Td>
                    {institute.affiliating_university ? (
                      <Link
                        to={`/universities/${institute.affiliating_university.id}`}
                        className="text-sm text-ink-700 underline decoration-ink-200 underline-offset-2 hover:decoration-ink-900"
                      >
                        {institute.affiliating_university.code}
                      </Link>
                    ) : (
                      <span
                        className="text-ink-300"
                        title="A university is assessed in its own right and is affiliated to nobody."
                      >
                        —
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <StatusBadge status={institute.status} />
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

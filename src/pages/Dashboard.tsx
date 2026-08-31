import { Link } from "react-router-dom";
import { formatTime } from "../api/client";
import { useApi } from "../api/hooks";
import type {
  AffiliatingUniversity,
  Framework,
  Health,
  InstituteStatus,
  InstituteSummary,
} from "../api/types";
import {
  Card,
  ErrorBox,
  Loading,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "../components/ui";

export function Dashboard() {
  const health = useApi<Health>("/health");
  const institutes = useApi<InstituteSummary[]>("/institutes");
  const universities = useApi<AffiliatingUniversity[]>(
    "/affiliating-universities",
  );
  const framework = useApi<Framework>("/reference/accreditation");

  const rows = institutes.data ?? [];
  const byStatus = countBy(rows, (row) => row.status);
  const needsAttention = rows.filter(
    (row) => row.status === "failed" || row.status === "suspended",
  );

  return (
    <>
      <PageHeader
        eyebrow="Tenant management"
        title="Overview"
        description="Every institute is one PostgreSQL schema. Only an active institute serves requests."
      />

      <ErrorBox error={health.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Institutes"
          value={rows.length}
          detail={`${byStatus.active ?? 0} active`}
        />
        <Stat
          label="Affiliating universities"
          value={universities.data?.length ?? 0}
          detail="Reference records"
        />
        <Stat
          label="Assessment framework"
          value={framework.data?.framework.scoring_model.toUpperCase() ?? "—"}
          detail={
            framework.data
              ? `${framework.data.manuals.length} manuals`
              : "Not installed"
          }
        />
        <Stat
          label="Tenant migration"
          value={health.data?.tenant_migration_version ?? "—"}
          detail="Applied to every schema"
        />
      </div>

      {needsAttention.length > 0 && (
        <div className="mb-6">
          <Card
            title="Needs attention"
            subtitle="Institutes that are not serving requests."
          >
            <Table>
              <tbody>
                {needsAttention.map((institute) => (
                  <tr key={institute.id}>
                    <Td>
                      <Link
                        to={`/institutes/${institute.id}`}
                        className="font-mono text-sm text-ink-900 underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900"
                      >
                        {institute.code}
                      </Link>
                    </Td>
                    <Td>{institute.name}</Td>
                    <Td align="right">
                      <StatusBadge status={institute.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Recently updated"
          subtitle="The five institutes touched most recently."
        >
          {institutes.loading ? (
            <Loading />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Category</Th>
                  <Th align="right">Updated</Th>
                </tr>
              </thead>
              <tbody>
                {[...rows]
                  .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
                  .slice(0, 5)
                  .map((institute) => (
                    <tr key={institute.id}>
                      <Td>
                        <Link
                          to={`/institutes/${institute.id}`}
                          className="font-mono text-sm text-ink-900 underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900"
                        >
                          {institute.code}
                        </Link>
                      </Td>
                      <Td className="text-ink-600">
                        {institute.hei_category.replace(/_/g, " ")}
                      </Td>
                      <Td align="right" className="tabular text-xs text-ink-500">
                        {formatTime(institute.updated_at)}
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title="By status">
          <dl className="flex flex-col">
            {(
              [
                "active",
                "provisioning",
                "suspended",
                "archived",
                "failed",
              ] as InstituteStatus[]
            ).map((status) => (
              <div
                key={status}
                className="flex items-center gap-3 border-b border-ink-100 px-5 py-2.5 last:border-b-0"
              >
                <dt>
                  <StatusBadge status={status} />
                </dt>
                <dd className="tabular ml-auto text-sm font-medium text-ink-900">
                  {byStatus[status] ?? 0}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {health.data && (
        <p className="mt-6 text-xs text-ink-400">
          Timestamps are stored in UTC and rendered with an explicit offset.
          Server time {health.data.server_time_local} (
          {health.data.default_time_zone}).
        </p>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-5 py-4 shadow-sm">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-400">
        {label}
      </p>
      <p className="tabular mt-1.5 text-2xl font-semibold text-ink-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-ink-500">{detail}</p>
    </div>
  );
}

function countBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, number>>((totals, item) => {
    const bucket = key(item);
    totals[bucket] = (totals[bucket] ?? 0) + 1;
    return totals;
  }, {});
}

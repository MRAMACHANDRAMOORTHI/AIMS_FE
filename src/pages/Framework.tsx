import { useState } from "react";
import { formatDate } from "../api/client";
import { useApi } from "../api/hooks";
import type { Framework as FrameworkData, ProgrammeLevel } from "../api/types";
import {
  Alert,
  Card,
  ErrorBox,
  Loading,
  PageHeader,
  Table,
  Tag,
  Td,
  Th,
} from "../components/ui";

export function Framework() {
  const { data, error, loading } = useApi<FrameworkData>(
    "/reference/accreditation",
  );
  const [level, setLevel] = useState<ProgrammeLevel>("ug");

  if (loading) return <Loading label="Loading framework" />;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;

  return (
    <>
      <PageHeader
        eyebrow="Reference data"
        title={data.framework.name}
        description="NAAC publishes three separate manuals. All of this is seeded reference data, so a corrected weightage is a row update rather than a release."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Tag tone="accent">{data.framework.code}</Tag>
        <Tag>{data.framework.authority}</Tag>
        <Tag>{data.framework.scoring_model}</Tag>
        {data.framework.effective_from && (
          <span className="text-xs text-ink-500">
            in force from {formatDate(data.framework.effective_from)}
          </span>
        )}
        {data.framework.source_url && (
          <a
            href={data.framework.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-ink-600 underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900"
          >
            source
          </a>
        )}
      </div>

      <div className="mb-6">
        <Alert tone="info" title="Checked against the NAAC manuals">
          <p className="leading-relaxed">
            Every weightage here matches the published NAAC manual for its
            category, and every column totals 1000.
          </p>
          <p className="mt-2 leading-relaxed">
            Correcting one is an edit in{" "}
            <code className="font-mono">Aims.Accreditation.Reference</code>{" "}
            followed by <code className="font-mono">mix aims.naac.install</code>.
          </p>
        </Alert>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-ink-600">Programme level</span>
        <div className="flex rounded-md bg-ink-100 p-0.5">
          {(["ug", "pg"] as ProgrammeLevel[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLevel(option)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                level === option
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {data.manuals.map((manual) => {
          const criteria = manual.criteria[level] ?? [];
          const peak = Math.max(1, ...criteria.map((c) => c.marks));

          return (
            <Card
              key={manual.code}
              title={manual.name}
              subtitle={
                manual.published_on
                  ? `Published ${formatDate(manual.published_on)}`
                  : undefined
              }
              actions={
                <span className="tabular rounded-md bg-ink-900 px-2.5 py-1 text-sm font-semibold text-white">
                  {manual.total_marks[level]}
                </span>
              }
            >
              <div className="flex flex-wrap gap-1.5 border-b border-ink-100 px-5 py-3">
                {manual.hei_categories.map((category) => (
                  <Tag key={category}>{category.replace(/_/g, " ")}</Tag>
                ))}
              </div>

              <Table>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Criterion</Th>
                    <Th align="right">Marks</Th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((criterion) => (
                    <tr key={criterion.number}>
                      <Td className="tabular w-8 font-mono text-xs text-ink-400">
                        {criterion.number}
                      </Td>
                      <Td>
                        <span className="text-sm text-ink-800">
                          {criterion.name}
                        </span>
                        <span className="mt-1 block h-1 rounded-full bg-ink-100">
                          <span
                            className="block h-1 rounded-full bg-brass-500"
                            style={{
                              width: `${(criterion.marks / peak) * 100}%`,
                            }}
                          />
                        </span>
                      </Td>
                      <Td
                        align="right"
                        className="tabular font-medium text-ink-900"
                      >
                        {criterion.marks}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-500">
        NAAC announced in February 2025 that the CGPA model would be replaced by
        binary accreditation — Accredited / Not Accredited — plus Maturity-Based
        Graded Levels 1–5. That portal has not launched and no revised date is
        confirmed, so the CGPA model above is what is in force. The framework
        record carries a <code className="font-mono">scoring_model</code>, so
        when binary arrives it is a new row rather than a rewrite.
      </p>
    </>
  );
}

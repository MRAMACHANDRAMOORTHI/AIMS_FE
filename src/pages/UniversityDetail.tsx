import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError, formatTime } from "../api/client";
import { useAction, useApi } from "../api/hooks";
import type { AffiliatingUniversity, InstituteSummary } from "../api/types";
import {
  Alert,
  Button,
  Card,
  Detail,
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  StatusBadge,
  Table,
  Tag,
  Td,
  Th,
} from "../components/ui";

export function UniversityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const university = useApi<AffiliatingUniversity>(
    id ? `/affiliating-universities/${id}` : null,
  );
  const colleges = useApi<InstituteSummary[]>(
    id ? `/affiliating-universities/${id}/institutes` : null,
  );
  const action = useAction();

  if (university.loading) return <Loading label="Loading university" />;
  if (university.error) return <ErrorBox error={university.error} />;
  if (!university.data) return null;

  const record = university.data;
  const rows = colleges.data ?? [];

  async function remove() {
    const done = await action.run(() =>
      api.del<void>(`/affiliating-universities/${record.id}`),
    );
    if (done !== undefined) navigate("/universities");
  }

  const blocked =
    action.error instanceof ApiError &&
    action.error.code === "university_has_institutes";

  return (
    <>
      <PageHeader
        eyebrow="Affiliating university"
        title={record.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Tag tone="accent">{record.code}</Tag>
            <Tag>{record.university_kind.replace(/_/g, " ")}</Tag>
          </span>
        }
        actions={
          <>
            <Button onClick={() => navigate("/universities")}>Back</Button>
            <Button variant="danger" onClick={remove} disabled={action.busy}>
              Delete
            </Button>
          </>
        }
      />

      {blocked ? (
        <div className="mb-5">
          <Alert tone="warning" title="Still referenced">
            {(action.error as ApiError).detail} Deleting it would leave colleges
            pointing at nothing.
          </Alert>
        </div>
      ) : (
        <ErrorBox error={action.error} />
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card title="Record">
          <dl>
            <Detail label="Code">
              <code className="font-mono text-sm">{record.code}</code>
            </Detail>
            <Detail label="Kind">
              {record.university_kind.replace(/_/g, " ")}
            </Detail>
            <Detail label="AISHE code">{record.aishe_code ?? "—"}</Detail>
            <Detail label="Location">
              {[record.city, record.state].filter(Boolean).join(", ") || "—"}
            </Detail>
            <Detail label="Website">
              {record.website ? (
                <a
                  href={record.website}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900"
                >
                  {record.website}
                </a>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label="Time zone">{record.time_zone}</Detail>
            <Detail label="Created">{formatTime(record.inserted_at)}</Detail>
          </dl>

          <div className="border-t border-ink-100 px-5 py-4">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-400">
              Inherited settings
            </p>
            {Object.keys(record.settings).length === 0 ? (
              <p className="text-sm text-ink-400">
                None — its colleges use the category defaults.
              </p>
            ) : (
              <pre className="overflow-x-auto rounded-md bg-ink-50 p-3 font-mono text-xs text-ink-700">
                {JSON.stringify(record.settings, null, 2)}
              </pre>
            )}
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              Every college affiliated to this university inherits these values
              unless it overrides them itself.
            </p>
          </div>
        </Card>

        <Card
          title="Affiliated colleges"
          subtitle={`${rows.length} ${rows.length === 1 ? "college names" : "colleges name"} this university`}
        >
          {colleges.loading ? (
            <Loading />
          ) : rows.length === 0 ? (
            <Empty title="No colleges yet">
              This university can be deleted while nothing references it.
            </Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th align="right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((college) => (
                  <tr key={college.id} className="hover:bg-ink-50/60">
                    <Td>
                      <Link
                        to={`/institutes/${college.id}`}
                        className="font-mono text-sm text-ink-900 underline decoration-ink-300 underline-offset-2 hover:decoration-ink-900"
                      >
                        {college.code}
                      </Link>
                    </Td>
                    <Td className="text-ink-800">{college.name}</Td>
                    <Td className="text-ink-600">
                      {college.hei_category.replace(/_/g, " ")}
                    </Td>
                    <Td align="right">
                      <StatusBadge status={college.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

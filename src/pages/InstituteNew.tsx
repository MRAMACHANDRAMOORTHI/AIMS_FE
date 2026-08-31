import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAction } from "../api/hooks";
import type { Institute } from "../api/types";
import { InstituteForm } from "../components/InstituteForm";
import { Alert, PageHeader } from "../components/ui";

export function InstituteNew() {
  const navigate = useNavigate();
  const action = useAction();

  async function create(payload: Record<string, unknown>) {
    const institute = await action.run(() =>
      api.post<Institute>("/institutes", payload),
    );
    if (institute) navigate(`/institutes/${institute.id}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Tenant management"
        title="Onboard institute"
        description="Creating an institute also provisions its PostgreSQL schema and runs every tenant migration into it."
      />

      <div className="mb-5">
        <Alert tone="info">
          The institute becomes <strong>active</strong> only once the row is
          committed, the schema exists and the migrations have run. If any of
          that fails it is left <strong>failed</strong> — visible, queryable and
          repairable — never half-created.
        </Alert>
      </div>

      <InstituteForm
        mode="create"
        error={action.error}
        busy={action.busy}
        onSubmit={create}
        onCancel={() => navigate("/institutes")}
      />
    </>
  );
}

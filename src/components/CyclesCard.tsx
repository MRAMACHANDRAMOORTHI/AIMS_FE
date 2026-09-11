import { useState } from "react";
import { formatDate } from "../api/client";
import { useApi } from "../api/hooks";
import type { AccreditationCycle, CycleEvent, CycleStatus } from "../api/types";
import { Card, Empty, ErrorBox, Loading, Table, Tag, Td, Th } from "./ui";

// NAAC's process as five stages. A cycle that ended early stops at the stage
// it ended in.
const STAGES = ["IIQA", "SSR", "DVV", "Visit", "Result"] as const;

const STAGE_OF: Record<CycleStatus, number> = {
  preparing: 0,
  iiqa_submitted: 0,
  iiqa_rejected: 0,
  withdrawn: 0,
  iiqa_accepted: 1,
  lapsed: 1,
  ssr_submitted: 2,
  not_prequalified: 2,
  dvv_terminated: 2,
  prequalified: 3,
  visited: 4,
  under_appeal: 5,
  accredited: 5,
  not_accredited: 5,
};

const LIVE = "bg-sky-50 text-sky-700 ring-sky-600/20";
const GOOD = "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
const ENDED = "bg-rose-50 text-rose-700 ring-rose-600/20";
const WAITING = "bg-amber-50 text-amber-800 ring-amber-600/20";
const NEUTRAL = "bg-ink-100 text-ink-600 ring-ink-500/20";

const STATUS: Record<CycleStatus, { label: string; tone: string }> = {
  preparing: { label: "preparing", tone: LIVE },
  iiqa_submitted: { label: "IIQA submitted", tone: LIVE },
  iiqa_accepted: { label: "SSR due", tone: LIVE },
  ssr_submitted: { label: "in DVV", tone: LIVE },
  prequalified: { label: "pre-qualified", tone: LIVE },
  visited: { label: "awaiting result", tone: LIVE },
  under_appeal: { label: "under appeal", tone: WAITING },
  accredited: { label: "accredited", tone: GOOD },
  not_accredited: { label: "not accredited", tone: ENDED },
  iiqa_rejected: { label: "IIQA rejected", tone: ENDED },
  lapsed: { label: "lapsed", tone: ENDED },
  not_prequalified: { label: "not pre-qualified", tone: ENDED },
  dvv_terminated: { label: "terminated at DVV", tone: ENDED },
  withdrawn: { label: "withdrawn", tone: NEUTRAL },
};

const EVENTS: Record<string, string> = {
  open: "Cycle opened",
  record_result: "Result recorded from before AIMS",
  submit_iiqa: "IIQA submitted",
  accept_iiqa: "IIQA accepted",
  reject_iiqa: "IIQA rejected",
  extend_ssr: "SSR deadline extended",
  submit_ssr: "SSR submitted",
  lapse: "Lapsed without an SSR",
  complete_dvv: "DVV completed",
  terminate_dvv: "Terminated at DVV",
  complete_visit: "Peer team visit",
  declare_result: "Result declared",
  file_appeal: "Appeal filed",
  decide_appeal: "Appeal decided",
  withdraw_appeal: "Appeal withdrawn",
  withdraw: "Withdrawn",
};

/**
 * An institute's NAAC accreditation cycles, as the platform sees them.
 *
 * Read-only on purpose: the institute's IQAC records its own progress through
 * the tenant API. This shows where it stands — the cycle in progress and the
 * deadline that matters next, every result on record, and each cycle's history.
 */
export function CyclesCard({ instituteId }: { instituteId: number }) {
  const { data, error, loading } = useApi<AccreditationCycle[]>(
    `/institutes/${instituteId}/cycles`,
  );
  const [expanded, setExpanded] = useState<number | null>(null);

  const live = data?.find((cycle) => cycle.live);

  return (
    <Card
      title="NAAC accreditation"
      subtitle="Recorded by the institute's IQAC. Read-only here."
    >
      {loading ? (
        <Loading label="Loading cycles" />
      ) : error ? (
        <div className="p-5">
          <ErrorBox error={error} />
        </div>
      ) : !data || data.length === 0 ? (
        <Empty title="No cycles on record">
          The institute opens one when it starts preparing its IIQA.
        </Empty>
      ) : (
        <>
          {live && <InProgress cycle={live} />}
          <Table>
            <thead>
              <tr>
                <Th>Assessment</Th>
                <Th>Status</Th>
                <Th align="right">CGPA</Th>
                <Th>Grade</Th>
                <Th>Valid until</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((cycle) => (
                <CycleRow
                  key={cycle.id}
                  cycle={cycle}
                  expanded={expanded === cycle.id}
                  onToggle={() =>
                    setExpanded(expanded === cycle.id ? null : cycle.id)
                  }
                />
              ))}
            </tbody>
          </Table>
        </>
      )}
    </Card>
  );
}

function CycleRow({
  cycle,
  expanded,
  onToggle,
}: {
  cycle: AccreditationCycle;
  expanded: boolean;
  onToggle: () => void;
}) {
  const result = cycle.result;
  const cgpa = result?.cgpa;

  return (
    <>
      <tr>
        <Td>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="flex items-center gap-1.5 rounded text-left text-sm font-medium text-ink-900 decoration-ink-300 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900"
          >
            <span
              aria-hidden
              className={`inline-block w-2 text-ink-400 transition-transform motion-reduce:transition-none ${
                expanded ? "rotate-90" : ""
              }`}
            >
              ›
            </span>
            {cycle.label}
          </button>
          {cycle.origin === "recorded" && (
            <span className="ml-3.5 block text-xs text-ink-400">
              recorded from before AIMS
            </span>
          )}
        </Td>
        <Td>
          <CycleBadge status={cycle.status} />
        </Td>
        <Td align="right" className="tabular text-ink-800">
          {cgpa != null ? cgpa.toFixed(2) : "—"}
        </Td>
        <Td>
          {result ? (
            <Tag tone={result.highest_grade ? "accent" : "neutral"}>
              {result.grade}
            </Tag>
          ) : (
            <span className="text-ink-400">—</span>
          )}
        </Td>
        <Td className="tabular text-ink-600">
          {result?.valid_until ? formatDate(result.valid_until) : "—"}
        </Td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="border-b border-ink-100 p-0">
            <History events={cycle.history} />
          </td>
        </tr>
      )}
    </>
  );
}

function InProgress({ cycle }: { cycle: AccreditationCycle }) {
  const stage = STAGE_OF[cycle.status];
  const next = nextStep(cycle);

  return (
    <div className="border-b border-ink-100 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink-900">{cycle.label}</span>
        <CycleBadge status={cycle.status} />
        <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-400">
          in progress
        </span>
      </div>

      <ol className="mt-3 grid grid-cols-5 gap-1.5" aria-label="Stages of the assessment">
        {STAGES.map((name, index) => {
          const state =
            index < stage ? "done" : index === stage ? "current" : "pending";

          return (
            <li key={name} aria-current={state === "current" ? "step" : undefined}>
              <span
                className={`block h-1 rounded-full ${
                  state === "done"
                    ? "bg-emerald-600"
                    : state === "current"
                      ? "bg-brass-500"
                      : "bg-ink-100"
                }`}
              />
              <span
                className={`mt-1 block font-mono text-[0.65rem] uppercase tracking-[0.08em] ${
                  state === "pending" ? "text-ink-300" : "text-ink-600"
                }`}
              >
                {name}
              </span>
            </li>
          );
        })}
      </ol>

      {next && (
        <p
          className={`mt-3 text-xs leading-relaxed ${
            next.urgent ? "font-medium text-rose-700" : "text-ink-600"
          }`}
        >
          {next.text}
        </p>
      )}
    </div>
  );
}

// What the cycle is waiting on, in the words an IQAC coordinator would use.
function nextStep(
  cycle: AccreditationCycle,
): { text: string; urgent?: boolean } | null {
  const { iiqa, ssr, prequalification, visit, appeal } = cycle;

  switch (cycle.status) {
    case "preparing":
      return iiqa.attempts > 0
        ? {
            text: `Preparing IIQA attempt ${iiqa.attempts + 1} of ${
              iiqa.attempts_allowed ?? "?"
            }, after a rejection.`,
          }
        : { text: "Preparing the IIQA." };

    case "iiqa_submitted":
      return {
        text: `IIQA submitted ${formatDate(iiqa.submitted_on)}, awaiting NAAC's decision.`,
      };

    case "iiqa_accepted":
      return ssr.overdue
        ? {
            text: `The SSR was due ${formatDate(ssr.due_on)} and has not been submitted. NAAC ends the process when it is missed.`,
            urgent: true,
          }
        : {
            text: `SSR due ${formatDate(ssr.due_on)}${
              ssr.extension_days ? `, after a ${ssr.extension_days}-day extension` : ""
            }.`,
          };

    case "ssr_submitted":
      return {
        text: `SSR submitted ${formatDate(ssr.submitted_on)}. DVV and the student satisfaction survey are under way.`,
      };

    case "prequalified":
      return {
        text: `Cleared the pre-qualifier with ${prequalification.qnm_percent}% against ${prequalification.threshold_percent}%. Peer team visit due by ${formatDate(prequalification.visit_due_by)}.`,
      };

    case "visited":
      return {
        text: `Peer team visited ${formatDate(visit.from)} to ${formatDate(visit.to)}. Awaiting the result.`,
      };

    case "under_appeal":
      return {
        text: `Appeal filed ${formatDate(appeal?.filed_on ?? null)}. The proforma is due by ${formatDate(appeal?.proforma_due_on ?? null)}.`,
      };

    default:
      return null;
  }
}

function History({ events }: { events: CycleEvent[] }) {
  return (
    <ol className="flex flex-col gap-2.5 bg-ink-50/60 px-5 py-4">
      {events.map((entry) => {
        const detail = detailOf(entry);

        return (
          <li key={entry.id} className="grid grid-cols-[6.5rem_1fr] gap-3">
            <span className="tabular pt-px text-xs text-ink-500">
              {formatDate(entry.occurred_on)}
            </span>
            <span className="min-w-0 text-sm">
              <span className="font-medium text-ink-800">
                {EVENTS[entry.event] ?? entry.event}
              </span>
              {detail && <span className="text-ink-500"> · {detail}</span>}
              {entry.notes && (
                <span className="block text-xs text-ink-600">{entry.notes}</span>
              )}
              {entry.recorded_by && (
                <span className="block text-xs text-ink-400">
                  recorded by {entry.recorded_by.name}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function detailOf({ event, details }: CycleEvent): string | null {
  const date = (key: string) => {
    const value = details[key];
    return formatDate(typeof value === "string" ? value : null);
  };

  switch (event) {
    case "submit_iiqa":
    case "reject_iiqa":
      return `attempt ${details.attempt} of ${details.attempts_allowed}`;
    case "accept_iiqa":
      return `SSR due ${date("ssr_due_on")}`;
    case "extend_ssr":
      return `${details.days} more days, due ${date("ssr_due_on")}`;
    case "complete_dvv":
      return `QnM ${details.qnm_percent}% against ${details.threshold_percent}%`;
    case "complete_visit":
      return `${date("visit_from")} to ${date("visit_to")}`;
    case "declare_result":
    case "decide_appeal":
      return `CGPA ${Number(details.cgpa).toFixed(2)}, ${details.grade}`;
    case "record_result":
      return String(details.grade);
    case "file_appeal":
      return `proforma due ${date("proforma_due_on")}`;
    default:
      return null;
  }
}

function CycleBadge({ status }: { status: CycleStatus }) {
  const { label, tone } = STATUS[status] ?? { label: status, tone: NEUTRAL };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

import type { Grade, ProcessRules } from "../api/types";
import { Card, Detail, Table, Td, Th } from "./ui";

/** NAAC's Table 3: each letter grade, the CGPA range that earns it, and whether it accredits. */
export function GradesCard({ grades }: { grades: Grade[] }) {
  return (
    <Card
      title="Grades"
      subtitle="Table 3 in every manual. Ranges are inclusive, at two decimal places."
    >
      <Table>
        <thead>
          <tr>
            <Th>Grade</Th>
            <Th>CGPA</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.letter}>
              <Td className="w-20">
                <span className="font-mono text-sm font-semibold text-ink-900">
                  {grade.letter}
                </span>
              </Td>
              <Td className="tabular text-ink-700">
                {grade.min_cgpa.toFixed(2)} – {grade.max_cgpa.toFixed(2)}
              </Td>
              <Td>
                {grade.accredited ? (
                  <span className="text-sm text-emerald-700">Accredited</span>
                ) : (
                  <span className="text-sm text-rose-700">Not accredited</span>
                )}
                {grade.highest && (
                  <span className="ml-2 text-xs text-ink-500">highest grade</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

/** The numbers of NAAC's process, in the order an institute meets them. */
export function ProcessRulesCard({ rules }: { rules: ProcessRules }) {
  const rows: [string, string][] = [
    [
      "First cycle",
      `${rules.first_cycle_min_years} years in existence, or ${rules.first_cycle_min_graduated_batches} graduated batches, whichever is earlier`,
    ],
    [
      "IIQA",
      `${rules.iiqa_attempts} attempts within ${period(rules.iiqa_attempt_window_months)} of the first, for one fee`,
    ],
    [
      "SSR",
      `within ${rules.ssr_window_days} days of the IIQA being accepted, with one extension of up to ${rules.ssr_extension_max_days} days`,
    ],
    [
      "Pre-qualifier",
      `${rules.prequalifier_qnm_percent}% in the Quantitative Metrics after DVV`,
    ],
    [
      "Peer team visit",
      `within ${period(rules.visit_within_months)} of clearing the pre-qualifier`,
    ],
    [
      "Appeal",
      `intent within ${rules.appeal_intent_days} days of the result, proforma within ${rules.appeal_proforma_days}`,
    ],
    [
      "Validity",
      `${rules.validity_years} years, or ${rules.extended_validity_years} from Cycle ${rules.extended_validity_from_cycle} for the highest grade three cycles running`,
    ],
    [
      "Next cycle",
      `IIQA in the last ${period(rules.reaccreditation_window_months)} of validity`,
    ],
    [
      "Re-assessment",
      `after ${period(rules.reassessment_after_months)} and before ${period(rules.reassessment_before_months)} from accreditation, once a cycle`,
    ],
    [
      "Applying again",
      `${period(rules.reapply_after_not_prequalified_months)} after missing the pre-qualifier; ${period(rules.reapply_after_withdrawal_months)} after withdrawing a submitted SSR; ${period(rules.reapply_after_dvv_termination_months)} after termination at DVV`,
    ],
  ];

  return (
    <Card
      title="Process rules"
      subtitle="From the manuals' Eligibility, Procedural Details, Appeals, Re-assessment and Subsequent Cycles sections."
    >
      <dl>
        {rows.map(([label, value]) => (
          <Detail key={label} label={label}>
            {value}
          </Detail>
        ))}
      </dl>
    </Card>
  );
}

function period(months: number): string {
  if (months % 12 === 0) return months === 12 ? "one year" : `${months / 12} years`;
  return months === 1 ? "one month" : `${months} months`;
}

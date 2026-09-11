// Mirrors the shapes the backend actually returns. Kept hand-written and small
// rather than generated, so a mismatch shows up as a type error at the one
// place that reads it.

export type HeiCategory =
  | "university"
  | "autonomous_college"
  | "constituent_college"
  | "affiliated_college";

export type UniversityKind =
  | "central"
  | "state"
  | "private"
  | "deemed_to_be"
  | "institution_of_national_importance";

export type ProgrammeLevel = "ug" | "pg";

export type InstituteStatus =
  | "provisioning"
  | "active"
  | "suspended"
  | "archived"
  | "failed";

/** One `{value, label}` pair from `/reference/classification`. */
export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export interface Classification {
  hei_categories: Option<HeiCategory>[];
  university_kinds: Option<UniversityKind>[];
  programme_levels: Option<ProgrammeLevel>[];
  disciplines: Option[];
  statuses: Option<InstituteStatus>[];
  /** Which categories require which field. The forms read these rather than
   *  hardcoding the rules — see `InstituteForm`. */
  rules: {
    university_kind_required_for: HeiCategory[];
    affiliating_university_required_for: HeiCategory[];
  };
}

export interface AffiliatingUniversity {
  id: number;
  code: string;
  name: string;
  university_kind: UniversityKind;
  aishe_code: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  time_zone: string;
  settings: Record<string, unknown>;
  inserted_at: string;
  updated_at: string;
}

/** The nested form an institute carries for its affiliating university. */
export interface UniversityRef {
  id: number;
  code: string;
  name: string;
}

export interface Criterion {
  number: number;
  name: string;
  marks: number;
}

export type Accreditation =
  | {
      status: "resolved";
      framework: string;
      framework_name: string;
      scoring_model: "cgpa" | "binary_mbgl";
      manual: string;
      manual_name: string;
      programme_level: ProgrammeLevel;
      total_marks: number;
      criteria: Criterion[];
    }
  | { status: "unavailable"; reason: string; detail: string };

/** The listing shape. Deliberately carries no mark scale. */
export interface InstituteSummary {
  id: number;
  code: string;
  name: string;
  hei_category: HeiCategory;
  university_kind: UniversityKind | null;
  programme_level: ProgrammeLevel;
  discipline: string;
  aishe_code: string | null;
  status: InstituteStatus;
  time_zone: string;
  schema: string;
  affiliating_university: UniversityRef | null;
  inserted_at: string;
  updated_at: string;
}

/** The detail shape: the summary plus configuration and the mark scale. */
export interface Institute extends InstituteSummary {
  ugc_section_2f: boolean;
  ugc_section_12b: boolean;
  established_on: string | null;
  accreditation: Accreditation;
  config: InstituteConfig;
  settings: Record<string, unknown>;
}

export interface InstituteConfig {
  term_pattern: string;
  terms_per_year: number;
  academic_year_start_month: number;
  features: Record<string, boolean>;
  [key: string]: unknown;
}

export interface Health {
  status: string;
  institutes: number;
  tenant_migration_version: number;
  server_time_utc: string;
  server_time_local: string;
  default_time_zone: string;
}

export interface Manual {
  code: string;
  name: string;
  hei_categories: HeiCategory[];
  published_on: string | null;
  source_url: string | null;
  criteria: Record<ProgrammeLevel, Criterion[]>;
  total_marks: Record<ProgrammeLevel, number>;
}

export interface Framework {
  framework: {
    code: string;
    name: string;
    authority: string;
    scoring_model: "cgpa" | "binary_mbgl";
    effective_from: string | null;
    effective_to: string | null;
    source_url: string | null;
    /** The deadlines, windows and thresholds of the process. */
    process_rules: ProcessRules | null;
    /** Highest first. */
    grades: Grade[];
  };
  manuals: Manual[];
}

export interface MigrationReport {
  migrated: string[];
  failed: { code: string; reason: string }[];
}

export interface PlatformAdmin {
  id: number;
  email: string;
  name: string;
  active: boolean;
  inserted_at: string;
}

// Accreditation cycles, from GET /institutes/:id/cycles. Read-only in this
// console: an institute records its own progress through the tenant API.

export type CycleStatus =
  | "preparing"
  | "iiqa_submitted"
  | "iiqa_accepted"
  | "ssr_submitted"
  | "prequalified"
  | "visited"
  | "under_appeal"
  | "accredited"
  | "not_accredited"
  | "iiqa_rejected"
  | "lapsed"
  | "not_prequalified"
  | "dvv_terminated"
  | "withdrawn";

export interface PersonRef {
  id: number;
  name: string;
}

/** One step in a cycle's history. `details` depends on the step. */
export interface CycleEvent {
  id: number;
  event: string;
  from_status: CycleStatus | null;
  to_status: CycleStatus;
  occurred_on: string;
  details: Record<string, string | number | boolean | null>;
  notes: string | null;
  recorded_by: PersonRef | null;
  recorded_at: string;
}

export interface CycleResult {
  declared_on: string;
  cgpa: number | null;
  grade: string;
  accredited: boolean;
  highest_grade: boolean;
  valid_until: string | null;
}

export interface CycleAppeal {
  intent_due_on: string | null;
  proforma_due_on: string | null;
  filed_on: string | null;
  outcome: "no_change" | "re_dvv" | "re_visit" | null;
  decided_on: string | null;
}

export interface AccreditationCycle {
  id: number;
  label: string;
  kind: "cycle" | "reassessment";
  cycle_number: number;
  status: CycleStatus;
  live: boolean;
  origin: "tracked" | "recorded";
  framework: string | null;
  scoring_model: "cgpa" | "binary_mbgl";
  graduated_batches: number | null;
  iiqa: {
    attempts: number;
    attempts_allowed: number | null;
    first_submitted_on: string | null;
    submitted_on: string | null;
    accepted_on: string | null;
  };
  ssr: {
    due_on: string | null;
    extension_days: number | null;
    submitted_on: string | null;
    overdue: boolean;
  };
  prequalification: {
    declared_on: string | null;
    qnm_percent: number | null;
    threshold_percent: number | null;
    visit_due_by: string | null;
  };
  visit: { from: string | null; to: string | null };
  result: CycleResult | null;
  appeal: CycleAppeal | null;
  closed_on: string | null;
  notes: string | null;
  available_events: string[];
  opened_by: PersonRef | null;
  history: CycleEvent[];
  inserted_at: string;
  updated_at: string;
}

/** A letter grade and the CGPA range that earns it, from NAAC's Table 3. */
export interface Grade {
  letter: string;
  min_cgpa: number;
  max_cgpa: number;
  accredited: boolean;
  highest: boolean;
}

/** The numbers of NAAC's process, as the manuals publish them. */
export interface ProcessRules {
  first_cycle_min_years: number;
  first_cycle_min_graduated_batches: number;
  iiqa_attempts: number;
  iiqa_attempt_window_months: number;
  ssr_window_days: number;
  ssr_extension_max_days: number;
  prequalifier_qnm_percent: number;
  reapply_after_not_prequalified_months: number;
  visit_within_months: number;
  reapply_after_withdrawal_months: number;
  reapply_after_dvv_termination_months: number;
  appeal_intent_days: number;
  appeal_proforma_days: number;
  reassessment_after_months: number;
  reassessment_before_months: number;
  reaccreditation_window_months: number;
  validity_years: number;
  extended_validity_years: number;
  extended_validity_from_cycle: number;
}

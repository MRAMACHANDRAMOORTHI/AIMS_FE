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

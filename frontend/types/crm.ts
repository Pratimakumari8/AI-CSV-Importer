export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number] | "";
export type DataSource = (typeof DATA_SOURCE_VALUES)[number] | "";

/** A single raw row parsed straight out of the uploaded CSV, before AI processing. */
export type RawCsvRow = Record<string, string>;

/** A single CRM record after AI extraction, matching the GrowEasy CRM format. */
export interface CrmRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: CrmStatus;
  crm_note?: string;
  data_source?: DataSource;
  possession_time?: string;
  description?: string;
}

/** A record the backend chose to skip, with the reason why. */
export interface SkippedRecord {
  row: RawCsvRow;
  reason: string;
  rowIndex?: number;
}

export interface ImportResponse {
  success: boolean;
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalReceived?: number;
  error?: string;
}

export type UploadStep = "upload" | "preview" | "processing" | "results";

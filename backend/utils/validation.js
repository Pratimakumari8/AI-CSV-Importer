const { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } = require("../prompts/crmExtractionPrompt");

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_DIGITS_REGEX = /\d{7,15}/;

/**
 * Defense-in-depth check: does this raw CSV row plausibly contain an email
 * or a phone number anywhere in its values? Used to sanity-check the AI's
 * skip decisions rather than trusting them blindly.
 */
function rowHasContactInfo(rawRow) {
  const values = Object.values(rawRow || {}).map((v) => String(v ?? ""));
  const joined = values.join(" ");
  return EMAIL_REGEX.test(joined) || PHONE_DIGITS_REGEX.test(joined.replace(/[\s()-]/g, ""));
}

/**
 * Strips a record down to only the allowed CRM schema keys, coerces
 * everything to single-line strings, and rejects enum values the model
 * hallucinated outside the allowed lists (rather than trusting them).
 */
function sanitizeCrmRecord(record) {
  const clean = {
    created_at: toSingleLineString(record.created_at),
    name: toSingleLineString(record.name),
    email: toSingleLineString(record.email).toLowerCase(),
    country_code: toSingleLineString(record.country_code),
    mobile_without_country_code: toSingleLineString(record.mobile_without_country_code).replace(
      /[\s()-]/g,
      ""
    ),
    company: toSingleLineString(record.company),
    city: toSingleLineString(record.city),
    state: toSingleLineString(record.state),
    country: toSingleLineString(record.country),
    lead_owner: toSingleLineString(record.lead_owner),
    crm_status: CRM_STATUS_VALUES.includes(record.crm_status) ? record.crm_status : "",
    crm_note: toSingleLineString(record.crm_note),
    data_source: DATA_SOURCE_VALUES.includes(record.data_source) ? record.data_source : "",
    possession_time: toSingleLineString(record.possession_time),
    description: toSingleLineString(record.description),
  };

  // created_at must survive `new Date(x)` on the frontend, or we drop it
  // rather than ship a value that will render as "Invalid Date".
  if (clean.created_at && Number.isNaN(new Date(clean.created_at).getTime())) {
    clean.created_at = "";
  }

  return clean;
}

function toSingleLineString(value) {
  if (value == null) return "";
  return String(value).replace(/\r?\n/g, " ").trim();
}

function recordHasContactInfo(record) {
  return Boolean(record.email) || Boolean(record.mobile_without_country_code);
}

module.exports = {
  rowHasContactInfo,
  sanitizeCrmRecord,
  recordHasContactInfo,
};

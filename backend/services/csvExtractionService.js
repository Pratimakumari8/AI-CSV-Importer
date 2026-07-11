const { getAiProvider } = require("./aiProviderFactory");
const { chunkArray, sleep, backoffDelay } = require("../utils/batchUtils");
const { sanitizeCrmRecord, recordHasContactInfo, rowHasContactInfo, extractContactInfo } = require("../utils/validation");

const BATCH_SIZE = Number(process.env.AI_BATCH_SIZE) || 25;
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES) || 3;

/**
 * Runs the full extraction pipeline over all uploaded rows.
 *
 * @param {Array<Record<string,string>>} rawRows - raw CSV rows as parsed by the frontend
 * @param {(processed: number, total: number) => void} [onProgress] - called after each batch completes
 * @returns {Promise<{imported: object[], skipped: object[], totalImported: number, totalSkipped: number, totalReceived: number}>}
 */
async function extractCrmRecords(rawRows, onProgress) {
  const provider = getAiProvider();
  const total = rawRows.length;

  // Tag every row with a stable, batch-local id so we can reassociate AI
  // output with its original row even if the model reorders entries.
  const taggedRows = rawRows.map((row, i) => ({ _id: `r${i}`, ...row }));
  const rowsById = new Map(taggedRows.map((row) => [row._id, row]));

  const batches = chunkArray(taggedRows, BATCH_SIZE);

  const imported = [];
  const skipped = [];
  let processed = 0;

  for (const batch of batches) {
    const batchResult = await processBatchWithRetry(provider, batch);

    if (batchResult.failed) {
      // Entire batch failed after all retries — skip every row in it with a
      // clear reason rather than silently dropping data or crashing the import.
      for (const row of batch) {
        skipped.push({
          row: stripId(row),
          reason: `AI processing failed after ${MAX_RETRIES} attempts: ${batchResult.error}`,
        });
      }
    } else {
      const returnedIds = new Set();

      for (const item of batchResult.records) {
        const originalRow = rowsById.get(item._id);
        if (!originalRow) continue; // AI invented an id we never sent — ignore it
        returnedIds.add(item._id);

        if (item._skip) {
          // Don't trust the AI's skip decision blindly — verify against the
          // row's actual content first. If it clearly has contact info, the
          // AI made a mapping error, not a legitimate skip. Recover it with
          // a direct regex extraction rather than losing the row.
          if (rowHasContactInfo(originalRow)) {
            imported.push(recoverFromRawRow(originalRow));
          } else {
            skipped.push({
              row: stripId(originalRow),
              reason: item._skip_reason || "Skipped by AI (no reason given)",
            });
          }
          continue;
        }

        const clean = sanitizeCrmRecord(item);

        // Defense in depth: even if the AI mapped fields, enforce the
        // documented skip rule (no email AND no mobile) server-side.
        if (!recordHasContactInfo(clean)) {
          skipped.push({
            row: stripId(originalRow),
            reason: "No email or phone number found in mapped output",
          });
          continue;
        }

        imported.push(clean);
      }

      // Any row the model silently dropped from its response gets a
      // fallback pass: check it directly against contact-info regexes
      // before deciding whether to skip it, rather than losing it silently.
      for (const row of batch) {
        if (returnedIds.has(row._id)) continue;
        if (rowHasContactInfo(row)) {
          imported.push(recoverFromRawRow(row));
        } else {
          skipped.push({
            row: stripId(row),
            reason: "No email or phone number found in any column",
          });
        }
      }
    }

    processed += batch.length;
    if (onProgress) onProgress(processed, total);
  }

  return {
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length,
    totalReceived: total,
  };
}

async function processBatchWithRetry(provider, batch) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const records = await provider.extractBatch(batch);
      return { failed: false, records };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt));
      }
    }
  }

  return { failed: true, error: lastError?.message || "Unknown error" };
}

function stripId({ _id, ...rest }) {
  return rest;
}

/**
 * Minimal fallback record builder for rows the AI incorrectly claimed had
 * no contact info (or silently dropped) despite the row clearly containing
 * one. Only email/phone are populated via direct regex extraction — this is
 * a safety net to avoid losing valid leads, not a substitute for full AI
 * field mapping, so other fields are left blank and crm_note explains why.
 */
function recoverFromRawRow(rawRow) {
  const { email, phone } = extractContactInfo(rawRow);
  return sanitizeCrmRecord({
    email,
    mobile_without_country_code: phone,
    crm_note:
      "Auto-recovered: AI did not map this row despite it containing an email/phone — only contact info was extracted automatically, other fields need manual review.",
  });
}

module.exports = { extractCrmRecords };
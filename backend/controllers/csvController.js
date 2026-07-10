const { parseCsvBuffer } = require("../services/csvParsingService");
const { extractCrmRecords } = require("../services/csvExtractionService");

/**
 * POST /api/csv/upload
 * Accepts a raw multipart CSV file and returns parsed rows for preview.
 * No AI processing happens here — this mirrors the frontend's own
 * client-side parse step, exposed as a real endpoint for direct API testing.
 */
async function uploadAndPreview(req, res, next) {
  try {
    const rows = parseCsvBuffer(req.file.buffer);
    res.json({
      success: true,
      fileName: req.file.originalname,
      rowCount: rows.length,
      rows,
    });
  } catch (err) {
    err.status = 400;
    next(err);
  }
}

/**
 * POST /api/csv/import
 * Accepts already-confirmed rows (JSON) and runs them through AI extraction
 * in batches. Streams progress as newline-delimited JSON (NDJSON) so the
 * frontend can show a live progress bar; falls back gracefully since the
 * response is still valid to read in full at the end either way.
 */
async function importRecords(req, res, next) {
  const { rows } = req.body;

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  // Flush headers immediately so the client starts reading the stream right away.
  if (res.flushHeaders) res.flushHeaders();

  try {
    const result = await extractCrmRecords(rows, (processed, total) => {
      res.write(JSON.stringify({ type: "progress", processed, total }) + "\n");
    });

    res.write(JSON.stringify({ type: "complete", result }) + "\n");
    res.end();
  } catch (err) {
    // Pipeline-level failure (e.g. misconfigured provider) — batches already
    // handle their own failures internally, so reaching here means something
    // more fundamental broke before/between batches.
    res.write(
      JSON.stringify({
        type: "error",
        error: err.message || "Import failed unexpectedly",
      }) + "\n"
    );
    res.end();
  }
}

module.exports = { uploadAndPreview, importRecords };

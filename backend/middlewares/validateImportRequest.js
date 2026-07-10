const MAX_ROWS = Number(process.env.MAX_ROWS_PER_IMPORT) || 5000;

function validateImportRequest(req, res, next) {
  const { rows } = req.body || {};

  if (!Array.isArray(rows)) {
    return res.status(400).json({
      success: false,
      error: "Request body must include a 'rows' array.",
    });
  }

  if (rows.length === 0) {
    return res.status(400).json({
      success: false,
      error: "The 'rows' array is empty — nothing to import.",
    });
  }

  if (rows.length > MAX_ROWS) {
    return res.status(413).json({
      success: false,
      error: `Too many rows (${rows.length}). Maximum allowed per import is ${MAX_ROWS}.`,
    });
  }

  const invalidIndex = rows.findIndex(
    (r) => typeof r !== "object" || r === null || Array.isArray(r)
  );
  if (invalidIndex !== -1) {
    return res.status(400).json({
      success: false,
      error: `Row at index ${invalidIndex} is not a valid object.`,
    });
  }

  next();
}

module.exports = { validateImportRequest };

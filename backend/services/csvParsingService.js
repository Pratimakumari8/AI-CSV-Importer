const { parse } = require("csv-parse/sync");

/**
 * Parses a raw CSV buffer/string into an array of row objects keyed by
 * header column. Column names are NOT assumed to be fixed — whatever
 * headers the file has become the object keys.
 */
function parseCsvBuffer(buffer) {
  let records;
  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new Error(`Failed to parse CSV: ${err.message}`);
  }

  if (records.length === 0) {
    throw new Error("CSV file has no data rows");
  }

  return records;
}

module.exports = { parseCsvBuffer };

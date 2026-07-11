/**
 * AI models occasionally wrap JSON in markdown fences or add stray whitespace
 * even when explicitly told not to. This strips common wrappers before parsing
 * so a single formatting slip doesn't fail an entire batch.
 */
function extractJsonArray(rawText) {
  let text = rawText.trim();

  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  const start = text.indexOf("[");
  if (start === -1) {
    throw new Error("AI response did not contain a JSON array");
  }

  const end = text.lastIndexOf("]");
  const candidate = end > start ? text.slice(start, end + 1) : text.slice(start);

  try {
    const parsed = JSON.parse(candidate);
    if (!Array.isArray(parsed)) throw new Error("AI response was valid JSON but not an array");
    return parsed;
  } catch (err) {
    // Full parse failed — likely a truncated/malformed response. Try to
    // salvage whichever complete top-level objects were written before the
    // cutoff, rather than losing every row in the batch.
    const recovered = recoverCompleteObjects(text.slice(start + 1));
    if (recovered.length > 0) return recovered;
    throw err;
  }
}

/**
 * Scans raw text for top-level `{...}` objects using bracket-depth tracking
 * (string- and escape-aware) and JSON.parses each one individually, skipping
 * any trailing object that's incomplete because the response got cut off.
 */
function recoverCompleteObjects(text) {
  const results = [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const objText = text.slice(objStart, i + 1);
        try {
          results.push(JSON.parse(objText));
        } catch {
          // Skip malformed individual object, keep scanning for more.
        }
        objStart = -1;
      }
    }
  }

  return results;
}

module.exports = { extractJsonArray };

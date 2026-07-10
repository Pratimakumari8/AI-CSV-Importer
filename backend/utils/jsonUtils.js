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

  // If there's leading/trailing prose around the array, extract the outermost brackets.
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("AI response was valid JSON but not an array");
  }
  return parsed;
}

module.exports = { extractJsonArray };

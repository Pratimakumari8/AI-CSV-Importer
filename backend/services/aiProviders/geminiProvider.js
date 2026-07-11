const { buildSystemPrompt } = require("../../prompts/crmExtractionPrompt");
const { extractJsonArray } = require("../../utils/jsonUtils");

/**
 * Uses Google's Gemini API directly via fetch (no extra SDK dependency).
 * Free tier: no credit card required, sign up at https://aistudio.google.com
 */
async function extractBatch(taggedRows) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env");
  }
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              buildSystemPrompt() +
              "\n\nOutput compact JSON only — no indentation, no pretty-printing, no extra whitespace or newlines between tokens. This keeps the response as short as possible.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: JSON.stringify(taggedRows) }],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) {
      throw new Error(
        `Gemini free-tier quota hit (429). This model's daily/per-minute request limit was exceeded — try a less-restricted model (gemini-flash-lite-latest has a much higher free RPD than newer preview models), reduce AI_BATCH_SIZE to send fewer, larger batches, or wait for the quota to reset. Raw: ${body}`
      );
    }
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error(
      "Gemini response was truncated (hit max output tokens) — try a smaller AI_BATCH_SIZE in .env"
    );
  }
  if (!text) {
    throw new Error(`Gemini response contained no text (finishReason: ${candidate?.finishReason || "unknown"})`);
  }

  return extractJsonArray(text);
}

module.exports = { extractBatch };
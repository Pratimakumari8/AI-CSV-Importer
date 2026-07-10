const { buildSystemPrompt } = require("../../prompts/crmExtractionPrompt");
const { extractJsonArray } = require("../../utils/jsonUtils");

/**
 * Uses OpenAI's Chat Completions API directly via fetch to avoid an extra
 * SDK dependency. Swap in the official `openai` package if you prefer.
 */
async function extractBatch(taggedRows) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in .env");
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          // OpenAI's json_object mode requires the word "json" in the prompt
          // and expects an object, not a bare array, so we wrap/unwrap it.
          content: `${buildSystemPrompt()}\n\nWrap your array response as {"records": [...]} since the output format requires a JSON object at the top level.`,
        },
        { role: "user", content: JSON.stringify(taggedRows) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response contained no content");

  const parsed = JSON.parse(content);
  const arr = Array.isArray(parsed) ? parsed : parsed.records;
  if (!Array.isArray(arr)) throw new Error("OpenAI response did not contain a records array");
  return arr;
}

module.exports = { extractBatch };

const Anthropic = require("@anthropic-ai/sdk");
const { buildSystemPrompt } = require("../../prompts/crmExtractionPrompt");
const { extractJsonArray } = require("../../utils/jsonUtils");

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set in .env");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Sends one batch of rows (each tagged with _id) to Claude and returns the
 * parsed JSON array of mapped/skip records exactly as the model returned them
 * (unsanitized — the caller is responsible for validating/sanitizing).
 *
 * @param {Array<{_id: string} & Record<string,string>>} taggedRows
 * @returns {Promise<any[]>}
 */
async function extractBatch(taggedRows) {
  const anthropic = getClient();
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: JSON.stringify(taggedRows),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic response contained no text block");
  }

  return extractJsonArray(textBlock.text);
}

module.exports = { extractBatch };

const { rowHasContactInfo } = require("../../utils/validation");

/**
 * Deterministic fake extractor — no network call, no cost. Applies simple
 * heuristics so the rest of the pipeline (batching, retries, skip counting,
 * frontend results table) can be exercised end-to-end without an API key.
 * Set AI_PROVIDER=mock in .env to use this.
 */
async function extractBatch(taggedRows) {
  // Simulate realistic network latency so the frontend progress UI is visible.
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

  return taggedRows.map((row) => {
    if (!rowHasContactInfo(row)) {
      return { _id: row._id, _skip: true, _skip_reason: "No email or phone number found (mock provider)" };
    }

    const values = Object.entries(row).filter(([k]) => k !== "_id");
    const findByPattern = (pattern) => {
      const hit = values.find(([, v]) => pattern.test(String(v ?? "")));
      return hit ? String(hit[1]) : "";
    };
    const findByKeyword = (keywords) => {
      const hit = values.find(([k]) => keywords.some((kw) => k.toLowerCase().includes(kw)));
      return hit ? String(hit[1]) : "";
    };

    const email = findByPattern(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneRaw = findByPattern(/\d{7,15}/);

    return {
      _id: row._id,
      created_at: findByKeyword(["date", "created", "time"]) || new Date().toISOString(),
      name: findByKeyword(["name"]) || "",
      email,
      country_code: phoneRaw.startsWith("+") ? phoneRaw.slice(0, 3) : "",
      mobile_without_country_code: phoneRaw.replace(/\D/g, "").slice(-10),
      company: findByKeyword(["company", "org"]) || "",
      city: findByKeyword(["city"]) || "",
      state: findByKeyword(["state"]) || "",
      country: findByKeyword(["country"]) || "",
      lead_owner: findByKeyword(["owner", "agent", "assigned"]) || "",
      crm_status: "",
      crm_note: "Processed by mock provider — connect a real AI_PROVIDER for accurate mapping.",
      data_source: "",
      possession_time: "",
      description: "",
    };
  });
}

module.exports = { extractBatch };

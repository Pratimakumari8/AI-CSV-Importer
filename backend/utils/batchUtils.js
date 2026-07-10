/**
 * Splits an array into fixed-size chunks, preserving order.
 * @template T
 * @param {T[]} items
 * @param {number} size
 * @returns {T[][]}
 */
function chunkArray(items, size) {
  if (size <= 0) throw new Error("chunkArray: size must be > 0");
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff delay with jitter, capped at maxMs.
 */
function backoffDelay(attempt, baseMs = 500, maxMs = 8000) {
  const exp = Math.min(maxMs, baseMs * 2 ** attempt);
  const jitter = Math.random() * exp * 0.3;
  return Math.round(exp * 0.7 + jitter);
}

module.exports = { chunkArray, sleep, backoffDelay };

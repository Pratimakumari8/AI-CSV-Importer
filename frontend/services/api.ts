import { ImportResponse, RawCsvRow } from "@/types/crm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Sends the confirmed CSV rows to the backend for AI-powered CRM extraction.
 * Uses fetch's streaming body (NDJSON) if the backend supports it, falling back
 * to a plain JSON response otherwise — see onProgress for incremental updates.
 */
export async function importCsvRecords(
  rows: RawCsvRow[],
  fileName: string,
  onProgress?: (processed: number, total: number) => void
): Promise<ImportResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/csv/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, fileName }),
    });
  } catch (err) {
    throw new ApiError(
      "Could not reach the server. Check that the backend is running and try again."
    );
  }

  if (!response.ok) {
    let message = `Import failed with status ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody?.error) message = errBody.error;
    } catch {
      /* body wasn't JSON, keep default message */
    }
    throw new ApiError(message, response.status);
  }

  // If the backend streams NDJSON progress events, consume them here.
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/x-ndjson") && response.body) {
    return consumeStreamedImport(response.body, onProgress);
  }

  const data: ImportResponse = await response.json();
  return data;
}

async function consumeStreamedImport(
  body: ReadableStream<Uint8Array>,
  onProgress?: (processed: number, total: number) => void
): Promise<ImportResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: ImportResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === "progress" && onProgress) {
        onProgress(event.processed, event.total);
      } else if (event.type === "complete") {
        finalResult = event.result;
      } else if (event.type === "error") {
        throw new ApiError(event.error || "Import failed during processing.");
      }
    }
  }

  if (!finalResult) {
    throw new ApiError("Import stream ended without a final result.");
  }
  return finalResult;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import CSVUpload from "@/components/CSVUpload";
import CSVPreviewTable from "@/components/CSVPreviewTable";
import ResultsTable from "@/components/ResultsTable";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import PipelineSteps from "@/components/PipelineSteps";
import ThemeToggle from "@/components/ThemeToggle";
import { importCsvRecords, ApiError } from "@/services/api";
import { ImportResponse, RawCsvRow, UploadStep } from "@/types/crm";

export default function Home() {
  const [step, setStep] = useState<UploadStep>("upload");
  const [rows, setRows] = useState<RawCsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  function handleParsed(parsedRows: RawCsvRow[], name: string) {
    setRows(parsedRows);
    setFileName(name);
    setStep("preview");
    setError(null);
  }

  async function handleConfirm() {
    setStep("processing");
    setError(null);
    setProgress({ processed: 0, total: 0 });

    try {
      const response = await importCsvRecords(rows, fileName, (processed, total) =>
        setProgress({ processed, total })
      );
      setResult(response);
      setStep("results");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong during import. Please try again.";
      setError(message);
      setStep("preview");
    }
  }

  function handleReset() {
    setStep("upload");
    setRows([]);
    setFileName("");
    setResult(null);
    setError(null);
    setProgress({ processed: 0, total: 0 });
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-ink-200 dark:border-ink-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 font-display text-sm font-bold text-white dark:bg-ink-50 dark:text-ink-900">
              G
            </div>
            <div>
              <p className="font-display text-sm font-semibold leading-tight text-ink-900 dark:text-ink-50">
                GrowEasy CSV Importer
              </p>
              <p className="text-xs leading-tight text-ink-400 dark:text-ink-500">
                Any layout in, clean CRM leads out
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10 flex justify-center">
          <PipelineSteps current={step} />
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-signal-red/30 bg-signal-red/5 px-4 py-3 text-sm text-signal-red">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === "upload" && (
          <section className="animate-fade-up">
            <h1 className="mb-2 font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">
              Upload a CSV
            </h1>
            <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">
              Facebook lead exports, Google Ads exports, real estate CRM sheets, manually made
              spreadsheets — column names don&apos;t need to match anything. We&apos;ll map them for you.
            </p>
            <CSVUpload onParsed={handleParsed} />
          </section>
        )}

        {step === "preview" && (
          <section className="animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">
                  Preview
                </h1>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  <span className="font-mono text-ink-700 dark:text-ink-200">{fileName}</span> &middot;{" "}
                  {rows.length} row{rows.length !== 1 ? "s" : ""} detected. Nothing has been sent
                  anywhere yet.
                </p>
              </div>
            </div>

            <CSVPreviewTable rows={rows} />

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <ArrowLeft size={15} /> Choose a different file
              </button>
              <button
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-signal-amber px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-signal-amber/90"
              >
                Confirm &amp; Import {rows.length} row{rows.length !== 1 ? "s" : ""}
              </button>
            </div>
          </section>
        )}

        {step === "processing" && (
          <section className="animate-fade-up">
            <ProcessingIndicator processed={progress.processed} total={progress.total} />
          </section>
        )}

        {step === "results" && result && (
          <section className="animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">
                Import complete
              </h1>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <RotateCcw size={14} /> Import another file
              </button>
            </div>
            <ResultsTable
              imported={result.imported}
              skipped={result.skipped}
              totalImported={result.totalImported}
              totalSkipped={result.totalSkipped}
            />
          </section>
        )}
      </div>
    </main>
  );
}

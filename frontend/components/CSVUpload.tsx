"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { UploadCloud, FileWarning, FileSpreadsheet } from "lucide-react";
import { RawCsvRow } from "@/types/crm";

interface CSVUploadProps {
  onParsed: (rows: RawCsvRow[], fileName: string) => void;
}

const MAX_FILE_SIZE_MB = 25;

export default function CSVUpload({ onParsed }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
        setError("That doesn't look like a CSV file. Please upload a .csv file.");
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File is too large. Keep it under ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      setIsParsing(true);
      Papa.parse<RawCsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        worker: true,
        complete: (results) => {
          setIsParsing(false);
          if (results.errors.length > 0 && results.data.length === 0) {
            setError("We couldn't parse that CSV. Check that it's well-formed and try again.");
            return;
          }
          if (results.data.length === 0) {
            setError("This CSV has no rows to import.");
            return;
          }
          onParsed(results.data, file.name);
        },
        error: () => {
          setIsParsing(false);
          setError("Something went wrong while reading the file. Please try again.");
        },
      });
    },
    [onParsed]
  );

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all
          ${
            isDragging
              ? "border-signal-amber bg-signal-amber/5 scale-[1.01]"
              : "border-ink-200 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:hover:border-ink-600 dark:hover:bg-ink-800/50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFileInputChange}
        />

        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
            isDragging
              ? "bg-signal-amber text-white"
              : "bg-ink-100 text-ink-400 group-hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-400 dark:group-hover:bg-ink-700"
          }`}
        >
          {isParsing ? (
            <FileSpreadsheet size={24} className="animate-pulse" />
          ) : (
            <UploadCloud size={24} />
          )}
        </div>

        <p className="font-display text-lg font-semibold text-ink-800 dark:text-ink-50">
          {isParsing ? "Reading your file…" : "Drop your CSV here"}
        </p>
        <p className="mt-1 text-sm text-ink-400 dark:text-ink-500">
          or click to browse — any layout works, we&apos;ll figure out the columns
        </p>
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-ink-300 dark:text-ink-600">
          .csv &middot; up to {MAX_FILE_SIZE_MB}MB
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-signal-red/30 bg-signal-red/5 px-4 py-3 text-sm text-signal-red">
          <FileWarning size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

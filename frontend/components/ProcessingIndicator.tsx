"use client";

import { Sparkles } from "lucide-react";

interface ProcessingIndicatorProps {
  processed: number;
  total: number;
}

export default function ProcessingIndicator({ processed, total }: ProcessingIndicatorProps) {
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-signal-amber/10 text-signal-amber">
        <Sparkles size={22} className="animate-pulse" />
      </div>
      <p className="font-display text-lg font-semibold text-ink-800 dark:text-ink-50">
        Mapping your fields to CRM format
      </p>
      <p className="mt-1 text-sm text-ink-400 dark:text-ink-500">
        {total > 0 ? `${processed} of ${total} records processed` : "Starting AI extraction…"}
      </p>

      <div className="mt-5 h-1.5 w-64 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className="h-full rounded-full bg-signal-amber transition-all duration-300 ease-out"
          style={{ width: `${total > 0 ? pct : 100}%` }}
        >
          {total === 0 && (
            <div className="h-full w-full animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] bg-[length:200%_100%]" />
          )}
        </div>
      </div>
      {total > 0 && (
        <p className="mt-2 font-mono text-xs text-ink-300 dark:text-ink-600">{pct}%</p>
      )}
    </div>
  );
}

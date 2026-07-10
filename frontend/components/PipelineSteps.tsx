"use client";

import { UploadStep } from "@/types/crm";
import { Check } from "lucide-react";
import clsx from "clsx";

const STEPS: { key: UploadStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "processing", label: "AI Extract" },
  { key: "results", label: "Import" },
];

export default function PipelineSteps({ current }: { current: UploadStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-0" aria-label="Import progress">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-xs transition-colors",
                  isDone &&
                    "border-signal-green bg-signal-green text-white",
                  isActive &&
                    "border-signal-amber text-signal-amber",
                  !isDone &&
                    !isActive &&
                    "border-ink-200 text-ink-300 dark:border-ink-700 dark:text-ink-500"
                )}
              >
                {isDone ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={clsx(
                  "text-xs font-medium",
                  isActive ? "text-ink-900 dark:text-ink-50" : "text-ink-400 dark:text-ink-500"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="relative mx-1.5 mb-5 h-px w-10 overflow-hidden bg-ink-200 dark:bg-ink-700 sm:w-16">
                {isDone && (
                  <div className="absolute inset-0 bg-signal-green" />
                )}
                {isActive && (
                  <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <line
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="0"
                      stroke="#E8A33D"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-flow-dash"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

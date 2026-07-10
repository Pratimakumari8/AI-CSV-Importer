"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { RawCsvRow } from "@/types/crm";

interface CSVPreviewTableProps {
  rows: RawCsvRow[];
  maxHeight?: number;
}

const ROW_HEIGHT = 40;

export default function CSVPreviewTable({ rows, maxHeight = 420 }: CSVPreviewTableProps) {
  const columns = useMemo(() => (rows.length ? Object.keys(rows[0]) : []), [rows]);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;

  if (columns.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
      <div
        ref={parentRef}
        className="scroll-thin overflow-auto"
        style={{ maxHeight }}
      >
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-ink-50 dark:bg-ink-800">
            <tr>
              <th className="sticky left-0 z-20 w-12 border-b border-r border-ink-200 bg-ink-50 px-3 py-2.5 font-mono text-xs font-medium text-ink-400 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-500">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap border-b border-ink-200 px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-700 dark:text-ink-300"
                >
                  {col || <span className="italic text-ink-300">(blank)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: paddingTop }} colSpan={columns.length + 1} />
              </tr>
            )}
            {virtualRows.map((vRow) => {
              const row = rows[vRow.index];
              return (
                <tr
                  key={vRow.index}
                  className="odd:bg-white even:bg-ink-50/50 hover:bg-signal-amber/5 dark:odd:bg-ink-900 dark:even:bg-ink-800/40"
                  style={{ height: ROW_HEIGHT }}
                >
                  <td className="sticky left-0 border-r border-ink-100 bg-inherit px-3 font-mono text-xs text-ink-300 dark:border-ink-700 dark:text-ink-600">
                    {vRow.index + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="max-w-[240px] truncate whitespace-nowrap px-4 text-ink-700 dark:text-ink-200"
                      title={row[col]}
                    >
                      {row[col] || <span className="text-ink-300 dark:text-ink-600">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: paddingBottom }} colSpan={columns.length + 1} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

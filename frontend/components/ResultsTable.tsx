"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckCircle2, XCircle, Download } from "lucide-react";
import { CrmRecord, SkippedRecord } from "@/types/crm";
import clsx from "clsx";

interface ResultsTableProps {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
}

const CRM_COLUMNS: (keyof CrmRecord)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

const STATUS_COLORS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-signal-blue/10 text-signal-blue",
  DID_NOT_CONNECT: "bg-ink-300/20 text-ink-500 dark:text-ink-300",
  BAD_LEAD: "bg-signal-red/10 text-signal-red",
  SALE_DONE: "bg-signal-green/10 text-signal-green",
};

const ROW_HEIGHT = 40;

export default function ResultsTable({ imported, skipped, totalImported, totalSkipped }: ResultsTableProps) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");
  const parentRef = useRef<HTMLDivElement>(null);

  const activeRows = tab === "imported" ? imported : skipped;

  const virtualizer = useVirtualizer({
    count: activeRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;

  function downloadCsv() {
    const rows = imported;
    if (rows.length === 0) return;
    const header = CRM_COLUMNS.join(",");
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = rows
      .map((r) => CRM_COLUMNS.map((c) => escape(r[c])).join(","))
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "groweasy_crm_import.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full">
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Imported"
          value={totalImported}
          tone="green"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Skipped"
          value={totalSkipped}
          tone="red"
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-ink-200 p-1 dark:border-ink-700">
          <TabButton active={tab === "imported"} onClick={() => setTab("imported")}>
            Imported ({imported.length})
          </TabButton>
          <TabButton active={tab === "skipped"} onClick={() => setTab("skipped")}>
            Skipped ({skipped.length})
          </TabButton>
        </div>

        {imported.length > 0 && (
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {activeRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 py-12 text-center text-sm text-ink-400 dark:border-ink-700 dark:text-ink-500">
          {tab === "imported" ? "No records were imported." : "Nothing was skipped — clean file."}
        </div>
      ) : tab === "imported" ? (
        <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
          <div ref={parentRef} className="scroll-thin overflow-auto" style={{ maxHeight: 480 }}>
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-ink-50 dark:bg-ink-800">
                <tr>
                  {CRM_COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap border-b border-ink-200 px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-700 dark:text-ink-300"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paddingTop > 0 && (
                  <tr><td style={{ height: paddingTop }} colSpan={CRM_COLUMNS.length} /></tr>
                )}
                {virtualRows.map((vRow) => {
                  const record = imported[vRow.index];
                  return (
                    <tr
                      key={vRow.index}
                      style={{ height: ROW_HEIGHT }}
                      className="odd:bg-white even:bg-ink-50/50 dark:odd:bg-ink-900 dark:even:bg-ink-800/40"
                    >
                      {CRM_COLUMNS.map((col) => (
                        <td
                          key={col}
                          className="max-w-[220px] truncate whitespace-nowrap px-4 text-ink-700 dark:text-ink-200"
                          title={String(record[col] ?? "")}
                        >
                          {col === "crm_status" && record.crm_status ? (
                            <span
                              className={clsx(
                                "rounded-full px-2 py-0.5 font-mono text-[11px]",
                                STATUS_COLORS[record.crm_status]
                              )}
                            >
                              {record.crm_status}
                            </span>
                          ) : (
                            record[col] || <span className="text-ink-300 dark:text-ink-600">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr><td style={{ height: paddingBottom }} colSpan={CRM_COLUMNS.length} /></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
          <div ref={parentRef} className="scroll-thin overflow-auto" style={{ maxHeight: 480 }}>
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-ink-50 dark:bg-ink-800">
                <tr>
                  <th className="border-b border-ink-200 px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-700 dark:text-ink-300">
                    Reason
                  </th>
                  <th className="border-b border-ink-200 px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-700 dark:text-ink-300">
                    Original Row
                  </th>
                </tr>
              </thead>
              <tbody>
                {paddingTop > 0 && <tr><td style={{ height: paddingTop }} colSpan={2} /></tr>}
                {virtualRows.map((vRow) => {
                  const s = skipped[vRow.index];
                  return (
                    <tr
                      key={vRow.index}
                      style={{ height: ROW_HEIGHT }}
                      className="odd:bg-white even:bg-ink-50/50 dark:odd:bg-ink-900 dark:even:bg-ink-800/40"
                    >
                      <td className="whitespace-nowrap px-4 text-signal-red">{s.reason}</td>
                      <td className="max-w-[500px] truncate px-4 font-mono text-xs text-ink-500 dark:text-ink-400">
                        {JSON.stringify(s.row)}
                      </td>
                    </tr>
                  );
                })}
                {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} colSpan={2} /></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "green" | "red";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-200 px-4 py-3 dark:border-ink-700">
      <div
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-full",
          tone === "green" ? "bg-signal-green/10 text-signal-green" : "bg-signal-red/10 text-signal-red"
        )}
      >
        {icon}
      </div>
      <div>
        <p className="font-mono text-xl font-semibold leading-none text-ink-900 dark:text-ink-50">
          {value}
        </p>
        <p className="text-xs text-ink-400 dark:text-ink-500">{label}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900"
          : "text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-100"
      )}
    >
      {children}
    </button>
  );
}

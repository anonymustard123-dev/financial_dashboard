import { useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import {
  displayRevenueLevel,
  opportunitiesToCsv,
  formatCurrency,
} from "../lib/formatters";
import { toBusinessLineBucket } from "../lib/calculations";
import { SOURCE_LABELS } from "../lib/csvSchemas";
import type { NormalizedOpportunity } from "../types/revenue";

type SortKey =
  | "revenueLevel"
  | "revenueSubcategory"
  | "clientGroup"
  | "opportunityName"
  | "platformBusinessLine"
  | "status"
  | "probability"
  | "bidValue"
  | "closeDate"
  | "sourceTab";

interface OpportunityTableProps {
  opportunities: NormalizedOpportunity[];
}

const columns: Array<{ key: SortKey; label: string }> = [
  { key: "revenueLevel", label: "Level" },
  { key: "revenueSubcategory", label: "Subcategory" },
  { key: "clientGroup", label: "Client / Group" },
  { key: "opportunityName", label: "Opportunity" },
  { key: "platformBusinessLine", label: "Business Line" },
  { key: "status", label: "Status" },
  { key: "probability", label: "Probability" },
  { key: "bidValue", label: "Total Bid Value" },
  { key: "closeDate", label: "Close Date" },
  { key: "sourceTab", label: "Source Tab" },
];

function getSortableValue(row: NormalizedOpportunity, key: SortKey) {
  return row[key];
}

export function OpportunityTable({ opportunities }: OpportunityTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("bidValue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<NormalizedOpportunity | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [tableLevel, setTableLevel] = useState("All");
  const [tableStatus, setTableStatus] = useState("All");
  const [tableBusinessLine, setTableBusinessLine] = useState("All");
  const [tableSource, setTableSource] = useState("All");
  const [tableMinProbability, setTableMinProbability] = useState(0);

  const filterOptions = useMemo(() => {
    const levels = Array.from(
      new Set(opportunities.map((row) => row.revenueLevel)),
    );
    const statuses = Array.from(
      new Set(opportunities.map((row) => row.statusBucket)),
    ).sort();
    const businessLines = Array.from(
      new Set(
        opportunities.map((row) => toBusinessLineBucket(row.platformBusinessLine)),
      ),
    ).sort();
    const sources = Array.from(
      new Set(opportunities.map((row) => row.sourceTab)),
    ).sort();

    return { levels, statuses, businessLines, sources };
  }, [opportunities]);

  const tableFiltered = useMemo(() => {
    const search = tableSearch.trim().toLowerCase();
    return opportunities.filter((row) => {
      if (tableLevel !== "All" && row.revenueLevel !== tableLevel) return false;
      if (tableStatus !== "All" && row.statusBucket !== tableStatus) return false;
      if (
        tableBusinessLine !== "All" &&
        toBusinessLineBucket(row.platformBusinessLine) !== tableBusinessLine
      ) {
        return false;
      }
      if (tableSource !== "All" && row.sourceTab !== tableSource) return false;
      if (row.probability < tableMinProbability) return false;
      if (
        search &&
        !`${row.client} ${row.clientGroup} ${row.opportunityName} ${row.platformBusinessLine}`
          .toLowerCase()
          .includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [
    opportunities,
    tableBusinessLine,
    tableLevel,
    tableMinProbability,
    tableSearch,
    tableSource,
    tableStatus,
  ]);

  const sorted = useMemo(() => {
    return [...tableFiltered].sort((a, b) => {
      const aValue = getSortableValue(a, sortKey);
      const bValue = getSortableValue(b, sortKey);
      const result =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue ?? "").localeCompare(String(bValue ?? ""));
      return sortDirection === "asc" ? result : -result;
    });
  }, [sortDirection, sortKey, tableFiltered]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const exportCsv = () => {
    const csv = opportunitiesToCsv(sorted);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "filtered-revenue-universe.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
            Deal-level view
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Opportunity Table
          </h2>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-bny-primary/35 bg-bny-primary/15 px-3 py-2 text-sm font-semibold text-bny-teal transition hover:bg-bny-primary/25 hover:text-white"
        >
          <Download className="h-4 w-4" />
          Export filtered CSV
        </button>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-bny-navy/45 p-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 xl:col-span-2">
          Search
          <input
            value={tableSearch}
            onChange={(event) => setTableSearch(event.target.value)}
            placeholder="Client, group, opportunity..."
            className="rounded-xl border border-white/10 bg-bny-navy px-3 py-2 text-sm normal-case tracking-normal text-white outline-none ring-bny-primary/40 placeholder:text-slate-500 focus:ring-2"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Revenue Type
          <select
            value={tableLevel}
            onChange={(event) => setTableLevel(event.target.value)}
            className="rounded-xl border border-white/10 bg-bny-navy px-3 py-2 text-sm normal-case tracking-normal text-white outline-none ring-bny-primary/40 focus:ring-2"
          >
            <option value="All">All</option>
            {filterOptions.levels.map((level) => (
              <option key={level} value={level}>
                {displayRevenueLevel(level)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Status
          <select
            value={tableStatus}
            onChange={(event) => setTableStatus(event.target.value)}
            className="rounded-xl border border-white/10 bg-bny-navy px-3 py-2 text-sm normal-case tracking-normal text-white outline-none ring-bny-primary/40 focus:ring-2"
          >
            <option value="All">All</option>
            {filterOptions.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Business Line
          <select
            value={tableBusinessLine}
            onChange={(event) => setTableBusinessLine(event.target.value)}
            className="rounded-xl border border-white/10 bg-bny-navy px-3 py-2 text-sm normal-case tracking-normal text-white outline-none ring-bny-primary/40 focus:ring-2"
          >
            <option value="All">All</option>
            {filterOptions.businessLines.map((businessLine) => (
              <option key={businessLine} value={businessLine}>
                {businessLine}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Source
          <select
            value={tableSource}
            onChange={(event) => setTableSource(event.target.value)}
            className="rounded-xl border border-white/10 bg-bny-navy px-3 py-2 text-sm normal-case tracking-normal text-white outline-none ring-bny-primary/40 focus:ring-2"
          >
            <option value="All">All</option>
            {filterOptions.sources.map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source] ?? source}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 xl:col-span-2">
          Min Probability: {tableMinProbability}%
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={tableMinProbability}
            onChange={(event) => setTableMinProbability(Number(event.target.value))}
            className="accent-bny-primary"
          />
        </label>
        <div className="flex items-end justify-between gap-3 text-sm text-slate-400 xl:col-span-4">
          <span>
            Showing {sorted.length.toLocaleString()} of{" "}
            {opportunities.length.toLocaleString()} filtered dashboard rows
          </span>
          <button
            type="button"
            onClick={() => {
              setTableSearch("");
              setTableLevel("All");
              setTableStatus("All");
              setTableBusinessLine("All");
              setTableSource("All");
              setTableMinProbability(0);
            }}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Reset table filters
          </button>
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto rounded-2xl border border-white/10">
        <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-bny-navy/95 text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort(column.key)}
                    className="font-semibold hover:text-bny-teal"
                  >
                    {column.label}
                    {sortKey === column.key
                      ? sortDirection === "asc"
                        ? " ^"
                        : " v"
                      : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sorted.map((row) => (
              <tr
                key={`${row.sourceTab}-${row.id}-${row.opportunityName}`}
                onClick={() => setSelected(row)}
                className="cursor-pointer text-slate-200 transition hover:bg-bny-primary/10"
              >
                <td className="px-4 py-3 text-bny-teal">
                  {displayRevenueLevel(row.revenueLevel)}
                </td>
                <td className="px-4 py-3">{row.revenueSubcategory}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-white">{row.client}</span>
                  <span className="block text-xs text-slate-500">
                    {row.clientGroup}
                  </span>
                </td>
                <td className="px-4 py-3">{row.opportunityName}</td>
                <td className="px-4 py-3">{row.platformBusinessLine}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">{row.probability}%</td>
                <td className="px-4 py-3 font-semibold text-white">
                  {formatCurrency(row.bidValue)}
                </td>
                <td className="px-4 py-3">{row.closeDate || "N/A"}</td>
                <td className="px-4 py-3">
                  {SOURCE_LABELS[row.sourceTab] ?? row.sourceTab}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-400">
            No opportunities match the current filter set.
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-bny-navy/70 backdrop-blur-sm">
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-bny-primary/25 bg-bny-navy p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
                  Opportunity detail
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {selected.opportunityName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 grid gap-3">
              {[
                ["Level", displayRevenueLevel(selected.revenueLevel)],
                ["Subcategory", selected.revenueSubcategory],
                ["Client", selected.client],
                ["Client Group", selected.clientGroup],
                ["Business Line", selected.platformBusinessLine],
                ["Status", selected.status],
                ["Probability", `${selected.probability}%`],
                ["Total Bid Value", formatCurrency(selected.bidValue)],
                ["Close Date", selected.closeDate || "N/A"],
                ["Included", selected.included ? "Yes" : "No"],
                [
                  "Pipeline Tracker Match",
                  selected.pipelineTrackerMatch ? "Yes" : "No",
                ],
                ["Source Tab", SOURCE_LABELS[selected.sourceTab] ?? selected.sourceTab],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-white">{value}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

import { X } from "lucide-react";
import {
  displayRevenueLevel,
  formatCurrency,
  formatNumber,
} from "../lib/formatters";
import type { NormalizedOpportunity } from "../types/revenue";

interface OpportunityDrilldownDrawerProps {
  title: string;
  subtitle?: string;
  opportunities: NormalizedOpportunity[];
  onClose: () => void;
}

export function OpportunityDrilldownDrawer({
  title,
  subtitle,
  opportunities,
  onClose,
}: OpportunityDrilldownDrawerProps) {
  const sorted = [...opportunities].sort((a, b) => b.bidValue - a.bidValue);
  const total = sorted.reduce((sum, row) => sum + row.bidValue, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-bny-navy/70 backdrop-blur-sm">
      <aside className="h-full w-full max-w-4xl overflow-y-auto border-l border-bny-primary/25 bg-bny-navy p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
              Opportunity drilldown
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {subtitle ? `${subtitle} - ` : ""}
              {formatNumber(sorted.length)} opportunities totaling{" "}
              {formatCurrency(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 overflow-auto rounded-2xl border border-white/10">
          <table className="min-w-[920px] w-full border-collapse text-left text-sm">
            <thead className="bg-bny-surface text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Client / Group</th>
                <th className="px-4 py-3">Opportunity</th>
                <th className="px-4 py-3">Business Line</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Probability</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sorted.map((row) => (
                <tr key={`${row.sourceTab}-${row.id}-${row.opportunityName}`}>
                  <td className="px-4 py-3 text-bny-teal">
                    {displayRevenueLevel(row.revenueLevel)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{row.client}</span>
                    <span className="block text-xs text-slate-500">
                      {row.clientGroup}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {row.opportunityName}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {row.platformBusinessLine}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{row.status}</td>
                  <td className="px-4 py-3 text-slate-300">{row.probability}%</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {formatCurrency(row.bidValue)}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {row.closeDate || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-400">
              No opportunities match this chart segment under the active filters.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

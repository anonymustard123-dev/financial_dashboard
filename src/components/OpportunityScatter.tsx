import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { LEVEL_COLORS, REVENUE_LEVELS } from "../lib/calculations";
import { formatCurrency } from "../lib/formatters";
import type { NormalizedOpportunity } from "../types/revenue";

interface OpportunityScatterProps {
  opportunities: NormalizedOpportunity[];
}

interface TooltipPayload {
  payload?: NormalizedOpportunity;
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="max-w-xs rounded-2xl border border-bny-primary/25 bg-bny-navy/95 p-3 text-sm text-white shadow-2xl">
      <p className="font-semibold">{row.opportunityName}</p>
      <p className="mt-1 text-slate-300">
        {row.clientGroup || row.client} - {row.platformBusinessLine}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
        <span>
          Status
          <strong className="block text-white">{row.status}</strong>
        </span>
        <span>
          Probability
          <strong className="block text-white">{row.probability}%</strong>
        </span>
        <span>
          Value
          <strong className="block text-white">
            {formatCurrency(row.bidValue)}
          </strong>
        </span>
        <span>
          Close date
          <strong className="block text-white">{row.closeDate || "N/A"}</strong>
        </span>
      </div>
    </div>
  );
}

export function OpportunityScatter({ opportunities }: OpportunityScatterProps) {
  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
          Pipeline terrain
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Opportunity Scatterplot
        </h2>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 16, bottom: 10, left: 6 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
            <XAxis
              type="number"
              dataKey="probability"
              name="Probability"
              unit="%"
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="bidValue"
              name="Total Bid Value"
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ZAxis dataKey="bidValue" range={[80, 900]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<ScatterTooltip />} />
            {REVENUE_LEVELS.map((level) => (
              <Scatter
                key={level}
                name={level}
                data={opportunities.filter((row) => row.revenueLevel === level)}
                fill={LEVEL_COLORS[level]}
                fillOpacity={0.78}
                isAnimationActive
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

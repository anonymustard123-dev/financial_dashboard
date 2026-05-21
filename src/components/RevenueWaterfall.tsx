import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LEVEL_COLORS, REVENUE_LEVELS } from "../lib/calculations";
import { formatCurrency } from "../lib/formatters";
import type { LevelSummary, RevenueLevel } from "../types/revenue";

interface RevenueWaterfallProps {
  summaries: LevelSummary[];
}

export function RevenueWaterfall({ summaries }: RevenueWaterfallProps) {
  const levelSummaries = summaries.filter((summary) =>
    REVENUE_LEVELS.includes(summary.level as RevenueLevel),
  );
  const { data: levelData, total } = levelSummaries.reduce<{
    data: Array<{
      name: string;
      offset: number;
      value: number;
      fullName: string;
      color: string;
    }>;
    total: number;
  }>((accumulator, summary) => {
    const item = {
      name: summary.level
        .replace("L1 ", "")
        .replace(" Revenue", "")
        .replace("Traditional Sales Enabled", "Trad. Enabled"),
      offset: accumulator.total,
      value: summary.value,
      fullName: summary.level,
      color: LEVEL_COLORS[summary.level as RevenueLevel],
    };
    return {
      data: [...accumulator.data, item],
      total: accumulator.total + summary.value,
    };
  }, { data: [], total: 0 });

  const data = [
    ...levelData,
    {
    name: "Total Universe",
    offset: 0,
    value: total,
    fullName: "Total Revenue Universe",
    color: "#f8fafc",
    },
  ];

  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
            Expansion story
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Revenue Universe Waterfall
          </h2>
        </div>
        <p className="max-w-xl text-sm text-slate-400">
          Direct digital revenue expands into digitally enabled, halo effect,
          and existing P&I-Other opportunities.
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 10, left: 5, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                background: "#00243D",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                color: "#fff",
              }}
              formatter={(value, name) =>
                name === "value" ? formatCurrency(Number(value)) : ""
              }
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.fullName ?? "")
              }
            />
            <Bar dataKey="offset" stackId="waterfall" fill="transparent" />
            <Bar dataKey="value" stackId="waterfall" radius={[10, 10, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.fullName} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

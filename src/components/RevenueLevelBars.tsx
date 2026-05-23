import { useState } from "react";
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
import {
  displayRevenueLevel,
  formatCurrency,
  formatNumber,
} from "../lib/formatters";
import type {
  LevelSummary,
  NormalizedOpportunity,
  RevenueLevel,
} from "../types/revenue";
import { OpportunityDrilldownDrawer } from "./OpportunityDrilldownDrawer";

interface RevenueLevelBarsProps {
  summaries: LevelSummary[];
  opportunities: NormalizedOpportunity[];
}

export function RevenueLevelBars({
  summaries,
  opportunities,
}: RevenueLevelBarsProps) {
  const [selectedLevel, setSelectedLevel] = useState<RevenueLevel | null>(null);
  const data = summaries
    .filter((summary) => REVENUE_LEVELS.includes(summary.level as RevenueLevel))
    .map((summary) => ({
      name: displayRevenueLevel(summary.level as RevenueLevel),
      level: summary.level,
      value: summary.value,
      count: summary.count,
      color: LEVEL_COLORS[summary.level as RevenueLevel],
    }));
  const selectedRows = selectedLevel
    ? opportunities.filter((row) => row.revenueLevel === selectedLevel)
    : [];

  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
            Revenue mix
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Revenue by Type
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          Simple total value view across the master revenue universe.
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
              interval={0}
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
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value, name, payload) => {
                if (name === "value") return [formatCurrency(Number(value)), "Value"];
                return [value, payload?.name];
              }}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload as
                  | { count?: number }
                  | undefined;
                return item
                  ? `${formatNumber(item.count ?? 0)} opportunities`
                  : "";
              }}
            />
            <Bar
              dataKey="value"
              radius={[10, 10, 0, 0]}
              className="cursor-pointer"
              onClick={(entry: { payload?: { level?: RevenueLevel } }) => {
                if (entry.payload?.level) setSelectedLevel(entry.payload.level);
              }}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Click a bar to inspect the opportunities behind that revenue type.
      </p>
      {selectedLevel && (
        <OpportunityDrilldownDrawer
          title={displayRevenueLevel(selectedLevel)}
          opportunities={selectedRows}
          onClose={() => setSelectedLevel(null)}
        />
      )}
    </section>
  );
}

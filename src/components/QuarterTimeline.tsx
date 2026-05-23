import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LEVEL_COLORS, REVENUE_LEVELS } from "../lib/calculations";
import {
  displayRevenueLevel,
  formatCurrency,
} from "../lib/formatters";
import type { NormalizedOpportunity, RevenueLevel } from "../types/revenue";
import { OpportunityDrilldownDrawer } from "./OpportunityDrilldownDrawer";

interface QuarterTimelineProps {
  data: Record<string, string | number>[];
  opportunities: NormalizedOpportunity[];
}

export function QuarterTimeline({ data, opportunities }: QuarterTimelineProps) {
  const [selectedSegment, setSelectedSegment] = useState<{
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    level: RevenueLevel;
  } | null>(null);
  const selectedRows = selectedSegment
    ? opportunities
        .filter(
          (opportunity) =>
            opportunity.quarter === selectedSegment.quarter &&
            opportunity.revenueLevel === selectedSegment.level,
        )
        .sort((a, b) => b.bidValue - a.bidValue)
    : [];

  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
            Timing
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Quarter Forecast
          </h2>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barGap={0}
            margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="quarter"
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
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
              contentStyle={{
                background: "#00243D",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            {REVENUE_LEVELS.map((level) => (
              <Bar
                key={level}
                dataKey={level}
                name={displayRevenueLevel(level)}
                stackId="quarter"
                fill={LEVEL_COLORS[level]}
                radius={0}
                className="cursor-pointer"
                onClick={(entry: { payload?: { quarter?: string } }) => {
                  const quarter = entry.payload?.quarter;
                  if (
                    quarter === "Q1" ||
                    quarter === "Q2" ||
                    quarter === "Q3" ||
                    quarter === "Q4"
                  ) {
                    setSelectedSegment({ quarter, level });
                  }
                }}
                isAnimationActive
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Click a colored segment to inspect the opportunities behind that quarter and revenue type.
      </p>

      {selectedSegment && (
        <OpportunityDrilldownDrawer
          title={`${selectedSegment.quarter} - ${displayRevenueLevel(
            selectedSegment.level,
          )}`}
          opportunities={selectedRows}
          onClose={() => setSelectedSegment(null)}
        />
      )}
    </section>
  );
}

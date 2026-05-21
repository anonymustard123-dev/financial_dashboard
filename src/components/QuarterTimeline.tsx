import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LEVEL_COLORS, REVENUE_LEVELS } from "../lib/calculations";
import { formatCurrency } from "../lib/formatters";

interface QuarterTimelineProps {
  data: Record<string, string | number>[];
}

export function QuarterTimeline({ data }: QuarterTimelineProps) {
  const [metric, setMetric] = useState<"total" | "weighted">("total");

  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
            Timing
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Quarter Forecast
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-bny-navy/60 p-1 text-sm">
          {(["total", "weighted"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMetric(option)}
              className={`rounded-full px-3 py-1.5 font-semibold transition ${
                metric === option
                  ? "bg-bny-primary text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {option === "total" ? "Total" : "Weighted"}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <defs>
              {REVENUE_LEVELS.map((level) => (
                <linearGradient
                  key={level}
                  id={`gradient-${level.replace(/\W/g, "")}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={LEVEL_COLORS[level]} stopOpacity={0.82} />
                  <stop offset="95%" stopColor={LEVEL_COLORS[level]} stopOpacity={0.18} />
                </linearGradient>
              ))}
            </defs>
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
              formatter={(value) => formatCurrency(Number(value))}
            />
            {REVENUE_LEVELS.map((level) => {
              const key = metric === "weighted" ? `${level} Weighted` : level;
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={LEVEL_COLORS[level]}
                  fill={`url(#gradient-${level.replace(/\W/g, "")})`}
                  strokeWidth={2}
                  isAnimationActive
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

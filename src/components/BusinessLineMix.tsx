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
import { formatCurrency } from "../lib/formatters";
import type { BusinessLineSummary } from "../types/revenue";

interface BusinessLineMixProps {
  data: BusinessLineSummary[];
}

export function BusinessLineMix({ data }: BusinessLineMixProps) {
  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
          Coverage
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Business Line Mix
        </h2>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 18, left: 44, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="businessLine"
              type="category"
              width={148}
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
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
            {REVENUE_LEVELS.map((level) => (
              <Bar
                key={level}
                dataKey={level}
                stackId="mix"
                fill={LEVEL_COLORS[level]}
                radius={[0, 8, 8, 0]}
                isAnimationActive
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

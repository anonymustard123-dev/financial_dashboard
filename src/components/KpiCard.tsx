import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LevelSummary } from "../types/revenue";
import {
  displayRevenueLevel,
  formatCurrency,
  formatNumber,
} from "../lib/formatters";

interface KpiCardProps {
  summary: LevelSummary;
  color: string;
}

export function KpiCard({ summary, color }: KpiCardProps) {
  const microbars = Object.entries(summary.quarters).map(([quarter, value]) => ({
    quarter,
    value,
  }));

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur"
    >
      <div
        className="absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-30 blur-3xl transition group-hover:opacity-50"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        <p className="min-h-10 text-sm font-medium text-slate-300">
          {displayRevenueLevel(summary.level)}
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
          {formatCurrency(summary.value)}
        </p>
        <div className="mt-3 text-xs text-slate-400">
          <span>
            <strong className="block text-sm text-white">
              {formatNumber(summary.count)}
            </strong>
            opportunities
          </span>
        </div>
        <div className="mt-4 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={microbars} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="quarter"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "#00243D",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                fill={color}
                opacity={0.9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.article>
  );
}

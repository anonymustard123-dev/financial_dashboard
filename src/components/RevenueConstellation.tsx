import { motion } from "framer-motion";
import { getClientSummaries, LEVEL_COLORS, REVENUE_LEVELS } from "../lib/calculations";
import { formatCurrency } from "../lib/formatters";
import type { NormalizedOpportunity, RevenueLevel } from "../types/revenue";

interface RevenueConstellationProps {
  opportunities: NormalizedOpportunity[];
}

export function RevenueConstellation({ opportunities }: RevenueConstellationProps) {
  const total = opportunities.reduce((sum, row) => sum + row.bidValue, 0);
  const levelNodes = REVENUE_LEVELS.map((level, index) => {
    const value = opportunities
      .filter((row) => row.revenueLevel === level)
      .reduce((sum, row) => sum + row.bidValue, 0);
    const angle = (Math.PI * 2 * index) / REVENUE_LEVELS.length - Math.PI / 2;
    return {
      label: level.replace(" Revenue", ""),
      level,
      value,
      x: 50 + Math.cos(angle) * 23,
      y: 50 + Math.sin(angle) * 23,
      r: Math.max(7, Math.min(15, total ? (value / total) * 28 : 7)),
    };
  });

  const clientNodes = getClientSummaries(opportunities)
    .slice(0, 12)
    .map((client, index, clients) => {
      const angle = (Math.PI * 2 * index) / clients.length - Math.PI / 2;
      return {
        ...client,
        x: 50 + Math.cos(angle) * 42,
        y: 50 + Math.sin(angle) * 42,
        r: Math.max(3.5, Math.min(8, total ? (client.value / total) * 24 : 3.5)),
      };
    });

  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
          Network view
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Revenue Constellation
        </h2>
      </div>
      <div className="relative aspect-square min-h-[360px] overflow-hidden rounded-3xl border border-bny-primary/20 bg-[radial-gradient(circle_at_center,rgba(45,155,173,0.2),rgba(0,72,94,0.24)_45%,rgba(0,36,61,0.88))]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[18, 30, 42].map((radius) => (
            <circle
              key={radius}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="1 2"
            />
          ))}
          {clientNodes.map((node) => (
            <line
              key={`line-${node.name}`}
              x1="50"
              y1="50"
              x2={node.x}
              y2={node.y}
              stroke="rgba(125,211,252,0.14)"
            />
          ))}
          {levelNodes.map((node) => (
            <line
              key={`level-line-${node.level}`}
              x1="50"
              y1="50"
              x2={node.x}
              y2={node.y}
              stroke={LEVEL_COLORS[node.level]}
              strokeOpacity="0.32"
              strokeWidth="0.35"
            />
          ))}
          <motion.circle
            initial={{ r: 0 }}
            animate={{ r: 11 }}
            cx="50"
            cy="50"
            fill="rgba(248,250,252,0.96)"
            filter="url(#glow)"
          >
            <title>Total Revenue Universe: {formatCurrency(total)}</title>
          </motion.circle>
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="2.4"
            fontWeight="700"
            fill="#020617"
          >
            Universe
          </text>
          {levelNodes.map((node) => (
            <g key={node.level}>
              <motion.circle
                initial={{ r: 0 }}
                animate={{ r: node.r }}
                cx={node.x}
                cy={node.y}
                fill={LEVEL_COLORS[node.level]}
                opacity="0.95"
                filter="url(#glow)"
              >
                <title>
                  {node.level}: {formatCurrency(node.value)}
                </title>
              </motion.circle>
              <text
                x={node.x}
                y={node.y + node.r + 4}
                textAnchor="middle"
                fontSize="2.1"
                fill="#e2e8f0"
              >
                {node.label}
              </text>
            </g>
          ))}
          {clientNodes.map((node) => (
            <motion.circle
              key={node.name}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: node.r, opacity: 0.78 }}
              cx={node.x}
              cy={node.y}
              fill={LEVEL_COLORS[node.dominantLevel as RevenueLevel]}
            >
              <title>
                {node.name}: {formatCurrency(node.value)} across {node.count} opportunities
              </title>
            </motion.circle>
          ))}
        </svg>
      </div>
    </section>
  );
}

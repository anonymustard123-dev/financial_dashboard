import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { getClientSummaries, LEVEL_COLORS } from "../lib/calculations";
import { formatCurrency } from "../lib/formatters";
import type { NormalizedOpportunity, RevenueLevel } from "../types/revenue";

interface ClientTreemapProps {
  opportunities: NormalizedOpportunity[];
}

interface TreemapCellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
}

function TreemapCell(props: TreemapCellProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", fill = "#22d3ee" } =
    props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        ry={12}
        fill={fill}
        fillOpacity={0.78}
        stroke="rgba(2,6,23,0.65)"
        strokeWidth={3}
      />
      {width > 96 && height > 44 && (
        <>
          <text x={x + 14} y={y + 24} fill="#ffffff" fontSize={13} fontWeight={700}>
            {name}
          </text>
          <text x={x + 14} y={y + 43} fill="#e2e8f0" fontSize={11}>
            Client group
          </text>
        </>
      )}
    </g>
  );
}

export function ClientTreemap({ opportunities }: ClientTreemapProps) {
  const data = getClientSummaries(opportunities)
    .slice(0, 18)
    .map((client) => ({
      ...client,
      fill: LEVEL_COLORS[client.dominantLevel as RevenueLevel],
    }));

  return (
    <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
            Concentration
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Client Group Treemap
          </h2>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            nameKey="name"
            stroke="rgba(2,6,23,0.8)"
            content={<TreemapCell />}
            isAnimationActive
          >
            <Tooltip
              contentStyle={{
                background: "#00243D",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                color: "#fff",
              }}
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(name) => String(name)}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
      {data.length === 0 && (
        <p className="-mt-48 text-center text-sm text-slate-400">
          Upload CSVs or use synthetic demo data to reveal client concentration.
        </p>
      )}
    </section>
  );
}

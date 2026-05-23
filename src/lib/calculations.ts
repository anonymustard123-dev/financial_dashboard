import type {
  BusinessLineSummary,
  ClientSummary,
  DashboardFilters,
  LevelSummary,
  NormalizedOpportunity,
  RevenueLevel,
} from "../types/revenue";

export const REVENUE_LEVELS: RevenueLevel[] = [
  "L1 Direct Digital Revenue",
  "L2 Digitally Enabled Revenue",
  "L3 Halo Effect Revenue",
];

export const LEVEL_COLORS: Record<RevenueLevel, string> = {
  "L1 Direct Digital Revenue": "#2D9BAD",
  "L1 Existing P&I-Other": "#6ABDC6",
  "L2 Digitally Enabled Revenue": "#FFBF00",
  "L3 Halo Effect Revenue": "#a78bfa",
};

export const BUSINESS_LINE_ORDER = [
  "Asset Servicing",
  "Global Payments & Trade",
  "Markets",
  "Clearance & Collateral Management",
  "Pershing",
  "Corporate Trust",
  "Growth Ventures",
  "Credit Services",
  "Digital Services",
  "Other",
];

const EMPTY_QUARTERS = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

export const DEFAULT_FILTERS: DashboardFilters = {
  years: [],
  minProbability: 30,
  includeLowProbability: false,
  showLostDeals: false,
  showPipelineMatches: false,
  levels: [],
  statuses: [],
  businessLines: [],
  search: "",
};

export function toBusinessLineBucket(value: string) {
  const lower = value.toLowerCase();
  const match = BUSINESS_LINE_ORDER.find((line) =>
    lower.includes(line.toLowerCase()),
  );
  return match ?? "Other";
}

export function applyFilters(
  opportunities: NormalizedOpportunity[],
  filters: DashboardFilters,
) {
  const search = filters.search.trim().toLowerCase();

  return opportunities.filter((opportunity) => {
    if (
      filters.years.length > 0 &&
      (!opportunity.year || !filters.years.includes(opportunity.year))
    ) {
      return false;
    }
    if (!filters.showLostDeals && opportunity.statusBucket === "Lost") {
      return false;
    }
    if (
      !filters.includeLowProbability &&
      opportunity.probability < filters.minProbability
    ) {
      return false;
    }
    if (
      !filters.showPipelineMatches &&
      (opportunity.pipelineTrackerMatch ||
        ((opportunity.revenueLevel === "L2 Digitally Enabled Revenue" ||
          opportunity.revenueLevel === "L3 Halo Effect Revenue") &&
          !opportunity.included))
    ) {
      return false;
    }
    if (
      filters.levels.length > 0 &&
      !filters.levels.includes(opportunity.revenueLevel)
    ) {
      return false;
    }
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(opportunity.statusBucket)
    ) {
      return false;
    }
    if (
      filters.businessLines.length > 0 &&
      !filters.businessLines.includes(
        toBusinessLineBucket(opportunity.platformBusinessLine),
      )
    ) {
      return false;
    }
    if (
      search &&
      !`${opportunity.client} ${opportunity.clientGroup} ${opportunity.opportunityName}`
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }

    return true;
  });
}

function summarize(level: LevelSummary["level"], rows: NormalizedOpportunity[]) {
  const value = rows.reduce((sum, row) => sum + row.bidValue, 0);
  const weightedValue = rows.reduce((sum, row) => sum + row.weightedValue, 0);
  const wonValue = rows
    .filter((row) => row.statusBucket === "Won")
    .reduce((sum, row) => sum + row.bidValue, 0);
  const quarters = rows.reduce<Record<"Q1" | "Q2" | "Q3" | "Q4", number>>(
    (totals, row) => {
      if (row.quarter) totals[row.quarter] += row.bidValue;
      return totals;
    },
    { ...EMPTY_QUARTERS },
  );

  return {
    level,
    value,
    weightedValue,
    wonValue,
    forecastValue: value,
    count: rows.length,
    averageDealSize: rows.length ? value / rows.length : 0,
    quarters,
  };
}

export function getLevelSummaries(rows: NormalizedOpportunity[]) {
  const summaries = REVENUE_LEVELS.map((level) =>
    summarize(
      level,
      rows.filter((row) => row.revenueLevel === level),
    ),
  );

  return [...summaries, summarize("Total Revenue Universe", rows)];
}

export function getQuarterTimeline(rows: NormalizedOpportunity[]) {
  return ["Q1", "Q2", "Q3", "Q4"].map((quarter) => {
    const quarterRows = rows.filter((row) => row.quarter === quarter);
    const item: Record<string, string | number> = { quarter };
    for (const level of REVENUE_LEVELS) {
      const levelRows = quarterRows.filter((row) => row.revenueLevel === level);
      item[level] = levelRows.reduce((sum, row) => sum + row.bidValue, 0);
    }
    return item;
  });
}

export function getBusinessLineMix(rows: NormalizedOpportunity[]) {
  return BUSINESS_LINE_ORDER.map((businessLine) => {
    const item: BusinessLineSummary = { businessLine };
    for (const level of REVENUE_LEVELS) {
      item[level] = rows
        .filter(
          (row) =>
            toBusinessLineBucket(row.platformBusinessLine) === businessLine &&
            row.revenueLevel === level,
        )
        .reduce((sum, row) => sum + row.bidValue, 0);
    }
    return item;
  }).filter((item) =>
    REVENUE_LEVELS.some((level) => Number(item[level] ?? 0) > 0),
  );
}

export function getClientSummaries(rows: NormalizedOpportunity[]) {
  const groups = new Map<string, NormalizedOpportunity[]>();
  for (const row of rows) {
    const key = row.clientGroup || row.client || "Unassigned Client";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups.entries())
    .map<ClientSummary>(([name, groupRows]) => {
      const levelTotals = REVENUE_LEVELS.map((level) => ({
        level,
        value: groupRows
          .filter((row) => row.revenueLevel === level)
          .reduce((sum, row) => sum + row.bidValue, 0),
      })).sort((a, b) => b.value - a.value);
      const largest = [...groupRows].sort((a, b) => b.bidValue - a.bidValue)[0];

      return {
        name,
        value: groupRows.reduce((sum, row) => sum + row.bidValue, 0),
        weightedValue: groupRows.reduce(
          (sum, row) => sum + row.weightedValue,
          0,
        ),
        count: groupRows.length,
        largestOpportunity: largest?.opportunityName ?? "None",
        dominantLevel: levelTotals[0]?.level ?? "L1 Direct Digital Revenue",
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function getTopFiveClientShare(rows: NormalizedOpportunity[]) {
  const clients = getClientSummaries(rows);
  const total = rows.reduce((sum, row) => sum + row.bidValue, 0);
  const topFive = clients
    .slice(0, 5)
    .reduce((sum, client) => sum + client.value, 0);
  return total ? topFive / total : 0;
}

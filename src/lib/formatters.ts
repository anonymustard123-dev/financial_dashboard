import type { NormalizedOpportunity, RevenueLevel } from "../types/revenue";

export function formatCurrency(value: number) {
  const abs = Math.abs(value);
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: abs >= 1_000_000 ? 1 : 0,
    notation: abs >= 1_000_000 ? "compact" : "standard",
  });
  return formatter.format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function displayRevenueLevel(
  level: RevenueLevel | "Total Revenue Universe",
) {
  const labels: Record<RevenueLevel | "Total Revenue Universe", string> = {
    "L1 Direct Digital Revenue": "Direct Digital Revenue",
    "Traditional Opportunities Expansion": "Traditional Opportunities Expansion",
    "Digital-Native Client Expansion": "Digital-Native Client Expansion",
    "Total Revenue Universe": "Total Revenue Universe",
  };

  return labels[level];
}

function escapeCsv(value: string | number | boolean | undefined) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function opportunitiesToCsv(rows: NormalizedOpportunity[]) {
  const headers = [
    "Level",
    "Subcategory",
    "Client",
    "Client Group",
    "Opportunity Name",
    "Business Line",
    "Status",
    "Probability",
    "Total Bid Value",
    "Close Date",
    "Source Tab",
    "Included",
    "Pipeline Tracker Match",
  ];

  const lines = rows.map((row) =>
    [
      displayRevenueLevel(row.revenueLevel),
      row.revenueSubcategory,
      row.client,
      row.clientGroup,
      row.opportunityName,
      row.platformBusinessLine,
      row.status,
      row.probability,
      row.bidValue,
      row.closeDate,
      row.sourceTab,
      row.included,
      row.pipelineTrackerMatch,
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [headers.join(","), ...lines].join("\n");
}

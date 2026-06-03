import type { SourceSchema, SourceTab } from "../types/revenue";

const L1_ECRM_COLUMNS = [
  "(Do Not Modify) Opportunity",
  "(Do Not Modify) Row Checksum",
  "(Do Not Modify) Last Modified Date",
  "Oppty ID",
  "Platform/Business Line",
  "Client",
  "Opportunity Name",
  "Status",
  "Probability",
  "Total Bid Value (Excluding NII)",
  "Close Date",
];

const BUCKET_REVENUE_COLUMNS = [
  "Oppty ID",
  "Platform/Business Line",
  "Client",
  "Client Group",
  "Opportunity Name",
  "Status",
  "Probability",
  "Total Bid Value (Excluding NII)",
  "Close Date",
];

export const SOURCE_SCHEMAS: SourceSchema[] = [
  {
    sourceTab: "L1-DAC-DATA",
    displayName: "L1 DAC + Data",
    expectedRows: 109,
    expectedColumns: 11,
    requiredColumns: L1_ECRM_COLUMNS,
  },
  {
    sourceTab: "L1-Stablecoin-DATA",
    displayName: "L1 Stablecoin",
    expectedRows: 48,
    expectedColumns: 11,
    requiredColumns: L1_ECRM_COLUMNS,
  },
  {
    sourceTab: "L1-TADA-DATA",
    displayName: "L1 TADA",
    expectedRows: 10,
    expectedColumns: 11,
    requiredColumns: L1_ECRM_COLUMNS,
  },
  {
    sourceTab: "L1-P&I-OTHER-DATA",
    displayName: "P&I Other Pipeline",
    expectedRows: 133,
    expectedColumns: 11,
    requiredColumns: L1_ECRM_COLUMNS,
  },
  {
    sourceTab: "L1-HARD-CODED-DATA",
    displayName: "L1 Hard-coded",
    expectedRows: 1,
    expectedColumns: 7,
    requiredColumns: [
      "Opportunity Name",
      "Business Line",
      "Date Closed",
      "Status",
      "Probability",
      "Total Bid Value",
      "Notes",
    ],
  },
  {
    sourceTab: "Bucket B Revenue Data",
    displayName: "Bucket B Revenue Data",
    expectedRows: 100,
    expectedColumns: 9,
    requiredColumns: BUCKET_REVENUE_COLUMNS,
    allowExtraColumns: true,
  },
  {
    sourceTab: "Bucket C Revenue Data",
    displayName: "Bucket C Revenue Data",
    expectedRows: 8,
    expectedColumns: 9,
    requiredColumns: BUCKET_REVENUE_COLUMNS,
    allowExtraColumns: true,
  },
];

export const SOURCE_TABS = SOURCE_SCHEMAS.map((schema) => schema.sourceTab);

export const SOURCE_LABELS = SOURCE_SCHEMAS.reduce<Record<SourceTab, string>>(
  (labels, schema) => {
    labels[schema.sourceTab] = schema.displayName;
    return labels;
  },
  {} as Record<SourceTab, string>,
);

export function getSchema(sourceTab: SourceTab) {
  return SOURCE_SCHEMAS.find((schema) => schema.sourceTab === sourceTab);
}

export function canonicalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateHeaders(headers: string[], schema: SourceSchema) {
  const headerSet = new Set(headers.map(canonicalizeHeader));
  return schema.requiredColumns.filter(
    (column) => !headerSet.has(canonicalizeHeader(column)),
  );
}

export function detectSourceTab(fileName: string): SourceTab | undefined {
  const normalized = fileName
    .toLowerCase()
    .replace(/\.csv$/, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-");

  if (normalized.includes("hard-coded")) return "L1-HARD-CODED-DATA";
  if (normalized.includes("stablecoin")) return "L1-Stablecoin-DATA";
  if (normalized.includes("tada")) return "L1-TADA-DATA";
  if (normalized.includes("dac")) return "L1-DAC-DATA";
  if (
    normalized.includes("p-i-other") ||
    normalized.includes("p-and-i-other") ||
    normalized.includes("pandi-other") ||
    normalized.includes("pi-other")
  ) {
    return "L1-P&I-OTHER-DATA";
  }
  if (
    normalized === "bucket-b-revenue-data" ||
    normalized.includes("bucket-b-revenue-data") ||
    normalized === "l2-data" ||
    normalized.includes("l2-data") ||
    normalized.startsWith("l2-rev") ||
    normalized.includes("-l2-rev")
  ) {
    return "Bucket B Revenue Data";
  }
  if (
    normalized === "bucket-c-revenue-data" ||
    normalized.includes("bucket-c-revenue-data") ||
    normalized === "l3-data" ||
    normalized.includes("l3-data") ||
    normalized.startsWith("l3-rev") ||
    normalized.includes("-l3-rev")
  ) {
    return "Bucket C Revenue Data";
  }

  return undefined;
}

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
    displayName: "Existing P&I-Other",
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
    sourceTab: "L2-DATA",
    displayName: "L2 Digitally Enabled",
    expectedRows: 100,
    expectedColumns: 13,
    requiredColumns: [
      "Source",
      "Oppty ID",
      "Platform/Business Line",
      "Client",
      "Client Group",
      "Opportunity Name",
      "Status",
      "Probability",
      "Total Bid Value (Excluding NII)",
      "Close Date",
      "Close Date (Date)",
      "Pipeline Tracker Match?",
      "Included?",
    ],
  },
  {
    sourceTab: "L3-DATA",
    displayName: "L3 Halo Effect",
    expectedRows: 8,
    expectedColumns: 13,
    requiredColumns: [
      "Source",
      "Oppty ID",
      "Platform/Business Line",
      "Client",
      "Client Group",
      "Opportunity Name",
      "Status",
      "Probability",
      "Total Bid Value (Excluding NII)",
      "Close Date",
      "Close Date (Date)",
      "Pipeline Tracker Match?",
      "Included?",
    ],
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
  if (normalized.includes("p-i-other") || normalized.includes("pi-other")) {
    return "L1-P&I-OTHER-DATA";
  }
  if (normalized === "l2-data" || normalized.includes("l2-data")) {
    return "L2-DATA";
  }
  if (normalized === "l3-data" || normalized.includes("l3-data")) {
    return "L3-DATA";
  }

  return undefined;
}

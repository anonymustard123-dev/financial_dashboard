import type { RawCsvRow } from "./parseCsv";
import { canonicalizeHeader } from "./csvSchemas";
import type {
  NormalizedOpportunity,
  RevenueLevel,
  SourceTab,
  StatusBucket,
} from "../types/revenue";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
const BUCKET_REVENUE_SOURCE_TABS: SourceTab[] = [
  "Bucket B Revenue Data",
  "Bucket C Revenue Data",
];

function getValue(row: RawCsvRow, ...headers: string[]) {
  const entries = Object.entries(row);
  for (const header of headers) {
    const match = entries.find(
      ([key]) => canonicalizeHeader(key) === canonicalizeHeader(header),
    );
    if (match) return String(match[1] ?? "").trim();
  }
  return "";
}

export function parseNumber(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return 0;
  const raw = String(value).trim();
  const negative = raw.startsWith("(") && raw.endsWith(")");
  const cleaned = raw.replace(/[,$%()\s]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
}

function parseProbability(value: string) {
  const parsed = parseNumber(value);
  if (parsed > 0 && parsed <= 1) return parsed * 100;
  return Math.max(0, Math.min(100, parsed));
}

function excelSerialToDate(serial: number) {
  const epoch = Date.UTC(1899, 11, 30);
  return new Date(epoch + serial * 24 * 60 * 60 * 1000);
}

export function parseDateValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric > 20000 && numeric < 90000) {
    const excelDate = excelSerialToDate(numeric);
    if (!Number.isNaN(excelDate.getTime())) return excelDate;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const parts = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const [, month, day, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const fallback = new Date(Number(fullYear), Number(month) - 1, Number(day));
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  return undefined;
}

function getQuarter(date: Date) {
  return QUARTERS[Math.floor(date.getMonth() / 3)];
}

export function normalizeStatus(status: string): StatusBucket {
  const value = status.trim().toLowerCase();
  if (value.includes("lost")) return "Lost";
  if (value.includes("won") || value.includes("closed won")) return "Won";
  if (value.includes("mandat")) return "Mandated";
  if (
    value.includes("open") ||
    value.includes("pipeline") ||
    value.includes("proposal") ||
    value.includes("prospect") ||
    value.includes("qualified")
  ) {
    return "Open";
  }
  return "Other";
}

function parseFlag(value: string) {
  return ["y", "yes", "true", "1", "included", "match"].includes(
    value.trim().toLowerCase(),
  );
}

function stablecoinSubcategory(platformBusinessLine: string) {
  const businessLine = platformBusinessLine.toLowerCase();
  if (businessLine.includes("asset servicing")) {
    return "Stablecoin Reserve Custody";
  }
  if (
    businessLine.includes("global payments") ||
    businessLine.includes("trade")
  ) {
    return "Stablecoin Enablement";
  }
  if (businessLine.includes("markets")) {
    return "Stablecoin Liquidity Direct";
  }
  return "Stablecoin Other";
}

function normalizeBusinessLine(value: string) {
  const businessLine = value.trim();
  return businessLine || "Other";
}

function isBucketRevenueSource(sourceTab: SourceTab) {
  return BUCKET_REVENUE_SOURCE_TABS.includes(sourceTab);
}

function mapRevenue(sourceTab: SourceTab, businessLine: string) {
  if (sourceTab === "L1-DAC-DATA") {
    return {
      revenueLevel: "L1 Direct Digital Revenue" as RevenueLevel,
      revenueSubcategory: "DAC + Data on Chain",
    };
  }
  if (sourceTab === "L1-Stablecoin-DATA") {
    return {
      revenueLevel: "L1 Direct Digital Revenue" as RevenueLevel,
      revenueSubcategory: stablecoinSubcategory(businessLine),
    };
  }
  if (sourceTab === "L1-TADA-DATA") {
    return {
      revenueLevel: "L1 Direct Digital Revenue" as RevenueLevel,
      revenueSubcategory: "Tokenized Fund Services",
    };
  }
  if (sourceTab === "Bucket B Revenue Data") {
    return {
      revenueLevel: "Traditional Opportunities Expansion" as RevenueLevel,
      revenueSubcategory: "Traditional Opportunities Expansion",
    };
  }
  if (sourceTab === "Bucket C Revenue Data") {
    return {
      revenueLevel: "Digital-Native Client Expansion" as RevenueLevel,
      revenueSubcategory: "Digital-Native Client Expansion",
    };
  }

  const line = businessLine.toLowerCase();
  const isTraditional =
    line.includes("traditional") ||
    line.includes("sales enabled") ||
    line.includes("p&i") ||
    line.includes("p and i") ||
    line.includes("pi-other");

  return {
    revenueLevel: isTraditional
      ? ("Traditional Opportunities Expansion" as RevenueLevel)
      : ("L1 Direct Digital Revenue" as RevenueLevel),
    revenueSubcategory: isTraditional
      ? "Traditional Opportunities Expansion"
      : businessLine || "Hard-coded Direct Digital Revenue",
  };
}

export function normalizeRows(
  sourceTab: SourceTab,
  rows: RawCsvRow[],
): NormalizedOpportunity[] {
  return rows.map((row, index) => {
    const bucketRevenueSource = isBucketRevenueSource(sourceTab);
    const platformBusinessLine = normalizeBusinessLine(
      bucketRevenueSource
        ? getValue(row, "Platform/Business Line")
        : getValue(row, "Platform/Business Line", "Business Line"),
    );
    const { revenueLevel, revenueSubcategory } = mapRevenue(
      sourceTab,
      platformBusinessLine,
    );
    const status = getValue(row, "Status") || "Other";
    const probability = parseProbability(getValue(row, "Probability"));
    const bidValue = parseNumber(
      bucketRevenueSource
        ? getValue(row, "Total Bid Value (Excluding NII)")
        : getValue(row, "Total Bid Value (Excluding NII)", "Total Bid Value"),
    );
    const date = parseDateValue(
      bucketRevenueSource
        ? getValue(row, "Close Date")
        : getValue(row, "Close Date (Date)", "Close Date", "Date Closed"),
    );
    const client = getValue(row, "Client") || "Unassigned Client";
    const clientGroup = getValue(row, "Client Group") || client;
    const generatedId = `${sourceTab}-${index + 1}`;

    return {
      id: getValue(row, "Oppty ID") || generatedId,
      sourceTab,
      revenueLevel,
      revenueSubcategory,
      platformBusinessLine,
      client,
      clientGroup,
      opportunityName:
        getValue(row, "Opportunity Name") || `Untitled opportunity ${index + 1}`,
      status,
      statusBucket: normalizeStatus(status),
      probability,
      bidValue,
      weightedValue: bidValue * (probability / 100),
      closeDate: date ? date.toISOString().slice(0, 10) : "",
      year: date?.getFullYear(),
      quarter: date ? getQuarter(date) : undefined,
      included: bucketRevenueSource
        ? true
        : getValue(row, "Included?")
          ? parseFlag(getValue(row, "Included?"))
          : true,
      pipelineTrackerMatch: bucketRevenueSource
        ? false
        : parseFlag(getValue(row, "Pipeline Tracker Match?")),
    };
  });
}

import type { NormalizedOpportunity, RevenueLevel, SourceTab } from "../types/revenue";
import { normalizeStatus } from "./normalizeData";

const fakeClients = [
  "Aster Ridge Capital",
  "Northstar Beacon Group",
  "Blue Harbor Trust",
  "Meridian Apex Funds",
  "Quartz River Markets",
  "Cobalt Crown Advisors",
  "Summit Vale Bank",
  "Pioneer Arc Holdings",
  "Silverline Treasury",
  "Atlas Grove Partners",
];

const businessLines = [
  "Asset Servicing",
  "Global Payments & Trade",
  "Markets",
  "Clearance & Collateral Management",
  "Pershing",
  "Corporate Trust",
  "Growth Ventures",
  "Credit Services",
  "Digital Services",
];

const levels: Array<{
  sourceTab: SourceTab;
  revenueLevel: RevenueLevel;
  subcategories: string[];
}> = [
  {
    sourceTab: "L1-DAC-DATA",
    revenueLevel: "L1 Direct Digital Revenue",
    subcategories: ["DAC + Data on Chain"],
  },
  {
    sourceTab: "L1-Stablecoin-DATA",
    revenueLevel: "L1 Direct Digital Revenue",
    subcategories: [
      "Stablecoin Reserve Custody",
      "Stablecoin Enablement",
      "Stablecoin Liquidity Direct",
    ],
  },
  {
    sourceTab: "L1-P&I-OTHER-DATA",
    revenueLevel: "L1 Existing P&I-Other",
    subcategories: ["Traditional Sales Enabled"],
  },
  {
    sourceTab: "Bucket B Revenue Data",
    revenueLevel: "Traditional Opportunities Expansion",
    subcategories: ["Traditional Opportunities Expansion"],
  },
  {
    sourceTab: "Bucket C Revenue Data",
    revenueLevel: "Digital-Native Client Expansion",
    subcategories: ["Digital-Native Client Expansion"],
  },
];

const statuses = ["Won", "Open", "Mandated", "Open", "Open", "Lost"];

export function createSyntheticData() {
  const rows: NormalizedOpportunity[] = [];

  levels.forEach((level, levelIndex) => {
    const count = level.revenueLevel === "Digital-Native Client Expansion" ? 8 : 18;
    for (let index = 0; index < count; index += 1) {
      const client = fakeClients[(index + levelIndex * 2) % fakeClients.length];
      const businessLine =
        businessLines[(index * 2 + levelIndex) % businessLines.length];
      const probability = [25, 35, 50, 65, 80, 95][
        (index + levelIndex) % 6
      ];
      const bidValue =
        (levelIndex + 1) * 850_000 +
        ((index % 7) + 1) * 420_000 +
        (index % 3) * 150_000;
      const month = index % 12;
      const status = statuses[(index + levelIndex) % statuses.length];
      const statusBucket = normalizeStatus(status);
      const quarter = (["Q1", "Q2", "Q3", "Q4"] as const)[
        Math.floor(month / 3)
      ];

      rows.push({
        id: `DEMO-${level.sourceTab}-${index + 1}`,
        sourceTab: level.sourceTab,
        revenueLevel: level.revenueLevel,
        revenueSubcategory:
          level.subcategories[index % level.subcategories.length],
        platformBusinessLine: businessLine,
        client,
        clientGroup: client,
        opportunityName: `${level.subcategories[index % level.subcategories.length]} program ${index + 1}`,
        status,
        statusBucket,
        probability,
        bidValue,
        weightedValue: bidValue * (probability / 100),
        closeDate: new Date(2026, month, 8 + (index % 18))
          .toISOString()
          .slice(0, 10),
        year: 2026,
        quarter,
        included:
          level.revenueLevel !== "Digital-Native Client Expansion" ||
          index % 4 !== 0,
        pipelineTrackerMatch:
          level.revenueLevel !== "L1 Direct Digital Revenue" && index % 9 === 0,
      });
    }
  });

  return rows;
}

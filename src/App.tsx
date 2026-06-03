import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  MessageSquareText,
  PanelLeftOpen,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { BusinessLineMix } from "./components/BusinessLineMix";
import { DataChatPanel } from "./components/DataChatPanel";
import { KpiCard } from "./components/KpiCard";
import { OpportunityTable } from "./components/OpportunityTable";
import { QuarterTimeline } from "./components/QuarterTimeline";
import { RevenueLevelBars } from "./components/RevenueLevelBars";
import { UploadPanel } from "./components/UploadPanel";
import {
  applyFilters,
  BUSINESS_LINE_ORDER,
  DEFAULT_FILTERS,
  DEFAULT_REVENUE_LEVEL_FILTER,
  getBusinessLineMix,
  getClientSummaries,
  getLevelSummaries,
  getQuarterTimeline,
  getTopFiveClientShare,
  LEVEL_COLORS,
  REVENUE_LEVELS,
} from "./lib/calculations";
import { detectSourceTab, getSchema, SOURCE_SCHEMAS } from "./lib/csvSchemas";
import {
  displayRevenueLevel,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "./lib/formatters";
import { normalizeRows } from "./lib/normalizeData";
import { parseRevenueCsv } from "./lib/parseCsv";
import { createSyntheticData } from "./lib/syntheticData";
import type {
  DashboardFilters,
  NormalizedOpportunity,
  RevenueLevel,
  RevenueLevelFilter,
  SourceLoadState,
  SourceTab,
  StatusBucket,
} from "./types/revenue";

const STORAGE_ENABLED_KEY = "pi-revenue-dashboard-persist-enabled";
const STORAGE_DATA_KEY = "pi-revenue-dashboard-local-session";

function createInitialSourceStates(): SourceLoadState[] {
  return SOURCE_SCHEMAS.map((schema) => ({
    sourceTab: schema.sourceTab,
    status: "missing",
    rowCount: 0,
    warnings: [],
    missingColumns: [],
  }));
}

function FilterChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        checked
          ? "border-bny-primary bg-bny-primary text-white"
          : "border-white/10 bg-bny-navy/35 text-slate-300 hover:border-bny-primary/60 hover:text-white"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="hidden"
      />
      {label}
    </label>
  );
}

function toggleArrayValue<T>(values: T[], value: T, checked: boolean) {
  if (checked) return [...values, value];
  return values.filter((item) => item !== value);
}

function getDashboardOpportunity(row: NormalizedOpportunity): NormalizedOpportunity {
  if (row.sourceTab !== "L1-P&I-OTHER-DATA") return row;
  return {
    ...row,
    revenueLevel: "Traditional Opportunities Expansion",
    revenueSubcategory: "Traditional Opportunities Expansion",
  };
}

function getRevenueLevelFilter(
  filters: DashboardFilters,
  level: RevenueLevel,
): RevenueLevelFilter {
  const stored = filters.revenueLevelFilters?.[level];
  return {
    ...DEFAULT_REVENUE_LEVEL_FILTER,
    ...stored,
    years: stored?.years ?? DEFAULT_REVENUE_LEVEL_FILTER.years,
    statuses: stored?.statuses ?? DEFAULT_REVENUE_LEVEL_FILTER.statuses,
  };
}

function App() {
  const [opportunities, setOpportunities] = useState<NormalizedOpportunity[]>(
    [],
  );
  const [sourceStates, setSourceStates] = useState<SourceLoadState[]>(
    createInitialSourceStates,
  );
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [notices, setNotices] = useState<string[]>([]);
  const [persistSession, setPersistSession] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem(STORAGE_ENABLED_KEY) === "true";
    setPersistSession(enabled);
    if (!enabled) return;

    const stored = localStorage.getItem(STORAGE_DATA_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        opportunities?: NormalizedOpportunity[];
        sourceStates?: SourceLoadState[];
      };
      setOpportunities(parsed.opportunities ?? []);
      setSourceStates(parsed.sourceStates ?? createInitialSourceStates());
    } catch {
      localStorage.removeItem(STORAGE_DATA_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_ENABLED_KEY, String(persistSession));
    if (!persistSession) {
      localStorage.removeItem(STORAGE_DATA_KEY);
      return;
    }

    localStorage.setItem(
      STORAGE_DATA_KEY,
      JSON.stringify({ opportunities, sourceStates }),
    );
  }, [opportunities, persistSession, sourceStates]);

  const loadFileForSource = async (file: File, sourceTab: SourceTab) => {
    const schema = getSchema(sourceTab);
    if (!schema) return;

    try {
      const parsed = await parseRevenueCsv(file, schema);
      const normalized = normalizeRows(sourceTab, parsed.rows);
      const warnings = [
        ...parsed.warnings,
        ...(parsed.missingColumns.length
          ? [`Missing required columns: ${parsed.missingColumns.join(", ")}`]
          : []),
      ];

      setOpportunities((current) => [
        ...current.filter((row) => row.sourceTab !== sourceTab),
        ...normalized,
      ]);
      setSourceStates((current) =>
        current.map((state) =>
          state.sourceTab === sourceTab
            ? {
                sourceTab,
                status: warnings.length ? "warning" : "loaded",
                fileName: file.name,
                rowCount: normalized.length,
                warnings,
                missingColumns: parsed.missingColumns,
                loadedAt: new Date().toISOString(),
              }
            : state,
        ),
      );
    } catch (error) {
      setNotices((current) => [
        ...current,
        `${file.name} could not be parsed: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      ]);
    }
  };

  const handleFiles = (files: File[]) => {
    const unmatched: string[] = [];
    const csvFiles = files.filter((file) => file.name.toLowerCase().endsWith(".csv"));
    const skipped = files.length - csvFiles.length;
    const detected = csvFiles.flatMap((file) => {
      const sourceTab = detectSourceTab(file.webkitRelativePath || file.name);
      if (!sourceTab) {
        unmatched.push(file.name);
        return [];
      }
      return [{ file, sourceTab }];
    });

    setNotices(
      [
        ...(skipped
          ? [`Ignored ${skipped} non-CSV file${skipped === 1 ? "" : "s"}.`]
          : []),
        ...unmatched.map(
        (name) =>
          `${name} was not auto-detected. Use manual mapping to assign it to a source tab.`,
        ),
      ],
    );
    void Promise.all(
      detected.map(({ file, sourceTab }) => loadFileForSource(file, sourceTab)),
    );
  };

  const resetData = () => {
    setOpportunities([]);
    setSourceStates(createInitialSourceStates());
    setNotices([]);
    localStorage.removeItem(STORAGE_DATA_KEY);
  };

  const useSyntheticData = () => {
    const synthetic = createSyntheticData();
    setOpportunities(synthetic);
    setSourceStates((current) =>
      current.map((state) => ({
        ...state,
        status: "loaded",
        fileName: "Synthetic demo data",
        rowCount: synthetic.filter((row) => row.sourceTab === state.sourceTab)
          .length,
        warnings: [],
        missingColumns: [],
        loadedAt: new Date().toISOString(),
      })),
    );
    setNotices(["Synthetic demo data uses clearly fake company names only."]);
  };

  const dashboardOpportunities = useMemo(
    () => opportunities.map(getDashboardOpportunity),
    [opportunities],
  );
  const filteredOpportunities = useMemo(
    () => applyFilters(dashboardOpportunities, filters),
    [dashboardOpportunities, filters],
  );
  const summaries = useMemo(
    () => getLevelSummaries(filteredOpportunities),
    [filteredOpportunities],
  );
  const timeline = useMemo(
    () => getQuarterTimeline(filteredOpportunities),
    [filteredOpportunities],
  );
  const businessLineMix = useMemo(
    () => getBusinessLineMix(filteredOpportunities),
    [filteredOpportunities],
  );
  const topClients = useMemo(
    () => getClientSummaries(filteredOpportunities).slice(0, 10),
    [filteredOpportunities],
  );
  const topFiveShare = useMemo(
    () => getTopFiveClientShare(filteredOpportunities),
    [filteredOpportunities],
  );
  const totalSummary = summaries.find(
    (summary) => summary.level === "Total Revenue Universe",
  );
  const availableYears = Array.from(
    new Set([
      2026,
      ...dashboardOpportunities.flatMap((row) => (row.year ? [row.year] : [])),
    ]),
  ).sort();
  const statusOptions: StatusBucket[] = ["Won", "Open", "Mandated", "Lost", "Other"];

  return (
    <main className="min-h-screen overflow-hidden bg-bny-navy text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-bny-primary/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-bny-teal/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-bny-accent/10 blur-3xl" />
      </div>

      <button
        type="button"
        onClick={() => setControlsOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-full border border-bny-primary/35 bg-bny-navy/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-bny-teal shadow-2xl backdrop-blur transition hover:bg-bny-primary/20 hover:text-white"
      >
        <PanelLeftOpen className="h-4 w-4" />
        Upload / Filters
      </button>

      <button
        type="button"
        onClick={() => setCopilotOpen(true)}
        className="fixed right-4 top-4 z-40 inline-flex items-center gap-2 rounded-full border border-bny-primary/35 bg-bny-navy/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-bny-teal shadow-2xl backdrop-blur transition hover:bg-bny-primary/20 hover:text-white"
      >
        <MessageSquareText className="h-4 w-4" />
        AI Copilot
      </button>

      {controlsOpen && (
        <div className="fixed inset-0 z-50 bg-bny-navy/65 backdrop-blur-sm">
          <aside className="h-full w-full max-w-[410px] overflow-y-auto border-r border-bny-primary/25 bg-bny-navy p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
                  Data controls
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Upload and Filters
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setControlsOpen(false)}
                className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <UploadPanel
                sourceStates={sourceStates}
                onFiles={handleFiles}
                onManualFile={(file, sourceTab) =>
                  void loadFileForSource(file, sourceTab)
                }
                onReset={resetData}
                onUseSynthetic={useSyntheticData}
                persistSession={persistSession}
                onPersistSessionChange={setPersistSession}
                notices={notices}
              />

              <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/80 p-5 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-bny-teal" />
                  <h2 className="text-lg font-semibold text-white">
                    Global Filters
                  </h2>
                </div>
                <div className="grid gap-4">
                  <label className="relative text-sm text-slate-300">
                    <Search className="absolute left-3 top-9 h-4 w-4 text-slate-500" />
                    Client / group search
                    <input
                      value={filters.search}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          search: event.target.value,
                        }))
                      }
                      placeholder="Search clients or opportunities"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-bny-navy py-2 pl-9 pr-3 text-white outline-none ring-bny-primary/40 placeholder:text-slate-500 focus:ring-2"
                    />
                  </label>

                  <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Revenue type configuration
                    </p>
                    <div className="grid gap-3">
                      {REVENUE_LEVELS.map((level) => {
                        const levelFilter = getRevenueLevelFilter(filters, level);
                        return (
                          <div
                            key={level}
                            className="rounded-2xl border border-white/10 bg-bny-navy/45 p-3"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-white">
                                {displayRevenueLevel(level)}
                              </p>
                              <FilterChip
                                label="Show"
                                checked={filters.levels.includes(level)}
                                onChange={(checked) =>
                                  setFilters((current) => ({
                                    ...current,
                                    levels: toggleArrayValue(
                                      current.levels,
                                      level,
                                      checked,
                                    ),
                                  }))
                                }
                              />
                            </div>
                            <label className="grid gap-2 text-sm text-slate-300">
                              Minimum probability: {levelFilter.minProbability}%
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={levelFilter.minProbability}
                                onChange={(event) =>
                                  setFilters((current) => ({
                                    ...current,
                                    revenueLevelFilters: {
                                      ...current.revenueLevelFilters,
                                      [level]: {
                                        ...getRevenueLevelFilter(current, level),
                                        minProbability: Number(event.target.value),
                                      },
                                    },
                                  }))
                                }
                                className="accent-bny-primary"
                              />
                            </label>
                            <div className="mt-3 grid gap-2 text-sm text-slate-300">
                              Reporting years
                              <div className="flex flex-wrap gap-2">
                                <FilterChip
                                  label="All years"
                                  checked={levelFilter.years.length === 0}
                                  onChange={(checked) => {
                                    if (!checked) return;
                                    setFilters((current) => ({
                                      ...current,
                                      revenueLevelFilters: {
                                        ...current.revenueLevelFilters,
                                        [level]: {
                                          ...getRevenueLevelFilter(current, level),
                                          years: [],
                                        },
                                      },
                                    }));
                                  }}
                                />
                                {availableYears.map((year) => (
                                  <FilterChip
                                    key={`${level}-${year}`}
                                    label={String(year)}
                                    checked={levelFilter.years.includes(year)}
                                    onChange={(checked) =>
                                      setFilters((current) => ({
                                        ...current,
                                        revenueLevelFilters: {
                                          ...current.revenueLevelFilters,
                                          [level]: {
                                            ...getRevenueLevelFilter(current, level),
                                            years: toggleArrayValue(
                                              getRevenueLevelFilter(
                                                current,
                                                level,
                                              ).years,
                                              year,
                                              checked,
                                            ),
                                          },
                                        },
                                      }))
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm text-slate-300">
                              Statuses
                              <div className="flex flex-wrap gap-2">
                                <FilterChip
                                  label="All statuses"
                                  checked={levelFilter.statuses.length === 0}
                                  onChange={(checked) => {
                                    if (!checked) return;
                                    setFilters((current) => ({
                                      ...current,
                                      revenueLevelFilters: {
                                        ...current.revenueLevelFilters,
                                        [level]: {
                                          ...getRevenueLevelFilter(current, level),
                                          statuses: [],
                                        },
                                      },
                                    }));
                                  }}
                                />
                                {statusOptions.map((status) => (
                                  <FilterChip
                                    key={`${level}-${status}`}
                                    label={status}
                                    checked={levelFilter.statuses.includes(status)}
                                    onChange={(checked) =>
                                      setFilters((current) => ({
                                        ...current,
                                        revenueLevelFilters: {
                                          ...current.revenueLevelFilters,
                                          [level]: {
                                            ...getRevenueLevelFilter(current, level),
                                            statuses: toggleArrayValue(
                                              getRevenueLevelFilter(
                                                current,
                                                level,
                                              ).statuses,
                                              status,
                                              checked,
                                            ),
                                          },
                                        },
                                      }))
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          levels: [...DEFAULT_FILTERS.levels],
                          revenueLevelFilters:
                            DEFAULT_FILTERS.revenueLevelFilters,
                        }))
                      }
                      className="mt-1 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      Reset revenue type filters
                    </button>
                  </div>

                  <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Business line
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BUSINESS_LINE_ORDER.map((line) => (
                        <FilterChip
                          key={line}
                          label={line}
                          checked={filters.businessLines.includes(line)}
                          onChange={(checked) =>
                            setFilters((current) => ({
                              ...current,
                              businessLines: toggleArrayValue(
                                current.businessLines,
                                line,
                                checked,
                              ),
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-300">
                    {[
                      [
                        "showPipelineMatches",
                        "Show pipeline tracker matches / excluded overlaps",
                      ],
                    ].map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-bny-navy/50 p-3"
                      >
                        {label}
                        <input
                          type="checkbox"
                          checked={Boolean(filters[key as keyof DashboardFilters])}
                          onChange={(event) =>
                            setFilters((current) => ({
                              ...current,
                              [key]: event.target.checked,
                            }))
                          }
                          className="h-5 w-5 accent-bny-primary"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      {copilotOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-bny-navy/65 backdrop-blur-sm">
          <aside className="h-full w-full max-w-[420px] border-l border-bny-primary/25 shadow-2xl">
            <DataChatPanel
              opportunities={filteredOpportunities}
              summaries={summaries}
              onClose={() => setCopilotOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="relative mx-auto max-w-[1800px] px-4 py-6 pt-20 lg:px-6">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-bny-primary/30 bg-bny-surface/75 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-bny-primary/25 blur-3xl" />
            <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-bny-accent/10 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-8">
              <div className="max-w-5xl">
                <img src="/bny-logo.svg" alt="BNY" className="mb-8 h-auto w-44" />
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 rounded-full border border-bny-primary/35 bg-bny-primary/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal"
                >
                  <Sparkles className="h-4 w-4" />
                  Revenue Universe Command Center
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="mt-5 text-5xl font-black tracking-tight text-white md:text-7xl xl:text-8xl"
                >
                  P&amp;I Master Revenue View
                </motion.h1>
              </div>
            </div>

            <div className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaries.map((summary) => (
                <KpiCard
                  key={summary.level}
                  summary={summary}
                  color={
                    summary.level === "Total Revenue Universe"
                      ? "#f8fafc"
                      : LEVEL_COLORS[summary.level as RevenueLevel]
                  }
                />
              ))}
            </div>
          </section>

          {opportunities.length === 0 && (
            <section className="rounded-[2rem] border border-bny-primary/25 bg-[radial-gradient(circle_at_top_left,rgba(45,155,173,0.22),rgba(0,51,79,0.72))] p-10 text-center shadow-2xl shadow-black/25">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
                Empty state
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Upload presentation CSVs to activate the command center
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-300">
                The deployed app contains no real model data. During a meeting,
                drag in the seven CSV exports or use the synthetic demo mode for
                a polished placeholder view with fake company names.
              </p>
            </section>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <RevenueLevelBars
              summaries={summaries}
              opportunities={filteredOpportunities}
            />
            <QuarterTimeline
              data={timeline}
              opportunities={filteredOpportunities}
            />
          </div>

          <BusinessLineMix
            data={businessLineMix}
            opportunities={filteredOpportunities}
          />

          <div className="grid gap-6">
            <section className="rounded-3xl border border-bny-primary/25 bg-bny-surface/75 p-5 shadow-2xl shadow-black/25 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
                Client concentration
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="rounded-3xl border border-white/10 bg-bny-navy/55 p-5">
                  <p className="text-sm text-slate-400">Top 5 share</p>
                  <p className="mt-2 text-4xl font-semibold text-white">
                    {formatPercent(topFiveShare)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    of filtered Total Revenue Universe
                  </p>
                </div>
                <div className="grid gap-2">
                  {topClients.map((client, index) => (
                    <div
                      key={client.name}
                      className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <span className="text-sm font-semibold text-bny-teal">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatNumber(client.count)} opportunities - largest:
                          {" "}
                          {client.largestOpportunity}
                        </p>
                      </div>
                      <span className="font-semibold text-white">
                        {formatCurrency(client.value)}
                      </span>
                    </div>
                  ))}
                  {topClients.length === 0 && (
                    <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-slate-400">
                      Client concentration appears after CSV upload.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <OpportunityTable opportunities={filteredOpportunities} />

          <footer className="pb-8 text-center text-xs text-slate-500">
            Forecast value uses the selected filters. Total Revenue Universe:
            {" "}
            {formatCurrency(totalSummary?.forecastValue ?? 0)} across{" "}
            {formatNumber(totalSummary?.count ?? 0)} opportunities.
          </footer>
        </div>
      </div>
    </main>
  );
}

export default App;

import { useState, type ChangeEvent, type DragEvent } from "react";
import { DatabaseZap, FolderOpen, RotateCcw, ShieldCheck, UploadCloud } from "lucide-react";
import { SOURCE_LABELS, SOURCE_SCHEMAS } from "../lib/csvSchemas";
import type { SourceLoadState, SourceTab } from "../types/revenue";

interface UploadPanelProps {
  sourceStates: SourceLoadState[];
  onFiles: (files: File[]) => void;
  onManualFile: (file: File, sourceTab: SourceTab) => void;
  onReset: () => void;
  onUseSynthetic: () => void;
  persistSession: boolean;
  onPersistSessionChange: (value: boolean) => void;
  notices: string[];
}

export function UploadPanel({
  sourceStates,
  onFiles,
  onManualFile,
  onReset,
  onUseSynthetic,
  persistSession,
  onPersistSessionChange,
  notices,
}: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [manualSource, setManualSource] =
    useState<SourceTab>("L1-DAC-DATA");

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    onFiles(Array.from(fileList));
  };

  const handleManualFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onManualFile(file, manualSource);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <aside className="rounded-3xl border border-bny-primary/30 bg-bny-surface/80 p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <img src="/bny-logo.svg" alt="BNY" className="h-auto w-32" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-bny-teal">
            Local-only upload
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            CSV Control Room
          </h2>
        </div>
        <ShieldCheck className="h-6 w-6 text-bny-teal" />
      </div>

      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition ${
          isDragging
            ? "border-bny-primary bg-bny-primary/20"
            : "border-bny-primary/35 bg-bny-navy/55 hover:border-bny-teal hover:bg-bny-primary/15"
        }`}
      >
        <UploadCloud className="mb-3 h-8 w-8 text-bny-teal" />
        <span className="font-medium text-white">Drop all 6 CSVs here</span>
        <span className="mt-1 text-sm text-slate-300">
          Filename detection loads matched tabs instantly.
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          multiple
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>

      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-bny-primary/35 bg-bny-primary/15 px-4 py-3 text-sm font-semibold text-bny-teal transition hover:bg-bny-primary/25 hover:text-white">
        <FolderOpen className="h-4 w-4" />
        Select export folder
        <input
          type="file"
          // React's input typings do not include Chromium's folder picker attributes.
          {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          multiple
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>

      <div className="mt-4 rounded-2xl border border-bny-primary/25 bg-bny-navy/50 p-3">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Manual mapping
        </label>
        <div className="mt-2 grid gap-2">
          <select
            value={manualSource}
            onChange={(event) => setManualSource(event.target.value as SourceTab)}
            className="rounded-xl border border-white/10 bg-bny-navy px-3 py-2 text-sm text-white outline-none ring-bny-primary/40 focus:ring-2"
          >
            {SOURCE_SCHEMAS.map((schema) => (
              <option key={schema.sourceTab} value={schema.sourceTab}>
                {schema.displayName}
              </option>
            ))}
          </select>
          <label className="cursor-pointer rounded-xl bg-bny-primary px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-bny-teal">
            Upload / replace mapped CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleManualFile}
            />
          </label>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {sourceStates.map((state) => (
          <div
            key={state.sourceTab}
            className="rounded-2xl border border-white/10 bg-bny-navy/35 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {SOURCE_LABELS[state.sourceTab]}
                </p>
                <p className="text-xs text-slate-400">
                  {state.fileName ?? "Missing"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  state.status === "loaded"
                    ? "bg-bny-primary/20 text-bny-teal"
                    : state.status === "warning"
                      ? "bg-amber-300/15 text-amber-200"
                      : "bg-slate-700/70 text-slate-300"
                }`}
              >
                {state.status === "warning"
                  ? "Loaded with warnings"
                  : state.status}
              </span>
            </div>
            {state.rowCount > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                {state.rowCount.toLocaleString()} rows loaded
              </p>
            )}
            {state.missingColumns.length > 0 && (
              <p className="mt-2 text-xs text-amber-200">
                Missing: {state.missingColumns.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      {notices.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">
          {notices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onUseSynthetic}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-bny-primary/35 bg-bny-primary/15 px-3 py-2 text-sm font-semibold text-bny-teal transition hover:bg-bny-primary/25 hover:text-white"
        >
          <DatabaseZap className="h-4 w-4" />
          Demo data
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-bny-navy/55 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" />
          Reset data
        </button>
      </div>

      <label className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-bny-navy/50 p-3 text-sm text-slate-200">
        <span>
          Persist in this browser
          <span className="block text-xs text-slate-500">
            Off by default; localStorage only.
          </span>
        </span>
        <input
          type="checkbox"
          checked={persistSession}
          onChange={(event) => onPersistSessionChange(event.target.checked)}
          className="h-5 w-5 accent-bny-primary"
        />
      </label>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        No data leaves this browser. CSVs are parsed locally in the active
        session, with no backend, API, analytics endpoint, or remote fetch.
      </p>
    </aside>
  );
}

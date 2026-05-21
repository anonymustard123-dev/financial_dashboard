import { AlertTriangle, LockKeyhole } from "lucide-react";

export function CaveatsPanel() {
  return (
    <section className="rounded-3xl border border-bny-accent/35 bg-bny-accent/[0.10] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-200/15 p-3 text-amber-100">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-100">
            Data quality caveats
          </p>
          <p className="mt-3 text-sm leading-6 text-amber-50/90">
            L3 is directional and requires pruning to include only opportunities
            where the digital connection was actually responsible for winning
            the traditional business. Client grouping may also require cleanup
            because eCRM often has multiple client objects for the same
            institution.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-amber-50/80">
            <p>Pipeline tracker matches can be excluded to avoid double counting.</p>
            <p className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" />
              All uploaded data is processed locally in this browser session.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import ResolutionCard from "./ResolutionCard";

type TrackerHook = any;

export default function ResolutionsSection({ t }: { t: TrackerHook }) {
  return (
    <>
      {/* Search resolutions */}
      <section className="mb-5">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Search resolutions…"
          value={t.resolutionsQuery}
          onChange={(e) => t.setResolutionsQuery(e.target.value)}
        />
      </section>

      {/* Snapshots */}
      <section className="grid gap-5 md:grid-cols-2">
        {t.filteredResolutions.map((r: any) => (
          <ResolutionCard key={r.id} r={r} t={t} />
        ))}
      </section>

      {t.resolutions.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed p-8 text-center text-sm text-zinc-600">
          No resolutions yet. Click <span className="font-medium">Add Resolution</span> to create your first one.
        </div>
      ) : null}
    </>
  );
}

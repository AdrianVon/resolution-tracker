"use client";

type TrackerHook = any;

export default function AddResolutionModal({ t }: { t: TrackerHook }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Add Resolution</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Description supports new lines. Tasks can include optional details.
              </p>
            </div>
            <button onClick={t.closeAddResolution} className="text-sm text-zinc-600 hover:text-black">
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          <div className="grid gap-3">
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Resolution Name (required)"
              value={t.draftName}
              onChange={(e: any) => t.setDraftName(e.target.value)}
            />

            <textarea
              className="rounded-md border px-3 py-2"
              rows={4}
              placeholder="Resolution description / why (optional) — Shift+Enter for a new line"
              value={t.draftDescription}
              onChange={(e: any) => t.setDraftDescription(e.target.value)}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-zinc-600">Resolution deadline (optional)</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={t.draftResolutionDeadline}
                  onChange={(e: any) => t.setDraftResolutionDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Tasks</div>
                <button
                  onClick={t.addDraftTaskRow}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-50"
                >
                  + Add task
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {t.draftTaskRows.map((row: any, idx: number) => (
                  <div key={idx} className="rounded-md border p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="rounded-md border px-3 py-2"
                        placeholder={`Task #${idx + 1} (required)`}
                        value={row.text}
                        onChange={(e: any) => t.updateDraftTaskRow(idx, "text", e.target.value)}
                      />
                      <input
                        type="date"
                        className="rounded-md border px-3 py-2"
                        value={row.deadline}
                        onChange={(e: any) => t.updateDraftTaskRow(idx, "deadline", e.target.value)}
                      />
                    </div>

                    <div className="mt-3">
                      <label className="text-xs text-zinc-600">Details (optional)</label>
                      <textarea
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Optional details for this task..."
                        value={row.details}
                        onChange={(e: any) => t.updateDraftTaskRow(idx, "details", e.target.value)}
                      />
                    </div>

                    {t.draftTaskRows.length > 1 ? (
                      <button
                        onClick={() => t.removeDraftTaskRow(idx)}
                        className="mt-2 text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        Remove task
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={t.closeAddResolution} className="rounded-md border px-4 py-2">
                Cancel
              </button>
              <button onClick={t.createResolution} className="rounded-md bg-black px-4 py-2 text-white">
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

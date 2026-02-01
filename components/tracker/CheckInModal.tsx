"use client";

import type { CheckInType } from "@/lib/tracker/types";
import { CHECKIN_TEMPLATES } from "@/lib/tracker/templates";

type TrackerHook = any;

export default function CheckInModal({ t }: { t: TrackerHook }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Check In</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Use a prompt template or write freely. Later: sentiment + intelligent feedback.
              </p>
            </div>
            <button onClick={t.closeCheckIn} className="text-sm text-zinc-600 hover:text-black">
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-zinc-600">Type</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={t.checkInType}
                  onChange={(e: any) => t.setCheckInType(e.target.value as CheckInType)}
                >
                  {(["Daily", "Weekly", "Blocked", "Win", "Other"] as CheckInType[]).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-600">Attach to a resolution (optional)</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={t.checkInResolutionId}
                  onChange={(e: any) => t.setCheckInResolutionId(e.target.value)}
                >
                  <option value="">All (General)</option>
                  {t.resolutions.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["Daily", "Weekly", "Blocked", "Win", "Other"] as CheckInType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => t.applyTemplate(type)}
                  className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  Use {type} prompt
                </button>
              ))}
            </div>

            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={8}
              placeholder={`How are you doing?\nWhat went well?\nWhat got in the way?\nWhat’s the next move?`}
              value={t.checkInText}
              onChange={(e: any) => t.setCheckInText(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2">
              <button onClick={t.closeCheckIn} className="rounded-md border px-4 py-2">
                Cancel
              </button>
              <button onClick={t.addCheckIn} className="rounded-md bg-black px-4 py-2 text-white">
                Save update
              </button>
            </div>

            <div className="text-xs text-zinc-500">
              Tip: templates are just text. Edit them however you want and it’ll save exactly what you write.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

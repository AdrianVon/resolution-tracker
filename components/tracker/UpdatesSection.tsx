"use client";

import { CHECKIN_TEMPLATES } from "@/lib/tracker/templates";
import type { CheckInType } from "@/lib/tracker/types";
import { clamp, formatDateTime } from "@/lib/tracker/utils";

type TrackerHook = any;

export default function UpdatesSection({ t }: { t: TrackerHook }) {
  const hasUpdatesFilters = Boolean(
    (t.updatesQuery ?? "").trim() || t.updatesType || t.updatesResolutionId
  );

  return (
    <section className="mb-8 rounded-lg border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Updates</div>
          <div className="mt-1 text-sm text-zinc-600">
            Log a daily/weekly check-in. Later we’ll run NLP + sentiment on these.
          </div>
        </div>
        <button
          onClick={() => t.openCheckIn()}
          className="rounded-md bg-black px-3 py-2 text-sm text-white"
        >
          New update
        </button>
      </div>

      {/* Search + filters */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Search updates…"
          value={t.updatesQuery}
          onChange={(e) => t.setUpdatesQuery(e.target.value)}
        />

        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={t.updatesType}
          onChange={(e) => t.setUpdatesType(e.target.value as "" | CheckInType)}
        >
          <option value="">All types</option>
          {(["Daily", "Weekly", "Blocked", "Win", "Other"] as CheckInType[]).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={t.updatesResolutionId}
          onChange={(e) => t.setUpdatesResolutionId(e.target.value)}
        >
          <option value="">All resolutions</option>
          {t.resolutions.map((r: any) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {hasUpdatesFilters ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="text-xs text-zinc-600">Active filters:</div>
          {(t.updatesQuery ?? "").trim() ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
              query: “{(t.updatesQuery ?? "").trim()}”
            </span>
          ) : null}
          {t.updatesType ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
              type: {t.updatesType}
            </span>
          ) : null}
          {t.updatesResolutionId ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
              resolution: {t.resolutionNameById(t.updatesResolutionId)}
            </span>
          ) : null}
          <button
            onClick={t.clearUpdatesFilters}
            className="text-xs text-zinc-600 hover:text-black underline"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* Nudge banner */}
      {t.daysSinceLastCheckIn !== null && t.daysSinceLastCheckIn >= 1 ? (
        <div className="mt-4 rounded-md border bg-zinc-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-700">
              It’s been <span className="font-semibold">{t.daysSinceLastCheckIn}</span>{" "}
              day{t.daysSinceLastCheckIn === 1 ? "" : "s"} since your last update.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  t.openCheckIn({ type: "Daily", text: CHECKIN_TEMPLATES.Daily })
                }
                className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Daily prompt
              </button>
              <button
                onClick={() =>
                  t.openCheckIn({ type: "Weekly", text: CHECKIN_TEMPLATES.Weekly })
                }
                className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Weekly prompt
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Latest */}
      {t.latestCheckIn ? (
        <div className="mt-4 rounded-md bg-zinc-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs font-medium text-zinc-600">
                {t.latestCheckIn.type} • {t.resolutionNameById(t.latestCheckIn.resolutionId)} •{" "}
                {formatDateTime(t.latestCheckIn.createdAt)}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-900">
                {t.latestCheckIn.text}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => t.startEditCheckIn(t.latestCheckIn)}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                Edit
              </button>
              <button
                onClick={() => t.deleteCheckIn(t.latestCheckIn.id)}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-zinc-600">No updates yet. Click “Check In”.</div>
      )}

      {/* History */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium">
          History ({t.filteredCheckIns.length}
          {t.checkIns.length !== t.filteredCheckIns.length ? ` of ${t.checkIns.length}` : ""})
        </summary>

        <div className="mt-3 max-h-[340px] overflow-y-auto rounded-md border bg-white p-3">
          {t.filteredCheckIns.length === 0 ? (
            <div className="text-sm text-zinc-600">No updates match your filters.</div>
          ) : (
            <ul className="space-y-2">
              {t.filteredCheckIns.map((ci: any) => {
                const isEditing = t.editingCheckInId === ci.id;

                return (
                  <li key={ci.id} className="rounded-md bg-zinc-50 p-3">
                    {!isEditing ? (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-zinc-600">
                            {ci.type} • {t.resolutionNameById(ci.resolutionId)} •{" "}
                            {formatDateTime(ci.createdAt)}
                          </div>
                          <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-900">
                            {ci.text}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => t.startEditCheckIn(ci)}
                            className="text-xs text-zinc-500 hover:text-zinc-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => t.deleteCheckIn(ci.id)}
                            className="text-xs text-zinc-500 hover:text-zinc-900"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <label className="text-xs text-zinc-600">Type</label>
                            <select
                              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                              value={t.editCheckInType}
                              onChange={(e) => t.setEditCheckInType(e.target.value as CheckInType)}
                            >
                              {(["Daily", "Weekly", "Blocked", "Win", "Other"] as CheckInType[]).map(
                                (type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-zinc-600">
                              Attach to a resolution (optional)
                            </label>
                            <select
                              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                              value={t.editCheckInResolutionId}
                              onChange={(e) => t.setEditCheckInResolutionId(e.target.value)}
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

                        <textarea
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          rows={5}
                          value={t.editCheckInText}
                          onChange={(e) => t.setEditCheckInText(e.target.value)}
                          placeholder="Update..."
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={t.cancelEditCheckIn}
                            className="rounded-md border px-3 py-2 text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => t.saveEditCheckIn(ci.id)}
                            className="rounded-md bg-black px-3 py-2 text-sm text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>
    </section>
  );
}

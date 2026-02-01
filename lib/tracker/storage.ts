import type { TrackerState, CheckIn } from "./types";
import { LEGACY_KEYS, STORAGE_KEY } from "./constants";
import { safeParse } from "./utils";

export function loadTrackerState(): TrackerState {
  // current
  const current = safeParse<TrackerState>(localStorage.getItem(STORAGE_KEY));
  if (current) return { resolutions: current.resolutions ?? [], checkIns: current.checkIns ?? [] };

  // legacy
  for (const k of LEGACY_KEYS) {
    const legacy = safeParse<any>(localStorage.getItem(k));
    if (!legacy) continue;

    const legacyResolutions = legacy.resolutions ?? [];
    const legacyCheckIns: CheckIn[] = (legacy.checkIns ?? []).map((ci: any) => ({
      id: String(ci.id),
      createdAt: String(ci.createdAt),
      text: String(ci.text ?? ""),
      resolutionId: ci.resolutionId ? String(ci.resolutionId) : undefined,
      type: ci.type ?? "Daily",
    }));

    return { resolutions: legacyResolutions, checkIns: legacyCheckIns };
  }

  return { resolutions: [], checkIns: [] };
}

export function saveTrackerState(state: TrackerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

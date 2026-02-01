"use client";

import { useTracker } from "@/lib/tracker/useTracker";
import HeaderBar from "./HeaderBar";
import OverallTracker from "./OverallTracker";
import UpdatesSection from "./UpdatesSection";
import ResolutionsSection from "./ResolutionsSection";
import AddResolutionModal from "./AddResolutionModal";
import CheckInModal from "./CheckInModal";

export default function TrackerApp() {
  const t = useTracker();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <HeaderBar onAddResolution={t.openAddResolution} onCheckIn={() => t.openCheckIn()} />

      <OverallTracker overall={t.overall} />

      <UpdatesSection t={t} />

      <ResolutionsSection t={t} />

      {t.isAddResolutionOpen ? <AddResolutionModal t={t} /> : null}
      {t.isCheckInOpen ? <CheckInModal t={t} /> : null}
    </main>
  );
}

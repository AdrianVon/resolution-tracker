"use client";

type Props = {
  onAddResolution: () => void;
  onCheckIn: () => void;
};

export default function HeaderBar({ onAddResolution, onCheckIn }: Props) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resolution Tracker</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Notes stay inside resolutions/tasks. Updates are separate and time-based.
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={onCheckIn} className="rounded-md border px-4 py-2">
          Check In
        </button>
        <button onClick={onAddResolution} className="rounded-md bg-black px-4 py-2 text-white">
          Add Resolution
        </button>
      </div>
    </header>
  );
}

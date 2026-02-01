"use client";

import type { OverallStats } from "@/lib/tracker/types";
import { clamp } from "@/lib/tracker/utils";

type Props = {
  overall: OverallStats;
};

export default function OverallTracker({ overall }: Props) {
  return (
    <section className="mb-8 rounded-lg border p-6">
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-sm text-zinc-600">Overall Tracker</div>
          <div className="mt-1 text-sm text-zinc-600">
            Total goals: <span className="font-medium">{overall.totalGoals}</span>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <div className="text-sm font-semibold">Goal Progress</div>
            <div className="text-sm text-zinc-600">
              {overall.goalCompletion}%{" "}
              <span className="text-xs">
                ({overall.completedGoals}/{overall.totalGoals} goals)
              </span>
            </div>
          </div>
          <div className="mt-2 h-3 w-full rounded-full bg-zinc-100">
            <div
              className="h-3 rounded-full bg-black"
              style={{ width: `${clamp(overall.goalCompletion, 0, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <div className="text-sm font-semibold">Task Progress</div>
            <div className="text-sm text-zinc-600">
              {overall.taskCompletion}%{" "}
              <span className="text-xs">
                ({overall.doneTasks}/{overall.totalTasks} tasks)
              </span>
            </div>
          </div>
          <div className="mt-2 h-3 w-full rounded-full bg-zinc-100">
            <div
              className="h-3 rounded-full bg-black"
              style={{ width: `${clamp(overall.taskCompletion, 0, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

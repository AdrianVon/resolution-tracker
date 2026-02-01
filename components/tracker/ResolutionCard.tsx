"use client";

import type { Resolution, Task, Note } from "@/lib/tracker/types";
import { clamp, formatDateTime, pct } from "@/lib/tracker/utils";

type TrackerHook = any;

function taskLabel(res: Resolution, taskId?: string) {
  if (!taskId) return "General";
  const t = res.tasks.find((x) => x.id === taskId);
  return t ? `Task: ${t.text}` : "Task (deleted)";
}

export default function ResolutionCard({ r, t }: { r: Resolution; t: TrackerHook }) {
  const done = r.tasks.filter((x) => x.done).length;
  const total = r.tasks.length;
  const progress = pct(done, total);
  const nt = t.nextTask(r);

  return (
    <article className="rounded-lg border p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {t.editingResolutionId === r.id ? (
            <div className="w-full">
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={t.editResName}
                onChange={(e: any) => t.setEditResName(e.target.value)}
                placeholder="Resolution name"
              />
              <textarea
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                rows={4}
                value={t.editResDescription}
                onChange={(e: any) => t.setEditResDescription(e.target.value)}
                placeholder="Resolution description (optional)"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={t.cancelEditResolution} className="rounded-md border px-3 py-1 text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => t.saveEditResolution(r.id)}
                  className="rounded-md bg-black px-3 py-1 text-sm text-white"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold">{r.name}</h2>
              {r.description ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{r.description}</p>
              ) : null}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
              {progress}% ({done}/{total})
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
              Priority: {r.priority ?? "AI (later)"}
            </span>
            {r.deadline ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">Deadline: {r.deadline}</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {t.editingResolutionId !== r.id ? (
            <button
              onClick={() => t.startEditResolution(r)}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Edit
            </button>
          ) : null}
          <button
            onClick={() => t.deleteResolution(r.id)}
            className="text-xs text-zinc-500 hover:text-zinc-900"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-zinc-100">
          <div className="h-2 rounded-full bg-black" style={{ width: `${clamp(progress, 0, 100)}%` }} />
        </div>
      </div>

      {/* Next task */}
      <div className="mt-4">
        <div className="text-sm font-semibold">Next task</div>
        {nt ? (
          <div className="mt-1 text-sm text-zinc-700">
            • {nt.text}
            {nt.deadline ? <span className="ml-2 text-xs text-zinc-500">(due {nt.deadline})</span> : null}
          </div>
        ) : (
          <div className="mt-1 text-sm text-zinc-600">All tasks complete 🎉</div>
        )}
      </div>

      {/* Tasks */}
      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-medium">Tasks ({done}/{total})</summary>

        <div className="mt-3 rounded-md border bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Add a new task</div>
            <button
              onClick={() => t.toggleAddTask(r.id)}
              className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-50"
            >
              + Add task
            </button>
          </div>

          {t.addTaskOpenByRes?.[r.id] ? (
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Task name (required)"
                value={t.addTaskTextByRes?.[r.id] ?? ""}
                onChange={(e: any) => t.setAddTaskTextByRes((p: any) => ({ ...p, [r.id]: e.target.value }))}
              />

              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={t.addTaskDeadlineByRes?.[r.id] ?? ""}
                onChange={(e: any) => t.setAddTaskDeadlineByRes((p: any) => ({ ...p, [r.id]: e.target.value }))}
              />

              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
                placeholder="Details (optional)"
                value={t.addTaskDetailsByRes?.[r.id] ?? ""}
                onChange={(e: any) => t.setAddTaskDetailsByRes((p: any) => ({ ...p, [r.id]: e.target.value }))}
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => t.toggleAddTask(r.id)}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => t.addTaskToResolution(r.id)}
                  className="rounded-md bg-black px-3 py-2 text-sm text-white"
                >
                  Add
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <ul className="mt-3 space-y-2">
          {r.tasks.map((task: Task) => {
            const key = `${r.id}:${task.id}`;
            const isEditing = t.editingTaskKey === key;

            return (
              <li key={task.id} className="rounded-md bg-zinc-50 p-3">
                {!isEditing ? (
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => t.toggleTaskDone(r.id, task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className={`text-sm ${task.done ? "line-through text-zinc-500" : ""}`}>
                        {task.text}
                      </div>
                      {task.deadline ? <div className="text-xs text-zinc-500">Due: {task.deadline}</div> : null}
                      {task.details ? (
                        <div className="mt-2 rounded-md border bg-white p-2 text-xs text-zinc-700">
                          <div className="font-semibold text-zinc-600">Details</div>
                          <div className="mt-1 whitespace-pre-wrap">{task.details}</div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => t.startEditTask(r.id, task)}
                        className="text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => t.deleteTask(r.id, task.id)}
                        className="text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="rounded-md border px-3 py-2 text-sm"
                        value={t.editTaskText}
                        onChange={(e: any) => t.setEditTaskText(e.target.value)}
                        placeholder="Task name"
                      />
                      <input
                        type="date"
                        className="rounded-md border px-3 py-2 text-sm"
                        value={t.editTaskDeadline}
                        onChange={(e: any) => t.setEditTaskDeadline(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-600">Details (optional)</label>
                      <textarea
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        rows={3}
                        value={t.editTaskDetails}
                        onChange={(e: any) => t.setEditTaskDetails(e.target.value)}
                        placeholder="Add optional details for this task..."
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button onClick={t.cancelEditTask} className="rounded-md border px-3 py-2 text-sm">
                        Cancel
                      </button>
                      <button
                        onClick={() => t.saveEditTask(r.id, task.id)}
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
      </details>

      {/* Notes dropdown at bottom */}
      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-medium">Notes ({r.notes.length})</summary>

        <div className="mt-3 rounded-md bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Add a note</div>
            <button
              onClick={() => t.toggleNoteBox(r.id)}
              className="rounded-md border bg-white px-3 py-1 text-sm hover:bg-zinc-50"
            >
              + Add note
            </button>
          </div>

          {t.noteOpenByRes?.[r.id] ? (
            <div className="mt-3 space-y-2">
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
                placeholder="Write a note..."
                value={t.noteDraftByRes?.[r.id] ?? ""}
                onChange={(e: any) => t.setNoteDraftByRes((p: any) => ({ ...p, [r.id]: e.target.value }))}
              />

              <div>
                <label className="text-xs text-zinc-600">Attach to a task (optional)</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={t.noteTaskAttachByRes?.[r.id] ?? ""}
                  onChange={(e: any) => t.setNoteTaskAttachByRes((p: any) => ({ ...p, [r.id]: e.target.value }))}
                >
                  <option value="">General (no task)</option>
                  {r.tasks.map((task: Task) => (
                    <option key={task.id} value={task.id}>
                      {task.text}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => t.toggleNoteBox(r.id)} className="rounded-md border px-3 py-2 text-sm">
                  Cancel
                </button>
                <button onClick={() => t.addNote(r.id)} className="rounded-md bg-black px-3 py-2 text-sm text-white">
                  Save note
                </button>
              </div>
            </div>
          ) : null}

          {r.notes.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {r.notes.map((note: Note) => {
                const nKey = `${r.id}:${note.id}`;
                const isEditing = t.editingNoteKey === nKey;

                return (
                  <li key={note.id} className="rounded-md bg-white p-3">
                    {!isEditing ? (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-zinc-600">
                            {taskLabel(r, note.taskId)}
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{note.text}</div>
                          <div className="mt-2 text-xs text-zinc-500">{formatDateTime(note.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => t.startEditNote(r.id, note)}
                            className="text-xs text-zinc-500 hover:text-zinc-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => t.deleteNote(r.id, note.id)}
                            className="text-xs text-zinc-500 hover:text-zinc-900"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-zinc-600">Attach to a task (optional)</label>
                          <select
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            value={t.editNoteTaskId}
                            onChange={(e: any) => t.setEditNoteTaskId(e.target.value)}
                          >
                            <option value="">General (no task)</option>
                            {r.tasks.map((task: Task) => (
                              <option key={task.id} value={task.id}>
                                {task.text}
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          rows={3}
                          value={t.editNoteText}
                          onChange={(e: any) => t.setEditNoteText(e.target.value)}
                        />

                        <div className="flex justify-end gap-2">
                          <button onClick={t.cancelEditNote} className="rounded-md border px-3 py-2 text-sm">
                            Cancel
                          </button>
                          <button
                            onClick={() => t.saveEditNote(r.id, note.id)}
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
          ) : (
            <div className="mt-3 text-sm text-zinc-600">No notes yet.</div>
          )}
        </div>
      </details>
    </article>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

type Note = {
  id: string;
  createdAt: string;
  text: string;
  taskId?: string;
};

type Task = {
  id: string;
  text: string;
  done: boolean;
  deadline?: string; // YYYY-MM-DD
  details?: string; // optional details (set on create/edit)
};

type Resolution = {
  id: string;
  name: string;
  description: string;
  deadline?: string; // YYYY-MM-DD
  tasks: Task[];
  notes: Note[];
  priority?: "Low" | "Medium" | "High";
  createdAt: string;
};

const STORAGE_KEY = "resolution-tracker:v8";

function uid() {
  return crypto.randomUUID();
}

function pct(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function Page() {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create Resolution modal state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [resolutionDeadline, setResolutionDeadline] = useState("");
  const [taskRows, setTaskRows] = useState<Array<{ text: string; deadline: string; details: string }>>([
    { text: "", deadline: "", details: "" },
  ]);

  // Per-resolution: Add Note UI state
  const [noteDraftByRes, setNoteDraftByRes] = useState<Record<string, string>>({});
  const [noteTaskAttachByRes, setNoteTaskAttachByRes] = useState<Record<string, string>>({});
  const [noteOpenByRes, setNoteOpenByRes] = useState<Record<string, boolean>>({});

  // NOTE EDIT state
  const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null); // `${resId}:${noteId}`
  const [editNoteText, setEditNoteText] = useState("");
  const [editNoteTaskId, setEditNoteTaskId] = useState<string>(""); // "" => General

  // Per-resolution: Add Task UI state (AFTER creation)
  const [addTaskOpenByRes, setAddTaskOpenByRes] = useState<Record<string, boolean>>({});
  const [addTaskTextByRes, setAddTaskTextByRes] = useState<Record<string, string>>({});
  const [addTaskDeadlineByRes, setAddTaskDeadlineByRes] = useState<Record<string, string>>({});
  const [addTaskDetailsByRes, setAddTaskDetailsByRes] = useState<Record<string, string>>({});

  // Per-task: Edit UI state
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null); // `${resId}:${taskId}`
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskDeadline, setEditTaskDeadline] = useState("");
  const [editTaskDetails, setEditTaskDetails] = useState("");

  // Per-resolution: Edit UI state (name + description)
  const [editingResolutionId, setEditingResolutionId] = useState<string | null>(null);
  const [editResName, setEditResName] = useState("");
  const [editResDescription, setEditResDescription] = useState("");

  // load/save localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { resolutions: Resolution[] };
      if (parsed?.resolutions) setResolutions(parsed.resolutions);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ resolutions }));
  }, [resolutions]);

  const overall = useMemo(() => {
    const totalGoals = resolutions.length;

    let totalTasks = 0;
    let doneTasks = 0;
    let completedGoals = 0;

    for (const r of resolutions) {
      const tTotal = r.tasks.length;
      const tDone = r.tasks.filter((t) => t.done).length;
      totalTasks += tTotal;
      doneTasks += tDone;
      if (tTotal > 0 && tDone === tTotal) completedGoals += 1;
    }

    return {
      totalGoals,
      completedGoals,
      goalCompletion: pct(completedGoals, totalGoals),
      totalTasks,
      doneTasks,
      taskCompletion: pct(doneTasks, totalTasks),
    };
  }, [resolutions]);

  function resetModal() {
    setName("");
    setDescription("");
    setResolutionDeadline("");
    setTaskRows([{ text: "", deadline: "", details: "" }]);
  }

  function openModal() {
    resetModal();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function addTaskRow() {
    setTaskRows((prev) => [...prev, { text: "", deadline: "", details: "" }]);
  }

  function removeTaskRow(index: number) {
    setTaskRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTaskRow(index: number, key: "text" | "deadline" | "details", value: string) {
    setTaskRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function createResolution() {
    const trimmedName = name.trim();
    const trimmedDesc = description; // preserve newlines

    const tasks: Task[] = taskRows
      .map((row) => ({
        id: uid(),
        text: row.text.trim(),
        done: false,
        deadline: row.deadline.trim() || undefined,
        details: row.details.trim() || undefined,
      }))
      .filter((t) => t.text.length > 0);

    if (!trimmedName) return alert("Resolution Name is required.");
    if (tasks.length === 0) return alert("Add at least 1 task.");

    const newResolution: Resolution = {
      id: uid(),
      name: trimmedName,
      description: trimmedDesc,
      deadline: resolutionDeadline.trim() || undefined,
      tasks,
      notes: [],
      priority: undefined,
      createdAt: new Date().toISOString(),
    };

    setResolutions((prev) => [newResolution, ...prev]);
    closeModal();
  }

  function deleteResolution(resolutionId: string) {
    if (!confirm("Delete this resolution?")) return;
    setResolutions((prev) => prev.filter((r) => r.id !== resolutionId));
    if (editingResolutionId === resolutionId) cancelEditResolution();
    if (editingNoteKey?.startsWith(`${resolutionId}:`)) cancelEditNote();
  }

  function toggleTaskDone(resolutionId: string, taskId: string) {
    setResolutions((prev) =>
      prev.map((r) =>
        r.id !== resolutionId
          ? r
          : { ...r, tasks: r.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
      )
    );
  }

  function nextTask(res: Resolution) {
    const remaining = res.tasks.filter((t) => !t.done);
    if (remaining.length === 0) return null;
    const withDates = remaining.filter((t) => t.deadline);
    if (withDates.length > 0) {
      withDates.sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1));
      return withDates[0];
    }
    return remaining[0];
  }

  // ---------- Notes ----------
  function toggleNoteBox(resId: string) {
    setNoteOpenByRes((prev) => ({ ...prev, [resId]: !prev[resId] }));
  }

  function addNote(resId: string) {
    const text = (noteDraftByRes[resId] ?? "").trim();
    if (!text) return;

    const taskId = (noteTaskAttachByRes[resId] ?? "").trim();
    const note: Note = {
      id: uid(),
      createdAt: new Date().toISOString(),
      text,
      taskId: taskId || undefined,
    };

    setResolutions((prev) => prev.map((r) => (r.id === resId ? { ...r, notes: [note, ...r.notes] } : r)));

    setNoteDraftByRes((prev) => ({ ...prev, [resId]: "" }));
    setNoteTaskAttachByRes((prev) => ({ ...prev, [resId]: "" }));
    setNoteOpenByRes((prev) => ({ ...prev, [resId]: false }));
  }

  function deleteNote(resId: string, noteId: string) {
    setResolutions((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, notes: r.notes.filter((n) => n.id !== noteId) } : r))
    );
    if (editingNoteKey === `${resId}:${noteId}`) cancelEditNote();
  }

  // Note editing
  function startEditNote(resId: string, note: Note) {
    setEditingNoteKey(`${resId}:${note.id}`);
    setEditNoteText(note.text);
    setEditNoteTaskId(note.taskId ?? "");
  }

  function cancelEditNote() {
    setEditingNoteKey(null);
    setEditNoteText("");
    setEditNoteTaskId("");
  }

  function saveEditNote(resId: string, noteId: string) {
    const text = editNoteText.trim();
    if (!text) return alert("Note can't be empty.");

    const taskId = editNoteTaskId.trim();

    setResolutions((prev) =>
      prev.map((r) =>
        r.id !== resId
          ? r
          : {
              ...r,
              notes: r.notes.map((n) =>
                n.id === noteId
                  ? {
                      ...n,
                      text,
                      taskId: taskId ? taskId : undefined,
                    }
                  : n
              ),
            }
      )
    );

    cancelEditNote();
  }

  // ---------- Task editing ----------
  function startEditTask(resId: string, task: Task) {
    setEditingTaskKey(`${resId}:${task.id}`);
    setEditTaskText(task.text);
    setEditTaskDeadline(task.deadline ?? "");
    setEditTaskDetails(task.details ?? "");
  }

  function cancelEditTask() {
    setEditingTaskKey(null);
    setEditTaskText("");
    setEditTaskDeadline("");
    setEditTaskDetails("");
  }

  function saveEditTask(resId: string, taskId: string) {
    const text = editTaskText.trim();
    if (!text) return alert("Task name can't be empty.");

    setResolutions((prev) =>
      prev.map((r) =>
        r.id !== resId
          ? r
          : {
              ...r,
              tasks: r.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      text,
                      deadline: editTaskDeadline.trim() || undefined,
                      details: editTaskDetails.trim() || undefined,
                    }
                  : t
              ),
            }
      )
    );

    cancelEditTask();
  }

  function deleteTask(resId: string, taskId: string) {
    if (!confirm("Delete this task?")) return;

    setResolutions((prev) =>
      prev.map((r) => {
        if (r.id !== resId) return r;
        const updatedNotes = r.notes.map((n) => (n.taskId === taskId ? { ...n, taskId: undefined } : n));
        return { ...r, tasks: r.tasks.filter((t) => t.id !== taskId), notes: updatedNotes };
      })
    );

    // If editing a note attached to this task, keep it open but "General" it
    if (editingNoteKey?.startsWith(`${resId}:`)) {
      // no-op
    }
    if (editingTaskKey === `${resId}:${taskId}`) cancelEditTask();
  }

  // ---------- Resolution editing ----------
  function startEditResolution(r: Resolution) {
    setEditingResolutionId(r.id);
    setEditResName(r.name);
    setEditResDescription(r.description ?? "");
  }

  function cancelEditResolution() {
    setEditingResolutionId(null);
    setEditResName("");
    setEditResDescription("");
  }

  function saveEditResolution(resId: string) {
    const n = editResName.trim();
    if (!n) return alert("Resolution name can't be empty.");

    const d = editResDescription;

    setResolutions((prev) => prev.map((r) => (r.id === resId ? { ...r, name: n, description: d } : r)));
    cancelEditResolution();
  }

  // ---------- Add task AFTER creation ----------
  function toggleAddTask(resId: string) {
    setAddTaskOpenByRes((p) => ({ ...p, [resId]: !p[resId] }));
  }

  function addTaskToResolution(resId: string) {
    const text = (addTaskTextByRes[resId] ?? "").trim();
    if (!text) return alert("Task name is required.");

    const deadline = (addTaskDeadlineByRes[resId] ?? "").trim();
    const details = (addTaskDetailsByRes[resId] ?? "").trim();

    const newTask: Task = {
      id: uid(),
      text,
      done: false,
      deadline: deadline || undefined,
      details: details || undefined,
    };

    setResolutions((prev) => prev.map((r) => (r.id === resId ? { ...r, tasks: [...r.tasks, newTask] } : r)));

    setAddTaskTextByRes((p) => ({ ...p, [resId]: "" }));
    setAddTaskDeadlineByRes((p) => ({ ...p, [resId]: "" }));
    setAddTaskDetailsByRes((p) => ({ ...p, [resId]: "" }));
    setAddTaskOpenByRes((p) => ({ ...p, [resId]: false }));
  }

  function taskLabel(res: Resolution, taskId?: string) {
    if (!taskId) return "General";
    const t = res.tasks.find((x) => x.id === taskId);
    return t ? `Task: ${t.text}` : "Task (deleted)";
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resolution Tracker</h1>
          <p className="mt-2 text-sm text-zinc-600">Notes dropdown now supports edit.</p>
        </div>

        <button onClick={openModal} className="rounded-md bg-black px-4 py-2 text-white">
          Add Resolution
        </button>
      </header>

      {/* Overall tracker */}
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
              <div className="h-3 rounded-full bg-black" style={{ width: `${clamp(overall.goalCompletion, 0, 100)}%` }} />
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
              <div className="h-3 rounded-full bg-black" style={{ width: `${clamp(overall.taskCompletion, 0, 100)}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Snapshots */}
      <section className="grid gap-5 md:grid-cols-2">
        {resolutions.map((r) => {
          const done = r.tasks.filter((t) => t.done).length;
          const total = r.tasks.length;
          const progress = pct(done, total);
          const nt = nextTask(r);

          return (
            <article key={r.id} className="rounded-lg border p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {editingResolutionId === r.id ? (
                    <div className="w-full">
                      <input
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        value={editResName}
                        onChange={(e) => setEditResName(e.target.value)}
                        placeholder="Resolution name"
                      />
                      <textarea
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        rows={4}
                        value={editResDescription}
                        onChange={(e) => setEditResDescription(e.target.value)}
                        placeholder="Resolution description (optional)"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button onClick={cancelEditResolution} className="rounded-md border px-3 py-1 text-sm">
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEditResolution(r.id)}
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
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                        Deadline: {r.deadline}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingResolutionId !== r.id ? (
                    <button
                      onClick={() => startEditResolution(r)}
                      className="text-xs text-zinc-500 hover:text-zinc-900"
                    >
                      Edit
                    </button>
                  ) : null}
                  <button onClick={() => deleteResolution(r.id)} className="text-xs text-zinc-500 hover:text-zinc-900">
                    Delete
                  </button>
                </div>
              </div>

              {/* Progress */}
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

              {/* Tasks (with Add Task after creation) */}
              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-medium">Tasks ({done}/{total})</summary>

                <div className="mt-3 rounded-md border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Add a new task</div>
                    <button
                      onClick={() => toggleAddTask(r.id)}
                      className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-50"
                    >
                      + Add task
                    </button>
                  </div>

                  {addTaskOpenByRes[r.id] ? (
                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Task name (required)"
                        value={addTaskTextByRes[r.id] ?? ""}
                        onChange={(e) => setAddTaskTextByRes((p) => ({ ...p, [r.id]: e.target.value }))}
                      />

                      <input
                        type="date"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        value={addTaskDeadlineByRes[r.id] ?? ""}
                        onChange={(e) => setAddTaskDeadlineByRes((p) => ({ ...p, [r.id]: e.target.value }))}
                      />

                      <textarea
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Details (optional)"
                        value={addTaskDetailsByRes[r.id] ?? ""}
                        onChange={(e) => setAddTaskDetailsByRes((p) => ({ ...p, [r.id]: e.target.value }))}
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAddTaskOpenByRes((p) => ({ ...p, [r.id]: false }))}
                          className="rounded-md border px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => addTaskToResolution(r.id)}
                          className="rounded-md bg-black px-3 py-2 text-sm text-white"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <ul className="mt-3 space-y-2">
                  {r.tasks.map((t) => {
                    const key = `${r.id}:${t.id}`;
                    const isEditing = editingTaskKey === key;

                    return (
                      <li key={t.id} className="rounded-md bg-zinc-50 p-3">
                        {!isEditing ? (
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={t.done}
                              onChange={() => toggleTaskDone(r.id, t.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className={`text-sm ${t.done ? "line-through text-zinc-500" : ""}`}>{t.text}</div>
                              {t.deadline ? <div className="text-xs text-zinc-500">Due: {t.deadline}</div> : null}
                              {t.details ? (
                                <div className="mt-2 rounded-md border bg-white p-2 text-xs text-zinc-700">
                                  <div className="font-semibold text-zinc-600">Details</div>
                                  <div className="mt-1 whitespace-pre-wrap">{t.details}</div>
                                </div>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEditTask(r.id, t)}
                                className="text-xs text-zinc-500 hover:text-zinc-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTask(r.id, t.id)}
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
                                value={editTaskText}
                                onChange={(e) => setEditTaskText(e.target.value)}
                                placeholder="Task name"
                              />
                              <input
                                type="date"
                                className="rounded-md border px-3 py-2 text-sm"
                                value={editTaskDeadline}
                                onChange={(e) => setEditTaskDeadline(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-xs text-zinc-600">Details (optional)</label>
                              <textarea
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                rows={3}
                                value={editTaskDetails}
                                onChange={(e) => setEditTaskDetails(e.target.value)}
                                placeholder="Add optional details for this task..."
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <button onClick={cancelEditTask} className="rounded-md border px-3 py-2 text-sm">
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEditTask(r.id, t.id)}
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

              {/* Notes dropdown at bottom with Edit */}
              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-medium">Notes ({r.notes.length})</summary>

                <div className="mt-3 rounded-md bg-zinc-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Add a note</div>
                    <button
                      onClick={() => toggleNoteBox(r.id)}
                      className="rounded-md border bg-white px-3 py-1 text-sm hover:bg-zinc-50"
                    >
                      + Add note
                    </button>
                  </div>

                  {noteOpenByRes[r.id] ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Write a note..."
                        value={noteDraftByRes[r.id] ?? ""}
                        onChange={(e) => setNoteDraftByRes((p) => ({ ...p, [r.id]: e.target.value }))}
                      />

                      <div>
                        <label className="text-xs text-zinc-600">Attach to a task (optional)</label>
                        <select
                          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                          value={noteTaskAttachByRes[r.id] ?? ""}
                          onChange={(e) => setNoteTaskAttachByRes((p) => ({ ...p, [r.id]: e.target.value }))}
                        >
                          <option value="">General (no task)</option>
                          {r.tasks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.text}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setNoteOpenByRes((p) => ({ ...p, [r.id]: false }))}
                          className="rounded-md border px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                        <button onClick={() => addNote(r.id)} className="rounded-md bg-black px-3 py-2 text-sm text-white">
                          Save note
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {r.notes.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {r.notes.map((n) => {
                        const nKey = `${r.id}:${n.id}`;
                        const isEditing = editingNoteKey === nKey;

                        return (
                          <li key={n.id} className="rounded-md bg-white p-3">
                            {!isEditing ? (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-zinc-600">{taskLabel(r, n.taskId)}</div>
                                  <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{n.text}</div>
                                  <div className="mt-2 text-xs text-zinc-500">{formatDateTime(n.createdAt)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startEditNote(r.id, n)}
                                    className="text-xs text-zinc-500 hover:text-zinc-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteNote(r.id, n.id)}
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
                                    value={editNoteTaskId}
                                    onChange={(e) => setEditNoteTaskId(e.target.value)}
                                  >
                                    <option value="">General (no task)</option>
                                    {r.tasks.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.text}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <textarea
                                  className="w-full rounded-md border px-3 py-2 text-sm"
                                  rows={3}
                                  value={editNoteText}
                                  onChange={(e) => setEditNoteText(e.target.value)}
                                />

                                <div className="flex justify-end gap-2">
                                  <button onClick={cancelEditNote} className="rounded-md border px-3 py-2 text-sm">
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => saveEditNote(r.id, n.id)}
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
        })}
      </section>

      {resolutions.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed p-8 text-center text-sm text-zinc-600">
          No resolutions yet. Click <span className="font-medium">Add Resolution</span> to create your first one.
        </div>
      ) : null}

      {/* Create Resolution Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Add Resolution</h3>
                  <p className="mt-1 text-sm text-zinc-600">Description supports new lines. Tasks can include optional details.</p>
                </div>
                <button onClick={closeModal} className="text-sm text-zinc-600 hover:text-black">
                  Close
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-6 pb-6">
              <div className="grid gap-3">
                <input
                  className="rounded-md border px-3 py-2"
                  placeholder="Resolution Name (required)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <textarea
                  className="rounded-md border px-3 py-2"
                  rows={4}
                  placeholder="Resolution description / why (optional) — Shift+Enter for a new line"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-zinc-600">Resolution deadline (optional)</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={resolutionDeadline}
                      onChange={(e) => setResolutionDeadline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Tasks</div>
                    <button onClick={addTaskRow} className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-50">
                      + Add task
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {taskRows.map((row, idx) => (
                      <div key={idx} className="rounded-md border p-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            className="rounded-md border px-3 py-2"
                            placeholder={`Task #${idx + 1} (required)`}
                            value={row.text}
                            onChange={(e) => updateTaskRow(idx, "text", e.target.value)}
                          />
                          <input
                            type="date"
                            className="rounded-md border px-3 py-2"
                            value={row.deadline}
                            onChange={(e) => updateTaskRow(idx, "deadline", e.target.value)}
                          />
                        </div>

                        <div className="mt-3">
                          <label className="text-xs text-zinc-600">Details (optional)</label>
                          <textarea
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            rows={2}
                            placeholder="Optional details for this task..."
                            value={row.details}
                            onChange={(e) => updateTaskRow(idx, "details", e.target.value)}
                          />
                        </div>

                        {taskRows.length > 1 ? (
                          <button
                            onClick={() => removeTaskRow(idx)}
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
                  <button onClick={closeModal} className="rounded-md border px-4 py-2">
                    Cancel
                  </button>
                  <button onClick={createResolution} className="rounded-md bg-black px-4 py-2 text-white">
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

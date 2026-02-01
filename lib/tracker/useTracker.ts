"use client";

import { useEffect, useMemo, useState } from "react";
import type { CheckIn, CheckInType, Note, OverallStats, Resolution, Task } from "./types";
import { CHECKIN_TEMPLATES } from "./templates";
import { daysSince, pct, uid } from "./utils";
import { loadTrackerState, saveTrackerState } from "./storage";

export function useTracker() {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  // UI state (filters/search)
  const [updatesQuery, setUpdatesQuery] = useState("");
  const [updatesType, setUpdatesType] = useState<"" | CheckInType>("");
  const [updatesResolutionId, setUpdatesResolutionId] = useState<string>("");
  const [resolutionsQuery, setResolutionsQuery] = useState("");

  // Modals
  const [isAddResolutionOpen, setIsAddResolutionOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Add Resolution form state
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftResolutionDeadline, setDraftResolutionDeadline] = useState("");
  const [draftTaskRows, setDraftTaskRows] = useState<Array<{ text: string; deadline: string; details: string }>>([
    { text: "", deadline: "", details: "" },
  ]);

  // Check-in draft
  const [checkInText, setCheckInText] = useState("");
  const [checkInResolutionId, setCheckInResolutionId] = useState<string>("");
  const [checkInType, setCheckInType] = useState<CheckInType>("Daily");

  // Editing IDs
  const [editingResolutionId, setEditingResolutionId] = useState<string | null>(null);
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null); // resId:taskId
  const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null); // resId:noteId
  const [editingCheckInId, setEditingCheckInId] = useState<string | null>(null);

  // Edit buffers
  const [editResName, setEditResName] = useState("");
  const [editResDescription, setEditResDescription] = useState("");

  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskDeadline, setEditTaskDeadline] = useState("");
  const [editTaskDetails, setEditTaskDetails] = useState("");

  const [editNoteText, setEditNoteText] = useState("");
  const [editNoteTaskId, setEditNoteTaskId] = useState("");

  const [editCheckInText, setEditCheckInText] = useState("");
  const [editCheckInResolutionId, setEditCheckInResolutionId] = useState("");
  const [editCheckInType, setEditCheckInType] = useState<CheckInType>("Daily");

  // Per-resolution UI maps
  const [noteOpenByRes, setNoteOpenByRes] = useState<Record<string, boolean>>({});
  const [noteDraftByRes, setNoteDraftByRes] = useState<Record<string, string>>({});
  const [noteTaskAttachByRes, setNoteTaskAttachByRes] = useState<Record<string, string>>({});

  const [addTaskOpenByRes, setAddTaskOpenByRes] = useState<Record<string, boolean>>({});
  const [addTaskTextByRes, setAddTaskTextByRes] = useState<Record<string, string>>({});
  const [addTaskDeadlineByRes, setAddTaskDeadlineByRes] = useState<Record<string, string>>({});
  const [addTaskDetailsByRes, setAddTaskDetailsByRes] = useState<Record<string, string>>({});

  // Load/save
  useEffect(() => {
    const state = loadTrackerState();
    setResolutions(state.resolutions);
    setCheckIns(state.checkIns);
  }, []);

  useEffect(() => {
    saveTrackerState({ resolutions, checkIns });
  }, [resolutions, checkIns]);

  // Derived
  const overall: OverallStats = useMemo(() => {
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

  const latestCheckIn = useMemo(() => (checkIns.length ? checkIns[0] : null), [checkIns]);
  const daysSinceLastCheckIn = useMemo(() => daysSince(latestCheckIn?.createdAt), [latestCheckIn]);

  function resolutionNameById(id?: string) {
    if (!id) return "All (General)";
    const r = resolutions.find((x) => x.id === id);
    return r ? r.name : "Resolution (deleted)";
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

  // Filters
  const filteredCheckIns = useMemo(() => {
    const q = updatesQuery.trim().toLowerCase();
    const t = updatesType;
    const rid = updatesResolutionId;

    return checkIns.filter((ci) => {
      if (t && ci.type !== t) return false;
      if (rid) {
        if (!ci.resolutionId) return false;
        if (ci.resolutionId !== rid) return false;
      }
      if (!q) return true;
      const hay = `${ci.text}\n${ci.type}\n${resolutionNameById(ci.resolutionId)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [checkIns, updatesQuery, updatesType, updatesResolutionId, resolutions]);

  const filteredResolutions = useMemo(() => {
    const q = resolutionsQuery.trim().toLowerCase();
    if (!q) return resolutions;
    return resolutions.filter((r) => (`${r.name}\n${r.description}`).toLowerCase().includes(q));
  }, [resolutions, resolutionsQuery]);

  // Actions: resolutions
  function openAddResolution() {
    setDraftName("");
    setDraftDescription("");
    setDraftResolutionDeadline("");
    setDraftTaskRows([{ text: "", deadline: "", details: "" }]);
    setIsAddResolutionOpen(true);
  }

  function closeAddResolution() {
    setIsAddResolutionOpen(false);
  }

  function addDraftTaskRow() {
    setDraftTaskRows((p) => [...p, { text: "", deadline: "", details: "" }]);
  }

  function removeDraftTaskRow(index: number) {
    setDraftTaskRows((p) => p.filter((_, i) => i !== index));
  }

  function updateDraftTaskRow(index: number, key: "text" | "deadline" | "details", value: string) {
    setDraftTaskRows((p) => p.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function createResolution() {
    const trimmedName = draftName.trim();
    const trimmedDesc = draftDescription;

    const tasks: Task[] = draftTaskRows
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
      deadline: draftResolutionDeadline.trim() || undefined,
      tasks,
      notes: [],
      priority: undefined,
      createdAt: new Date().toISOString(),
    };

    setResolutions((prev) => [newResolution, ...prev]);
    closeAddResolution();
  }

  function deleteResolution(resId: string) {
    if (!confirm("Delete this resolution?")) return;
    setResolutions((p) => p.filter((r) => r.id !== resId));
  }

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

    setResolutions((p) => p.map((r) => (r.id === resId ? { ...r, name: n, description: d } : r)));
    cancelEditResolution();
  }

  // Actions: tasks
  function toggleTaskDone(resId: string, taskId: string) {
    setResolutions((p) =>
      p.map((r) =>
        r.id !== resId ? r : { ...r, tasks: r.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
      )
    );
  }

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

    setResolutions((p) => p.map((r) => (r.id === resId ? { ...r, tasks: [...r.tasks, newTask] } : r)));

    setAddTaskTextByRes((p) => ({ ...p, [resId]: "" }));
    setAddTaskDeadlineByRes((p) => ({ ...p, [resId]: "" }));
    setAddTaskDetailsByRes((p) => ({ ...p, [resId]: "" }));
    setAddTaskOpenByRes((p) => ({ ...p, [resId]: false }));
  }

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

    setResolutions((p) =>
      p.map((r) =>
        r.id !== resId
          ? r
          : {
              ...r,
              tasks: r.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, text, deadline: editTaskDeadline.trim() || undefined, details: editTaskDetails.trim() || undefined }
                  : t
              ),
            }
      )
    );
    cancelEditTask();
  }

  function deleteTask(resId: string, taskId: string) {
    if (!confirm("Delete this task?")) return;

    setResolutions((p) =>
      p.map((r) => {
        if (r.id !== resId) return r;
        const updatedNotes = r.notes.map((n) => (n.taskId === taskId ? { ...n, taskId: undefined } : n));
        return { ...r, tasks: r.tasks.filter((t) => t.id !== taskId), notes: updatedNotes };
      })
    );
  }

  // Actions: notes
  function toggleNoteBox(resId: string) {
    setNoteOpenByRes((p) => ({ ...p, [resId]: !p[resId] }));
  }

  function addNote(resId: string) {
    const text = (noteDraftByRes[resId] ?? "").trim();
    if (!text) return;

    const taskId = (noteTaskAttachByRes[resId] ?? "").trim();
    const note: Note = { id: uid(), createdAt: new Date().toISOString(), text, taskId: taskId || undefined };

    setResolutions((p) => p.map((r) => (r.id === resId ? { ...r, notes: [note, ...r.notes] } : r)));

    setNoteDraftByRes((p) => ({ ...p, [resId]: "" }));
    setNoteTaskAttachByRes((p) => ({ ...p, [resId]: "" }));
    setNoteOpenByRes((p) => ({ ...p, [resId]: false }));
  }

  function deleteNote(resId: string, noteId: string) {
    setResolutions((p) => p.map((r) => (r.id === resId ? { ...r, notes: r.notes.filter((n) => n.id !== noteId) } : r)));
  }

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

    setResolutions((p) =>
      p.map((r) =>
        r.id !== resId
          ? r
          : { ...r, notes: r.notes.map((n) => (n.id === noteId ? { ...n, text, taskId: taskId || undefined } : n)) }
      )
    );

    cancelEditNote();
  }

  // Actions: check-ins
  function openCheckIn(preset?: { type?: CheckInType; resolutionId?: string; text?: string }) {
    setCheckInType(preset?.type ?? "Daily");
    setCheckInResolutionId(preset?.resolutionId ?? "");
    setCheckInText(preset?.text ?? "");
    setIsCheckInOpen(true);
  }

  function closeCheckIn() {
    setIsCheckInOpen(false);
  }

  function applyTemplate(t: CheckInType) {
    setCheckInType(t);
    setCheckInText(CHECKIN_TEMPLATES[t]);
  }

  function addCheckIn() {
    const text = checkInText.trim();
    if (!text) return alert("Write something for your update.");

    const resId = checkInResolutionId.trim();

    const newCheckIn: CheckIn = {
      id: uid(),
      createdAt: new Date().toISOString(),
      text,
      resolutionId: resId ? resId : undefined,
      type: checkInType,
    };

    setCheckIns((p) => [newCheckIn, ...p]);
    closeCheckIn();
  }

  function startEditCheckIn(ci: CheckIn) {
    setEditingCheckInId(ci.id);
    setEditCheckInText(ci.text);
    setEditCheckInResolutionId(ci.resolutionId ?? "");
    setEditCheckInType(ci.type ?? "Daily");
  }

  function cancelEditCheckIn() {
    setEditingCheckInId(null);
    setEditCheckInText("");
    setEditCheckInResolutionId("");
    setEditCheckInType("Daily");
  }

  function saveEditCheckIn(id: string) {
    const text = editCheckInText.trim();
    if (!text) return alert("Update can't be empty.");

    const resId = editCheckInResolutionId.trim();
    const t = editCheckInType;

    setCheckIns((p) => p.map((c) => (c.id === id ? { ...c, text, resolutionId: resId || undefined, type: t } : c)));
    cancelEditCheckIn();
  }

  function deleteCheckIn(id: string) {
    if (!confirm("Delete this update?")) return;
    setCheckIns((p) => p.filter((c) => c.id !== id));
  }

  function clearUpdatesFilters() {
    setUpdatesQuery("");
    setUpdatesType("");
    setUpdatesResolutionId("");
  }

  return {
    // data
    resolutions,
    checkIns,
    overall,
    latestCheckIn,
    daysSinceLastCheckIn,

    // derived
    filteredCheckIns,
    filteredResolutions,

    // UI state
    updatesQuery, updatesType, updatesResolutionId, resolutionsQuery,
    setUpdatesQuery, setUpdatesType, setUpdatesResolutionId, setResolutionsQuery,

    isAddResolutionOpen, isCheckInOpen,
    openAddResolution, closeAddResolution,
    openCheckIn, closeCheckIn,

    // add resolution drafts
    draftName, draftDescription, draftResolutionDeadline, draftTaskRows,
    setDraftName, setDraftDescription, setDraftResolutionDeadline,
    addDraftTaskRow, removeDraftTaskRow, updateDraftTaskRow,
    createResolution,

    // resolution actions
    deleteResolution,
    editingResolutionId, editResName, editResDescription,
    startEditResolution, cancelEditResolution, saveEditResolution,
    setEditResName, setEditResDescription,

    // task actions
    nextTask,
    toggleTaskDone,
    addTaskOpenByRes, addTaskTextByRes, addTaskDeadlineByRes, addTaskDetailsByRes,
    setAddTaskTextByRes, setAddTaskDeadlineByRes, setAddTaskDetailsByRes,
    toggleAddTask, addTaskToResolution,
    editingTaskKey, editTaskText, editTaskDeadline, editTaskDetails,
    startEditTask, cancelEditTask, saveEditTask, deleteTask,
    setEditTaskText, setEditTaskDeadline, setEditTaskDetails,

    // note actions
    noteOpenByRes, noteDraftByRes, noteTaskAttachByRes,
    setNoteDraftByRes, setNoteTaskAttachByRes,
    toggleNoteBox, addNote, deleteNote,
    editingNoteKey, editNoteText, editNoteTaskId,
    startEditNote, cancelEditNote, saveEditNote,
    setEditNoteText, setEditNoteTaskId,

    // check-ins
    checkInText, checkInResolutionId, checkInType,
    setCheckInText, setCheckInResolutionId, setCheckInType,
    applyTemplate, addCheckIn,

    editingCheckInId, editCheckInText, editCheckInResolutionId, editCheckInType,
    startEditCheckIn, cancelEditCheckIn, saveEditCheckIn, deleteCheckIn,
    setEditCheckInText, setEditCheckInResolutionId, setEditCheckInType,

    // helpers
    resolutionNameById,
    clearUpdatesFilters,
  };
}

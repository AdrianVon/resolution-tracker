export type Note = {
  id: string;
  createdAt: string;
  text: string;
  taskId?: string;
};

export type Task = {
  id: string;
  text: string;
  done: boolean;
  deadline?: string; // YYYY-MM-DD
  details?: string; // optional
};

export type Resolution = {
  id: string;
  name: string;
  description: string;
  deadline?: string; // YYYY-MM-DD
  tasks: Task[];
  notes: Note[];
  priority?: "Low" | "Medium" | "High";
  createdAt: string;
};

export type CheckInType = "Daily" | "Weekly" | "Blocked" | "Win" | "Other";

export type CheckIn = {
  id: string;
  createdAt: string;
  text: string;
  resolutionId?: string;
  type: CheckInType;
};

export type TrackerState = {
  resolutions: Resolution[];
  checkIns: CheckIn[];
};

export type OverallStats = {
  totalGoals: number;
  completedGoals: number;
  goalCompletion: number;
  totalTasks: number;
  doneTasks: number;
  taskCompletion: number;
};

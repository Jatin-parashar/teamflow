import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { RequestStatus, type TaskPriority, TaskStatus } from "./types";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import { v4 as uuidv4 } from "uuid";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  assignedTo: string;
  assignedToName: string;
  assignedToEmail: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  completedAt?: string;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  status: RequestStatus;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  status: RequestStatus.IDLE,
  error: null,
};

const generateTaskId = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `TSK-${dateStr}-${uuidv4().slice(0, 8)}`;
};

export const fetchTasks = createAsyncThunk<
  Task[],
  void,
  { rejectValue: string }
>("tasks/fetchTasks", async (_, { rejectWithValue }) => {
  try {
    const data = await firebaseFetch<Record<string, Omit<Task, "id">> | null>(
      "tasks.json"
    );
    if (!data) return [];
    return Object.keys(data).map((key) => ({ id: key, ...data[key] }));
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to fetch tasks"
    );
  }
});

export const fetchTasksByProject = createAsyncThunk<
  Task[],
  string,
  { rejectValue: string }
>("tasks/fetchTasksByProject", async (projectId, { rejectWithValue }) => {
  try {
    const data = await firebaseFetch<Record<string, Omit<Task, "id">> | null>(
      `tasks.json?orderBy="projectId"&equalTo="${encodeURIComponent(projectId)}"`
    );
    if (!data) return [];
    return Object.keys(data).map((key) => ({ id: key, ...data[key] }));
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to fetch tasks"
    );
  }
});

export const fetchTasksByUser = createAsyncThunk<
  Task[],
  string,
  { rejectValue: string }
>("tasks/fetchTasksByUser", async (userId, { rejectWithValue }) => {
  try {
    const data = await firebaseFetch<Record<string, Omit<Task, "id">> | null>(
      `tasks.json?orderBy="assignedTo"&equalTo="${encodeURIComponent(userId)}"`
    );
    if (!data) return [];
    return Object.keys(data).map((key) => ({ id: key, ...data[key] }));
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to fetch tasks"
    );
  }
});

export const fetchTaskById = createAsyncThunk<
  Task,
  string,
  { rejectValue: string }
>("tasks/fetchTaskById", async (taskId, { rejectWithValue }) => {
  try {
    const data = await firebaseFetch<Omit<Task, "id"> | null>(
      `tasks/${taskId}.json`
    );
    if (!data) return rejectWithValue("Task not found");
    return { id: taskId, ...data };
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to fetch task"
    );
  }
});

export const createTask = createAsyncThunk<
  Task,
  Omit<Task, "id" | "createdAt" | "updatedAt">,
  { rejectValue: string }
>("tasks/createTask", async (taskData, { rejectWithValue }) => {
  try {
    const taskId = generateTaskId();
    const now = new Date().toISOString();
    const newTask = { ...taskData, createdAt: now, updatedAt: now };

    await firebaseFetch(`tasks/${taskId}.json`, {
      method: "PUT",
      body: JSON.stringify(newTask),
    });

    return { id: taskId, ...newTask };
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to create task"
    );
  }
});

export const updateTask = createAsyncThunk<
  Task,
  { id: string; updates: Partial<Task> },
  { rejectValue: string }
>("tasks/updateTask", async ({ id, updates }, { rejectWithValue }) => {
  try {
    const updatedData: Partial<Task> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === TaskStatus.DONE && !updates.completedAt) {
      updatedData.completedAt = new Date().toISOString();
    }

    await firebaseFetch(`tasks/${id}.json`, {
      method: "PATCH",
      body: JSON.stringify(updatedData),
    });

    const data = await firebaseFetch<Omit<Task, "id">>(`tasks/${id}.json`);
    return { id, ...data };
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to update task"
    );
  }
});

export const deleteTask = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("tasks/deleteTask", async (taskId, { rejectWithValue }) => {
  try {
    await firebaseFetch(`tasks/${taskId}.json`, { method: "DELETE" });
    return taskId;
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to delete task"
    );
  }
});

export const updateTaskStatus = createAsyncThunk<
  Task,
  { taskId: string; status: TaskStatus },
  { rejectValue: string }
>("tasks/updateTaskStatus", async ({ taskId, status }, { rejectWithValue }) => {
  try {
    const updates: Partial<Task> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === TaskStatus.DONE) {
      updates.completedAt = new Date().toISOString();
    }

    await firebaseFetch(`tasks/${taskId}.json`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    const data = await firebaseFetch<Omit<Task, "id">>(`tasks/${taskId}.json`);
    return { id: taskId, ...data };
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to update task status"
    );
  }
});

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    clearTaskError: (state) => {
      state.error = null;
    },
    optimisticUpdateTaskStatus: (
      state,
      action: PayloadAction<{ taskId: string; status: TaskStatus }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
        task.updatedAt = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = RequestStatus.LOADING;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = RequestStatus.FAILED;
        state.error = action.payload || "Failed to fetch tasks";
      })
      .addCase(fetchTasksByProject.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksByUser.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.tasks = action.payload;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.currentTask = action.payload;
      })
      .addCase(createTask.pending, (state) => {
        state.status = RequestStatus.LOADING;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = RequestStatus.FAILED;
        state.error = action.payload || "Failed to create task";
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) state.tasks[index] = action.payload;
        if (state.currentTask?.id === action.payload.id)
          state.currentTask = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        if (state.currentTask?.id === action.payload) state.currentTask = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) state.tasks[index] = action.payload;
        if (state.currentTask?.id === action.payload.id)
          state.currentTask = action.payload;
      });
  },
});

export const { setCurrentTask, clearTaskError, optimisticUpdateTaskStatus } =
  taskSlice.actions;
export const taskReducer = taskSlice.reducer;

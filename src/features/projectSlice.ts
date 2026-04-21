import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { RequestStatus, type ProjectPriority, type ProjectStatus, type Role } from './types';
import { firebaseFetch } from '@/firebase/firebaseFetch';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  managerId: string;
  managerName: string;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  status: RequestStatus;
  error: string | null;
  lastFetched: number | null;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  status: RequestStatus.IDLE,
  error: null,
  lastFetched: null,
};

const generateProjectId = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `PRJ-${dateStr}-${uuidv4().slice(0, 8)}`;
};

export const fetchProjects = createAsyncThunk<Project[], void, { rejectValue: string }>(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const data = await firebaseFetch<Record<string, Omit<Project, 'id'>> | null>('projects.json');
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk<Project, string, { rejectValue: string }>(
  'projects/fetchProjectById',
  async (projectId, { rejectWithValue }) => {
    try {
      const data = await firebaseFetch<Omit<Project, 'id'> | null>(`projects/${projectId}.json`);
      if (!data) return rejectWithValue('Project not found');
      return { id: projectId, ...data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk<Project, Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, { rejectValue: string }>(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const projectId = generateProjectId();
      const now = new Date().toISOString();
      const newProject = { ...projectData, createdAt: now, updatedAt: now };

      await firebaseFetch(`projects/${projectId}.json`, {
        method: 'PUT',
        body: JSON.stringify(newProject),
      });

      return { id: projectId, ...newProject };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk<Project, { id: string; updates: Partial<Project> }, { rejectValue: string }>(
  'projects/updateProject',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const updatedData = { ...updates, updatedAt: new Date().toISOString() };

      await firebaseFetch(`projects/${id}.json`, {
        method: 'PATCH',
        body: JSON.stringify(updatedData),
      });

      const data = await firebaseFetch<Omit<Project, 'id'>>(`projects/${id}.json`);
      return { id, ...data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk<string, string, { rejectValue: string }>(
  'projects/deleteProject',
  async (projectId, { rejectWithValue }) => {
    try {
      const tasksData = await firebaseFetch<Record<string, any> | null>('tasks.json');

      const updates: Record<string, null> = {
        [`/projects/${projectId}`]: null,
      };

      if (tasksData) {
        Object.keys(tasksData)
          .filter(taskId => tasksData[taskId].projectId === projectId)
          .forEach(taskId => { updates[`/tasks/${taskId}`] = null; });
      }

      await firebaseFetch('.json', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      return projectId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete project');
    }
  }
);

export const addProjectMember = createAsyncThunk<Project, { projectId: string; member: ProjectMember }, { rejectValue: string }>(
  'projects/addProjectMember',
  async ({ projectId, member }, { rejectWithValue }) => {
    try {
      const projectData = await firebaseFetch<Omit<Project, 'id'> | null>(`projects/${projectId}.json`);
      if (!projectData) return rejectWithValue('Project not found');

      const existingMembers = projectData.members || [];
      if (existingMembers.some((m: ProjectMember) => m.userId === member.userId)) {
        return rejectWithValue('Member already exists in this project');
      }

      const updatedMembers = [...existingMembers, member];

      await firebaseFetch(`projects/${projectId}/members.json`, {
        method: 'PUT',
        body: JSON.stringify(updatedMembers),
      });

      return { id: projectId, ...projectData, members: updatedMembers };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add project member');
    }
  }
);

export const removeProjectMember = createAsyncThunk<Project, { projectId: string; userId: string }, { rejectValue: string }>(
  'projects/removeProjectMember',
  async ({ projectId, userId }, { rejectWithValue }) => {
    try {
      const projectData = await firebaseFetch<Omit<Project, 'id'> | null>(`projects/${projectId}.json`);
      if (!projectData) return rejectWithValue('Project not found');

      const updatedMembers = (projectData.members || []).filter((m: ProjectMember) => m.userId !== userId);

      await firebaseFetch(`projects/${projectId}/members.json`, {
        method: 'PUT',
        body: JSON.stringify(updatedMembers),
      });

      return { id: projectId, ...projectData, members: updatedMembers };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove project member');
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    clearProjectError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = RequestStatus.LOADING;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.projects = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = RequestStatus.FAILED;
        state.error = action.payload || 'Failed to fetch projects';
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.status = RequestStatus.LOADING;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.status = RequestStatus.FAILED;
        state.error = action.payload || 'Failed to fetch project';
      })
      .addCase(createProject.pending, (state) => {
        state.status = RequestStatus.LOADING;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.status = RequestStatus.SUCCEEDED;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.status = RequestStatus.FAILED;
        state.error = action.payload || 'Failed to create project';
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.projects[index] = action.payload;
        if (state.currentProject?.id === action.payload.id) state.currentProject = action.payload;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) state.currentProject = null;
      })
      .addCase(addProjectMember.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.projects[index] = action.payload;
        if (state.currentProject?.id === action.payload.id) state.currentProject = action.payload;
      })
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.projects[index] = action.payload;
        if (state.currentProject?.id === action.payload.id) state.currentProject = action.payload;
      });
  },
});

export const { setCurrentProject, clearProjectError } = projectSlice.actions;
export const projectReducer = projectSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Notification {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: "project" | "task" | "user";
  entityName: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      // Keep only latest 50, sorted newest first
      const sorted = [...action.payload].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      state.notifications = sorted.slice(0, 50);
      state.unreadCount = sorted.filter((n) => !n.read).length;
    },
    markAllRead: (state) => {
      state.notifications = state.notifications.map((n) => ({
        ...n,
        read: true,
      }));
      state.unreadCount = 0;
    },
    markOneRead: (state, action: PayloadAction<string>) => {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n && !n.read) {
        n.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  markAllRead,
  markOneRead,
  clearNotifications,
} = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;

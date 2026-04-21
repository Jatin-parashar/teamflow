import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "../features/authSlice";
import { projectReducer } from "@/features/projectSlice";
import { taskReducer } from "@/features/taskSlice";
import { notificationReducer } from "@/features/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    tasks: taskReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

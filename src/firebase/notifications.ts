import {
  ref,
  onValue,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { db } from "./firebase";
import type { AppDispatch } from "@/app/store";
import {
  setNotifications,
  clearNotifications,
  type Notification,
} from "@/features/notificationSlice";

let activeListener: (() => void) | null = null;

export const startNotificationListener = (
  currentUserId: string,
  dispatch: AppDispatch
) => {
  // Clean up any existing listener first
  stopNotificationListener();

  const activityRef = query(
    ref(db, "activity"),
    orderByChild("timestamp"),
    limitToLast(50)
  );

  const unsubscribe = onValue(activityRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      dispatch(setNotifications([]));
      return;
    }

    const notifications: Notification[] = Object.keys(data)
      .map((key) => ({
        id: key,
        ...data[key],
        // Mark as unread if triggered by someone else
        read: data[key].userId === currentUserId,
      }))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 50);

    dispatch(setNotifications(notifications));
  });

  // Store cleanup function
  activeListener = () => {
    unsubscribe();
  };
};

export const stopNotificationListener = () => {
  if (activeListener) {
    activeListener();
    activeListener = null;
  }
};

export const clearNotificationState = (dispatch: AppDispatch) => {
  stopNotificationListener();
  dispatch(clearNotifications());
};

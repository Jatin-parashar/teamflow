import { firebaseFetch } from "./firebaseFetch";
import { v4 as uuidv4 } from "uuid";

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: "project" | "task" | "user";
  entityId: string;
  entityName: string;
  timestamp: string;
}

export async function logActivity(
  userId: string,
  userName: string,
  action: string,
  entityType: ActivityLog["entityType"],
  entityId: string,
  entityName: string
): Promise<void> {
  const id = `ACT-${uuidv4().slice(0, 12)}`;
  const log: Omit<ActivityLog, "id"> = {
    userId,
    userName,
    action,
    entityType,
    entityId,
    entityName,
    timestamp: new Date().toISOString(),
  };

  try {
    await firebaseFetch(`activity/${id}.json`, {
      method: "PUT",
      body: JSON.stringify(log),
    });
  } catch {
    // Audit logging should never block the main operation
  }
}

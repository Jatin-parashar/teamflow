import { firebaseFetch } from "./firebaseFetch";
import { v4 as uuidv4 } from "uuid";
import type { Comment } from "@/features/types";

export async function fetchComments(taskId: string): Promise<Comment[]> {
  const data = await firebaseFetch<Record<string, Omit<Comment, "id">> | null>(
    `comments/${taskId}.json`
  );
  if (!data) return [];
  return Object.keys(data)
    .map((key) => ({ id: key, ...data[key] }))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export async function addComment(
  taskId: string,
  userId: string,
  userName: string,
  text: string
): Promise<Comment> {
  const id = uuidv4().slice(0, 12);
  const comment: Omit<Comment, "id"> = {
    taskId,
    userId,
    userName,
    text,
    createdAt: new Date().toISOString(),
  };

  await firebaseFetch(`comments/${taskId}/${id}.json`, {
    method: "PUT",
    body: JSON.stringify(comment),
  });

  return { id, ...comment };
}

export async function updateComment(
  taskId: string,
  commentId: string,
  text: string
): Promise<void> {
  await firebaseFetch(`comments/${taskId}/${commentId}.json`, {
    method: "PATCH",
    body: JSON.stringify({ text, editedAt: new Date().toISOString() }),
  });
}

export async function deleteComment(
  taskId: string,
  commentId: string
): Promise<void> {
  await firebaseFetch(`comments/${taskId}/${commentId}.json`, {
    method: "DELETE",
  });
}

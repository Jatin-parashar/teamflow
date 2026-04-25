import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";
import { firebaseFetch } from "./firebaseFetch";
import { v4 as uuidv4 } from "uuid";
import type { Attachment } from "@/features/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function fetchAttachments(taskId: string): Promise<Attachment[]> {
  const data = await firebaseFetch<Record<
    string,
    Omit<Attachment, "id">
  > | null>(`attachments/${taskId}.json`);
  if (!data) return [];
  return Object.keys(data)
    .map((key) => ({ id: key, ...data[key] }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function uploadAttachment(
  taskId: string,
  file: File,
  userId: string,
  userName: string
): Promise<Attachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 10MB limit");
  }

  const id = uuidv4().slice(0, 12);
  const storageRef = ref(storage, `attachments/${taskId}/${id}_${file.name}`);

  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);

  const attachment: Omit<Attachment, "id"> = {
    taskId,
    fileName: file.name,
    fileUrl,
    fileSize: file.size,
    contentType: file.type,
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: new Date().toISOString(),
  };

  await firebaseFetch(`attachments/${taskId}/${id}.json`, {
    method: "PUT",
    body: JSON.stringify(attachment),
  });

  return { id, ...attachment };
}

export async function deleteAttachment(
  taskId: string,
  attachment: Attachment
): Promise<void> {
  const storageRef = ref(
    storage,
    `attachments/${taskId}/${attachment.id}_${attachment.fileName}`
  );

  try {
    await deleteObject(storageRef);
  } catch {
    // File may already be deleted from storage
  }

  await firebaseFetch(`attachments/${taskId}/${attachment.id}.json`, {
    method: "DELETE",
  });
}

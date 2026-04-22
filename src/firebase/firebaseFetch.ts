import { auth } from "./firebase";

const BASE_URL = import.meta.env.VITE_FIREBASE_DB_URL;

export async function firebaseFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication required");
  }
  const token = await user.getIdToken();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}/${path}${separator}auth=${token}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error("Request failed. Please try again.");
  }

  return response.json();
}

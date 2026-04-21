import { auth } from "./firebase";

const BASE_URL = import.meta.env.VITE_FIREBASE_DB_URL;

export async function firebaseFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  const separator = path.includes("?") ? "&" : "?";
  const authParam = token ? `${separator}auth=${token}` : "";
  const url = `${BASE_URL}/${path}${authParam}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Firebase request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

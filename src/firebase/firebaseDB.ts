import {
  ref,
  set,
  get,
  child,
  remove,
  update,
  push,
  onValue,
  query,
  orderByChild,
  equalTo,
  type Unsubscribe,
  DataSnapshot,
} from "firebase/database";
import { db } from "./firebase";

export async function writeData(path: string, data: unknown): Promise<void> {
  return await set(ref(db, path), data);
}

export async function fetchData<T = any>(path: string): Promise<T | null> {
  const dbRef = ref(db);
  const snapshot: DataSnapshot = await get(child(dbRef, path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

export function listenForValueEvents<T = any>(
  path: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const dataRef = ref(db, path);

  const unsubscribe = onValue(
    dataRef,
    (snapshot: DataSnapshot) => {
      callback(snapshot.exists() ? (snapshot.val() as T) : null);
    },
    (_error) => {
      // Error handled silently in production
    }
  );

  return unsubscribe;
}

export async function updateData(
  dataPaths: Record<string, any>
): Promise<void> {
  return await update(ref(db), dataPaths);
}

export function deleteData(paths: string | string[]): Promise<void> {
  if (typeof paths === "string") {
    return remove(ref(db, paths));
  }

  if (Array.isArray(paths)) {
    const updates: Record<string, null> = {};
    paths.forEach((path) => {
      updates[path] = null;
    });
    return update(ref(db), updates);
  }

  throw new Error(
    "Invalid input: paths should be a string or an array of strings."
  );
}

export async function appendToListWithKey(
  path: string,
  data: unknown,
  key: string | null = null
): Promise<void> {
  const listRef = ref(db, path);
  const itemRef = key ? ref(db, `${path}/${key}`) : push(listRef);
  return await set(itemRef, data);
}

export async function getItemByField<T = any>(
  path: string,
  field: string,
  value: string | number | boolean
): Promise<T | null> {
  const refPath = ref(db, path);
  const fieldQuery = query(refPath, orderByChild(field), equalTo(value));
  const snapshot: DataSnapshot = await get(fieldQuery);
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

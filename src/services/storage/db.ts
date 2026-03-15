import { openDB } from "idb";

const DB_NAME = "mindwrite-db";
const STORE = "kv";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE);
    }
  },
});

export async function getValue<T>(key: string): Promise<T | null> {
  const db = await dbPromise;
  const value = await db.get(STORE, key);
  return (value as T) ?? null;
}

export async function setValue<T>(key: string, value: T): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE, value, key);
}

export async function removeValue(key: string): Promise<void> {
  const db = await dbPromise;
  await db.delete(STORE, key);
}

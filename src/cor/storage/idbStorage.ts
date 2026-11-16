/**
 * idbStorage.ts — موتور ذخیره‌سازی IndexedDB برای Zustand
 * استاندارد: Zustand persist middleware (StateStorage interface)
 * هدف: جایگزینی localStorage (سقف ۵ مگابایت) با IndexedDB (سقف چند گیگابایت)
 */
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'pm-state';
const DB_VERSION = 1;
const STORE_NAME = 'zustand';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

/** ذخیره یک کلید در IndexedDB */
export async function idbSetItem(name: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, value, name);
}

/** خواندن یک کلید از IndexedDB */
export async function idbGetItem(name: string): Promise<string | null> {
  const db = await getDB();
  const val = await db.get(STORE_NAME, name);
  return val || null;
}

/** حذف یک کلید از IndexedDB */
export async function idbRemoveItem(name: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, name);
}

/**
 * شیء استاندارد برای Zustand persist
 * طبق مستندات Zustand: createJSONStorage(() => storage)
 */
export const zustandIdbStorage = {
  getItem: idbGetItem,
  setItem: idbSetItem,
  removeItem: idbRemoveItem,
};

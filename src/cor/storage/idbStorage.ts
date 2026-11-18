/**
 * idbStorage.ts — موتور ذخیره‌سازی IndexedDB برای Zustand
 * استاندارد: Zustand persist middleware (StateStorage interface)
 * هدف: جایگزینی localStorage (سقف ۵ مگابایت) با IndexedDB (سقف چند گیگابایت)
 */
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'pm-state';
const DB_VERSION = 2;
const STORE_NAME = 'zustand';
const RECORDS_STORE = 'records';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
          // ═══ ۴-ب — store رکورد-محور ═══
          if (!db.objectStoreNames.contains(RECORDS_STORE)) {
            const st = db.createObjectStore(RECORDS_STORE, { keyPath: ['store', 'id'] });
            st.createIndex('by_store', 'store');
            st.createIndex('by_store_date', ['store', 'date']);
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

// ═══ ۴-ب — API رکورد-محور ═══
export async function idbPutRecord(store: string, rec: any): Promise<void> {
  const db = await getDB();
  await db.put(RECORDS_STORE, { store, ...rec });
}

export async function idbDeleteRecord(store: string, id: string): Promise<void> {
  const db = await getDB();
  await db.delete(RECORDS_STORE, [store, id]);
}

export async function idbGetAllRecords<T = any>(store: string): Promise<T[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex(RECORDS_STORE, 'by_store', store);
  return rows.map((r: any) => {
    const { store: _s, ...rest } = r;
    return rest as T;
  });
}

export async function idbCountRecords(store: string): Promise<number> {
  const db = await getDB();
  return db.countFromIndex(RECORDS_STORE, 'by_store', store);
}

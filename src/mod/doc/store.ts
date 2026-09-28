import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'pm-docs';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export interface DocFile {
  id: string;
  name: string;
  type: string;        // MIME type
  size: number;        // bytes
  blob: Blob;
  category: DocCategory;
  linkedType: string;  // flk | hal | ctc | inc | whs | tra | null
  linkedId: string;    // شناسه‌ی رکورد
  tags: string[];
  notes: string;
  uploadedAt: string;  // ISO
}

export type DocCategory = 'image' | 'pdf' | 'audio' | 'video' | 'excel' | 'other';

export const CATEGORY_LABEL: Record<DocCategory, string> = {
  image: 'تصویر',
  pdf: 'PDF',
  audio: 'صدا',
  video: 'ویدیو',
  excel: 'Excel',
  other: 'سایر'
};

export const CATEGORY_ICON: Record<DocCategory, string> = {
  image: '🖼',
  pdf: '📄',
  audio: '🎵',
  video: '🎬',
  excel: '📊',
  other: '📎'
};

export const LINKED_TYPE_LABEL: Record<string, string> = {
  flk: 'گله',
  hal: 'سالن',
  ctc: 'مخاطب',
  inc: 'جوجه‌کشی',
  whs: 'انبار',
  tra: 'معامله',
  none: 'بدون اتصال'
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (dbPromise === null) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('linkedType', 'linkedType');
          store.createIndex('linkedId', 'linkedId');
          store.createIndex('category', 'category');
          store.createIndex('uploadedAt', 'uploadedAt');
        }
      }
    });
  }
  return dbPromise;
}

/** تبدیل MIME به دسته */
export function fileCategory(mime: string, name: string): DocCategory {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'excel';
  return 'other';
}

/** فرمت حجم */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/** افزودن فایل */
export async function addFile(
  file: File,
  category: DocCategory,
  linkedType: string,
  linkedId: string,
  tags: string[],
  notes: string
): Promise<DocFile> {
  const db = await getDB();
  const doc: DocFile = {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    size: file.size,
    blob: file,
    category,
    linkedType: linkedType || 'none',
    linkedId: linkedId || '',
    tags: tags || [],
    notes: notes || '',
    uploadedAt: new Date().toISOString()
  };
  await db.put(STORE_NAME, doc);
  return doc;
}

/** لیست همه فایل‌ها */
export async function listFiles(): Promise<DocFile[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return (all as DocFile[]).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/** فایل‌های یک رکورد */
export async function filesOfLinked(linkedType: string, linkedId: string): Promise<DocFile[]> {
  const db = await getDB();
  const all = await listFiles();
  return all.filter(f => f.linkedType === linkedType && f.linkedId === linkedId);
}

/** حذف فایل */
export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/** حذف چند فایل */
export async function deleteFiles(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all(ids.map(id => tx.store.delete(id)));
  await tx.done;
}

/** حجم کل مصرفی */
export async function totalSize(): Promise<number> {
  const files = await listFiles();
  return files.reduce((a, f) => a + f.size, 0);
}

/** دانلود فایل (ذخیره در گوشی) */
export function downloadFile(doc: DocFile): void {
  const url = URL.createObjectURL(doc.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** باز کردن فایل در تب جدید (پیش‌نمایش) */
export function openFile(doc: DocFile): void {
  const url = URL.createObjectURL(doc.blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** ایجاد URL برای پیش‌نمایش */
export function fileURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

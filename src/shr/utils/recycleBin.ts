/**
 * recycleBin.ts — سبد بازیابی (Recycle Bin) — استاندارد Odoo
 * نگهداری ۳۰ روزه قبل از حذف دائمی
 */
import { safeStorage } from './storage';

const RETENTION_DAYS = 30;
const KEY_PREFIX = 'pm-recycle-';

export interface RecycleBinEntry<T> {
  item: T;
  deletedAt: string;
  expiresAt: string;
}

interface BinStore<T> {
  entries: RecycleBinEntry<T>[];
}

const key = (module: string): string => KEY_PREFIX + module;
const now = (): string => new Date().toISOString();

const computeExpiry = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + RETENTION_DAYS);
  return d.toISOString();
};

const isExpired = <T>(entry: RecycleBinEntry<T>): boolean =>
  new Date(entry.expiresAt).getTime() < Date.now();

const readBin = <T>(module: string): RecycleBinEntry<T>[] => {
  const raw = safeStorage.get(key(module));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BinStore<T>;
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
};

const writeBin = <T>(module: string, entries: RecycleBinEntry<T>[]): void => {
  const store: BinStore<T> = { entries };
  safeStorage.set(key(module), JSON.stringify(store));
};

export function purgeExpired<T>(module: string): number {
  const entries = readBin<T>(module);
  const alive = entries.filter((e) => !isExpired(e));
  const removed = entries.length - alive.length;
  if (removed > 0) writeBin(module, alive);
  return removed;
}

export function saveToRecycleBin<T>(
  module: string,
  item: T,
  idMatcher: (existing: T) => boolean,
): void {
  const entries = readBin<T>(module).filter(
    (e) => !idMatcher(e.item) && !isExpired(e),
  );
  entries.push({
    item,
    deletedAt: now(),
    expiresAt: computeExpiry(),
  });
  writeBin(module, entries);
}

export function listRecycleBin<T>(module: string): RecycleBinEntry<T>[] {
  purgeExpired<T>(module);
  return readBin<T>(module);
}

export function removeFromRecycleBin<T>(
  module: string,
  idMatcher: (item: T) => boolean,
): T | null {
  const entries = readBin<T>(module);
  const idx = entries.findIndex((e) => idMatcher(e.item));
  if (idx === -1) return null;
  const [removed] = entries.splice(idx, 1);
  writeBin(module, entries);
  return removed.item;
}

export function clearRecycleBin(module: string): void {
  safeStorage.remove(key(module));
}

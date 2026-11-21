/**
 * backup.ts — موتور پشتیبان‌گیری و بازیابی
 * استاندارد: ALCOA+ / 21 CFR Part 11
 * اصل: هر داده‌ای که در برنامه هست باید در پشتیبان باشد و برگردد.
 *
 * تغییرات:
 *  - خواندن/نوشتن از طریق rawStore (IDB + LS) — نه فقط localStorage
 *  - APIهای داده‌ای async شدند (IDB مسیر همگام ندارد)
 *  - حجم بر حسب بایت واقعی (UTF-8)
 *  - pm-recycle-tra-deals اضافه شد
 *  - clearAllData() برای پاک‌سازی کامل (LS + IDB)
 */
import { safeStorage } from './storage';
import { rawGet, rawSet, rawRemove, IDB_KEYS } from '../../cor/storage/rawStore';
import { idbRemoveItem } from '../../cor/storage/idbStorage';
import {
  ARCHIVE_STORES,
  exportArchiveRecords,
  importArchiveRecords,
  clearArchive,
  countArchived,
  listFlockSummaries,
  saveFlockSummary,
  clearFlockSummaries,
  migrateFlockSummary,
  type ArchiveRecord,
  type FlockArchiveSummary,
} from '../../cor/storage/historyArchive';

/** کلیدهای پشتیبان‌گیری‌شده */
export const PM_KEYS = [
  'pm-settings',
  ...IDB_KEYS,
  'pm-recycle-tra',
  'pm-recycle-tra-deals',
  'pm-alt',
  'pm-cal-manual',
  'pm-theme',
] as const;

/** کلید IDB برای نسخه‌های پشتیبان خودکار */
export const AUTOBACKUP_IDB_KEY = 'pm-autobackup-list';

/** کلیدهای ویژه در BackupFile.data برای آرشیو سرد */
const BACKUP_KEY_ARCHIVE_LOGS = '__archive_logs';
const BACKUP_KEY_ARCHIVE_SUMMARIES = '__archive_summaries';

export const MODULE_LABELS: Record<string, string> = {
  'pm-settings': 'تنظیمات',
  'pm-brd': 'پرنده و نژاد',
  'pm-hal': 'سالن',
  'pm-ctc': 'مخاطبین',
  'pm-flk': 'گله',
  'pm-inc': 'جوجه‌کشی',
  'pm-egg': 'تخم',
  'pm-dlg': 'ثبت روزانه',
  'pm-whs': 'انبار',
  'pm-fed': 'جیره‌نویسی',
  'pm-tra': 'معاملات',
  'pm-recycle-tra': 'سطل بازیافت معاملات',
  'pm-recycle-tra-deals': 'سطل بازیافت معاملات (جزئیات)',
  'pm-alt': 'هشدارها',
  'pm-cal-manual': 'تقویم دستی',
  'pm-theme': 'تم',
};

export interface BackupFile {
  version: number;
  schemaVersion: number;
  exportedAt: string;
  checksum: string;
  data: Record<string, any>;
}

export interface BackupStats {
  totalKeys: number;
  totalSize: number;
  byModule: { key: string; label: string; size: number; records: number }[];
}

/** حجم واقعی رشته بر حسب بایت (UTF-8) — متن فارسی ۲ بایت است */
export function byteSize(s: string): number {
  try {
    return new TextEncoder().encode(s).length;
  } catch {
    return s.length;
  }
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/** خروجی گرفتن از همه‌ی داده‌ها */
export async function exportAll(): Promise<string> {
  const data: Record<string, any> = {};

  for (const k of PM_KEYS) {
    const raw = await rawGet(k);
    if (!raw) continue;
    try {
      data[k] = JSON.parse(raw);
    } catch {
      data[k] = null;
    }
  }

  // 🆕 آرشیو سرد — همه مخازن ARCHIVE_STORES
  try {
    const archiveByStore: Record<string, ArchiveRecord[]> = {};
    let hasAny = false;
    for (const [, storeName] of Object.entries(ARCHIVE_STORES)) {
      const rows = await exportArchiveRecords(storeName);
      if (rows.length > 0) {
        archiveByStore[storeName] = rows;
        hasAny = true;
      }
    }
    if (hasAny) {
      data[BACKUP_KEY_ARCHIVE_LOGS] = archiveByStore;
    }
    const summaries = await listFlockSummaries();
    if (summaries.length > 0) {
      data[BACKUP_KEY_ARCHIVE_SUMMARIES] = summaries;
    }
  } catch (e) {
    console.warn('[Backup] Failed to export archive:', e);
  }

  const payload: BackupFile = {
    version: 1,
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    checksum: '',
    data,
  };

  const body = JSON.stringify(payload, null, 2);
  payload.checksum = simpleChecksum(body);
  return JSON.stringify(payload, null, 2);
}

/** اعتبارسنجی فایل پشتیبان (همگام — فقط JSON) */
export function validateBackup(jsonText: string): {
  valid: boolean;
  error: string;
  data: BackupFile | null;
} {
  try {
    const parsed = JSON.parse(jsonText);
    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: 'فایل معتبر نیست', data: null };
    }
    if (typeof parsed.version !== 'number') {
      return { valid: false, error: 'نسخه‌ی فایل مشخص نیست', data: null };
    }
    if (typeof parsed.data !== 'object' || parsed.data === null) {
      return { valid: false, error: 'داده‌ها در فایل نیست', data: null };
    }
    return { valid: true, error: '', data: parsed };
  } catch {
    return { valid: false, error: 'فایل JSON معتبر نیست', data: null };
  }
}

/** کلیدهای فایل + کلیدهای شناخته‌شده (سازگاری با پشتیبان قدیمی) */
function collectKeys(backup: BackupFile): string[] {
  const set = new Set<string>(PM_KEYS as readonly string[]);
  for (const k of Object.keys(backup.data || {})) {
    if (k.startsWith('pm-')) set.add(k);
  }
  return Array.from(set);
}

/** وارد کردن داده‌ها */
export async function importAll(
  backup: BackupFile,
  mode: 'replace' | 'merge',
): Promise<{ success: boolean; message: string }> {
  try {
    const keys = collectKeys(backup);
    let written = 0;
    const failed: string[] = [];

    for (const k of keys) {
      const incoming = backup.data[k];
      if (incoming === undefined || incoming === null) continue;

      if (mode === 'replace') {
        const ok = await rawSet(k, JSON.stringify(incoming));
        if (ok) written++;
        else failed.push(k);
      } else {
        const existingRaw = await rawGet(k);
        if (!existingRaw) {
          const ok = await rawSet(k, JSON.stringify(incoming));
          if (ok) written++;
          else failed.push(k);
        } else {
          let existing: any = {};
          try {
            existing = JSON.parse(existingRaw);
          } catch {
            existing = {};
          }
          const merged = mergeZustand(existing, incoming);
          const ok = await rawSet(k, JSON.stringify(merged));
          if (ok) written++;
          else failed.push(k);
        }
      }
    }

    // 🆕 بازیابی آرشیو سرد (همه مخازن + سازگاری با فرمت قدیمی)
    const archiveRaw = backup.data[BACKUP_KEY_ARCHIVE_LOGS];
    if (archiveRaw) {
      try {
        let importedTotal = 0;
        if (Array.isArray(archiveRaw) && archiveRaw.length > 0) {
          if (mode === 'replace') await clearArchive();
          importedTotal += await importArchiveRecords(archiveRaw as ArchiveRecord[], mode);
        } else if (typeof archiveRaw === 'object') {
          for (const [, storeName] of Object.entries(ARCHIVE_STORES)) {
            const rows = (archiveRaw as Record<string, unknown>)[storeName];
            if (!Array.isArray(rows) || rows.length === 0) continue;
            if (mode === 'replace') await clearArchive(storeName);
            importedTotal += await importArchiveRecords(rows as ArchiveRecord[], mode, storeName);
          }
        }
        if (importedTotal > 0) {
          console.info(`[Backup] Imported ${importedTotal} archive records`);
        }
      } catch (e) {
        console.error('[Backup] Failed to import archive:', e);
        failed.push('آرشیو سرد');
      }
    }

    const base = mode === 'replace' ? 'همه‌ی داده‌ها جایگزین شد' : 'داده‌ها ادغام شد';
    if (failed.length) {
      return {
        success: false,
        message: base + ' — اما ' + failed.length + ' بخش ذخیره نشد (' + failed.join(', ') + ')',
      };
    }
    return { success: true, message: base + ' (' + written + ' بخش)' };
  } catch (e: any) {
    return { success: false, message: (e && e.message) || 'خطا در بازیابی' };
  }
}

/** ادغام دو state زوستند — بر اساس id، بدون تکرار */
function mergeZustand(a: any, b: any): any {
  const result = { ...a, state: { ...((a && a.state) || {}) } };
  if (b && b.state) {
    for (const key of Object.keys(b.state)) {
      const av = a && a.state ? a.state[key] : undefined;
      const bv = b.state[key];
      if (Array.isArray(av) && Array.isArray(bv)) {
        const byId: Record<string, any> = {};
        av.concat(bv).forEach((item: any) => {
          if (item && item.id) byId[item.id] = item;
          else byId['tmp-' + Math.random().toString(36).slice(2)] = item;
        });
        result.state[key] = Object.values(byId);
      } else {
        result.state[key] = bv;
      }
    }
  }
  return result;
}

/** آمار حجم و رکوردها (حجم = بایت واقعی) */
export async function getStats(): Promise<BackupStats> {
  const byModule: BackupStats['byModule'] = [];
  let totalSize = 0;
  let totalKeys = 0;

  for (const k of PM_KEYS) {
    const raw = await rawGet(k);
    const size = raw ? byteSize(raw) : 0;
    totalSize += size;
    if (raw) totalKeys++;

    let records = 0;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.state) {
          for (const v of Object.values(parsed.state)) {
            if (Array.isArray(v)) records += v.length;
          }
        }
      } catch {
        /* silent */
      }
    }

    byModule.push({ key: k, label: MODULE_LABELS[k] || k, size, records });
  }

  // 🆕 آمار آرشیو سرد (همه مخازن ARCHIVE_STORES)
  try {
    let archiveCount = 0;
    for (const [, storeName] of Object.entries(ARCHIVE_STORES)) {
      archiveCount += await countArchived(storeName);
    }
    if (archiveCount > 0) {
      // تخمین: هر رکورد آرشیو ~2KB (میانگین بر اساس bench: 4.3KB در RAM با wrapper)
      const estimatedSize = archiveCount * 2000;
      byModule.push({
        key: 'pm-archive',
        label: 'آرشیو سرد',
        size: estimatedSize,
        records: archiveCount,
      });
      totalSize += estimatedSize;
      totalKeys++;
    }
  } catch {
    /* silent */
  }

  return { totalKeys, totalSize, byModule };
}

/** چک‌سام ساده */
function simpleChecksum(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/** دانلود فایل */

export async function shareBackup(jsonText: string): Promise<'shared' | 'downloaded'> {
  const fileName = 'PM-Backup-' + new Date().toISOString().slice(0, 10) + '.json';
  const file = new File([jsonText], fileName, { type: 'application/json' });
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (nav && typeof nav.share === 'function' && (!nav.canShare || nav.canShare({ files: [file] }))) {
    await nav.share({
      title: 'پشتیبان نرم‌افزار مرغداری',
      files: [file],
    });
    return 'shared';
  }
  downloadBackup(jsonText);
  return 'downloaded';
}

export function downloadBackup(jsonText: string): void {
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const stamp =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0') +
    '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0');
  a.href = url;
  a.download = 'PM-Backup-' + stamp + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** خواندن فایل از ورودی */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsText(file);
  });
}

/**
 * پاک‌سازی کامل داده‌ها — LS و IDB با هم.
 * قبلاً فقط کلیدهای pm- در localStorage حذف می‌شد و داده‌های IDB
 * بعد از reload برمی‌گشتند (باگ ۶).
 */
export async function clearAllData(): Promise<void> {
  for (const k of PM_KEYS) {
    await rawRemove(k);
  }

  // هر کلید pm- باقی‌مانده در localStorage (درفت فرم، پشتیبان قدیمی و ...)
  try {
    const lsKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('pm-')) lsKeys.push(k);
    }
    for (const k of lsKeys) safeStorage.remove(k);
  } catch {
    /* silent */
  }

  try {
    await idbRemoveItem(AUTOBACKUP_IDB_KEY);
  } catch {
    /* silent */
  }

  for (const [, storeName] of Object.entries(ARCHIVE_STORES)) {
    try {
      await clearArchive(storeName);
    } catch {
      /* silent */
    }
  }
  try {
    await clearFlockSummaries();
  } catch {
    /* silent */
  }
}

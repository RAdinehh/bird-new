// لیست کلیدهای localStorage پروژه
export const PM_KEYS = [
  'pm-settings',
  'pm-brd',
  'pm-hal',
  'pm-ctc',
  'pm-flk',
  'pm-inc',
  'pm-egg',
  'pm-dlg',
  'pm-whs',
  'pm-fed',
  'pm-tra',
  'pm-alt',
  'pm-theme'
] as const;

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
  'pm-alt': 'هشدارها',
  'pm-theme': 'تم'
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

/** خروجی گرفتن از همه‌ی داده‌ها */
export function exportAll(): string {
  const data: Record<string, any> = {};

  for (const k of PM_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        data[k] = JSON.parse(raw);
      } catch {
        data[k] = null;
      }
    }
  }

  const payload: BackupFile = {
    version: 1,
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    checksum: '',
    data
  };

  const json = JSON.stringify(payload, null, 2);
  payload.checksum = simpleChecksum(json);
  return JSON.stringify(payload, null, 2);
}

/** اعتبارسنجی فایل پشتیبان */
export function validateBackup(jsonText: string): { valid: boolean; error: string; data: BackupFile | null } {
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
  } catch (e: any) {
    return { valid: false, error: 'فایل JSON معتبر نیست', data: null };
  }
}

/** وارد کردن داده‌ها */
export function importAll(backup: BackupFile, mode: 'replace' | 'merge'): { success: boolean; message: string } {
  try {
    for (const k of PM_KEYS) {
      const incoming = backup.data[k];
      if (!incoming) continue;

      if (mode === 'replace') {
        localStorage.setItem(k, JSON.stringify(incoming));
      } else {
        const existingRaw = localStorage.getItem(k);
        if (!existingRaw) {
          localStorage.setItem(k, JSON.stringify(incoming));
        } else {
          const existing = JSON.parse(existingRaw);
          const merged = mergeZustand(existing, incoming);
          localStorage.setItem(k, JSON.stringify(merged));
        }
      }
    }
    return { success: true, message: mode === 'replace' ? 'همه‌ی داده‌ها جایگزین شد' : 'داده‌ها ادغام شد' };
  } catch (e: any) {
    return { success: false, message: e.message || 'خطا در بازیابی' };
  }
}

/** ادغام دو state زوستند */
function mergeZustand(a: any, b: any): any {
  const result = { ...a, state: { ...(a.state || {}) } };
  if (b.state) {
    for (const key of Object.keys(b.state)) {
      const av = a.state?.[key];
      const bv = b.state[key];
      if (Array.isArray(av) && Array.isArray(bv)) {
        // ادغام بر اساس id — بدون تکرار
        const byId: Record<string, any> = {};
        [...av, ...bv].forEach(item => {
          if (item && item.id) byId[item.id] = item;
          else byId[Math.random().toString()] = item;
        });
        result.state[key] = Object.values(byId);
      } else {
        result.state[key] = bv;
      }
    }
  }
  return result;
}

/** آمار حجم و رکوردها */
export function getStats(): BackupStats {
  const byModule: BackupStats['byModule'] = [];
  let totalSize = 0;
  let totalKeys = 0;

  for (const k of PM_KEYS) {
    const raw = localStorage.getItem(k);
    const size = raw ? raw.length : 0;
    totalSize += size;
    if (raw) totalKeys++;

    let records = 0;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.state) {
          for (const v of Object.values(parsed.state)) {
            if (Array.isArray(v)) records += v.length;
          }
        }
      } catch {}
    }

    byModule.push({
      key: k,
      label: MODULE_LABELS[k] || k,
      size,
      records
    });
  }

  return { totalKeys, totalSize, byModule };
}

/** چک‌سام ساده */
function simpleChecksum(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/** دانلود فایل */
export function downloadBackup(jsonText: string): void {
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const stamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + '-' +
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

/** فرمت حجم */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

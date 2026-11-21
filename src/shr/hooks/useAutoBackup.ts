/**
 * useAutoBackup — پشتیبان خودکار
 *
 * نسخه‌های پشتیبان دیگر در localStorage ذخیره نمی‌شوند.
 * قبلاً هر نسخه یک رشته‌ی کامل JSON بود و بعد از ۲–۳ نسخه سهمیه‌ی ۵MB
 * پر می‌شد. حالا در IndexedDB ذخیره می‌شود.
 */
import { useEffect } from 'react';
import { safeStorage } from '../utils/storage';
import { useSet } from '../../mod/set/store';
import { exportAll, AUTOBACKUP_IDB_KEY } from '../utils/backup';
import { getGoogleDriveConfig, uploadBackupToGoogleDrive } from '../utils/googleDriveBackup';
import { idbGetItem, idbSetItem } from '../../cor/storage/idbStorage';

const LAST_KEY = 'pm-autobackup-last';

interface Snapshot {
  at: number;
  data: string;
}

async function readList(): Promise<Snapshot[]> {
  try {
    const raw = await idbGetItem(AUTOBACKUP_IDB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useAutoBackup() {
  const { autoBackup } = useSet();
  const cfg: any = autoBackup || {};
  const enabled = !!cfg.enabled;
  const intervalHours = Number(cfg.intervalHours) || 24;
  const maxVersions = Number(cfg.maxVersions) || 5;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const check = async () => {
      const last = parseInt(safeStorage.get(LAST_KEY) || '0', 10);
      if (Date.now() - last < intervalHours * 3600 * 1000) return;

      try {
        const data = await exportAll();
        if (cancelled) return;

        const list = await readList();
        list.unshift({ at: Date.now(), data });
        while (list.length > maxVersions) list.pop();

        await idbSetItem(AUTOBACKUP_IDB_KEY, JSON.stringify(list));
        safeStorage.set(LAST_KEY, String(Date.now()));
          const driveCfg = getGoogleDriveConfig();
          if (driveCfg.autoSync && driveCfg.clientId) {
            uploadBackupToGoogleDrive(data, false).catch(() => {});
          }
        console.log('[AutoBackup] نسخه‌ی خودکار ذخیره شد');
      } catch (e) {
        console.warn('[AutoBackup] ذخیره‌سازی ناموفق:', e);
      }
    };

    void check();
    const t = setInterval(() => void check(), 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [enabled, intervalHours, maxVersions]);
}

import { useEffect } from 'react';
import { safeStorage } from '../utils/storage';
import { useSet } from '../../mod/set/store';
import { exportAll } from '../utils/backup';

const KEY = 'pm-autobackup-last';
const LIST_KEY = 'pm-autobackup-list';

export function useAutoBackup() {
  const { autoBackup } = useSet();
  useEffect(() => {
    if (!autoBackup?.enabled) return;
    const check = () => {
      const last = parseInt(safeStorage.get(KEY) || '0', 10);
      const interval = (autoBackup.intervalHours || 24) * 3600 * 1000;
      if (Date.now() - last < interval) return;
      try {
        const data = exportAll();
        const list = JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
        list.unshift({ at: Date.now(), data });
        while (list.length > (autoBackup.maxVersions || 5)) list.pop();
        safeStorage.setJSON(LIST_KEY, list);
        safeStorage.set(KEY, String(Date.now()));
        console.log('[AutoBackup] ذخیره شد');
      } catch (e) { /* silent */ }
    };
    check();
    const t = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(t);
  }, [autoBackup?.enabled, autoBackup?.intervalHours, autoBackup?.maxVersions]);
}

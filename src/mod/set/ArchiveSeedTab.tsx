import { useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { Row, RowGrid, MiniStat, Btn } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import {
  archiveLogs, listArchived, purgeArchiveIds, countArchived, ARCHIVE_STORES,
} from '../../cor/storage/historyArchive';

/**
 * ArchiveSeedTab — ابزار موقت برای پر کردن آرشیو با داده مصنوعی.
 * هدف: دیدن UI صفحه /arc در حجم بالا. بعداً حذف می‌شود.
 */

const FLOCKS = ['g1', 'g2', 'g3', 'g4', 'g5'];

function makeLogs(count: number) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const fy = 1403 + (i % 3);
    const fm = String(1 + (i % 12)).padStart(2, '0');
    const fd = String(1 + (i % 28)).padStart(2, '0');
    out.push({
      id: `seed-${i}`,
      flockId: FLOCKS[i % FLOCKS.length],
      date: `${fy}/${fm}/${fd}`,
      eggs: 100 + (i % 50),
      deaths: 0,
      corrections: [],
    });
  }
  return out;
}

export default function ArchiveSeedTab() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [count, setCount] = useState(0);

  const refresh = async () => {
    setCount(await countArchived(ARCHIVE_STORES.dlg));
  };

  const seed = async (n: number) => {
    setBusy(true);
    setMsg('');
    try {
      const res = await archiveLogs(makeLogs(n) as any, { months: 0, reason: 'age' }, ARCHIVE_STORES.dlg);
      setMsg(`✅ ${toFa(res.archivedCount)} لاگ آرشیو شد`);
      await refresh();
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    setMsg('');
    try {
      const rows = await listArchived({ limit: 100000 }, ARCHIVE_STORES.dlg);
      const ids = rows.filter(r => r.id.startsWith('seed-')).map(r => r.id);
      await purgeArchiveIds(ids, ARCHIVE_STORES.dlg);
      setMsg(`🗑 ${toFa(ids.length)} لاگ تستی حذف شد`);
      await refresh();
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <SettingsGroup icon="🧪" title="داده تستی آرشیو" tone="warn" defaultOpen persist={false}>
        <RowGrid>
          <MiniStat label="لاگ در آرشیو" value={toFa(count)} />
          <MiniStat label="گله‌های تستی" value={toFa(FLOCKS.length)} />
        </RowGrid>
        <Row l="وضعیت" v={msg || '—'} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <Btn disabled={busy} onClick={() => void seed(120)}>۱۲۰ لاگ</Btn>
          <Btn disabled={busy} onClick={() => void seed(500)}>۵۰۰ لاگ</Btn>
          <Btn disabled={busy} onClick={() => void seed(2000)}>۲۰۰۰ لاگ</Btn>
          <Btn disabled={busy} onClick={() => void refresh()}>بروزرسانی شمارش</Btn>
          <Btn disabled={busy} onClick={() => void clear()}>🗑 حذف داده تستی</Btn>
        </div>
        <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
          بعد از ساختن داده، به صفحهٔ <b>آرشیو → تب لاگ‌ها</b> برو. برای پاک کردن، دکمهٔ «حذف داده تستی» را بزن.
        </div>
      </SettingsGroup>
    </div>
  );
}

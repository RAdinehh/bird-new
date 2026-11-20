import { useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { Row, RowGrid, MiniStat, Btn } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import {
  archiveLogs,
  listArchived,
  purgeArchiveIds,
  countArchived,
  saveFlockSummary,
  ARCHIVE_STORES,
  type FlockArchiveSummary,
} from '../../cor/storage/historyArchive';
import { useFlk, type Flock } from '../../mod/flk/store';
import { useDlg, type DailyLog } from '../../mod/dlg/store';

/**
 * ArchiveSeedTab — ابزار موقت برای پر کردن آرشیو و سناریوهای مقایسه با داده مصنوعی.
 */

const FLOCKS = ['g1', 'g2', 'g3', 'g4', 'g5'];
const COMP_FLOCK_IDS = ['cmp-seed-1', 'cmp-seed-2', 'cmp-seed-3', 'cmp-seed-active'];

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

function buildComparisonSummaries(): FlockArchiveSummary[] {
  return [
    {
      schemaVersion: 1,
      flockId: 'cmp-seed-1',
      flockName: 'گله تستی ۱ (مرجع ۸۰ روزه)',
      productionType: 'layer',
      firstDate: '1404/10/01',
      lastDate: '1404/12/20',
      archivedAt: Date.now() - 86400000 * 10,
      durationDays: 80,
      logCount: 74,
      totalMortality: 35,
      totalFeedKg: 7800,
      totalEggs: 4950,
      totalBrokenEggs: 85,
      livabilityPct: 96.5,
      fcr: 1.88,
      epef: 315,
      financialMetrics: {
        recordedCost: 15500000,
        recordedRevenue: 24500000,
        recordedNet: 9000000,
        isComplete: true,
      },
    },
    {
      schemaVersion: 1,
      flockId: 'cmp-seed-2',
      flockName: 'گله تستی ۲ (کوتاه ۳۰ روزه - داده جزئی)',
      productionType: 'broiler',
      firstDate: '1405/01/01',
      lastDate: '1405/01/30',
      archivedAt: Date.now() - 86400000 * 5,
      durationDays: 30,
      logCount: 14,
      totalMortality: 28,
      totalFeedKg: 1750,
      totalEggs: 0,
      totalBrokenEggs: 0,
      livabilityPct: 92.0,
      fcr: 1.72,
      epef: 330,
      financialMetrics: {
        recordedCost: 4800000,
        recordedRevenue: 5700000,
        recordedNet: 900000,
        isComplete: false,
      },
    },
    {
      schemaVersion: 1,
      flockId: 'cmp-seed-3',
      flockName: 'گله تستی ۳ (بلند ۱۴۵ روزه)',
      productionType: 'layer',
      firstDate: '1404/05/01',
      lastDate: '1404/09/23',
      archivedAt: Date.now() - 86400000 * 20,
      durationDays: 145,
      logCount: 132,
      totalMortality: 85,
      totalFeedKg: 15600,
      totalEggs: 10200,
      totalBrokenEggs: 140,
      livabilityPct: 95.0,
      fcr: 2.02,
      epef: 298,
      financialMetrics: {
        recordedCost: 29000000,
        recordedRevenue: 43500000,
        recordedNet: 14500000,
        isComplete: true,
      },
    },
  ];
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

  const seedComparisonScenario = async (mode: 'two' | 'threeWithActive') => {
    setBusy(true);
    setMsg('');
    try {
      const allSummaries = buildComparisonSummaries();
      const selectedSummaries = mode === 'two' ? allSummaries.slice(0, 2) : allSummaries;

      for (const s of selectedSummaries) {
        await saveFlockSummary(s);
      }

      const flkState = useFlk.getState();
      const existingFlocks = (flkState.flocks || []).filter(
        (f) => !COMP_FLOCK_IDS.includes(f.id)
      );

      const seededFlocks: Flock[] = [
        {
          id: 'cmp-seed-1',
          name: 'گله تستی ۱ (مرجع ۸۰ روزه)',
          status: 'archived',
          initialCount: 1000,
          currentCount: 965,
          startDate: '1404/10/01',
        } as Flock,
        {
          id: 'cmp-seed-2',
          name: 'گله تستی ۲ (کوتاه ۳۰ روزه - داده جزئی)',
          status: 'archived',
          initialCount: 350,
          currentCount: 322,
          startDate: '1405/01/01',
        } as Flock,
      ];

      if (mode === 'threeWithActive') {
        seededFlocks.push({
          id: 'cmp-seed-3',
          name: 'گله تستی ۳ (بلند ۱۴۵ روزه)',
          status: 'archived',
          initialCount: 1700,
          currentCount: 1615,
          startDate: '1404/05/01',
        } as Flock);

        seededFlocks.push({
          id: 'cmp-seed-active',
          name: 'گله فعال تستی (در حال پرورش)',
          status: 'active',
          initialCount: 800,
          currentCount: 795,
          startDate: '1405/02/01',
        } as Flock);
      }

      useFlk.setState({ flocks: [...existingFlocks, ...seededFlocks] });

      if (mode === 'threeWithActive') {
        const dlgState = useDlg.getState();
        const existingLogs = (dlgState.logs || []).filter(
          (l) => !COMP_FLOCK_IDS.includes(l.flockId)
        );
        const activeLogs: DailyLog[] = [
          {
            id: 'cmp-log-1',
            flockId: 'cmp-seed-active',
            date: '1405/02/02',
            deaths: 3,
            feedKg: 92,
            eggs: 0,
          } as unknown as DailyLog,
          {
            id: 'cmp-log-2',
            flockId: 'cmp-seed-active',
            date: '1405/02/03',
            deaths: 2,
            feedKg: 98,
            eggs: 0,
          } as unknown as DailyLog,
        ];
        useDlg.setState({ logs: [...existingLogs, ...activeLogs] });
      }

      setMsg(
        mode === 'two'
          ? '✅ سناریوی ۲ گله مقایسه آماده شد — به صفحه آرشیو بروید'
          : '✅ سناریوی ۳ گله + گله فعال مقایسه آماده شد — به صفحه آرشیو بروید'
      );
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

      const flkState = useFlk.getState();
      useFlk.setState({
        flocks: (flkState.flocks || []).filter((f) => !COMP_FLOCK_IDS.includes(f.id)),
      });

      const dlgState = useDlg.getState();
      useDlg.setState({
        logs: (dlgState.logs || []).filter((l) => !COMP_FLOCK_IDS.includes(l.flockId)),
      });

      setMsg(`🗑 ${toFa(ids.length)} لاگ و داده‌های تستی مقایسه حذف شد`);
      await refresh();
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <SettingsGroup icon="🧪" title="داده تستی آرشیو و مقایسه" tone="warn" defaultOpen persist={false}>
        <RowGrid>
          <MiniStat label="لاگ در آرشیو" value={toFa(count)} />
          <MiniStat label="گله‌های تستی" value={toFa(FLOCKS.length)} />
        </RowGrid>
        <Row l="وضعیت" v={msg || '—'} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <Btn disabled={busy} onClick={() => void seedComparisonScenario('two')}>مقایسه ۲ گله</Btn>
          <Btn disabled={busy} onClick={() => void seedComparisonScenario('threeWithActive')}>مقایسه ۳ گله + فعال</Btn>
          <Btn disabled={busy} onClick={() => void seed(120)}>۱۲۰ لاگ</Btn>
          <Btn disabled={busy} onClick={() => void seed(500)}>۵۰۰ لاگ</Btn>
          <Btn disabled={busy} onClick={() => void seed(2000)}>۲۰۰۰ لاگ</Btn>
          <Btn disabled={busy} onClick={() => void refresh()}>بروزرسانی شمارش</Btn>
          <Btn disabled={busy} onClick={() => void clear()}>🗑 حذف داده تستی</Btn>
        </div>
        <div style={{ marginTop: 10, fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
          برای تست مقایسه روی گوشی: از <b>تنظیمات → سیستم → داده تستی آرشیو و مقایسه</b> یکی از دکمه‌های «مقایسه ۲ گله» یا «مقایسه ۳ گله + فعال» را بزنید و سپس به صفحهٔ <b>آرشیو</b> بروید.
        </div>
      </SettingsGroup>
    </div>
  );
}

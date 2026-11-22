import { useFormat, getGlobalFormat } from '../../shr/units/useFormat';
import { useEffect, useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { Row, RowGrid, MiniStat, Btn } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { readStorageStats, type StorageStats } from './storageDebug';

/** حجم خوانا — بایت واقعی UTF-8 */
function fmtBytes(b: number): string {
  if (!b) return '۰';
  if (b < 1024) return getGlobalFormat().num(b) + ' بایت';
  if (b < 1048576) return getGlobalFormat().code((b / 1024).toFixed(1)) + ' کیلوبایت';
  return getGlobalFormat().code((b / 1048576).toFixed(2)) + ' مگابایت';
}

export default function StorageDebugTab() {
  const fmt = useFormat();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setStats(await readStorageStats());
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  if (loading && !stats) {
    return (
      <div style={{ padding: 'var(--sp-4)', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
        در حال خواندن از IndexedDB…
      </div>
    );
  }

  if (!stats || !stats.ok) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <SettingsGroup icon="⚠️" title="خطا در خواندن" tone="danger" defaultOpen persist={false}>
          <Row l="پیام" v={stats?.error ?? 'نامشخص'} warn />
          <Btn onClick={() => void load()}>تلاش دوباره</Btn>
        </SettingsGroup>
      </div>
    );
  }

  const years = Object.entries(stats.byYear).sort((a, b) => b[0].localeCompare(a[0]));
  const statuses = Object.entries(stats.byStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      <SettingsGroup icon="📊" title="خلاصهٔ ذخیره‌سازی" tone="accent" defaultOpen persist={false}>
        <RowGrid>
          <MiniStat label="حجم کل IDB" value={fmtBytes(stats.dbBytes)} color="accent" />
          <MiniStat label="حجم pm-dlg" value={fmtBytes(stats.dlgBytes)} color="info" />
          <MiniStat label="تعداد لاگ" value={stats.logCount} color="purple" />
          <MiniStat label="میانگین هر لاگ" value={fmtBytes(stats.avgBytes)} color="warn" />
        </RowGrid>
        <Btn onClick={() => void load()}>🔄 بازخوانی</Btn>
      </SettingsGroup>

      <SettingsGroup icon="📅" title="تفکیک بر اساس سال" tone="info" persist={false}>
        {years.length === 0 ? (
          <Row l="نتیجه" v="لاگی نیست" />
        ) : (
          <RowGrid>
            {years.map(([y, n]) => (
              <Row key={y} l={y} v={fmt.count(n) + ' لاگ'} />
            ))}
          </RowGrid>
        )}
      </SettingsGroup>

      <SettingsGroup icon="🏷" title="وضعیت" tone="purple" persist={false}>
        <RowGrid>
          {statuses.map(([s, n]) => (
            <Row key={s} l={s === 'archived' ? 'آرشیوشده' : 'فعال'} v={fmt.count(n)} />
          ))}
        </RowGrid>
      </SettingsGroup>

      <SettingsGroup icon="🔒" title="لاگ‌های حساس (نباید آرشیو شوند)" tone="warn" persist={false}>
        <RowGrid>
          <Row l="دارای اصلاحات" v={fmt.count(stats.withCorrections)} warn={stats.withCorrections > 0} />
          <Row l="دارای تلفات" v={fmt.count(stats.withDeaths)} warn={stats.withDeaths > 0} />
          <Row l="دارای رویداد" v={fmt.count(stats.withEvents)} />
          <Row l="مجموع رویدادها" v={fmt.count(stats.totalEvents)} />
        </RowGrid>
      </SettingsGroup>

      <SettingsGroup icon="🗄" title="کلیدهای IndexedDB" tone="info" persist={false}>
        <RowGrid>
          {stats.keys.map((k) => (
            <Row key={k.key} l={k.key} v={fmtBytes(k.bytes)} />
          ))}
        </RowGrid>
      </SettingsGroup>

      <SettingsGroup icon="💽" title="سهمیهٔ مرورگر" tone="accent" persist={false}>
        <RowGrid>
          <Row l="استفاده‌شده" v={fmt.code(stats.usageMB.toFixed(2)) + ' مگابایت'} />
          <Row l="سهمیه" v={fmt.code(stats.quotaMB.toFixed(0)) + ' مگابایت'} />
          <Row
            l="درصد"
            v={fmt.code(stats.percent.toFixed(2)) + '٪'}
            warn={stats.percent > 80}
          />
        </RowGrid>
      </SettingsGroup>

    </div>
  );
}

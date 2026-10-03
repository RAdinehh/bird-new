import { useMemo } from 'react';
import { useFlk, getAgeDays } from '../flk/store';
import { useDlg } from '../dlg/store';
import { toFa } from '../../shr/utils/fa';

export default function BenchmarkCard() {
  const { flocks } = useFlk();
  const { logs } = useDlg();

  const rows = useMemo(() => {
    return flocks.map(f => {
      const fLogs = logs.filter(l => l.flockId === f.id);
      const totalFeed = fLogs.reduce((a, l) => a + (l.feedAmount || 0), 0);
      const totalDeaths = fLogs.reduce((a, l) => a + (l.deathsCount || 0), 0);
      const initial = f.initialCount || 0;
      const alive = f.currentCount || initial;
      const mortality = initial > 0 ? (totalDeaths / initial) * 100 : 0;
      const feedPerBird = initial > 0 ? totalFeed / initial : 0;
      const age = getAgeDays(f);
      const status = f.status;
      return { id: f.id, name: f.name, status, age, mortality, feedPerBird, initial };
    }).filter(r => r.initial > 0);
  }, [flocks, logs]);

  if (rows.length < 2) return null;

  const active = rows.filter(r => r.status === 'active');
  const archived = rows.filter(r => r.status !== 'active');

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const activeAvgMort = avg(active.map(r => r.mortality));
  const archAvgMort = avg(archived.map(r => r.mortality));
  const activeAvgFeed = avg(active.map(r => r.feedPerBird));
  const archAvgFeed = avg(archived.map(r => r.feedPerBird));

  const cmpMort = archAvgMort > 0 ? ((activeAvgMort - archAvgMort) / archAvgMort) * 100 : 0;
  const cmpFeed = archAvgFeed > 0 ? ((activeAvgFeed - archAvgFeed) / archAvgFeed) * 100 : 0;

  const Row = ({ label, active, arch, cmp, lowerBetter }: any) => {
    const good = lowerBetter ? cmp < 0 : cmp > 0;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--pad-inner)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)' }}>
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{ direction: 'ltr', width: 70, textAlign: 'center', fontWeight: 600 }}>{toFa(active.toFixed(1))}</span>
        <span style={{ direction: 'ltr', width: 70, textAlign: 'center', color: 'var(--muted)' }}>{toFa(arch.toFixed(1))}</span>
        <span style={{ direction: 'ltr', width: 70, textAlign: 'center', fontWeight: 700, color: good ? 'var(--accent)' : 'var(--danger)' }}>
          {cmp > 0 ? '+' : ''}{toFa(cmp.toFixed(0))}٪
        </span>
      </div>
    );
  };

  return (
    <div style={{ padding: 'var(--pad-card)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>📈 Benchmark — مقایسه گله‌ها</div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
        فعال ({toFa(active.length)}) vs آرشیو ({toFa(archived.length)})
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
        <span style={{ flex: 1 }}>متریک</span>
        <span style={{ width: 70, textAlign: 'center' }}>فعال</span>
        <span style={{ width: 70, textAlign: 'center' }}>آرشیو</span>
        <span style={{ width: 70, textAlign: 'center' }}>تغییر</span>
      </div>
      <Row label="تلفات ٪" active={activeAvgMort} arch={archAvgMort} cmp={cmpMort} lowerBetter />
      <Row label="دان/پرنده (kg)" active={activeAvgFeed} arch={archAvgFeed} cmp={cmpFeed} lowerBetter />
    </div>
  );
}

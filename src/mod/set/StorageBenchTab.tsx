import { useFormat, getGlobalFormat } from '../../shr/units/useFormat';
import { useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { Row, RowGrid, MiniStat, Btn } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { runBench, deleteBenchDb, type BenchRow } from './storageBench';

/** اندازه‌های اندازه‌گیری — پله‌پله، از سبک به سنگین */
const SIZES = [100, 500, 1000, 2000, 5000];

/** حجم خوانا — بایت واقعی UTF-8 */
function fmtBytes(b: number): string {
  if (!b) return '۰';
  if (b < 1024) return getGlobalFormat().num(b) + ' بایت';
  if (b < 1048576) return getGlobalFormat().code((b / 1024).toFixed(1)) + ' کیلوبایت';
  return getGlobalFormat().code((b / 1048576).toFixed(2)) + ' مگابایت';
}

/** زمان خوانا */
function fmtMs(ms: number): string {
  if (ms < 1) return getGlobalFormat().code(ms.toFixed(2)) + ' ms';
  if (ms < 100) return getGlobalFormat().code(ms.toFixed(1)) + ' ms';
  return getGlobalFormat().int(Math.round(ms)) + ' ms';
}

const cell: React.CSSProperties = {
  padding: 'var(--sp-2) var(--sp-2)',
  fontSize: 'var(--fs-sm)',
  textAlign: 'center',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
};

const head: React.CSSProperties = {
  ...cell,
  color: 'var(--muted)',
  fontSize: 'var(--fs-xs)',
  fontWeight: 600,
  borderBottom: '1px solid var(--border-strong, var(--border))',
};

export default function StorageBenchTab() {
  const fmt = useFormat();
  const [rows, setRows] = useState<BenchRow[]>([]);
  const [running, setRunning] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (n: number) => {
    if (running !== null) return;
    setRunning(n);
    setError(null);
    const r = await runBench(n);
    if (r.ok) {
      setRows((prev) => [...prev.filter((x) => x.n !== n), r.row].sort((a, b) => a.n - b.n));
    } else {
      setError(`${fmt.count(n)} لاگ: ${r.error}`);
    }
    setRunning(null);
  };

  const clear = async () => {
    if (running !== null) return;
    await deleteBenchDb();
    setRows([]);
    setError(null);
  };

  const last = rows.length ? rows[rows.length - 1] : null;
  const worst = rows.length
    ? rows.reduce((a, b) => (b.appendMs > a.appendMs ? b : a), rows[0])
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      <SettingsGroup icon="📏" title="اندازه‌گیری" tone="accent" defaultOpen persist={false}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.9 }}>
          لاگ‌های واقعی خودت تکثیر می‌شوند (فقط <code>id</code> عوض می‌شود) و در دیتابیس
          آزمایشی <code>pm-bench</code> نوشته می‌شوند. داده‌های واقعی دست نمی‌خورند و
          <code>pm-bench</code> در پایان هر اجرا پاک می‌شود.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          {SIZES.map((n) => (
            <Btn
              key={n}
              onClick={() => void run(n)}
            >
              {running === n ? '⏳ ' + fmt.count(n) : fmt.count(n) + ' لاگ'}
            </Btn>
          ))}
        </div>

        {running !== null && (
          <Row l="در حال اجرا" v={fmt.count(running) + ' لاگ…'} accent />
        )}

        {error && <Row l="خطا" v={error} warn />}

        <Btn onClick={() => void clear()}>🗑 پاک‌سازی دیتابیس آزمایشی</Btn>
      </SettingsGroup>

      {last && (
        <SettingsGroup icon="🎯" title="شاخص کلیدی" tone="warn" defaultOpen persist={false}>
          <RowGrid>
            <MiniStat
              label="هزینهٔ افزودن یک لاگ"
              value={fmtMs(last.appendMs)}
              color={last.appendMs > 100 ? 'danger' : last.appendMs > 30 ? 'warn' : 'accent'}
            />
            <MiniStat label="در حجم" value={fmtBytes(last.bytes)} color="info" />
            <MiniStat label="تعداد لاگ" value={last.n} color="purple" />
          </RowGrid>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.9 }}>
            «افزودن یک لاگ» = serialize کل آرایه + نوشتن کل آرایه. این عدد مستقل از تعداد
            لاگ‌های جدید نیست؛ با رشد آرایه رشد می‌کند.
          </div>
          {worst && worst.n !== last.n && (
            <Row l="بدترین حالت اندازه‌گیری‌شده" v={fmtMs(worst.appendMs) + ' در ' + fmt.count(worst.n) + ' لاگ'} warn />
          )}
        </SettingsGroup>
      )}

      <SettingsGroup icon="📊" title="نتایج" tone="info" defaultOpen persist={false}>
        {rows.length === 0 ? (
          <Row l="نتیجه" v="هنوز اندازه‌گیری نشده" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={head}>تعداد</th>
                  <th style={head}>حجم</th>
                  <th style={head}>افزودن یک لاگ</th>
                  <th style={head}>serialize</th>
                  <th style={head}>نوشتن</th>
                  <th style={head}>خواندن</th>
                  <th style={head}>parse</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n}>
                    <td style={cell}>{fmt.count(r.n)}</td>
                    <td style={cell}>{fmtBytes(r.bytes)}</td>
                    <td style={{ ...cell, fontWeight: 700, color: 'var(--warn)' }}>
                      {fmtMs(r.appendMs)}
                    </td>
                    <td style={cell}>{fmtMs(r.stringifyMs)}</td>
                    <td style={cell}>{fmtMs(r.putMs)}</td>
                    <td style={cell}>{fmtMs(r.getMs)}</td>
                    <td style={cell}>{fmtMs(r.parseMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsGroup>

    </div>
  );
}

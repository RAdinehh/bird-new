import { useState } from 'react';
import { useFlockValue, KIND_LABEL } from '../../../shr/hooks/useFlockValue';
import QuickPricesModal from '../../../shr/components/QuickPricesModal';
import { formatNumWhileTyping } from '../../../shr/utils/fa';
import { Btn } from '../../../shr/components/ui';
import { Row } from '../helpers';

interface Props { flock: any; }

const fmtInt = (n: number): string => formatNumWhileTyping(String(n)) || '۰';
const fmtDec = (n: number, decimals = 2): string => formatNumWhileTyping(n.toFixed(decimals)) || '۰';

export default function FlockValueSection({ flock }: Props) {
  const [pricesOpen, setPricesOpen] = useState(false);
  const { computeFlockValue } = useFlockValue();
  const result = computeFlockValue(flock);

  const initialCount = Number(flock.initialCount) || 0;
  const currentCount = Number(flock.currentCount) || 0;

  const evDeaths = (flock.events || [])
    .filter((e: any) => e.type === 'death')
    .reduce((s: number, e: any) => s + (Number(e.count) || 0), 0);

  const deaths = evDeaths > 0 ? evDeaths : Math.max(0, initialCount - currentCount);
  const deathsPct = initialCount > 0 ? (deaths / initialCount) * 100 : 0;
  const showDeaths = deaths > 0 && initialCount > 0;

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', display: 'flex', alignItems: 'center', gap: 2 }}>
        📊 ارزش روز گله
        {result.kind && KIND_LABEL[result.kind] && (
          <span style={{ fontSize: 'var(--fs-2xs)', padding: '1px 6px', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 4, fontWeight: 700 }}>{KIND_LABEL[result.kind]}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setPricesOpen(true)}
        title="ویرایش قیمت‌ها"
        style={{
          width: 28, height: 28,
          background: 'var(--btn-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: 'var(--text)',
          fontFamily: 'inherit',
          padding: 0,
        }}
      >✏️</button>
    </div>
  );

  if (result.value === 0) {
    return (
      <>
        {header}
        <div style={{
          padding: 'var(--pad-normal)',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)',
          textAlign: 'center',
          fontSize: 'var(--fs-sm)',
          color: (result.reason || '').includes('نامشخص') || (result.reason || '').includes('نژاد') ? 'var(--warn)' : 'var(--muted)',
        }}>
          {(result.reason || '').includes('نامشخص') || (result.reason || '').includes('نژاد')
            ? `⚠️ ${result.reason}`
            : result.reason === 'قیمت تعریف نشده'
              ? `قیمت «${KIND_LABEL[result.kind] || 'پرنده'}» تعریف نشده — روی ✏️ بزنید`
              : (result.reason || 'نامشخص')}
        </div>
        <QuickPricesModal
          open={pricesOpen}
          onClose={() => setPricesOpen(false)}
          restrictToKinds={result.kind ? [result.kind] : undefined}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)' }}>
        <Row l="وزن تخمینی" v={`${fmtDec(result.weightG! / 1000)} کیلو`} />
        <Row l="قیمت پایه" v={`${fmtInt(result.pricePerKg)} ت/ک`} />
        <Row l="تعداد زنده" v={fmtInt(currentCount)} />
        {showDeaths ? (
          <Row
            l="تلفات"
            v={<span style={{ color: 'var(--danger)' }}>{fmtInt(deaths)} ({fmtDec(deathsPct, 1)}٪)</span>}
          />
        ) : (
          <Row l="تلفات" v="۰" />
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <Row l="ارزش بازار" v={`${fmtInt(result.value)} تومان`} accent />
        </div>
      </div>
      <QuickPricesModal
        open={pricesOpen}
        onClose={() => setPricesOpen(false)}
        restrictToKinds={result.kind ? [result.kind] : undefined}
      />
    </>
  );
}

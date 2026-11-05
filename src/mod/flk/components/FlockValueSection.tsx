import { useState } from 'react';
import { useFlockValue } from '../../../shr/hooks/useFlockValue';
import QuickPricesModal from '../../../shr/components/QuickPricesModal';
import { toFa } from '../../../shr/utils/fa';
import { Btn } from '../../../shr/components/ui';

interface Props { flock: any; }

const cellStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: 'var(--fs-sm)',
  padding: 'var(--pad-tight)',
  background: 'var(--input-bg)',
  borderRadius: 'var(--r-sm)',
  minWidth: 0,
} as const;

export default function FlockValueSection({ flock }: Props) {
  const [pricesOpen, setPricesOpen] = useState(false);
  const { computeFlockValue } = useFlockValue();
  const result = computeFlockValue(flock);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
        📊 ارزش روز گله
      </div>
      <Btn size="sm" variant="outline" onClick={() => setPricesOpen(true)}>✏️</Btn>
    </div>
  );

  if (result.value === 0) {
    return (
      <>
        {header}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-1)' }}>
          <div style={{ ...cellStyle, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{result.reason || 'نامشخص'}</span>
            <Btn size="sm" variant="outline" onClick={() => setPricesOpen(true)}>تنظیم قیمت‌ها</Btn>
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

  return (
    <>
      {header}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)' }}>
        <div style={cellStyle}>
          <span style={{ color: 'var(--muted)' }}>وزن تخمینی:</span>
          <b style={{ fontWeight: 700 }}>{(result.weightG! / 1000).toFixed(2)} کیلو</b>
        </div>
        <div style={cellStyle}>
          <span style={{ color: 'var(--muted)' }}>قیمت پایه:</span>
          <b style={{ fontWeight: 700 }}>{toFa(result.pricePerKg.toLocaleString('fa-IR'))} ت/کیلو</b>
        </div>
        <div style={cellStyle}>
          <span style={{ color: 'var(--muted)' }}>تعداد زنده:</span>
          <b style={{ fontWeight: 700 }}>{toFa((Number(flock.currentCount) || 0).toLocaleString('fa-IR'))}</b>
        </div>
        <div style={{ ...cellStyle, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
          <span style={{ fontWeight: 700 }}>ارزش بازار:</span>
          <b style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 'var(--fs-md)' }}>
            {toFa(result.value.toLocaleString('fa-IR'))} ت
          </b>
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

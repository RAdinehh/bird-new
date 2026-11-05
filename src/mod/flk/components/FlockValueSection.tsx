import { useState } from 'react';
import { useFlockValue } from '../../../shr/hooks/useFlockValue';
import QuickPricesModal from '../../../shr/components/QuickPricesModal';
import { toFa } from '../../../shr/utils/fa';
import { Btn } from '../../../shr/components/ui';

interface Props { flock: any; }

export default function FlockValueSection({ flock }: Props) {
  const [pricesOpen, setPricesOpen] = useState(false);
  const { computeFlockValue } = useFlockValue();
  const result = computeFlockValue(flock);

  if (result.value === 0) {
    return (
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-sm)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>📊 ارزش روز گله</div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 8 }}>
          {result.reason || 'نامشخص'}
        </div>
        <Btn size="sm" variant="outline" onClick={() => setPricesOpen(true)}>✏️ تنظیم قیمت‌ها</Btn>
        <QuickPricesModal
          open={pricesOpen}
          onClose={() => setPricesOpen(false)}
          restrictToKinds={result.kind ? [result.kind] : undefined}
        />
      </div>
    );
  }

  return (
    <div style={{
      padding: 'var(--pad-normal)',
      background: 'var(--accent-soft)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--r-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)' }}>📊 ارزش روز گله</div>
        <Btn size="sm" variant="outline" onClick={() => setPricesOpen(true)}>✏️</Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--fs-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)' }}>وزن تخمینی:</span>
          <b>{(result.weightG! / 1000).toFixed(2)} کیلو</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)' }}>قیمت پایه:</span>
          <b>{toFa(result.pricePerKg.toLocaleString('fa-IR'))} ت/کیلو</b>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          borderTop: '1px dashed var(--border)', paddingTop: 4, marginTop: 4,
        }}>
          <span style={{ fontWeight: 700 }}>ارزش بازار:</span>
          <b style={{ color: 'var(--accent)', fontSize: 'var(--fs-md)' }}>
            {toFa(result.value.toLocaleString('fa-IR'))} ت
          </b>
        </div>
      </div>

      <QuickPricesModal
        open={pricesOpen}
        onClose={() => setPricesOpen(false)}
        restrictToKinds={result.kind ? [result.kind] : undefined}
      />
    </div>
  );
}

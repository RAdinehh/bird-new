import { StatBox, Dot } from '../../../shr/components/ExpandableCard';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  kind: 'sale' | 'purchase';
  totalOpen: number;
  openCount: number;
  overdueCount: number;
  soonCount: number;
}

export default function SummaryBox({ kind, totalOpen, openCount, overdueCount, soonCount }: Props) {
  if (totalOpen <= 0) return null;
  const isSale = kind === 'sale';
  return (
    <div style={{ padding: 'var(--pad-comfy)', background: isSale ? 'var(--accent-soft)' : 'var(--warn-soft)', border: `1px solid ${isSale ? 'var(--accent-border)' : 'var(--warn)'}`, borderRadius: 'var(--r-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: isSale ? 'var(--accent)' : 'var(--warn)' }}>
          {isSale ? 'مجموع طلب' : 'مجموع بدهی'}
        </span>
        <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: isSale ? 'var(--accent)' : 'var(--warn)', fontVariantNumeric: 'tabular-nums' }}>
          {toFa(totalOpen.toLocaleString('fa-IR'))} تومان
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
        <StatBox icon="📋" label="تعداد" value={toFa(openCount)} />
        <Dot />
        <StatBox icon="⏰" label="معوق" value={toFa(overdueCount)} tone={overdueCount > 0 ? 'danger' : 'default'} />
        <Dot />
        <StatBox icon="⏳" label="سرسید" value={toFa(soonCount)} tone={soonCount > 0 ? 'warn' : 'default'} />
      </div>
    </div>
  );
}

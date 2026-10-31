import { StatBox, Dot } from '../../../shr/components/ExpandableCard';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  kind: 'sale' | 'purchase' | 'deal';
  totalOpen: number;
  openCount: number;
  overdueCount: number;
  soonCount: number;
}

export default function SummaryBox({ kind, totalOpen, openCount, overdueCount, soonCount }: Props) {
  if (totalOpen <= 0) return null;
  const isSale = kind === 'sale';
  const isDeal = kind === 'deal';
  const accent = isDeal ? 'var(--purple)' : isSale ? 'var(--accent)' : 'var(--warn)';
  const accentSoft = isDeal ? 'var(--purple-soft, rgba(124,58,237,.12))' : isSale ? 'var(--accent-soft)' : 'var(--warn-soft)';
  const accentBorder = isDeal ? 'var(--purple)' : isSale ? 'var(--accent-border)' : 'var(--warn)';
  const accentLabel = isDeal ? 'مجموع معاملات' : isSale ? 'مجموع طلب' : 'مجموع بدهی';
  return (
    <div style={{ padding: 'var(--pad-comfy)', background: accentSoft, border: `1px solid ${accentBorder}`, borderRadius: 'var(--r-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: accent }}>
          {accentLabel}
        </span>
        <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>
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

import { toFa } from '../../../shr/utils/fa';

interface Props {
  kind: 'sale' | 'purchase' | 'deal';
  totalInvoiced: number;
  totalOpen: number;
  settledAmount: number;
  dueSoonAmount: number;
  openCount: number;
}

export default function SummaryBox({ kind, totalInvoiced, totalOpen, settledAmount, dueSoonAmount, openCount }: Props) {
  if (totalInvoiced <= 0) return null;
  const isSale = kind === 'sale';
  const isDeal = kind === 'deal';
  const accent = isDeal ? 'var(--purple)' : isSale ? 'var(--accent)' : 'var(--warn)';
  const accentSoft = isDeal ? 'var(--purple-soft, rgba(124,58,237,.12))' : isSale ? 'var(--accent-soft)' : 'var(--warn-soft)';
  const accentBorder = isDeal ? 'var(--purple)' : isSale ? 'var(--accent-border)' : 'var(--warn)';
  const accentLabel = isDeal ? 'کل معاملات' : 'کل صورتحساب';

  return (
    <div style={{ padding: '10px 12px', background: accentSoft, border: `1px solid ${accentBorder}`, borderRadius: 'var(--r-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: accent }}>{accentLabel}</span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 400 }}>({toFa(openCount)} {isDeal ? 'قرارداد' : 'فاکتور'})</span>
        </div>
        <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: accent, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {toFa(totalInvoiced.toLocaleString('fa-IR'))} <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--muted)' }}>تومان</span>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', alignItems: 'center', borderTop: '1px solid rgba(148, 163, 184, 0.4)', paddingTop: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1, whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', fontWeight: 500 }}>مانده حساب</span>
          <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', direction: 'ltr', fontSize: 'var(--fs-md)', color: 'var(--warn)' }}>{toFa(totalOpen.toLocaleString('fa-IR'))}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1, whiteSpace: 'nowrap', borderLeft: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', fontWeight: 500 }}>تسویه شده</span>
          <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', direction: 'ltr', fontSize: 'var(--fs-md)', color: 'var(--accent)' }}>{toFa(settledAmount.toLocaleString('fa-IR'))}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1, whiteSpace: 'nowrap', borderLeft: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', fontWeight: 500 }}>نزدیک سرسید</span>
          <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', direction: 'ltr', fontSize: 'var(--fs-md)', color: 'var(--danger)' }}>{toFa(dueSoonAmount.toLocaleString('fa-IR'))}</span>
        </div>
      </div>
    </div>
  );
}

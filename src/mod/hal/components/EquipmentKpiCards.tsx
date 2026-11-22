/**
 * EquipmentKpiCards — ۳ کارت KPI بالای لیست تجهیزات
 * الگو: FOUNDATION-PATTERNS ب۲۲ (KPI Cards)
 */
import { useFormat } from '../../../shr/units/useFormat';

import { toFa } from '../../../shr/utils/fa';

interface Props {
  total: number;
  categories: number;
  totalValue: number;
  needRepair: number;
}

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  tone: 'accent' | 'warn' | 'danger';
}

function KpiCard({ icon, label, value, tone }: KpiCardProps) {
  const color = `var(--${tone})`;
  const soft = tone === 'accent' ? 'var(--accent-soft)' : tone === 'warn' ? 'var(--warn-soft)' : 'var(--danger-soft)';
  return (
    <div style={{
      padding: 'var(--pad-tight)',
      background: 'var(--card-solid)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 22, height: 22,
          borderRadius: 'var(--r-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: soft, color,
          fontSize: 'var(--fs-sm)',
          flexShrink: 0,
        }}>{icon}</span>
        <span style={{
          fontSize: 'var(--fs-2xs)',
          opacity: 0.9,
          color: 'var(--muted)',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: 'var(--fs-sm)',
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{value}</div>
    </div>
  );
}

export default function EquipmentKpiCards({ total, categories, totalValue, needRepair }: Props) {
  const fmt = useFormat();
  if (total === 0) return null;

  const valueText = totalValue >= 1_000_000_000
    ? `${fmt.money(totalValue)}`
    : totalValue >= 1_000_000
      ? `${fmt.money(totalValue)}`
      : `${fmt.money(totalValue)}`;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 'var(--sp-2)',
    }}>
      <KpiCard
        icon="🔧"
        label="کل تجهیزات"
        value={`${fmt.count(total)} مورد در ${fmt.count(categories)} دسته`}
        tone="accent"
      />
      <KpiCard
        icon="💰"
        label="ارزش کل"
        value={valueText}
        tone="accent"
      />
      <KpiCard
        icon={needRepair > 0 ? '🔴' : '🟢'}
        label="نیاز به سرویس"
        value={fmt.count(needRepair)}
        tone={needRepair > 0 ? 'danger' : 'accent'}
      />
    </div>
  );
}

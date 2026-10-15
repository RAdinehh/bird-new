/**
 * FlocksKpiCards — ۳ کارت KPI بالای لیست گله‌ها
 * الگو: FOUNDATION-PATTERNS ب۲۲
 */
import { toFa } from '../../../shr/utils/fa';

interface Props {
  totalFlocks: number;
  totalBirds: number;
  totalValue: number;
}

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  tone: 'accent' | 'purple' | 'info';
}

function KpiCard({ icon, label, value, tone }: KpiCardProps) {
  const color = `var(--${tone})`;
  const soft = tone === 'accent' ? 'var(--accent-soft)' : tone === 'purple' ? 'var(--purple-soft)' : 'var(--info-soft)';
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

export default function FlocksKpiCards({ totalFlocks, totalBirds, totalValue }: Props) {
  if (totalFlocks === 0) return null;

  const valueText = totalValue >= 1_000_000_000
    ? `${toFa((totalValue / 1_000_000_000).toFixed(1))} میلیارد`
    : totalValue >= 1_000_000
      ? `${toFa((totalValue / 1_000_000).toFixed(1))} میلیون`
      : `${toFa(totalValue.toLocaleString('fa-IR'))}`;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 'var(--sp-2)',
    }}>
      <KpiCard
        icon="🐔"
        label="کل گله‌ها"
        value={`${toFa(totalFlocks)} گله`}
        tone="accent"
      />
      <KpiCard
        icon="🥚"
        label="کل پرنده‌ها"
        value={`${toFa(totalBirds)} پرنده`}
        tone="purple"
      />
      <KpiCard
        icon="💰"
        label="ارزش کل"
        value={`${valueText} ت`}
        tone="info"
      />
    </div>
  );
}

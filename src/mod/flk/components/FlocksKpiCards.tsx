/**
 * FlocksKpiCards — ۳ کارت KPI بالای لیست گله‌ها
 * الگو: FOUNDATION-PATTERNS ب۲۲ (KPI Cards)
 */
import { OptionIcon } from '../../../shr/components/OptionIcon';
import { useFormat } from '../../../shr/units/useFormat';

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
  const soft =
    tone === 'accent'
      ? 'var(--accent-soft)'
      : tone === 'purple'
        ? 'var(--purple-soft)'
        : 'var(--info-soft)';

  return (
    <div
      style={{
        padding: 'var(--pad-tight)',
        background: 'var(--card-solid)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--r-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: soft,
            color,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <OptionIcon icon={icon} size={16} />
        </span>
        <span
          style={{
            fontSize: 'var(--fs-2xs)',
            opacity: 0.9,
            color: 'var(--muted)',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 'var(--fs-sm)',
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function FlocksKpiCards({ totalFlocks, totalBirds, totalValue }: Props) {
  const fmt = useFormat();
  if (totalFlocks === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 'var(--sp-2)',
      }}
    >
      <KpiCard
        icon="flocks_group"
        label="کل گله‌ها"
        value={`${fmt.count(totalFlocks)} گله`}
        tone="accent"
      />
      <KpiCard
        icon="flock"
        label="کل پرنده‌ها"
        value={`${fmt.count(totalBirds)} پرنده`}
        tone="purple"
      />
      <KpiCard
        icon="💰"
        label="ارزش کل"
        value={fmt.money(totalValue)}
        tone="info"
      />
    </div>
  );
}

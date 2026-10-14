/**
 * HallEquipCatCard — کارت KPI دسته‌ی تجهیز (۲ ستونه، فشرده)
 * الگو: Big Dutchman BigFarmNet + Material 3 KPI Cards
 */
import { CategoryIcon, CATEGORY_COLORS } from '../../../shr/icons/equipment';
import { getCategoryLabel, getCategorySoft } from '../_typedLabels';
import { toFa } from '../../../shr/utils/fa';

const TONE_COLOR: Record<string, string> = {
  'ok': 'var(--accent)',
  'low': 'var(--warn)',
  'very-low': 'var(--danger)',
  'over': 'var(--purple)',
  'none': 'var(--dim)',
};

const TONE_EMOJI: Record<string, string> = {
  'ok': '🟢', 'low': '🟡', 'very-low': '🔴', 'over': '🟣', 'none': '⚪',
};

interface Props {
  cat: string;
  count: number;
  tone: string;
  pct: number | null;
  onClick: () => void;
}

export default function HallEquipCatCard({ cat, count, tone, pct, onClick }: Props) {
  const label = getCategoryLabel(cat)?.name || cat;
  const color = CATEGORY_COLORS[cat] || 'var(--cat-auxiliary)';
  const soft = getCategorySoft(cat);
  const toneColor = TONE_COLOR[tone] || 'var(--dim)';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 80,
        padding: '10px 12px',
        background: 'var(--card-solid)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: 'inherit',
        cursor: 'pointer',
        textAlign: 'right',
      }}
    >
      {/* Header: آیکون + label + emoji */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 'var(--r-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: soft, color, flexShrink: 0,
        }}>
          <CategoryIcon category={cat} size={15} weight="duotone" color={color} />
        </span>
        <span style={{
          flex: 1,
          fontSize: 'var(--fs-sm)',
          fontWeight: 700,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{label}</span>
        <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>{TONE_EMOJI[tone]}</span>
      </div>

      {/* نوار پیشرفت */}
      <div style={{
        width: '100%',
        height: 5,
        borderRadius: 'var(--r-sm)',
        background: 'var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(pct || 0, 100)}%`,
          height: '100%',
          background: toneColor,
          borderRadius: 'var(--r-sm)',
          transition: 'width .2s',
        }} />
      </div>

      {/* Footer: درصد + تعداد */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 'var(--fs-xs)',
      }}>
        <span style={{
          fontWeight: 700,
          color: toneColor,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pct !== null ? (
            pct <= 100
              ? `${toFa(Math.round(pct))}٪`
              : `${toFa(Math.round((pct / 100) * 10) / 10)}×`
          ) : '—'}
        </span>
        <span style={{ color: 'var(--muted)' }}>
          {toFa(count)} مورد
        </span>
      </div>
    </button>
  );
}

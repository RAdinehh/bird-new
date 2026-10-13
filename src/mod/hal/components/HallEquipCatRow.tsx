/**
 * HallEquipCatRow — یک ردیف دسته‌ی تجهیز (تک‌خطی با نوار پیشرفت)
 */
import { CategoryIcon, CATEGORY_COLORS } from '../../../shr/icons/equipment';
import { getCategoryLabel, getCategorySoft } from '../_typedLabels';
import { CATEGORY_LABELS } from '../store';
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

export default function HallEquipCatRow({ cat, count, tone, pct, onClick }: Props) {
  const label = getCategoryLabel(cat)?.name || cat;
  const color = CATEGORY_COLORS[cat] || 'var(--cat-auxiliary)';
  const soft = getCategorySoft(cat);
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', padding: '10px 12px', minHeight: 46,
      background: 'var(--card-solid)',
      border: 'none', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right',
    }}>
      <span style={{
        width: 30, height: 30, borderRadius: 'var(--r-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: soft, color, flexShrink: 0,
      }}>
        <CategoryIcon category={cat} size={16} weight="duotone" color={color} />
      </span>
      <span style={{
        fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)',
        flexShrink: 0, minWidth: 62,
      }}>{label}</span>
      <div style={{
        flex: 1, height: 5, borderRadius: 'var(--r-sm)',
        background: 'var(--border)', overflow: 'hidden', minWidth: 40,
      }}>
        <div style={{
          width: `${Math.min(pct || 0, 100)}%`, height: '100%',
          background: TONE_COLOR[tone], borderRadius: 'var(--r-sm)',
        }} />
      </div>
      <span style={{
        fontSize: 'var(--fs-xs)', fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: TONE_COLOR[tone],
        minWidth: 40, textAlign: 'left', flexShrink: 0,
      }}>
        {pct !== null ? `${toFa(Math.round(pct))}٪` : '—'}
      </span>
      <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>{TONE_EMOJI[tone]}</span>
    </button>
  );
}

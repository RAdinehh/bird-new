import { useNavigate } from 'react-router-dom';
import { toFa } from '../utils/fa';

type EntityType = 'flock' | 'bird' | 'breed' | 'hall' | 'party' | 'invoice' | 'item' | 'device' | 'log';

const MAP: Record<EntityType, { path: string; icon: string; color: string; tab?: string }> = {
  flock:   { path: '/flk', icon: '🐔', color: 'var(--accent)' },
  bird:    { path: '/brd', icon: '🐣', color: 'var(--purple)', tab: 'birds' },
  breed:   { path: '/brd', icon: '🧬', color: 'var(--purple)', tab: 'breeds' },
  hall:    { path: '/hal', icon: '🏠', color: 'var(--info)' },
  party:   { path: '/ctc', icon: '👤', color: 'var(--warn)' },
  invoice: { path: '/tra', icon: '📄', color: 'var(--info)' },
  item:    { path: '/whs', icon: '📦', color: 'var(--accent)' },
  device:  { path: '/inc', icon: '🥚', color: 'var(--purple)' },
  log:     { path: '/dlg', icon: '📋', color: 'var(--muted)' },
};

interface Props {
  type: EntityType;
  id: string;
  label: string;
  sub?: string;
  /** 🆕 حالت بج (پس‌زمینه رنگی، بدون underline) */
  badge?: boolean;
  /** 🆕 رنگ پس‌زمینه بج */
  badgeBg?: string;
  /** 🆕 رنگ متن بج */
  badgeColor?: string;
}

export default function EntityLink({ type, id, label, sub, badge, badgeBg, badgeColor }: Props) {
  const nav = useNavigate();
  const conf = MAP[type];
  if (!conf || !id) return <span>{label}</span>;

  return (
    <button
      type="button"
      onClick={() => nav(`${conf.path}?${conf.tab ? `tab=${conf.tab}&` : ''}focus=${id}`)}
      aria-label={`برو به ${label}`}
      style={badge ? {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: badgeBg || 'transparent',
        color: badgeColor || conf.color,
        border: 'none',
        fontFamily: 'inherit',
        fontSize: 'var(--fs-xs)',
        fontWeight: 600,
        cursor: 'pointer',
        padding: '4px 10px',
        borderRadius: 6,
      } : {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'transparent',
        border: 'none',
        color: conf.color,
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 600,
        cursor: 'pointer',
        padding: 0,
        textDecoration: 'underline dotted',
        textUnderlineOffset: 3,
      }}
    >
      <span>{conf.icon}</span>
      <span>{label}</span>
      {sub && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {toFa(sub)}</span>}
    </button>
  );
}

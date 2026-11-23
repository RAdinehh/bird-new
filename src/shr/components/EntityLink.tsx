import { getGlobalFormat } from '../units/useFormat';
import { useNavigate } from 'react-router-dom';

export type EntityType =
  | 'flock'
  | 'bird'
  | 'breed'
  | 'hall'
  | 'zone'
  | 'party'
  | 'invoice'
  | 'item'
  | 'device'
  | 'log';

const MAP: Record<EntityType, { path: string; icon: string; tab?: string }> = {
  flock:   { path: '/flk', icon: '🐔' },
  bird:    { path: '/brd', icon: '🐣', tab: 'birds' },
  breed:   { path: '/brd', icon: '🧬', tab: 'breeds' },
  hall:    { path: '/hal', icon: '🏠' },
  zone:    { path: '/hal', icon: '📦', tab: 'zones' },
  party:   { path: '/ctc', icon: '👤' },
  invoice: { path: '/tra', icon: '📄' },
  item:    { path: '/whs', icon: '📦' },
  device:  { path: '/inc', icon: '🥚' },
  log:     { path: '/dlg', icon: '📋' },
};

export function getEntityUrl(
  type: EntityType,
  id: string,
  opts?: { tab?: string; edit?: boolean },
): string {
  const conf = MAP[type];
  if (!conf || !id) return '/';
  const finalTab = opts?.tab || conf.tab;
  const param = opts?.edit ? 'edit' : 'focus';
  return `${conf.path}?${finalTab ? `tab=${finalTab}&` : ''}${param}=${id}${opts?.edit ? `&_t=${Date.now()}` : ''}`;
}

export function useEntityNav() {
  const nav = useNavigate();
  return (type: EntityType, id: string, opts?: { tab?: string; edit?: boolean }) => {
    if (!id) return;
    nav(getEntityUrl(type, id, opts));
  };
}

interface Props {
  type: EntityType;
  id: string;
  label: string;
  sub?: string;
  /** حفظ سازگاری با فراخوانی‌های قبلی — ظاهر همیشه یکپارچه و استاندارد است */
  badge?: boolean;
  badgeBg?: string;
  badgeColor?: string;
  /** بازنویسی تب (برای invoice: sales/purchases) */
  tab?: string;
  /** برای invoice: باز کردن فرم ویرایش (به جای focus) */
  edit?: boolean;
}

export default function EntityLink({
  type,
  id,
  label,
  sub,
  tab,
  edit,
}: Props) {
  const entityNav = useEntityNav();
  const conf = MAP[type];
  if (!conf || !id) return <span>{label}</span>;

  return (
    <button
      type="button"
      className="pm-entity-link"
      onClick={(e) => {
        e.stopPropagation();
        entityNav(type, id, { tab, edit });
      }}
      aria-label={`برو به ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        border: '1px solid var(--accent-border)',
        borderRadius: 8,
        padding: '2px 8px',
        marginInline: 2,
        fontFamily: 'inherit',
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        lineHeight: 1.4,
        textDecoration: 'none',
        cursor: 'pointer',
        verticalAlign: 'middle',
        maxWidth: '100%',
        transition: 'background-color 0.15s ease, transform 0.1s ease',
      }}
    >
      <span style={{ fontSize: '1.05em', lineHeight: 1, flexShrink: 0 }}>{conf.icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {sub && (
        <span style={{ color: 'var(--muted)', fontWeight: 500, flexShrink: 0 }}>
          · {getGlobalFormat().code(sub)}
        </span>
      )}
      <span aria-hidden="true" style={{ fontSize: '0.85em', opacity: 0.75, lineHeight: 1, flexShrink: 0 }}>↗</span>
    </button>
  );
}

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
        gap: 4,
        background: 'transparent',
        color: 'var(--accent)',
        border: 'none',
        padding: 0,
        marginInline: 2,
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 600,
        lineHeight: 1.4,
        textDecoration: 'underline dotted',
        textUnderlineOffset: 3,
        cursor: 'pointer',
        verticalAlign: 'baseline',
        maxWidth: '100%',
      }}
    >
      <span style={{ fontSize: '1.05em', lineHeight: 1, flexShrink: 0 }}>{conf.icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {sub && (
        <span style={{ color: 'var(--muted)', fontWeight: 500, flexShrink: 0 }}>
          · {getGlobalFormat().code(sub)}
        </span>
      )}
    </button>
  );
}

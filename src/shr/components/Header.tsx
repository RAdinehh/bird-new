import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../cor/store/theme';
import { useUI } from '../../cor/store/ui';
import { useAlt, countByLevel } from '../../mod/alt/store';
import { useTra } from '../../mod/tra/store';
import { toFa } from '../utils/fa';

export default function Header({ title }: { title: string }) {
  const { theme, toggle } = useTheme();
  const { openMenu, openHelp } = useUI();
  const nav = useNavigate();
  const alerts = useAlt(s => s.alerts);
  const invoices = useTra(s => s.invoices);
  const counts = countByLevel(alerts);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const dueSoon = (invoices || []).filter(inv => {
    if (!inv.dueDate) return false;
    if (inv.workflowStatus === 'paid') return false;
    try {
      const [y, m, d] = inv.dueDate.split('/').map(Number);
      const due = new Date(y, m - 1, d);
      return due >= today && due <= in7Days;
    } catch { return false; }
  }).length;

  const IconBtn = ({ onClick, children, badge, badgeColor }: any) => (
    <button
      onClick={onClick}
      style={{
        width: 34, height: 34,
        borderRadius: 'var(--r-md)',
        background: 'var(--btn-bg)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--muted)', cursor: 'pointer',
        position: 'relative', flexShrink: 0,
        padding: 0
      }}
    >
      {children}
      {badge ? (
        <span style={{
          position: 'absolute', top: -3, left: -3,
          background: badgeColor || 'var(--danger)', color: '#fff',
          fontSize: 9, fontWeight: 700,
          minWidth: 15, height: 15, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px',
          border: '2px solid var(--bg)'
        }}>{badge}</span>
      ) : null}
    </button>
  );

  return (
    <header style={{
      position: 'sticky', top: 0,
      background: 'var(--header-bg)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border)',
      padding: '9px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
      zIndex: 12
    }}>
      <IconBtn onClick={openMenu}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </IconBtn>

      <h1 style={{
        fontSize: 'var(--fs-lg)', fontWeight: 700,
        flex: 1, margin: 0,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>{title}</h1>

      <IconBtn onClick={openHelp}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </IconBtn>

      <IconBtn onClick={toggle}>
        {theme === 'light' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
      </IconBtn>

      <IconBtn
        onClick={() => nav('/alt')}
        badge={(counts.total + dueSoon) > 0 ? toFa(counts.total + dueSoon) : null}
        badgeColor={counts.critical > 0 ? 'var(--danger)' : dueSoon > 0 ? 'var(--warn)' : 'var(--info)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </IconBtn>
    </header>
  );
}

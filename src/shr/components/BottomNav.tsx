import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSet, MODULE_LABELS } from '../../mod/set/store';

const ICONS: Record<string, string> = {
  dsh: 'M3 11.5 12 3l9 8.5 M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10',
  dlg: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 3h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M9 14l2 2 4-4',
  flk: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2 M16 5a4 4 0 0 1 0 8 M21 21v-2a4 4 0 0 0-3-3.87',
  inc: 'M20 7h-9 M14 17H5 M20 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M10 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  egg: 'M12 3a9 9 0 0 0-9 9 9 9 0 0 0 18 0 9 9 0 0 0-9-9z',
  rep: 'M3 3v18h18 M7 14V9 M11 14V5 M15 14v-3 M19 14v-7',
  set: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  whs: 'M21 8v13H3V8 M1 3h22v5H1z M10 12h4',
  fed: 'M12 2v20 M5 8h14 M5 16h14',
  tra: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  alt: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
  arc: 'M21 8v13H3V8 M1 3h22v5H1z',
  cal: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
  brd: 'M12 2v20 M5 8h14 M5 16h14',
  hal: 'M3 3h18v18H3z M3 9h18 M9 21V9',
  ctc: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
};

const PATHS: Record<string, string> = {
  dsh: '/', brd: '/brd', hal: '/hal', ctc: '/ctc', flk: '/flk',
  inc: '/inc', egg: '/egg', dlg: '/dlg', whs: '/whs', fed: '/fed',
  tra: '/tra', rep: '/rep', alt: '/alt', arc: '/arc', set: '/set',
  cal: '/cal', doc: '/doc'
};

const DEFAULT_NAV = ['dsh', 'dlg', 'flk', 'rep', 'set'];

export default function BottomNav() {
  const bottomNav = useSet(s => s.bottomNav);
  const modules = useSet(s => s.modules);
  const [pressed, setPressed] = useState<string | null>(null);

  const safeNav = Array.isArray(bottomNav) && bottomNav.length === 5
    ? bottomNav
    : DEFAULT_NAV;

  const activeNav = safeNav
    .filter(id => id && id !== '' && PATHS[id] !== undefined && modules[id] !== false)
    .slice(0, 5);

  const finalNav = activeNav.length > 0 ? activeNav : DEFAULT_NAV;

  return (
    <>
      <style>{`
        @keyframes pmNavBounce {
          0%   { transform: scale(1); }
          30%  { transform: scale(0.82); }
          60%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes pmPillPop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pmLabelFade {
          0%   { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--card-solid, #fff)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        padding: '8px 6px calc(10px + env(safe-area-inset-bottom))',
        zIndex: 20,
        maxWidth: 480,
        margin: '0 auto',
        boxShadow: '0 -8px 24px rgba(0,0,0,.08)'
      }}>
        {finalNav.map((id) => {
          const path = PATHS[id] || '/';
          const label = (MODULE_LABELS[id] && MODULE_LABELS[id].name) || id;
          const icon = ICONS[id] || ICONS.dsh;
          const isPressed = pressed === id;

          return (
            <NavLink
              key={id}
              to={path}
              end={path === '/'}
              onClick={() => {
                setPressed(id);
                setTimeout(() => setPressed(null), 350);
              }}
              style={{
                flex: 1,
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative'
              }}
            >
              {({ isActive }) => (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '2px 0',
                  cursor: 'pointer'
                }}>
                  {/* Pill / Icon container */}
                  <div style={{
                    position: 'relative',
                    width: 64,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* پس‌زمینه pill فعال */}
                    {isActive ? (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--accent) 0%, #15803d 100%)',
                        boxShadow: '0 4px 12px var(--accent-border)',
                        animation: 'pmPillPop 0.35s cubic-bezier(.34,1.56,.64,1)'
                      }} />
                    ) : null}

                    {/* آیکون */}
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={isActive ? 2.4 : 1.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        color: isActive ? '#ffffff' : 'var(--muted)',
                        animation: isPressed
                          ? 'pmNavBounce 0.4s cubic-bezier(.34,1.56,.64,1)'
                          : 'none',
                        transition: 'color .25s, stroke-width .25s',
                        filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,.15))' : 'none'
                      }}
                    >
                      {icon.split(' M').map((seg, i) => (
                        <path key={i} d={(i === 0 ? '' : 'M') + seg} />
                      ))}
                    </svg>
                  </div>

                  {/* متن */}
                  <span style={{
                    fontSize: isActive ? 11 : 10.5,
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? 'var(--accent)' : 'var(--muted)',
                    letterSpacing: isActive ? '-.2px' : '0',
                    transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
                    lineHeight: 1,
                    animation: isActive ? 'pmLabelFade 0.3s ease-out' : 'none'
                  }}>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

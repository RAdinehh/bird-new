import { getGlobalFormat } from '../units/useFormat';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUI } from '../../cor/store/ui';
import { useAlt, activeAlerts } from '../../mod/alt/store';
import { useWhs, stockWarning, expiryWarning } from '../../mod/whs/store';
import { toFa } from '../utils/fa';

interface MenuItem {
  to: string;
  label: string;
  icon: string;
  badge?: 'alerts' | 'stock' | null;
}

interface Section {
  title: string;
  icon: string;
  tone: 'accent' | 'info' | 'warn' | 'purple' | 'danger';
  items: MenuItem[];
}

export default function MenuDrawer() {
  const { menuOpen, closeMenu } = useUI();
  const nav = useNavigate();
  const loc = useLocation();

  // مقدار امن — اگر undefined بود، آرایه‌ی خالی
  const alertsRaw = useAlt(s => s.alerts);
  const itemsRaw = useWhs(s => s.items);
  const alerts = Array.isArray(alertsRaw) ? alertsRaw : [];
  const items = Array.isArray(itemsRaw) ? itemsRaw : [];

  const alertCount = (() => {
    try { return activeAlerts(alerts).length; } catch { return 0; }
  })();

  const stockCount = (() => {
    try {
      return items.filter(i => stockWarning(i) !== 'ok' || expiryWarning(i) !== 'ok').length;
    } catch { return 0; }
  })();

  const sections: Section[] = [
    {
      title: 'خانه',
      icon: '🏠',
      tone: 'accent',
      items: [
        { to: '/', label: 'داشبورد', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
        { to: '/dlg', label: 'ثبت روزانه', icon: 'M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z' },
        { to: '/cal', label: 'تقویم', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
      ]
    },
    {
      title: 'پرورش',
      icon: '🐔',
      tone: 'accent',
      items: [
        { to: '/brd', label: 'پرنده‌ها و نژادها', icon: 'M12 3l4 5h-8l4-5z M12 8v13 M6 14h12' },
        { to: '/hal', label: 'سالن‌ها', icon: 'M3 3h18v18H3z M3 9h18 M9 21V9' },
        { to: '/flk', label: 'گله‌ها', icon: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M2 20a5 5 0 0 1 10 0 M13 20a4 4 0 0 1 8 0' },
        { to: '/inc', label: 'جوجه‌کشی', icon: 'M12 3C8 8 6 11.5 6 15a6 6 0 0 0 12 0c0-3.5-2-7-6-12z M12 12v6 M9 15h6' },
        { to: '/egg', label: 'تخم‌ها', icon: 'M12 5a7 7 0 0 0-7 7 7 7 0 0 0 14 0 7 7 0 0 0-7-7z' },
      ]
    },
    {
      title: 'منابع',
      icon: '📦',
      tone: 'info',
      items: [
        { to: '/whs', label: 'انبار', icon: 'M3 7l9-4 9 4v11l-9 4-9-4V7z M3 7l9 4 9-4 M12 11v11', badge: stockCount > 0 ? 'stock' : null },
        { to: '/fed', label: 'جیره‌نویسی', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 9h6 M9 13h6 M9 17h4' },
      ]
    },
    {
      title: 'کسب‌وکار',
      icon: '💼',
      tone: 'warn',
      items: [
        { to: '/tra', label: 'معاملات', icon: 'M7 8h11 M15 5l3 3-3 3 M17 16H6 M9 13l-3 3 3 3' },
        { to: '/ctc', label: 'مخاطبین', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
      ]
    },
    {
      title: 'تحلیل',
      icon: '📊',
      tone: 'purple',
      items: [
        { to: '/rep', label: 'گزارش‌ها', icon: 'M3 3v18h18 M19 9l-5 5-4-4-3 3' },
        { to: '/alt', label: 'هشدارها', icon: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', badge: alertCount > 0 ? 'alerts' : null },
        { to: '/doc', label: 'اسناد و فایل‌ها', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6' },
        { to: '/arc', label: 'آرشیو', icon: 'M4 4h16v4H4z M5 8v12h14V8 M9 13h6' },
      ]
    },
    {
      title: 'سیستم',
      icon: '⚙️',
      tone: 'danger',
      items: [
        { to: '/set', label: 'تنظیمات', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
      ]
    }
  ];

  const go = (to: string) => {
    closeMenu();
    nav(to);
  };

  const isActive = (to: string) => {
    if (to === '/') return loc.pathname === '/';
    return loc.pathname.startsWith(to);
  };

  return (
    <>
      <div
        onClick={closeMenu}
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--overlay)',
          zIndex: 50,
          display: menuOpen ? 'block' : 'none'
        }}
      />

      <aside style={{
        position: 'fixed', top: 0, bottom: 0, right: 0,
        width: 290, maxWidth: '85vw',
        background: 'var(--card-solid)',
        zIndex: 51,
        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform var(--dur-enter) cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: menuOpen ? '-8px 0 32px rgba(0,0,0,.2)' : 'none'
      }}>

        <div style={{
          padding: '24px 20px 20px',
          background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{
            position: 'absolute', top: -40, left: -40,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,.08)'
          }} />
          <div style={{
            position: 'absolute', bottom: -30, right: -30,
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(255,255,255,.06)'
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48,
              borderRadius: 'var(--r-lg)',
              background: 'rgba(255,255,255,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24
            }}>🐔</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
                مدیریت مرغداری
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', opacity: 1, marginTop: 2 }}>
                نسخه ۰.۴.۰ • ۱۵ ماژول
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 10px 20px', flex: 1 }}>
          {sections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px 6px', marginBottom: 4
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: 'var(--' + sec.tone + '-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12
                }}>{sec.icon}</div>
                <span style={{
                  fontSize: 'var(--fs-xs)', fontWeight: 700,
                  color: 'var(--' + sec.tone + ')',
                  letterSpacing: '.5px'
                }}>{sec.title}</span>
                <div style={{
                  height: 1, flex: 1,
                  background: 'linear-gradient(90deg, var(--' + sec.tone + '-soft), transparent)',
                  opacity: 0.5
                }} />
              </div>

              {sec.items.map((it) => {
                const active = isActive(it.to);
                return (
                  <div
                    key={it.to}
                    onClick={() => go(it.to)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      marginBottom: 2,
                      background: active ? 'var(--' + sec.tone + '-soft)' : 'transparent',
                      position: 'relative'
                    }}
                  >
                    {active ? (
                      <div style={{
                        position: 'absolute', right: 0, top: 8, bottom: 8,
                        width: 3,
                        background: 'var(--' + sec.tone + ')',
                        borderRadius: '3px 0 0 3px'
                      }} />
                    ) : null}

                    <div style={{
                      width: 36, height: 36,
                      borderRadius: 'var(--r-md)',
                      background: active ? 'var(--card-solid)' : 'var(--input-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      color: active ? 'var(--' + sec.tone + ')' : 'var(--muted)',
                      border: active
                        ? '1px solid var(--' + sec.tone + ')'
                        : '1px solid transparent'
                    }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {it.icon.split(' M').map((seg, i) => (
                          <path key={i} d={(i === 0 ? '' : 'M') + seg} />
                        ))}
                      </svg>
                    </div>

                    <span style={{
                      flex: 1,
                      fontSize: 'var(--fs-base)',
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--' + sec.tone + ')' : 'var(--text)'
                    }}>{it.label}</span>

                    {it.badge === 'alerts' && alertCount > 0 ? (
                      <span style={{
                        background: 'var(--danger)', color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        minWidth: 20, height: 20, borderRadius: 999, whiteSpace: 'nowrap', lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 6px'
                      }}>{getGlobalFormat().count(alertCount)}</span>
                    ) : null}

                    {it.badge === 'stock' && stockCount > 0 ? (
                      <span style={{
                        background: 'var(--warn)', color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        minWidth: 20, height: 20, borderRadius: 999, whiteSpace: 'nowrap', lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 6px'
                      }}>{getGlobalFormat().count(stockCount)}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{
          padding: '12px 16px 20px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: 'var(--fs-xs)',
          color: 'var(--dim)',
          flexShrink: 0
        }}>
          ساخته‌شده برای مرغداری ایران 🇮🇷
        </div>
      </aside>
    </>
  );
}

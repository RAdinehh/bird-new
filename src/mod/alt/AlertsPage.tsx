/**
 * AlertsPage — هشدارها (carousel tabs مثل hal)
 */
import { useState, useEffect, useMemo } from 'react';
import { useAlt, countByLevel } from './store';
import { runRules } from './rules';
import { useCarousel } from '../../shr/hooks/useCarousel';
import { toFa } from '../../shr/utils/fa';
import AlertTabPanel from './components/AlertTabPanel';

type TabId = 'active' | 'history';

export default function AlertsPage() {
  const { alerts } = useAlt();
  const [tab, setTab] = useState<TabId>('active');

  // اجرای خودکار قواعد در بار اول
  useEffect(() => {
    runRules();
  }, []);

  const counts = useMemo(() => countByLevel(alerts), [alerts]);
  const historyCount = useMemo(
    () => alerts.filter(a => a.status === 'dismissed').length,
    [alerts],
  );

  const tabIds: TabId[] = ['active', 'history'];
  const { containerRef, trackRef, setInstant } = useCarousel(
    tabIds,
    tab,
    (id) => setTab(id as TabId),
  );

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '11px 14px',
    fontSize: 'var(--fs-base)',
    fontWeight: 600,
    color: active ? 'var(--accent)' : 'var(--muted)',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    borderBottom: active ? '2.5px solid var(--accent)' : '2.5px solid transparent',
  });

  return (
    <div>
      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 12px',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
      }}>
        <div
          role="button" tabIndex={0}
          onClick={() => { setInstant(); setTab('active'); }}
          style={tabStyle(tab === 'active')}
        >
          فعال
          {counts.total > 0 ? (
            <span style={{
              fontSize: 12,
              background: counts.critical > 0 ? 'var(--danger)' : 'var(--warn)',
              color: '#fff',
              padding: '1px 6px',
              borderRadius: 8,
              fontWeight: 700,
            }}>{toFa(counts.total)}</span>
          ) : null}
        </div>
        <div
          role="button" tabIndex={0}
          onClick={() => { setInstant(); setTab('history'); }}
          style={tabStyle(tab === 'history')}
        >
          تاریخچه ({toFa(historyCount)})
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          isolation: 'isolate',
          touchAction: 'pan-y',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            direction: 'ltr',
            willChange: 'transform',
            touchAction: 'pan-y',
            width: '100%',
            minWidth: 0,
          }}
        >
          {tabIds.map(id => (
            <div
              key={id}
              style={{
                flex: '0 0 100%',
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                direction: 'rtl',
                overflow: 'hidden',
                boxSizing: 'border-box',
                isolation: 'isolate',
              }}
            >
              <AlertTabPanel tab={id} active={tab === id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

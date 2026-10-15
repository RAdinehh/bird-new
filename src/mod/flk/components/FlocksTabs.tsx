/**
 * FlocksTabs — نوار تب گله‌ها
 * با نشانگر «آیتم جدید» (دات قرمز)
 */
import type { TabId } from '../types-flocks';

export interface FlockTab {
  id: TabId;
  label: string;
}

interface Props {
  tabs: FlockTab[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  newTabBadge: TabId | null;
}

export default function FlocksTabs({ tabs, activeTab, onTabChange, newTabBadge }: Props) {
  return (
    <>
      <style>{`
        @keyframes flkDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.75; }
        }
      `}</style>
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '0 12px', background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => onTabChange(t.id)}
            
            style={{
              padding: '11px 12px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: activeTab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t.label}
            {newTabBadge === t.id && (
              <span
                aria-label="آیتم جدید"
                style={{
                  position: 'absolute', top: 4, left: 4,
                  width: 9, height: 9, borderRadius: '50%',
                  background: 'var(--danger)',
                  boxShadow: '0 0 0 2px var(--bg)',
                  animation: 'flkDotPulse 1s ease-in-out infinite',
                }}
              />
            )}
            {activeTab === t.id && (
              <div style={{
                position: 'absolute', bottom: 0, right: 12, left: 12, height: 3,
                background: 'var(--accent)', borderRadius: '3px 3px 0 0',
              }} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

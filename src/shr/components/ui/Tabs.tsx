/**
 * Tabs.tsx — نوار تب مشترک (استاندارد پروژه)
 * الگو: flk/FlocksTabs.jsx
 * پشتیبانی: count badge، dot پالس (آیتم جدید)، rightAction
 */
import type React from 'react';
import { toFa } from '../../utils/fa';

export interface Tab<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (id: T) => void;
  newTabBadge?: T | null;
  rightAction?: React.ReactNode;
}

export function Tabs<T extends string = string>({
  tabs, activeTab, onTabChange, newTabBadge, rightAction,
}: Props<T>) {
  return (
    <>
      <style>{`
        @keyframes tabDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.75; }
        }
      `}</style>
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: '1px solid var(--border)',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
      }}>
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', gap: 0,
          padding: '0 12px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {tabs.map(t => (
            <div
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                padding: '11px 14px',
                fontSize: 'var(--fs-base)',
                fontWeight: 600,
                color: activeTab === t.id ? 'var(--accent)' : 'var(--muted)',
                cursor: 'pointer',
                position: 'relative',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span style={{
                  fontSize: 12,
                  background: activeTab === t.id ? 'var(--accent-soft)' : 'var(--input-bg)',
                  color: activeTab === t.id ? 'var(--accent)' : 'var(--muted)',
                  padding: '1px 5px',
                  borderRadius: 8,
                  fontWeight: 700,
                }}>{toFa(t.count)}</span>
              )}
              {newTabBadge === t.id && (
                <span
                  aria-label="آیتم جدید"
                  style={{
                    position: 'absolute', top: 4, left: 4,
                    width: 9, height: 9, borderRadius: '50%',
                    background: 'var(--danger)',
                    boxShadow: '0 0 0 2px var(--bg)',
                    animation: 'tabDotPulse 1s ease-in-out infinite',
                  }}
                />
              )}
              {activeTab === t.id && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 14, left: 14, height: 3,
                  background: 'var(--accent)', borderRadius: '3px 3px 0 0',
                }} />
              )}
            </div>
          ))}
        </div>
        {rightAction && (
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '0 8px',
            borderRight: '1px solid var(--border)',
          }}>
            {rightAction}
          </div>
        )}
      </div>
    </>
  );
}

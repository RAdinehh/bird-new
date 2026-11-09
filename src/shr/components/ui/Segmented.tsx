/**
 * Segmented.tsx — دکمه‌های segmented (تب‌های داخلی) + ShowMore
 * الگو: FlockHistoryModal (line 836+ / 844+)
 */
import type { ReactNode } from 'react';
import { toFa } from '../../utils/fa';

export function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 10px',
        fontSize: 'var(--fs-sm)',
        fontWeight: 700,
        borderRadius: 'calc(var(--r-md) - 3px)',
        border: 'none',
        background: active ? 'var(--card)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

export function ShowMoreButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-sm)',
        color: 'var(--accent)',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      📜 نمایش {toFa(count)} رویداد بیشتر
    </button>
  );
}

import { getGlobalFormat } from '../units/useFormat';
import { type ReactNode } from 'react';
import { IconCheck } from '../icons';

export function RowItem({
  active, multi, icon, label, count: cnt, onClick,
}: {
  active: boolean; multi: boolean;
  icon?: ReactNode; label: string; count?: number;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      height: 38, minHeight: 38, padding: '0 10px', width: '100%',
      boxSizing: 'border-box',
      background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
      border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
      borderRadius: 'var(--r-md)',
      boxShadow: 'none', opacity: 1,
      cursor: 'pointer', fontFamily: 'inherit',
      textAlign: 'right',
      transition: 'all var(--dur-fast) var(--ease-out)',
    }}>
      {icon && (
        <span style={{
          width: 26, height: 26, borderRadius: 'var(--r-sm)',
          background: active ? 'var(--accent)' : 'var(--input-bg)',
          color: active ? 'var(--avatar-text)' : 'var(--muted)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--dur-fast) var(--ease-out)',
        }}>{icon}</span>
      )}
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: 'var(--fs-sm)', fontWeight: 600,
        color: active ? 'var(--accent)' : 'var(--text)',
        opacity: 1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{label}</span>
      {cnt !== undefined && (
        <span style={{
          fontSize: 'var(--fs-2xs)', fontWeight: 600,
          color: active ? 'var(--accent)' : 'var(--muted)',
          background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
          border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
          padding: '1px 6px', borderRadius: 'var(--r-sm)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>{getGlobalFormat().count(cnt)}</span>
      )}
      <span style={{
        width: 18, height: 18, flexShrink: 0,
        borderRadius: multi ? 5 : 9,
        background: active ? 'var(--accent)' : 'var(--input-bg)',
        border: '2px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
        transition: 'all var(--dur-fast) var(--ease-out)',
      }}>
        {active && (multi
          ? <IconCheck size={10} />
          : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
        )}
      </span>
    </button>
  );
}

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
      padding: '8px 10px', minHeight: 42, width: '100%',
      background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
      border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
      borderRadius: 'var(--r-lg)',
      cursor: 'pointer', fontFamily: 'inherit',
      textAlign: 'right',
      transition: 'all var(--dur-fast) var(--ease-out)',
    }}>
      {icon && (
        <span style={{
          width: 26, height: 26, borderRadius: 12,
          background: active ? 'var(--accent)' : 'var(--input-bg)',
          color: active ? 'var(--avatar-text)' : 'var(--muted)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--dur-fast) var(--ease-out)',
        }}>{icon}</span>
      )}
      <span style={{
        flex: 1, fontSize: 'var(--fs-base)',
        fontWeight: active ? 700 : 600,
        color: active ? 'var(--accent)' : 'var(--text)',
      }}>{label}</span>
      {cnt !== undefined && (
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          color: active ? 'var(--accent)' : 'var(--muted)',
          background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
          border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
          padding: '2px 8px', borderRadius: 12,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>{cnt}</span>
      )}
      <span style={{
        width: 22, height: 22, flexShrink: 0,
        borderRadius: multi ? 6 : 11,
        background: active ? 'var(--accent)' : 'var(--input-bg)',
        border: '2px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
        transition: 'all var(--dur-fast) var(--ease-out)',
      }}>
        {active && (multi
          ? <IconCheck size={12} />
          : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
        )}
      </span>
    </button>
    );
}

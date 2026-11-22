import { getGlobalFormat } from '../units/useFormat';
import { type ReactNode } from 'react';
import { IconCheck } from '../icons';
import { toFa } from '../utils/fa';

export function RowItem({
  active, multi, icon, label, count: cnt, onClick,
}: {
  active: boolean; multi: boolean;
  icon?: ReactNode; label: string; count?: number;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', minHeight: 38, width: '100%',
      background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
      border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
      borderRadius: 'var(--r-md)',
      cursor: 'pointer', fontFamily: 'inherit',
      textAlign: 'right',
      transition: 'all var(--dur-fast) var(--ease-out)',
    }}>
      {icon && (
        <span style={{
          width: 22, height: 22, borderRadius: 'var(--r-sm)',
          background: active ? 'var(--accent)' : 'var(--input-bg)',
          color: active ? 'var(--avatar-text)' : 'var(--muted)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--dur-fast) var(--ease-out)',
        }}>{icon}</span>
      )}
      <span style={{
        flex: 1, fontSize: 'var(--fs-sm)',
        fontWeight: active ? 700 : 600,
        color: active ? 'var(--accent)' : 'var(--text)',
      }}>{label}</span>
      {cnt !== undefined && (
        <span style={{
          fontSize: 'var(--fs-2xs)', fontWeight: 700,
          color: active ? 'var(--accent)' : 'var(--muted)',
          background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
          border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
          padding: '1px 5px', borderRadius: 'var(--r-sm)',
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

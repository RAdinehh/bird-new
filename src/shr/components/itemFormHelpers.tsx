import { type ReactNode } from 'react';

// ============ helper ============
function getField(item: any, key: string, def: any = '') {
  return item[key] !== undefined ? item[key] : def;
}

// ============ Chip toggle ============
export function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 10px', fontSize: 'var(--fs-xs)',
        background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
        border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 'var(--r-sm)',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontWeight: active ? 700 : 500, cursor: 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ============ داروی گیاهی ============

/**
 * AboutCards — StatCard و LinkRow
 */
import { toFa } from '../../../shr/utils/fa';

export function StatCard({ icon, value, label, tone }: { icon: string; value: number; label: string; tone: 'accent' | 'info' | 'purple' | 'warn' }) {
  return (
    <div style={{
      background: 'var(--' + tone + '-soft)',
      border: '1px solid var(--' + tone + '-border)',
      borderRadius: 'var(--r-md)',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minWidth: 0,
    }}>
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--fs-lg)',
          fontWeight: 700,
          color: 'var(--' + tone + ')',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}>{toFa(value)}</div>
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          marginTop: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{label}</div>
      </div>
    </div>
  );
}

// ═══ ردیف لینک ═══
export function LinkRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 12px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'right',
        color: 'var(--text)',
        fontSize: 'var(--fs-base)',
        fontWeight: 600,
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ color: 'var(--muted)', fontSize: 14 }}>‹</span>
    </button>
  );
}

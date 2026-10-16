/**
 * helpers.tsx — کامپوننت‌های کمکی مخاطبین
 */

export function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)',
      padding: 'var(--pad-tight)',
      background: accent ? 'var(--accent-soft)' : 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
    }}>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function DepBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--accent-soft)', border: '1px dashed var(--accent-border)',
      borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex',
      flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 4,
    }}>
      <div style={{
        fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8,
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        {title}
      </div>
      {children}
    </div>
  );
}

/**
 * helpers.tsx — helperهای مشترک ماژول flk
 */
import type { ReactNode, CSSProperties } from 'react';
import { toFa } from '../../shr/utils/fa';

export function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function DepBox({ title, children, tone = 'accent' }: { title: string; children: ReactNode; tone?: 'accent' | 'purple' }) {
  const c = tone === 'purple' ? 'var(--purple)' : 'var(--accent)';
  const s = tone === 'purple' ? 'var(--purple-soft)' : 'var(--accent-soft)';
  const b = tone === 'purple' ? 'var(--purple)' : 'var(--accent-border)';
  return (
    <div style={{ background: s, border: `1px dashed ${b}`, borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 4 }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: c, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 6, height: 36, borderRadius: '50%', background: c }} />
        {title}
      </div>
      {children}
    </div>
  );
}

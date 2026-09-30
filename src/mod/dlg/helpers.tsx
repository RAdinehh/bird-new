/**
 * helpers.tsx — helperهای مشترک ماژول dlg
 */
import type { ReactNode, CSSProperties } from 'react';
import { toFa } from '../../shr/utils/fa';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}

export function Row({ l, v, warn }: { l: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: warn ? 'var(--warn-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)', color: warn ? 'var(--warn)' : undefined, fontWeight: warn ? 700 : undefined }}>
      <span style={{ color: warn ? 'var(--warn)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: warn ? 'var(--warn)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}

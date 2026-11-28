import type { ReactNode } from 'react';
import { OptionIcon } from '../OptionIcon';
import type { AppIconKey } from '../../icons/AppIcons';

function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (typeof node === 'object' && 'props' in node && (node as any).props) {
    return extractText((node as any).props.children);
  }
  return '';
}

function inferRowIcon(l: ReactNode): AppIconKey | null {
  const raw = extractText(l).trim();
  if (!raw) return null;
  if (/تلفات/.test(raw)) return 'mortality';
  if (/تخم\s*شکسته|شکسته/.test(raw)) return 'broken_egg';
  if (/نطفه/.test(raw)) return 'fertile_egg';
  if (/تخم\s*(خوراکی|سالم|کل)/.test(raw)) return 'egg';
  if (/ضرر|زیان/.test(raw)) return 'profit_trend';
  if (/خرید/.test(raw)) return 'invoice';
  if (/تعمیر/.test(raw)) return 'hand_tools';
  if (/اسقاط/.test(raw)) return 'archive_box';
  if (/فعال/.test(raw)) return 'equipment';
  if (/رطوبت|آب/.test(raw)) return 'water';
  if (/دما/.test(raw)) return 'climate';
  if (/دان|خوراک/.test(raw)) return 'feed';
  return null;
}

export function Row({ l, v, accent, warn, autoFrom, icon }: { l: ReactNode; v: ReactNode; accent?: boolean; warn?: boolean; autoFrom?: string; icon?: AppIconKey | false }) {
  const bg = warn ? 'var(--warn-soft)' : accent ? 'var(--accent-soft)' : 'var(--input-bg)';
  const color = warn ? 'var(--warn)' : accent ? 'var(--accent)' : 'var(--muted)';
  const textColor = warn ? 'var(--warn)' : accent ? 'var(--accent)' : 'var(--text)';
  const resolvedIcon = icon === false ? null : (icon ?? inferRowIcon(l));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: autoFrom ? 'var(--sp-1)' : 0, padding: 'var(--pad-tight)', background: bg, borderRadius: 'var(--r-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)', gap: 8, minWidth: 0 }}>
        <span style={{ color, display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', flexShrink: 0, maxWidth: '55%' }}>
          {resolvedIcon && <OptionIcon icon={resolvedIcon} size={14} />}
          <span>{l}:</span>
          {autoFrom && (
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
          )}
        </span>
        <span style={{ fontWeight: 600, color: textColor, minWidth: 0, wordBreak: 'break-word', textAlign: 'left' }}>{v}</span>
      </div>
      {autoFrom && (
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent)', fontWeight: 600, opacity: 1, textAlign: 'left' }}>
          {'✨ از ' + autoFrom}
        </div>
      )}
    </div>
  );
}

export function RowGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)' }}>{children}</div>;
}

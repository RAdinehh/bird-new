import { toFa } from '../../utils/fa';

type KpiColorKey = 'accent' | 'warn' | 'danger' | 'info';

interface MiniStatProps {
  label: string;
  value: number | string;
  suffix?: string;
  color?: KpiColorKey | string;
  noFormat?: boolean;
  variant?: 'box' | 'plain';
}

function resolveColor(color: KpiColorKey | string): string {
  if (color.startsWith('var(')) return color;
  return `var(--${color})`;
}
function resolveSoft(color: KpiColorKey | string): string {
  if (color.startsWith('var(')) return color.replace(/^var\(--([a-z]+)\)$/, 'var(--$1-soft)');
  return `var(--${color}-soft)`;
}

export function MiniStat({ label, value, suffix = '', color = 'accent', noFormat, variant = 'box' }: MiniStatProps) {
  const fg = resolveColor(color);

  if (variant === 'plain') {
    const display = typeof value === 'number'
      ? (noFormat ? toFa(String(value)) : toFa(value.toLocaleString('fa-IR')))
      : String(value);
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: fg, fontVariantNumeric: 'tabular-nums' }}>{display}</div>
      </div>
    );
  }

  const bg = resolveSoft(color);
  const display = typeof value === 'number'
    ? (noFormat ? toFa(String(Math.round(value))) : toFa((Math.round(value * 100) / 100).toLocaleString('fa-IR')))
    : String(value);
  return (
    <div style={{
      padding: '8px 10px', background: bg,
      border: `1px solid ${fg}`, borderRadius: 'var(--r-md)',
      textAlign: 'center', minHeight: 60,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2,
    }}>
      <div style={{ fontSize: 11, color: fg, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', fontWeight: 800, color: fg, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, wordBreak: 'break-word' }}>
        {display}{suffix}
      </div>
    </div>
  );
}

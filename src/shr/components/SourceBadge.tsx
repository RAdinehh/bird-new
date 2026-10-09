/**
 * SourceBadge.tsx — نشانگر منبع داده (آیکون کوچیک)
 *
 * قوانین:
 *   - فقط آیکون ۱۸×۱۸ — نه بج بزرگ با متن
 *   - tooltip در لمس/هاور برای متن کامل
 *   - حالت «دستی» و «خالی» → هیچ آیکونی نمایش نده
 */
export type SourceType = 'standard' | 'preset' | 'parent' | 'manual' | 'none';

interface Props {
  source: SourceType;
  /** متن برای tooltip */
  label?: string;
}

const CONFIG: Record<SourceType, { icon: string; bg: string; color: string; title: string }> = {
  standard: {
    icon: '✓',
    bg: 'var(--accent)',
    color: '#fff',
    title: 'از استاندارد',
  },
  preset: {
    icon: '⚡',
    bg: 'var(--info, #0ea5e9)',
    color: '#fff',
    title: 'از preset',
  },
  parent: {
    icon: '⬆',
    bg: 'var(--warn)',
    color: '#fff',
    title: 'از والد',
  },
  manual: {
    icon: '',
    bg: '',
    color: '',
    title: 'دستی',
  },
  none: {
    icon: '',
    bg: '',
    color: '',
    title: 'خالی',
  },
};

export default function SourceBadge({ source, label }: Props) {
  // هیچ آیکونی برای دستی/خالی
  if (source === 'manual' || source === 'none') return null;

  const c = CONFIG[source];
  const tooltip = label ? `${c.title}: ${label}` : c.title;

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: c.bg,
        color: c.color,
        fontSize: '10px',
        fontWeight: 700,
        lineHeight: 1,
        marginInlineStart: 5,
        flexShrink: 0,
        verticalAlign: 'middle',
        cursor: 'help',
      }}
    >
      {c.icon}
    </span>
  );
}

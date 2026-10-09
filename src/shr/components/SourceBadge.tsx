/**
 * SourceBadge.tsx — نشانگر منبع داده هر فیلد
 *
 * انواع منبع:
 *   standard — از استاندارد (DEFAULT_STANDARDS)
 *   preset   — از preset پرنده (BIRD_PRESETS)
 *   parent   — از والد (مثلاً نژاد از پرنده)
 *   manual   — کاربر دستی وارد کرده
 *   none     — خالی
 */
export type SourceType = 'standard' | 'preset' | 'parent' | 'manual' | 'none';

interface Props {
  source: SourceType;
  /** متن اضافه — مثلاً اسم استاندارد «Ross 308» */
  label?: string;
  /** متن کوتاه به جای پیش‌فرض */
  customText?: string;
}

const CONFIG: Record<SourceType, { dot: string; color: string; bg: string; defaultText: string; icon: string }> = {
  standard: { dot: 'var(--accent)', color: 'var(--accent)', bg: 'var(--accent-soft)', defaultText: 'از استاندارد', icon: '✓' },
  preset:   { dot: 'var(--info, #0ea5e9)', color: 'var(--info, #0ea5e9)', bg: 'var(--info-soft, #e0f2fe)', defaultText: 'از preset', icon: '⚡' },
  parent:   { dot: 'var(--warn)', color: 'var(--warn)', bg: 'var(--warn-soft)', defaultText: 'از پرنده والد', icon: '⬆' },
  manual:   { dot: 'var(--muted)', color: 'var(--muted)', bg: 'var(--input-bg)', defaultText: 'دستی', icon: '✋' },
  none:     { dot: 'var(--dim)', color: 'var(--dim)', bg: 'var(--input-bg)', defaultText: 'خالی', icon: '○' },
};

export default function SourceBadge({ source, label, customText }: Props) {
  const c = CONFIG[source];
  const text = customText || c.defaultText;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '1px 7px',
      fontSize: '9.5px',
      fontWeight: 600,
      fontFamily: 'inherit',
      color: c.color,
      background: c.bg,
      border: `1px solid ${c.color}`,
      borderRadius: 10,
      lineHeight: 1.5,
      whiteSpace: 'nowrap',
      opacity: source === 'none' ? 0.5 : 1,
    }}>
      <span style={{ fontSize: '8px', lineHeight: 1 }}>{c.icon}</span>
      <span>{text}</span>
      {label && source !== 'none' && (
        <span style={{ opacity: 0.7 }}>· {label}</span>
      )}
    </span>
  );
}

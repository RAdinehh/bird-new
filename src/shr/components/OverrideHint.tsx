/**
 * OverrideHint.tsx — نشانگر «استاندارد تغییر یافته»
 *
 * طراحی (طبق docs/STANDARDS.md + UI-RULES.md):
 *   - فقط متن زرد زیر فیلد (بدون کادر، بدون پس‌زمینه)
 *   - خط نقطه‌چین زیر متن → کاربر می‌فهمه کلیک‌پذیره
 *   - کلیک → مقدار برمی‌گرده به استاندارد
 *   - آیکون ↺ کوچیک انتهای متن
 *   - اگه تغییر نکرده → هیچی نمایش نده
 */

import { toFa } from '../utils/fa';

interface Props {
  /** آیا مقدار با استاندارد متفاوته؟ */
  overridden: boolean;
  /** مقدار استاندارد که کاربر ازش دور شده */
  stdValue: number | null;
  /** واحد (روز / FCR / ...) */
  unit?: string;
  /** تعداد اعشار */
  decimals?: number;
  /** کلیک → بازگشت به استاندارد */
  onReset: () => void;
}

export default function OverrideHint({
  overridden, stdValue, unit, decimals = 0, onReset,
}: Props) {
  if (!overridden || stdValue == null) return null;

  const fmtVal = decimals > 0 ? toFa(stdValue.toFixed(decimals)) : toFa(stdValue);
  const text = unit ? `${fmtVal} ${unit}` : fmtVal;

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onReset}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onReset(); } }}
      aria-label={`بازگشت به استاندارد ${text}`}
      title={`لمس کن تا برگرده به استاندارد: ${text}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        color: 'var(--warn)',
        padding: '2px 4px 0',
        cursor: 'pointer',
        userSelect: 'none',
        textDecoration: 'underline dotted',
        textUnderlineOffset: '3px',
        width: 'fit-content',
      }}
    >
      <span>استاندارد: {text}</span>
      <span aria-hidden="true" style={{ fontSize: 12, lineHeight: 1 }}>↺</span>
    </span>
  );
}

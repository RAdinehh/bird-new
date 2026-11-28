import { OptionIcon } from '../../shr/components/OptionIcon';
/**
 * helpers.tsx — helperهای مشترک ماژول rep
 */
import { getGlobalFormat } from '../../shr/units/useFormat';

import { toFa } from '../../shr/utils/fa';

export { Section } from '../../shr/components/ui/Layout';

export function StatCard({ label, icon, value, unit, color }: {
  label: string;
  icon?: string;
  value: number | string;
  unit?: string;
  color: 'accent' | 'warn' | 'danger' | 'info';
}) {
  const displayValue = typeof value === 'number'
    ? getGlobalFormat().num(value)
    : value;
  return (
    <div style={{
      padding: 'var(--pad-normal)', textAlign: 'center',
      background: 'var(--' + color + '-soft)',
      border: '1px solid var(--' + color + ')',
      borderRadius: 'var(--r-md)'
    }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--' + color + ')', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>{icon ? <OptionIcon icon={icon} size={14} /> : null}<span>{label}</span></div>
      <div style={{
        fontSize: 'var(--fs-md)', fontWeight: 700,
        color: 'var(--' + color + ')', marginTop: 4,
        fontVariantNumeric: 'tabular-nums'
      }}>
        {displayValue}
      </div>
      {unit ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>{unit}</div>
      ) : null}
    </div>
  );
}

/**
 * helpers.tsx — helperهای مشترک ماژول fed
 */
import { useFormat } from '../../shr/units/useFormat';

import type { ReactNode, CSSProperties } from 'react';
import { toFa } from '../../shr/utils/fa';
export { Row } from '../../shr/components/ui';


export { SectionTitle } from '../../shr/components/ui';

export function NutrientRow({ l, value, target, unit }: { l: string; value: number; target?: number; unit: string }) {
  const fmt = useFormat();
  let diff = 0;
  let tone: 'ok' | 'low' | 'high' = 'ok';
  if (target !== undefined && target > 0) {
    diff = value - target;
    const pct = (diff / target) * 100;
    if (pct < -5) tone = 'low';
    else if (pct > 5) tone = 'high';
  }
  const color = tone === 'ok' ? 'var(--accent)' : tone === 'low' ? 'var(--danger)' : 'var(--warn)';

  return (
    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
        <span style={{ color: 'var(--muted)' }}>{l}:</span>
        <span style={{ fontWeight: 600, color: color }}>{fmt.num(value)} {unit}</span>
      </div>
      {target !== undefined && target > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', marginTop: 2, color: 'var(--muted)' }}>
          <span>هدف: {fmt.num(target)} {unit}</span>
          <span style={{ color: color }}>{diff >= 0 ? '+' : ''}{fmt.num(diff)}</span>
        </div>
      ) : null}
    </div>
  );
}

export { chipStyle as chip } from '../../shr/utils/chipStyle';

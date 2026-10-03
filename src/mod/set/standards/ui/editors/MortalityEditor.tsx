import { RangeCard, CompactField } from '../components';
import { toFa } from '../../../../../shr/utils/fa';
import type { MortalityRange } from '../../types';

export function MortalityEditor({
  mortality, onChange,
}: {
  mortality: MortalityRange[];
  onChange: (n: MortalityRange[]) => void;
}) {
  const update = (i: number, patch: Partial<MortalityRange>) => {
    onChange(mortality.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {mortality.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${toFa(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : toFa(r.dayTo)}`}
        >
          <CompactField
            label="💀 حداکثر تلفات"
            value={r.maxPct}
            onChange={v => update(i, { maxPct: v ?? 0 })}
            unit="٪"
          />
        </RangeCard>
      ))}
    </div>
  );
}

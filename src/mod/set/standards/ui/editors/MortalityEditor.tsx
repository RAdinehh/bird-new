import { RangeCard, CompactField } from '../components';
import { useFormat } from '../../../../../shr/units/useFormat';
import type { MortalityRange } from '../../types';

export function MortalityEditor({
  mortality, onChange,
}: {
  mortality: MortalityRange[];
  onChange: (n: MortalityRange[]) => void;
}) {
  const fmt = useFormat();
  const update = (i: number, patch: Partial<MortalityRange>) => {
    onChange(mortality.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {mortality.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${fmt.int(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : fmt.int(r.dayTo)}`}
        >
          <CompactField
            decimals={1}
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
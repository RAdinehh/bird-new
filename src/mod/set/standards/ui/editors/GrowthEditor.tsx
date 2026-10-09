import { RangeCard, CompactField, FieldsGrid } from '../components';
import { useFormat } from '../../../../../shr/units/useFormat';
import type { GrowthRange } from '../../types';

export function GrowthEditor({
  growth, onChange,
}: {
  growth: GrowthRange[];
  onChange: (n: GrowthRange[]) => void;
}) {
  const fmt = useFormat();
  const update = (i: number, patch: Partial<GrowthRange>) => {
    onChange(growth.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {growth.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${fmt.int(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : fmt.int(r.dayTo)}`}
        >
          <FieldsGrid>
            <CompactField
              label="⚖️ وزن"
              value={r.weightG}
              onChange={v => update(i, { weightG: v ?? 0 })}
              unit="گرم"
            />
            <CompactField
              decimals={1}
          label="📈 ADG"
              value={r.adgG}
              onChange={v => update(i, { adgG: v ?? 0 })}
              unit="گرم"
            />
            <CompactField
              decimals={2}
          label="🎯 FCR"
              value={r.fcr}
              onChange={v => update(i, { fcr: v ?? 0 })}
              unit="—"
            />
          </FieldsGrid>
        </RangeCard>
      ))}
    </div>
  );
}
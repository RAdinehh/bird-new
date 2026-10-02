import { RangeCard, CompactField, FieldsGrid } from '../components';
import { toFa } from '../../../../../shr/utils/fa';
import type { GrowthRange } from '../../types';

export function GrowthEditor({
  growth, onChange,
}: {
  growth: GrowthRange[];
  onChange: (n: GrowthRange[]) => void;
}) {
  const update = (i: number, patch: Partial<GrowthRange>) => {
    onChange(growth.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {growth.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${toFa(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : toFa(r.dayTo)}`}
        >
          <FieldsGrid>
            <CompactField
              label="⚖️ وزن"
              value={r.weightG}
              onChange={v => update(i, { weightG: v ?? 0 })}
              unit="گرم"
            />
            <CompactField
              label="📈 ADG"
              value={r.adgG}
              onChange={v => update(i, { adgG: v ?? 0 })}
              unit="گرم"
            />
            <CompactField
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

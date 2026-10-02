import { RangeCard, CompactField, FieldsGrid } from '../components';
import { toFa } from '../../../../../shr/utils/fa';
import type { EnvRange } from '../../types';

export function EnvEditor({
  env, onChange,
}: {
  env: EnvRange[];
  onChange: (n: EnvRange[]) => void;
}) {
  const update = (i: number, patch: Partial<EnvRange>) => {
    onChange(env.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {env.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${toFa(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : toFa(r.dayTo)}`}
        >
          <FieldsGrid>
            <CompactField
              label="🌡 دما هدف"
              value={r.temp.target}
              onChange={v => update(i, { temp: { ...r.temp, target: v ?? 0 } })}
              unit="°C"
              isTemp={true}
            />
            <CompactField
              label="دما حداقل"
              value={r.temp.min}
              onChange={v => update(i, { temp: { ...r.temp, min: v ?? 0 } })}
              unit="°C"
              isTemp={true}
            />
            <CompactField
              label="دما حداکثر"
              value={r.temp.max}
              onChange={v => update(i, { temp: { ...r.temp, max: v ?? 0 } })}
              unit="°C"
              isTemp={true}
            />
            <CompactField
              label="💧 رطوبت حداقل"
              value={r.humidity.min}
              onChange={v => update(i, { humidity: { ...r.humidity, min: v ?? 0 } })}
              unit="٪"
            />
            <CompactField
              label="رطوبت حداکثر"
              value={r.humidity.max}
              onChange={v => update(i, { humidity: { ...r.humidity, max: v ?? 0 } })}
              unit="٪"
            />
          </FieldsGrid>
        </RangeCard>
      ))}
    </div>
  );
}

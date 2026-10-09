import { RangeCard, CompactField, FieldsGrid } from '../components';
import type { LitterStandard, LitterMaterial } from '../../types';

const MATERIAL_LABELS: Record<LitterMaterial, string> = {
  wood_shavings: 'پوشال چوب',
  straw: 'کاه',
  sand: 'ماسه',
  rice_hull: 'پوسته برنج',
  paper_roll: 'رول کاغذی',
  sawdust: 'خاک‌اره',
  peat: 'پیت ماس',
  none: '—',
};

export function LitterEditor({
  litter, onChange,
}: {
  litter: LitterStandard;
  onChange: (n: LitterStandard) => void;
}) {
  const update = (patch: Partial<LitterStandard>) => onChange({ ...litter, ...patch });

  const toggleMaterial = (m: LitterMaterial) => {
    const rec = litter.recommended.includes(m)
      ? litter.recommended.filter(x => x !== m)
      : [...litter.recommended, m];
    update({ recommended: rec });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        padding: '8px 12px',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-md)',
      }}>
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          marginBottom: 8,
          fontWeight: 700,
        }}>مواد پیشنهادی</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(MATERIAL_LABELS) as LitterMaterial[])
            .filter(m => m !== 'none')
            .map(m => {
              const selected = litter.recommended.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMaterial(m)}
                  aria-pressed={selected}
                  style={{
                    padding: '5px 10px',
                    background: selected ? 'var(--accent-soft)' : 'var(--card)',
                    border: '1px solid ' + (selected ? 'var(--accent-border)' : 'var(--border)'),
                    borderRadius: 'var(--r-md)',
                    color: selected ? 'var(--accent)' : 'var(--muted)',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: selected ? 700 : 500,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {selected ? '✓ ' : ''}{MATERIAL_LABELS[m]}
                </button>
              );
            })}
        </div>
      </div>

      <RangeCard title="مشخصات بستر">
        <FieldsGrid>
          <CompactField
            label="مقدار مصرف"
            value={litter.kgPerM2}
            onChange={v => update({ kgPerM2: v ?? 0 })}
            unit="kg/m²"
          />
          <CompactField
            label="ضخامت"
            value={litter.thicknessCm}
            onChange={v => update({ thicknessCm: v ?? 0 })}
            unit="cm"
          />
          <CompactField
            label="عمر مفید"
            value={litter.lifetimeDays}
            onChange={v => update({ lifetimeDays: v ?? 0 })}
            unit="روز"
          />
          <CompactField
            label="تعویض در دوره"
            value={litter.replacementsPerCycle ?? null}
            onChange={v => update({ replacementsPerCycle: v ?? undefined })}
            unit="بار"
          />
        </FieldsGrid>
      </RangeCard>

      {litter.notes && (
        <div style={{
          padding: '6px 10px',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          lineHeight: 1.8,
        }}>
          📝 {litter.notes}
        </div>
      )}
    </div>
  );
}

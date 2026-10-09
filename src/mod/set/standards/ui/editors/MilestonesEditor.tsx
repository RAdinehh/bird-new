/**
 * MilestonesEditor — نقاط کلیدی بیولوژیک
 */
import type { BirdStandard, KeyMilestones } from '../../types';

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const G2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
);

const inputStyle = (changed: boolean) => ({
  width: '100%', height: 34, padding: '0 10px',
  background: 'var(--input-bg)',
  border: '1px solid ' + (changed ? 'var(--warn)' : 'var(--border)'),
  borderRadius: 'var(--r-md)' as any,
  color: 'var(--text)', fontFamily: 'inherit',
  fontSize: 'var(--fs-base)', fontWeight: 600,
  textAlign: 'right' as any, outline: 'none', boxSizing: 'border-box' as any,
});

interface Props {
  std: BirdStandard;
  def: BirdStandard;
  updateBird: (patch: Partial<BirdStandard>) => void;
}

export default function MilestonesEditor({ std, def, updateBird }: Props) {
  const m = std.keyMilestones;
  const dm = def.keyMilestones;

  const set = (key: keyof KeyMilestones, val: any) => {
    updateBird({ keyMilestones: { ...m, [key]: val } as KeyMilestones });
  };

  const numInput = (key: keyof KeyMilestones, label: string) => (
    <F label={label}>
      <input
        type="text"
        inputMode="decimal"
        value={(m?.[key] as any) ?? ''}
        onChange={e => {
          const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.-]/g, '');
          const n = en ? parseFloat(en) : null;
          set(key, n && !isNaN(n) ? n : undefined);
        }}
        style={inputStyle((m?.[key] as any) !== (dm?.[key] as any))}
      />
    </F>
  );

  return (
    <>
      <G2>
        {numInput('firstEggDay', 'اولین تخم (روز)')}
        {numInput('peakProductionDay', 'روز پیک تولید')}
      </G2>
      <G2>
        {numInput('peakProductionPct', 'پیک تولید (٪)')}
        {numInput('endOfCycleDay', 'پایان دوره (روز)')}
      </G2>
      <G2>
        {numInput('adultWeightMaleG', 'وزن نر بالغ (g)')}
        {numInput('adultWeightFemaleG', 'وزن ماده بالغ (g)')}
      </G2>
    </>
  );
}

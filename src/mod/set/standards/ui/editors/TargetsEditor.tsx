/**
 * TargetsEditor — اهداف عملکردی
 */
import type { BirdStandard, PerformanceTargets } from '../../types';

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

export default function TargetsEditor({ std, def, updateBird }: Props) {
  const t = std.targets;
  const dt = def.targets;

  const set = (key: keyof PerformanceTargets, val: any) => {
    updateBird({ targets: { ...t, [key]: val } as PerformanceTargets });
  };

  const numInput = (key: keyof PerformanceTargets, label: string) => (
    <F label={label}>
      <input
        type="text"
        inputMode="decimal"
        value={(t?.[key] as any) ?? ''}
        onChange={e => {
          const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.-]/g, '');
          const n = en ? parseFloat(en) : null;
          set(key, n && !isNaN(n) ? n : undefined);
        }}
        style={inputStyle((t?.[key] as any) !== (dt?.[key] as any))}
      />
    </F>
  );

  return (
    <>
      <G2>
        {numInput('targetFCR', 'FCR هدف')}
        {numInput('targetADGG', 'ADG هدف (g/روز)')}
      </G2>
      <G2>
        {numInput('targetMortalityPct', 'تلفات هدف (٪)')}
        {numInput('targetLivabilityPct', 'ماندگاری هدف (٪)')}
      </G2>
      <G2>
        {numInput('targetEggProdPct', 'تولید تخم هدف (٪)')}
        {numInput('targetFeedIntakeG', 'دان مصرفی هدف (g)')}
      </G2>
      <G2>
        {numInput('targetWeightG', 'وزن هدف (g)')}
      </G2>
    </>
  );
}

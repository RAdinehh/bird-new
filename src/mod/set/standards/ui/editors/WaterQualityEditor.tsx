/**
 * WaterQualityEditor — کیفیت آب (اختیاری)
 */
import type { BirdStandard, WaterQualityStandard } from '../../types';

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
  width: '100%', height: 38, padding: '0 10px',
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

export default function WaterQualityEditor({ std, def, updateBird }: Props) {
  const w = std.waterQuality;
  const dw = def.waterQuality;

  const set = (key: keyof WaterQualityStandard, val: any) => {
    updateBird({ waterQuality: { ...w, [key]: val } as WaterQualityStandard });
  };

  const numInput = (key: keyof WaterQualityStandard, label: string) => (
    <F label={label}>
      <input
        type="text"
        inputMode="decimal"
        value={(w?.[key] as any) ?? ''}
        onChange={e => {
          const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.-]/g, '');
          const n = en ? parseFloat(en) : null;
          set(key, n && !isNaN(n) ? n : undefined);
        }}
        style={inputStyle((w?.[key] as any) !== (dw?.[key] as any))}
      />
    </F>
  );

  return (
    <>
      <G2>
        {numInput('phMin', 'pH حداقل')}
        {numInput('phMax', 'pH حداکثر')}
      </G2>
      <G2>
        {numInput('tdsMaxPpm', 'TDS حداکثر (ppm)')}
        {numInput('hardnessMaxPpm', 'سختی حداکثر (ppm)')}
      </G2>
      <G2>
        {numInput('chlorineMaxPpm', 'کلر حداکثر (ppm)')}
        {numInput('bacterialMaxCfu', 'باکتری حداکثر (CFU)')}
      </G2>
    </>
  );
}

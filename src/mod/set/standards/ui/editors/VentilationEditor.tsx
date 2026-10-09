/**
 * VentilationEditor — تهویه دقیق
 */
import type { BirdStandard, VentilationStandard } from '../../types';

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

export default function VentilationEditor({ std, def, updateBird }: Props) {
  const v = std.ventilation;
  const dv = def.ventilation;

  const set = (key: keyof VentilationStandard, val: any) => {
    updateBird({ ventilation: { ...v, [key]: val } as VentilationStandard });
  };

  const numInput = (key: keyof VentilationStandard, label: string) => (
    <F label={label}>
      <input
        type="text"
        inputMode="decimal"
        value={(v?.[key] as any) ?? ''}
        onChange={e => {
          const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.-]/g, '');
          const n = en ? parseFloat(en) : null;
          set(key, n && !isNaN(n) ? n : undefined);
        }}
        style={inputStyle((v?.[key] as any) !== (dv?.[key] as any))}
      />
    </F>
  );

  return (
    <>
      <G2>
        {numInput('airVolumeM3HMin', 'حجم هوا - حداقل (m³/h)')}
        {numInput('airVolumeM3HMax', 'حجم هوا - حداکثر (m³/h)')}
      </G2>
      <G2>
        {numInput('co2MaxPpm', 'CO₂ حداکثر (ppm)')}
        {numInput('nh3MaxPpm', 'NH₃ حداکثر (ppm)')}
      </G2>
      <G2>
        {numInput('humidityOptimalPct', 'رطوبت بهینه (٪)')}
        {numInput('airSpeedMS', 'سرعت هوا (m/s)')}
      </G2>
      <F label="نوع تهویه">
        <select
          value={v?.ventilationType || ''}
          onChange={e => set('ventilationType', e.target.value || undefined)}
          style={inputStyle(v?.ventilationType !== dv?.ventilationType)}
        >
          <option value="">— انتخاب نشده —</option>
          <option value="tunnel">تونلی</option>
          <option value="cross">عرضی</option>
          <option value="natural">طبیعی</option>
          <option value="combined">ترکیبی</option>
        </select>
      </F>
    </>
  );
}

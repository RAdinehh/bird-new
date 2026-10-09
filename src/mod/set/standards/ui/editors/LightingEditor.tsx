/**
 * LightingEditor — برنامه نوری
 */
import type { BirdStandard, LightingProgram } from '../../types';

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
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

export default function LightingEditor({ std, def, updateBird }: Props) {
  const lp = std.lightingProgram;
  const dlp = def.lightingProgram;

  const update = (patch: Partial<LightingProgram>) => {
    updateBird({ lightingProgram: { phases: [], ...lp, ...patch } as LightingProgram });
  };

  return (
    <>
      <F label="نوع لامپ">
        <select
          value={lp?.lightType || ''}
          onChange={e => update({ lightType: (e.target.value || undefined) as any })}
          style={inputStyle(lp?.lightType !== dlp?.lightType)}
        >
          <option value="">— انتخاب نشده —</option>
          <option value="LED">LED</option>
          <option value="CFL">CFL</option>
          <option value="incandescent">رشته‌ای</option>
          <option value="mixed">ترکیبی</option>
        </select>
      </F>
      <F label="یادداشت">
        <input
          type="text"
          value={lp?.notes || ''}
          onChange={e => update({ notes: e.target.value || undefined })}
          placeholder="مثلاً: ۲۳ ساعت روشنایی در هفته اول"
          style={inputStyle(lp?.notes !== dlp?.notes)}
        />
      </F>
    </>
  );
}

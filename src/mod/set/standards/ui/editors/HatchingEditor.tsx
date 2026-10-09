/**
 * HatchingEditor — پارامترهای جوجه‌کشی
 */
import type { BirdStandard, HatchingParams } from '../../types';

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

export default function HatchingEditor({ std, def, updateBird }: Props) {
  const h = std.hatchingParams;
  const dh = def.hatchingParams;

  const set = (key: keyof HatchingParams, val: any) => {
    updateBird({ hatchingParams: { ...h, [key]: val } as HatchingParams });
  };

  const numInput = (key: keyof HatchingParams, label: string) => (
    <F label={label}>
      <input
        type="text"
        inputMode="decimal"
        value={(h?.[key] as any) ?? ''}
        onChange={e => {
          const en = e.target.value.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.').replace(/[^\d.-]/g, '');
          const n = en ? parseFloat(en) : null;
          set(key, n && !isNaN(n) ? n : undefined);
        }}
        style={inputStyle((h?.[key] as any) !== (dh?.[key] as any))}
      />
    </F>
  );

  return (
    <>
      <G2>
        {numInput('setterCapacityEggs', 'ظرفیت دستگاه ستر')}
        {numInput('hatcherCapacityEggs', 'ظرفیت دستگاه هچر')}
      </G2>
      <G2>
        {numInput('eggStorageDaysMin', 'نگهداری تخم حداقل (روز)')}
        {numInput('eggStorageDaysMax', 'نگهداری تخم حداکثر (روز)')}
      </G2>
      <G2>
        {numInput('eggStorageTempC', 'دمای انبار تخم (°C)')}
        {numInput('eggStorageHumidityPct', 'رطوبت انبار تخم (٪)')}
      </G2>
      <G2>
        {numInput('preWarmingHours', 'پیش‌گرمایش (ساعت)')}
      </G2>
    </>
  );
}

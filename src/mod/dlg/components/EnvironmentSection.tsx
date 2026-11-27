import SmartSelect from '../../../shr/components/SmartSelect';
/**
 * EnvironmentSection — محیط و پرنده
 */
import { Field, Grid2, Grid3, NumField, PercentField, Textarea } from '../../../shr/components/ui';
import type { F } from '../types';
import { useFlk } from '../../flk/store';
import { useHal } from '../../hal/store';
import { useBreedStandard } from '../../../shr/hooks/useBreedStandard';
import { findInRange } from '../../set/standards/resolve';
import { getAgeDays } from '../../flk/store';
import { FieldHint } from '../../../shr/intelligence/FieldHint';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  vErrors: Record<string, string>;
  showError: (field: string) => string | undefined;
  markTouched: (field: string) => void;
}

export default function EnvironmentSection({ form, setForm, vErrors, showError, markTouched }: Props) {
  const flock = useFlk(s => form.flockId ? s.flocks.find(f => f.id === form.flockId) : undefined);
  const hall = useHal(s => flock?.hallId ? s.halls.find(h => h.id === flock.hallId) : undefined);
  const breedStd = useBreedStandard();
  const flockAge = flock ? getAgeDays(flock) : null;
  const hallStd = hall?.breedId ? breedStd.byBreedId(hall.breedId) : null;
  const dynStd = hallStd?.env && flockAge ? findInRange(hallStd.env, flockAge) : null;
  const targetTemp = (dynStd as any)?.temp?.target ?? hall?.targetTemp ?? null;
  const targetHumidity = (dynStd as any)?.humidity?.target ?? (dynStd as any)?.humidity?.min ?? hall?.targetHumidity ?? null;

  // 🆕 context برای anomaly detection
  const envCtx = {
    ageDays: flockAge ?? undefined,
    flockType: flock?.type as 'broiler' | 'layer' | 'breeder' | 'ornamental' | undefined,
  };

  return (
    <>

      <Grid2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="حداقل دما" required error={showError('temperatureMin')} onTouch={() => markTouched('temperatureMin')}>
            <NumField placeholder="۲۰" value={form.temperatureMin} onChange={e => setForm({ ...form, temperatureMin: e.target.value })} unit="°C" min={-10} max={50} />
          </Field>
          <FieldHint fieldPath="dlg.temperatureMin" value={form.temperatureMin} context={envCtx} />
          
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="حداکثر دما" required error={showError('temperatureMax')} onTouch={() => markTouched('temperatureMax')}>
            <NumField placeholder="۲۵" value={form.temperatureMax} onChange={e => setForm({ ...form, temperatureMax: e.target.value })} unit="°C" min={-10} max={50} />
          </Field>
          <FieldHint fieldPath="dlg.temperatureMax" value={form.temperatureMax} context={envCtx} />
          
        </div>
      </Grid2>

      <Grid2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="حداقل رطوبت" error={showError('humidityMin')}>
            <PercentField placeholder="۵۰" value={form.humidityMin} onChange={e => setForm({ ...form, humidityMin: e.target.value })} />
          </Field>
          <FieldHint fieldPath="dlg.humidityMin" value={form.humidityMin} context={envCtx} />
          
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="حداکثر رطوبت" error={showError('humidityMax')}>
            <PercentField placeholder="۷۰" value={form.humidityMax} onChange={e => setForm({ ...form, humidityMax: e.target.value })} />
          </Field>
          <FieldHint fieldPath="dlg.humidityMax" value={form.humidityMax} context={envCtx} />
          
        </div>
      </Grid2>

      <Grid2>
        <Field label="تهویه">
          <SmartSelect
            value={form.ventilation}
            onChange={v => setForm({ ...form, ventilation: v })}
            options={[
              { value: 'ok', label: 'مناسب' },
              { value: 'low', label: 'ضعیف' },
              { value: 'high', label: 'شدید' },
            ]}
            modalTitle="وضعیت تهویه"
          />
        </Field>
        <Field label="بستر">
          <SmartSelect
            value={form.litter}
            onChange={v => setForm({ ...form, litter: v })}
            options={[
              { value: 'dry', label: 'خشک' },
              { value: 'wet', label: 'مرطوب' },
              { value: 'clumped', label: 'کلوخه' },
            ]}
            modalTitle="وضعیت بستر"
          />
        </Field>
      </Grid2>

      <Grid3>
        <Field label="رفتار">
          <SmartSelect
            value={form.behavior}
            onChange={v => setForm({ ...form, behavior: v })}
            options={[
              { value: 'active', label: 'فعال' },
              { value: 'lethargic', label: 'بی‌حال' },
              { value: 'excited', label: 'پرهیجان' },
            ]}
            modalTitle="رفتار گله"
          />
        </Field>
        <Field label="توزیع">
          <SmartSelect
            value={form.distribution}
            onChange={v => setForm({ ...form, distribution: v })}
            options={[
              { value: 'uniform', label: 'یکنواخت' },
              { value: 'cornered', label: 'گوشه‌گیر' },
            ]}
            modalTitle="توزیع در سالن"
          />
        </Field>
        <Field label="صدا">
          <SmartSelect
            value={form.sound}
            onChange={v => setForm({ ...form, sound: v })}
            options={[
              { value: 'normal', label: 'طبیعی' },
              { value: 'cough', label: 'سرفه' },
              { value: 'sneeze', label: 'عطسه' },
            ]}
            modalTitle="صدای گله"
          />
        </Field>
      </Grid3>

      <Field label="ظاهر عمومی">
        <Textarea rows={2} placeholder="رنگ پر، چشم، تاج، منقار..." value={form.appearance} onChange={e => setForm({ ...form, appearance: e.target.value })} />
      </Field>

    </>
  );
}

/**
 * EnvironmentSection — محیط و پرنده
 */
import { Field, Grid2, Grid3, NumField, PercentField, Select, Textarea } from '../../../shr/components/ui';
import type { F } from '../types';
import { FieldHint } from '../../../shr/intelligence';
import { useFlk } from '../../flk/store';
import { useHal } from '../../hal/store';
import { useBreedStandard } from '../../../shr/hooks/useBreedStandard';
import { findInRange } from '../../set/standards/resolve';
import { getAgeDays } from '../../flk/store';

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

  return (
    <>

      <Grid2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="حداقل دما" hint="۱۵-۳۰ درجه" error={showError('temperatureMin')}>
            <NumField placeholder="۲۰" value={form.temperatureMin} onChange={e => setForm({ ...form, temperatureMin: e.target.value })} unit="°C" min={-10} max={50} />
          </Field>
          {!showError('temperatureMin') && <FieldHint fieldPath="dlg.temperatureMin" value={form.temperatureMin} context={targetTemp !== null ? { expected: targetTemp } : {}} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="حداکثر دما" hint="۱۵-۳۰ درجه" error={showError('temperatureMax')}>
            <NumField placeholder="۲۵" value={form.temperatureMax} onChange={e => setForm({ ...form, temperatureMax: e.target.value })} unit="°C" min={-10} max={50} />
          </Field>
          {!showError('temperatureMax') && <FieldHint fieldPath="dlg.temperatureMax" value={form.temperatureMax} context={targetTemp !== null ? { expected: targetTemp } : {}} />}
        </div>
      </Grid2>

      <Grid2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="حداقل رطوبت" hint="۴۰-۷۰٪" error={showError('humidityMin')}>
            <PercentField placeholder="۵۰" value={form.humidityMin} onChange={e => setForm({ ...form, humidityMin: e.target.value })} />
          </Field>
          {!showError('humidityMin') && <FieldHint fieldPath="dlg.humidityMin" value={form.humidityMin} context={targetHumidity !== null ? { expected: targetHumidity } : {}} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="حداکثر رطوبت" hint="۴۰-۷۰٪" error={showError('humidityMax')}>
            <PercentField placeholder="۷۰" value={form.humidityMax} onChange={e => setForm({ ...form, humidityMax: e.target.value })} />
          </Field>
          {!showError('humidityMax') && <FieldHint fieldPath="dlg.humidityMax" value={form.humidityMax} context={targetHumidity !== null ? { expected: targetHumidity } : {}} />}
        </div>
      </Grid2>

      <Grid2>
        <Field label="تهویه">
          <Select value={form.ventilation} onChange={e => setForm({ ...form, ventilation: e.target.value })}>
            <option value="ok">مناسب</option>
            <option value="low">ضعیف</option>
            <option value="high">شدید</option>
          </Select>
        </Field>
        <Field label="بستر">
          <Select value={form.litter} onChange={e => setForm({ ...form, litter: e.target.value })}>
            <option value="dry">خشک</option>
            <option value="wet">مرطوب</option>
            <option value="clumped">کلوخه</option>
          </Select>
        </Field>
      </Grid2>

      <Grid3>
        <Field label="رفتار">
          <Select value={form.behavior} onChange={e => setForm({ ...form, behavior: e.target.value })}>
            <option value="active">فعال</option>
            <option value="lethargic">بی‌حال</option>
            <option value="excited">پرهیجان</option>
          </Select>
        </Field>
        <Field label="توزیع">
          <Select value={form.distribution} onChange={e => setForm({ ...form, distribution: e.target.value })}>
            <option value="uniform">یکنواخت</option>
            <option value="cornered">گوشه‌گیر</option>
          </Select>
        </Field>
        <Field label="صدا">
          <Select value={form.sound} onChange={e => setForm({ ...form, sound: e.target.value })}>
            <option value="normal">طبیعی</option>
            <option value="cough">سرفه</option>
            <option value="sneeze">عطسه</option>
          </Select>
        </Field>
      </Grid3>

      <Field label="ظاهر عمومی">
        <Textarea rows={2} placeholder="رنگ پر، چشم، تاج، منقار..." value={form.appearance} onChange={e => setForm({ ...form, appearance: e.target.value })} />
      </Field>

    </>
  );
}

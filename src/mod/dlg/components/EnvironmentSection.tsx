/**
 * EnvironmentSection — محیط و پرنده
 */
import { Field, Grid2, Grid3, NumField, PercentField, Select, Textarea } from '../../../shr/components/ui';
import type { F } from '../types';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  vErrors: Record<string, string>;
}

export default function EnvironmentSection({ form, setForm, vErrors }: Props) {
  return (
    <>

      <Grid2>
        <Field label="حداقل دما" hint="۱۵-۳۰ درجه" error={vErrors.temperatureMin}>
          <NumField placeholder="۲۰" value={form.temperatureMin} onChange={e => setForm({ ...form, temperatureMin: e.target.value })} unit="°C" min={-10} max={50} />
        </Field>
        <Field label="حداکثر دما" hint="۱۵-۳۰ درجه" error={vErrors.temperatureMax}>
          <NumField placeholder="۲۵" value={form.temperatureMax} onChange={e => setForm({ ...form, temperatureMax: e.target.value })} unit="°C" min={-10} max={50} />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="حداقل رطوبت" hint="۴۰-۷۰٪" error={vErrors.humidityMin}>
          <PercentField placeholder="۵۰" value={form.humidityMin} onChange={e => setForm({ ...form, humidityMin: e.target.value })} />
        </Field>
        <Field label="حداکثر رطوبت" hint="۴۰-۷۰٪" error={vErrors.humidityMax}>
          <PercentField placeholder="۷۰" value={form.humidityMax} onChange={e => setForm({ ...form, humidityMax: e.target.value })} />
        </Field>
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

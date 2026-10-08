/**
 * FormModal — فرم افزودن/ویرایش ثبت روزانه
 */
import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';
import { useFlk } from '../../flk/store';
import type { F } from '../types';
import type { Flock } from '../../flk/store';
import { toFa } from '../../../shr/utils/fa';
import { FEED_SYSTEM_LABEL, WATER_SYSTEM_LABEL } from '../../../shr/utils/systemType';
import SmartSelect from '../../../shr/components/SmartSelect';
import { Btn, BtnRow, Field, Grid2, Modal, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import TimePicker from '../../../shr/components/TimePicker';
import { useFormat } from '../../../shr/units';
import { getAgeDays } from '../../flk/store';
import EnvironmentSection from './EnvironmentSection';
import FeedSection from './FeedSection';
import EggsWeightSection from './EggsWeightSection';
import HealthSection from './HealthSection';
import ActivitiesSection from './ActivitiesSection';

export interface FormModalProps {
  open: boolean;
  onClose: () => void;
  form: F;
  setForm: Dispatch<SetStateAction<F>>;
  save: () => void;
  saving: boolean;
  err: string;
  vErrors: Record<string, string>;
  selectedFlock: Flock | undefined;
  flockAliveCount: number;
  isLayerFlock: boolean;
  isLayerType: boolean;
  isFlockMature: boolean;
  vaccineEnabled: boolean;
  medicineEnabled: boolean;
  onFlockChange: (id: string) => void;
}

export default function FormModal(props: FormModalProps) {
  const {
    open, onClose, form, setForm, save, err, vErrors,
    selectedFlock, flockAliveCount, isLayerFlock, isLayerType,
    isFlockMature, vaccineEnabled, medicineEnabled, onFlockChange,
  } = props;

  const { flocks } = useFlk();
  const fmt = useFormat();
  const activeFlocks = useMemo(() => flocks.filter(f => f.status === 'active' && !f.paused && !f.hidden), [flocks]);

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'ویرایش ثبت روزانه' : 'ثبت روزانه جدید'}
      footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}>
      <Grid2>
        <Field label="تاریخ" required>
          <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })} autoToday />
        </Field>
        <Field label="ساعت ورود">
          <TimePicker value={form.entryTime} onChange={v => setForm({ ...form, entryTime: v })} placeholder="انتخاب ساعت" />
        </Field>
      </Grid2>

      <Field label="گله" required>
        <SmartSelect
          value={form.flockId}
          onChange={onFlockChange}
          options={activeFlocks.map(f => ({
            value: f.id, label: f.name,
            subtitle: f.currentCount ? `${toFa(f.currentCount)} پرنده` : undefined,
          }))}
          placeholder="— انتخاب گله —"
          modalTitle="انتخاب گله"
        />
      </Field>

      {flockAliveCount > 0 && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textAlign: 'center' }}>
          تعداد زنده گله: {toFa(flockAliveCount)} پرنده
          {form.feedMethod && ` · دانخوری — ${FEED_SYSTEM_LABEL[form.feedMethod as 'manual' | 'auto'] || '—'}`}
          {form.waterMethod && ` · آبخوری — ${WATER_SYSTEM_LABEL[form.waterMethod as 'manual' | 'nipple' | 'trough' | 'tank'] || '—'}`}
        </div>
      )}

      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🌡 محیط و پرنده</div>
      <EnvironmentSection form={form} setForm={setForm} vErrors={vErrors} />

      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🍽 تغذیه و آب</div>
      <FeedSection form={form} setForm={setForm} vErrors={vErrors} />

      {isLayerType && !isFlockMature && selectedFlock && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--warn)', lineHeight: 1.7, marginBottom: 8 }}>
          💡 این گله هنوز به سن تخم‌گذاری نرسیده ({fmt.int(getAgeDays(selectedFlock))} از {fmt.int(selectedFlock.layingStartDay)} روز). فرم تخم‌گذاری بعد از بلوغ فعال می‌شود.
        </div>
      )}

      {isLayerFlock && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🥚 تخم و وزن</div>
          <EggsWeightSection form={form} setForm={setForm} vErrors={vErrors} flockAliveCount={flockAliveCount} />
        </>
      )}

      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🏥 سلامت</div>
      <HealthSection
        form={form} setForm={setForm} vErrors={vErrors}
        flockAliveCount={flockAliveCount}
        vaccineEnabled={vaccineEnabled}
        medicineEnabled={medicineEnabled}
      />

      <ActivitiesSection form={form} setForm={setForm} />

      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}

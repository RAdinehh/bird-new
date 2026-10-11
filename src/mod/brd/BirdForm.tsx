import { useMemo } from 'react';
import type { Bird } from './store';
import { toFa, toEn } from '../../shr/utils/fa';
import { detectCycleDaysSource, detectFcrSource, getOverrideInfo } from './_source';
import SourceBadge from '../../shr/components/SourceBadge';
import OverrideHint from '../../shr/components/OverrideHint';
import BirdNameField, { type BirdPresetPick } from './BirdNameField';
import { Btn, BtnRow, Field, Grid2, Modal, NumField } from '../../shr/components/ui';

export interface BirdFormData {
  id?: string;
  name: string;
  cycleDays: string;
  fcrStandard: string;
  standardKey?: string;
  birdKind?: 'chicken' | 'duck' | 'turkey' | 'quail' | 'goose';
  purpose?: 'broiler' | 'layer' | 'breeder' | 'dual' | 'ornamental';
  categoryId?: string;
}

export const EMPTY_BIRD_FORM: BirdFormData = {
  name: '', cycleDays: '', fcrStandard: '', standardKey: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
  form: BirdFormData;
  setForm: React.Dispatch<React.SetStateAction<BirdFormData>>;
  error: string;
  birds: Bird[];
  onSave: () => void;
}

export default function BirdForm({ open, onClose, form, setForm, error, birds, onSave }: Props) {
  const overrideCycle = useMemo(() => {
    const cd = form.cycleDays ? parseInt(toEn(form.cycleDays)) || null : null;
    return getOverrideInfo(cd, form.standardKey, 'cycleDays', form.name);
  }, [form.cycleDays, form.standardKey, form.name]);

  const overrideFcr = useMemo(() => {
    const fcr = form.fcrStandard ? parseFloat(toEn(form.fcrStandard).replace('٫', '.')) || null : null;
    return getOverrideInfo(fcr, form.standardKey, 'fcr', form.name);
  }, [form.fcrStandard, form.standardKey, form.name]);

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'ویرایش پرنده' : 'افزودن پرنده'} contentGap={14}
      footer={<BtnRow><Btn variant="primary" onClick={onSave}>ذخیره</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}>
      <Field label="نام پرنده" required hint="انتخاب یا تایپ">
        <BirdNameField
          value={form.name}
          onChange={v => setForm(f => ({ ...f, name: v }))}
          onPick={(pick: BirdPresetPick) => {
            setForm(f => ({
              ...f,
              name: pick.name,
              cycleDays: pick.cycleDays ? toFa(pick.cycleDays) : f.cycleDays,
              fcrStandard: pick.fcrStandard ? toFa(pick.fcrStandard) : f.fcrStandard,
              standardKey: pick.standardKey || f.standardKey,
              birdKind: pick.birdKind || f.birdKind,
              purpose: pick.purpose || f.purpose,
              categoryId: pick.categoryId || f.categoryId,
            }));
          }}
          error={error || undefined}
          excludeNames={birds.filter(b => b.id !== form.id).map(b => b.name)}
        />
      </Field>

      <Grid2>
        <Field
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              چرخه زندگی (روز)
              {(() => {
                const cd = form.cycleDays ? parseInt(toEn(form.cycleDays)) || null : null;
                const src = detectCycleDaysSource(cd, form.standardKey, form.name);
                const source = overrideCycle.overridden ? 'manual' : src.source;
                return <SourceBadge source={source} label={src.label} />;
              })()}
            </span>
          }
          hint="از شروع تا پایان دوره"
        >
          <NumField
            placeholder="۰"
            value={form.cycleDays}
            onChange={e => setForm({ ...form, cycleDays: e.target.value })}
            min={1} max={2000} unit="روز" autoClamp />
          <OverrideHint
            overridden={overrideCycle.overridden}
            stdValue={overrideCycle.stdValue}
            unit="روز"
            decimals={0}
            onReset={() => setForm(f => ({ ...f, cycleDays: overrideCycle.stdValue != null ? toFa(overrideCycle.stdValue) : '' }))}
          />
        </Field>
        <Field
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              FCR استاندارد
              {(() => {
                const fcr = form.fcrStandard ? parseFloat(toEn(form.fcrStandard).replace('٫', '.')) || null : null;
                const src = detectFcrSource(fcr, form.standardKey, form.name);
                const source = overrideFcr.overridden ? 'manual' : src.source;
                return <SourceBadge source={source} label={src.label} />;
              })()}
            </span>
          }
          hint="ضریب تبدیل غذایی مرجع"
        >
          <NumField
            placeholder="۲٫۰"
            value={form.fcrStandard}
            onChange={e => setForm({ ...form, fcrStandard: e.target.value })}
            min={0.5} max={5} unit="FCR" autoClamp />
          <OverrideHint
            overridden={overrideFcr.overridden}
            stdValue={overrideFcr.stdValue}
            unit="FCR"
            decimals={1}
            onReset={() => setForm(f => ({ ...f, fcrStandard: overrideFcr.stdValue != null ? toFa(overrideFcr.stdValue) : '' }))}
          />
        </Field>
      </Grid2>

      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7,
         padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
         marginBottom: 8 }}>
        💡 <b>چرخه زندگی</b> = چند روز طول می‌کشد تا دوره این پرنده کامل شود (گوشتی ۴۲، تخم‌گذار ۵۰۰). <b>FCR</b> = چند کیلو دان برای ۱ کیلو وزن (۱.۶ عالی، ۱.۸ متوسط، ۲.۰+ ضعیف).
      </div>
    </Modal>
  );
}

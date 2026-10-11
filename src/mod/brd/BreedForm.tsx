import type { Bird, Breed } from './store';
import { toFa, toEn } from '../../shr/utils/fa';
import { detectBreedFcrSource, getBreedFcrBaseline } from './_source';
import { useOverride } from '../../shr/hooks/useOverride';
import SourceBadge from '../../shr/components/SourceBadge';
import OverrideHint from '../../shr/components/OverrideHint';
import BreedNameField, { type BreedPick } from './BreedNameField';
import SmartSelect from '../../shr/components/SmartSelect';
import { Btn, BtnRow, Field, Modal, NumField, ErrorBox } from '../../shr/components/ui';

export interface BreedFormData {
  id: string;
  birdId: string;
  name: string;
  fcr: string;
  standardKey: string;
}

export const EMPTY_BREED_FORM: BreedFormData = {
  id: '', birdId: '', name: '', fcr: '', standardKey: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
  form: BreedFormData;
  setForm: React.Dispatch<React.SetStateAction<BreedFormData>>;
  err: string;
  birds: Bird[];
  breeds: Breed[];
  onSave: () => void;
  customStandards?: Record<string, any>;
}

export default function BreedForm({ open, onClose, form, setForm, err, birds, breeds, onSave, customStandards = {} }: Props) {
  const parentBird = birds.find(x => x.id === form.birdId);
  const fcrBaseline = getBreedFcrBaseline(form.standardKey, parentBird?.fcrStandard ?? null);
  const fcrCurrent = form.fcr ? parseFloat(toEn(form.fcr).replace('٫', '.')) || null : null;
  const { hint: fcrHint } = useOverride({
    current: fcrCurrent,
    stdValue: fcrBaseline.value,
    onReset: () => setForm(f => ({ ...f, fcr: fcrBaseline.value != null ? toFa(fcrBaseline.value) : '' })),
    unit: 'FCR',
    decimals: 1,
  });

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'ویرایش نژاد' : 'افزودن نژاد'}
      footer={<BtnRow><Btn variant="primary" onClick={onSave}>ذخیره</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}>
      <Field label="پرنده" required>
        <SmartSelect
          value={form.birdId}
          onChange={v => {
            const parent = birds.find(x => x.id === v);
            setForm(f => ({
              ...f,
              birdId: v,
              fcr: !f.fcr && parent?.fcrStandard ? toFa(parent.fcrStandard) : f.fcr,
            }));
          }}
          options={birds.map(c => ({
            value: c.id,
            label: c.name,
            subtitle: c.fcrStandard ? `FCR ${toFa(c.fcrStandard)}` : undefined,
          }))}
          placeholder="— انتخاب کنید —"
          modalTitle="انتخاب پرنده"
          autoThreshold={6}
        />
      </Field>
      <Field label="نام نژاد" required hint="انتخاب یا تایپ">
        <BreedNameField
          value={form.name}
          onChange={v => setForm(f => ({ ...f, name: v }))}
          onPick={(pick: BreedPick) => {
            setForm(f => ({
              ...f,
              name: pick.name,
              standardKey: pick.standardKey || f.standardKey,
              fcr: pick.fcr !== null ? toFa(pick.fcr) : f.fcr,
            }));
          }}
          excludeNames={breeds
            .filter(b => b.id !== form.id && b.birdId === form.birdId)
            .map(b => b.name)}
          parentBirdName={parentBird?.name}
          parentPurpose={(parentBird as any)?.purpose}
            customStandards={customStandards}
        />
      </Field>

      <Field
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            FCR
            {(() => {
              const fcr = form.fcr ? parseFloat(toEn(form.fcr).replace('٫', '.')) || null : null;
              const src = detectBreedFcrSource(fcr, form.standardKey, parentBird?.fcrStandard ?? null);
              const source = fcrHint.overridden ? 'manual' : src.source;
              return <SourceBadge source={source} label={src.label} />;
            })()}
          </span>
        }
        hint="کیلوگرم دان برای هر کیلوگرم رشد"
      >
        <NumField
          placeholder="۲٫۰"
          value={form.fcr}
          onChange={e => setForm({ ...form, fcr: e.target.value })}
          min={0.5} max={5} unit="FCR" autoClamp
        />
        <OverrideHint {...fcrHint} />
      </Field>
      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}

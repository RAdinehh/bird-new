import type { Bird } from './store';
import BirdNameField, { type BirdPresetPick } from './BirdNameField';
import { Btn, BtnRow, Field, Modal } from '../../shr/components/ui';

export interface BirdFormData {
  id?: string;
  name: string;
  standardKey?: string;
  birdKind?: string;
}

export const EMPTY_BIRD_FORM: BirdFormData = {
  name: '', standardKey: '',
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
              standardKey: pick.standardKey || f.standardKey,
              birdKind: pick.birdKind || f.birdKind,
            }));
          }}
          error={error || undefined}
          excludeNames={birds.filter(b => b.id !== form.id).map(b => b.name)}
        />
      </Field>

      {/* طبق مدل صنعت: چرخه و FCR مالِ نژادن، نه پرنده */}
    </Modal>
  );
}

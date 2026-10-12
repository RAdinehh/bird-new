import { useMemo } from 'react';
import type { Bird } from './store';
import BirdNameField, { type BirdPresetPick } from './BirdNameField';
import { Btn, BtnRow, Field, Modal } from '../../shr/components/ui';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { DEFAULT_SPECIES } from './species';
import { useSet } from '../set/store';

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
  onErrorClear?: () => void;
}

// ═══ کارت اطلاعات (2 ستونه) ═══
function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      padding: 'var(--pad-tight)',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)', fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function BirdForm({ open, onClose, form, setForm, error, birds, onSave, onErrorClear }: Props) {
  const customSpecies = useSet((st: any) => st.customSpecies || []);

  // آمار runtime — بر اساس نام فعلی (نه birdKind قدیمی)
  const stats = useMemo(() => {
    const trimmed = form.name.trim();
    if (!trimmed) return null;

    // نام فعلی رو با species ها match کن
    const allSpecies = [...DEFAULT_SPECIES, ...customSpecies];
    const matched = allSpecies.find(
      (s: any) => s.nameFa.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (!matched) return null;

    const matching = Object.values(DEFAULT_STANDARDS).filter(
      (s: any) => s.birdKind === matched.kind
    );

    if (matching.length === 0) return null;

    const native = matching.filter((s: any) => s.category === 'native').length;
    const industrial = matching.filter((s: any) => s.category === 'industrial').length;
    const fancy = matching.filter((s: any) => s.category === 'fancy').length;

    // بازه سن (cullDay)
    const culls = matching
      .map((s: any) => s.biology?.cullDay)
      .filter((c: any) => typeof c === 'number' && c > 0) as number[];

    const minAge = culls.length > 0 ? Math.min(...culls) : null;
    const maxAge = culls.length > 0 ? Math.max(...culls) : null;

    return {
      total: matching.length,
      native,
      industrial,
      fancy,
      minAge,
      maxAge,
    };
  }, [form.name, customSpecies]);

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'ویرایش پرنده' : 'افزودن پرنده'} contentGap={14}
      footer={<BtnRow><Btn variant="primary" onClick={onSave}>ذخیره</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}>
      <Field label="نام پرنده" required hint="انتخاب یا تایپ">
        <BirdNameField
          value={form.name}
          onChange={v => {
            onErrorClear?.();
            setForm(f => ({ ...f, name: v }));
          }}
          onPick={(pick: BirdPresetPick) => {
            onErrorClear?.();
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

      {/* 🆕 کارت اطلاعات (پویا — فقط بعد از انتخاب پرنده) */}
      {stats && (
        <div style={{ marginTop: 8 }}>
          <div style={{
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            color: 'var(--muted)',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            📊 اطلاعات {form.name}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
          }}>
            <StatBox icon="🧬" label="تعداد نژاد" value={`${stats.total} نژاد`} />
            <StatBox
              icon="⏱"
              label="بازه سن"
              value={
                stats.minAge != null
                  ? `${stats.minAge}–${stats.maxAge} روز`
                  : '—'
              }
            />
            <StatBox icon="🌾" label="بومی" value={`${stats.native} نژاد`} />
            <StatBox icon="🏭" label="صنعتی" value={`${stats.industrial} نژاد`} />
            {stats.fancy > 0 && (
              <StatBox icon="🎨" label="تزئینی" value={`${stats.fancy} نژاد`} />
            )}
          </div>
        </div>
      )}

      <div style={{
        fontSize: 'var(--fs-xs)',
        color: 'var(--muted)',
        lineHeight: 1.7,
        padding: 'var(--pad-normal)',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-sm)',
        marginTop: 8,
      }}>
        💡 بعد از ذخیره، برو تب <b>نژادها</b> تا نژادهای این پرنده رو اضافه کنی.
      </div>
    </Modal>
  );
}

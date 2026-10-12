import type { Bird, Breed } from './store';
import { toFa, toEn } from '../../shr/utils/fa';
import { detectBreedFcrSource, getBreedFcrBaseline } from './_source';
import { useOverride } from '../../shr/hooks/useOverride';
import SourceBadge from '../../shr/components/SourceBadge';
import OverrideHint from '../../shr/components/OverrideHint';
import BreedNameField, { type BreedPick } from './BreedNameField';
import SmartSelect from '../../shr/components/SmartSelect';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { Btn, BtnRow, Field, Modal, NumField, ErrorBox } from '../../shr/components/ui';
import { toastMsg } from '../../cor/store/toast';

export interface BreedFormData {
  id: string;
  birdId: string;
  name: string;
  fcr: string;
  standardKey: string;
  purposes: string[];
}

export const EMPTY_BREED_FORM: BreedFormData = {
  id: '', birdId: '', name: '', fcr: '', standardKey: '', purposes: [],
};

// ═══ چک‌باکس‌های هدف ═══
const PURPOSE_OPTIONS = [
  { key: 'layer',      label: 'تخم‌گذار', icon: '🥚' },
  { key: 'breeder',    label: 'مادر',     icon: '🐣' },
  { key: 'broiler',    label: 'گوشتی',    icon: '🍗' },
  { key: 'ornamental', label: 'تزئینی',   icon: '🎨' },
];

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
  customOverrides?: Record<string, any>;
}

export default function BreedForm({ open, onClose, form, setForm, err, birds, breeds, onSave, customStandards = {}, customOverrides = {} }: Props) {
  const parentBird = birds.find(x => x.id === form.birdId);
  const fcrBaseline = getBreedFcrBaseline(form.standardKey, null);
  const fcrCurrent = form.fcr ? parseFloat(toEn(form.fcr).replace('٫', '.')) || null : null;
  const { hint: fcrHint } = useOverride({
    current: fcrCurrent,
    stdValue: fcrBaseline.value,
    onReset: () => setForm(f => ({ ...f, fcr: fcrBaseline.value != null ? toFa(fcrBaseline.value) : '' })),
    unit: 'FCR',
    decimals: 1,
  });

  // اطلاعات استاندارد برای نمایش
  const std = form.standardKey
    ? ((() => {
        const k = form.standardKey!;
        const base = (DEFAULT_STANDARDS as any)[k];
        const custom = customStandards[k];
        const ov = customOverrides[k];
        let merged: any = { ...(base || {}), ...(custom || {}) };
        if (ov?.nameFa) merged.nameFa = ov.nameFa;
        if (ov?.source) merged.source = ov.source;
        if (ov?.publishYear) merged.publishYear = ov.publishYear;
        return merged;
      })())
    : null;

  const togglePurpose = (key: string) => {
    const current = form.purposes || [];
    const has = current.includes(key);

    // اعتبارسنجی بیرون از setForm (چون StrictMode دوبار صدا می‌زنه)
    if (!has && current.length >= 2) {
      toastMsg.info('حداکثر ۲ هدف می‌تونی انتخاب کنی — یکی رو بردار');
      return;
    }

    setForm(f => ({
      ...f,
      purposes: has
        ? (f.purposes || []).filter(p => p !== key)
        : [...(f.purposes || []), key],
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'ویرایش نژاد' : 'افزودن نژاد'}
      footer={<BtnRow><Btn variant="primary" onClick={onSave}>ذخیره</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <Field label="پرنده" required>
        <SmartSelect
          value={form.birdId}
          onChange={v => {
            // وقتی پرنده عوض می‌شه، نژاد + هدف + FCR ریست شن
            setForm(f => ({
              ...f,
              birdId: v,
              name: '',
              standardKey: '',
              fcr: '',
              purposes: [],
            }));
          }}
          options={birds.map(c => ({
            value: c.id,
            label: c.name,
            subtitle: undefined,
          }))}
          placeholder="— انتخاب کنید —"
          modalTitle="انتخاب پرنده"
          autoThreshold={6}
        />
      </Field>

      <Field label="نام نژاد" required hint="انتخاب یا تایپ">
        <BreedNameField
          value={form.name}
          onChange={v => setForm(f => {
            // 🆕 merge با overrides برای nameFa
            const baseStandards = { ...(DEFAULT_STANDARDS as any), ...customStandards };
            const allStandards: Record<string, any> = {};
            for (const [k, v] of Object.entries(baseStandards)) {
              const ov = customOverrides[k];
              allStandards[k] = ov?.nameFa ? { ...(v as any), nameFa: ov.nameFa } : v;
            }
            const trimmed = v.trim().toLowerCase();
            if (!trimmed) return { ...f, name: v, standardKey: '' };

            // 🆕 تلاش برای match با استانداردها
            const match = Object.entries(allStandards).find(
              ([_, std]: [string, any]) =>
                std?.nameFa?.trim().toLowerCase() === trimmed
            ) as [string, any] | undefined;

            if (match) {
              const [key, std] = match;
              const last = std?.growth?.weightByAge?.slice(-1)?.[0];
              return {
                ...f,
                name: v,
                standardKey: key,
                fcr: last?.fcr != null ? toFa(last.fcr) : f.fcr,
              };
            }

            return { ...f, name: v, standardKey: '' };
          })}
          onPick={(pick: BreedPick) => {
            // کاربر خودش هدف رو انتخاب می‌کنه — بدون auto-fill
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
          parentKind={(parentBird as any)?.birdKind}
          customStandards={customStandards}
        />
      </Field>
      </div>

      {/* 🆕 هدف پرورش */}
      <Field label="هدف پرورش" hint="می‌تونی چند تا انتخاب کنی">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PURPOSE_OPTIONS.map(opt => {
            const active = (form.purposes || []).includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => togglePurpose(opt.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '7px 12px',
                  background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Field>

      {/* اطلاعات استاندارد (نمایش) */}
      {std && (
        <div style={{
          padding: 'var(--pad-normal)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 2, fontSize: 'var(--fs-sm)' }}>
            📚 {std.nameFa}
          </div>
          {(std.source || std.publishYear) && (
            <div style={{ fontSize: 'var(--fs-2xs)', opacity: 0.85, marginBottom: 3 }}>
              {std.source}{std.publishYear && ` · ${std.publishYear}`}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
            {std.production?.eggsPerYear && <div>🥚 {toFa(std.production.eggsPerYear)} تخم/سال</div>}
            {std.biology?.layingStartDay && <div>📅 روز {toFa(std.biology.layingStartDay)}</div>}
            {std.production?.peakLayingPct && <div>📊 اوج {toFa(std.production.peakLayingPct)}٪</div>}
            {std.production?.fertilityPct && <div>🐣 باروری {toFa(std.production.fertilityPct)}٪</div>}
            {std.production?.hatchabilityPct && <div>🐣 هچ {toFa(std.production.hatchabilityPct)}٪</div>}
          </div>
        </div>
      )}

      <Field
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            FCR
            {(() => {
              const fcr = form.fcr ? parseFloat(toEn(form.fcr).replace('٫', '.')) || null : null;
              const src = detectBreedFcrSource(fcr, form.standardKey, null);
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

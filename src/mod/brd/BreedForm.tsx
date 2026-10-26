import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Bird, Breed } from './store';
import { toFa, toEn } from '../../shr/utils/fa';
import { detectBreedFcrSource, getBreedFcrBaseline } from './_source';
import { resolveStandard } from './_display-values';
import { useOverride } from '../../shr/hooks/useOverride';
import SourceBadge from '../../shr/components/SourceBadge';
import OverrideHint from '../../shr/components/OverrideHint';
import BreedNameField, { type BreedPick } from './BreedNameField';
import SmartSelect from '../../shr/components/SmartSelect';
import { FieldHint } from '../../shr/intelligence';
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

const PURPOSE_OPTIONS = [
  { key: 'layer',      label: 'تخم‌گذار', icon: '🥚' },
  { key: 'breeder',    label: 'مادر',     icon: '🐣' },
  { key: 'broiler',    label: 'گوشتی',    icon: '🍗' },
  { key: 'ornamental', label: 'تزئینی',   icon: '🎨' },
];

const BreedFormSchema = z.object({
  id: z.string(),
  birdId: z.string().min(1, 'پرنده را انتخاب کنید'),
  name: z.string().trim().min(1, 'نام نژاد را وارد کنید').max(100, 'نام نژاد بیش از حد طولانی است'),
  fcr: z.string().optional().default(''),
  standardKey: z.string().optional().default(''),
  purposes: z.array(z.string()).optional().default([]),
});

interface Props {
  open: boolean;
  onClose: () => void;
  initialData: BreedFormData;
  birds: Bird[];
  breeds: Breed[];
  onSaved: (data: BreedFormData) => void;
  onRedirectToStandards?: (name: string) => void;
  customStandards?: Record<string, any>;
  customOverrides?: Record<string, any>;
}

export default function BreedForm({
  open, onClose, initialData, birds, breeds, onSaved, onRedirectToStandards,
  customStandards = {}, customOverrides = {},
}: Props) {
  const methods = useForm<BreedFormData>({
    resolver: zodResolver(BreedFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: initialData,
  });
  const { control, setValue, setError, handleSubmit, formState: { errors } } = methods;
  const [businessError] = useState('');

  useEffect(() => {
    if (open) methods.reset(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  const watchedStandardKey = useWatch({ control, name: 'standardKey' }) || '';
  const watchedFcr = useWatch({ control, name: 'fcr' }) || '';
  const watchedPurposes = useWatch({ control, name: 'purposes' }) || [];
  const watchedBirdId = useWatch({ control, name: 'birdId' }) || '';

  const parentBird = birds.find(x => x.id === watchedBirdId);
  const fcrBaseline = getBreedFcrBaseline(watchedStandardKey, null);
  const fcrCurrent = watchedFcr ? parseFloat(toEn(watchedFcr).replace('٫', '.')) || null : null;
  const { hint: fcrHint } = useOverride({
    current: fcrCurrent,
    stdValue: fcrBaseline.value,
    onReset: () => setValue('fcr', fcrBaseline.value != null ? toFa(fcrBaseline.value) : ''),
    unit: 'FCR',
    decimals: 1,
  });

  const std = resolveStandard(watchedStandardKey, customStandards, customOverrides);

  const togglePurpose = (key: string) => {
    const has = watchedPurposes.includes(key);
    if (!has && watchedPurposes.length >= 2) {
      toastMsg.info('حداکثر ۲ هدف می‌تونی انتخاب کنی — یکی رو بردار');
      return;
    }
    setValue('purposes', has
      ? watchedPurposes.filter(p => p !== key)
      : [...watchedPurposes, key], { shouldDirty: true });
  };

  const onSubmit = handleSubmit((data) => {
    const trimmed = data.name.trim();

    if (!data.id) {
      const newPurposes = (data.purposes || []).slice().sort().join(',');
      const dup = breeds.find((x) => {
        if (x.birdId !== data.birdId) return false;
        if (x.name.trim() !== trimmed) return false;
        return (x.purposes || []).slice().sort().join(',') === newPurposes;
      });
      if (dup) {
        setError('name', { type: 'manual', message: 'این نژاد با این هدف قبلاً ثبت شده است' });
        return;
      }
    }

    if (!data.purposes || data.purposes.length === 0) {
      setError('purposes', { type: 'manual', message: 'حداقل یک هدف انتخاب کنید' });
      return;
    }

    const allStandardKeys = new Set([
      ...Object.keys(DEFAULT_STANDARDS),
      ...Object.keys(customStandards || {}),
    ]);
    const baseStandards: Record<string, any> = {};
    for (const k of allStandardKeys) {
      const s = resolveStandard(k, customStandards, customOverrides);
      if (s) baseStandards[k] = s;
    }
    const allStandards: Record<string, any> = {};
    for (const [k, v] of Object.entries(baseStandards)) {
      const ov = customOverrides[k];
      allStandards[k] = ov?.nameFa ? { ...(v as any), nameFa: ov.nameFa } : v;
    }

    const trimmedLower = trimmed.toLowerCase();
    let finalKey = data.standardKey || '';
    let finalName = trimmed;

    const matchedByKey = finalKey ? allStandards[finalKey] : null;
    if (matchedByKey) {
      const stdName = matchedByKey.nameFa?.trim() || '';
      if (stdName.toLowerCase() !== trimmedLower) {
        const baseStd = resolveStandard(finalKey, customStandards, customOverrides);
        if (baseStd?.nameFa?.trim().toLowerCase() === trimmedLower) {
          finalName = stdName;
        } else {
          setError('name', { type: 'manual', message: `نام نژاد با استاندارد «${stdName}» هماهنگ نیست` });
          return;
        }
      }
    } else {
      const matchedByName = Object.entries(allStandards).find(
        ([_, s]: [string, any]) => s?.nameFa?.trim().toLowerCase() === trimmedLower
      );
      if (!matchedByName) {
        onRedirectToStandards?.(trimmed);
        return;
      }
      finalKey = matchedByName[0];
    }

    onSaved({ ...data, name: finalName, standardKey: finalKey });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData.id ? 'ویرایش نژاد' : 'افزودن نژاد'}
      footer={<BtnRow><Btn variant="primary" onClick={onSubmit}>ذخیره</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="پرنده" required error={errors.birdId?.message}>
          <Controller
            name="birdId"
            control={control}
            render={({ field }) => (
              <SmartSelect
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  setValue('name', ''); setValue('standardKey', '');
                  setValue('fcr', ''); setValue('purposes', []);
                }}
                error={errors.birdId?.message}
                options={birds.map(c => ({ value: c.id, label: c.name }))}
                placeholder="— انتخاب کنید —"
                modalTitle="انتخاب پرنده"
                autoThreshold={6}
              />
            )}
          />
        </Field>

        <Field label="نام نژاد" required hint="انتخاب یا تایپ" error={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <BreedNameField
                error={errors.name?.message}
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  const t = v.trim().toLowerCase();
                  if (!t) { setValue('standardKey', ''); return; }
                  const allStandards: Record<string, any> = {};
                  const allKeys = new Set([...Object.keys(DEFAULT_STANDARDS), ...Object.keys(customStandards)]);
                  for (const k of allKeys) {
                    const s = resolveStandard(k, customStandards, customOverrides);
                    if (s) allStandards[k] = s;
                  }
                  const match = Object.entries(allStandards).find(
                    ([_, s]: [string, any]) => s?.nameFa?.trim().toLowerCase() === t
                  );
                  if (match) {
                    setValue('standardKey', match[0]);
                    const last = (match[1] as any)?.growth?.weightByAge?.slice(-1)?.[0];
                    if (last?.fcr != null) setValue('fcr', toFa(last.fcr));
                  }
                }}
                onPick={(pick: BreedPick) => {
                  field.onChange(pick.name);
                  if (pick.standardKey) setValue('standardKey', pick.standardKey);
                  if (pick.fcr !== null) setValue('fcr', toFa(pick.fcr));
                }}
                parentBirdName={parentBird?.name}
                parentKind={(parentBird as any)?.birdKind}
                customStandards={customStandards}
                customOverrides={customOverrides}
              />
            )}
          />
        </Field>
      </div>

      <Field label="هدف پرورش" hint="می‌تونی چند تا انتخاب کنی" error={errors.purposes?.message}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PURPOSE_OPTIONS.map(opt => {
            const active = watchedPurposes.includes(opt.key);
            return (
              <button key={opt.key} type="button" onClick={() => togglePurpose(opt.key)}
                style={{ padding: '7px 12px', background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)', color: active ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                  fontWeight: active ? 700 : 500, cursor: 'pointer' }}>
                <span>{opt.icon}</span> <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Field>

      {std && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 2, fontSize: 'var(--fs-sm)' }}>
            📚 {std.nameFa}
          </div>
          {(std.source || std.publishYear) && (
            <div style={{ fontSize: 'var(--fs-2xs)', opacity: 0.85, marginBottom: 3 }}>
              {std.source}{std.publishYear && ` • ${std.publishYear}`}
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
        label={<span style={{ display: 'inline-flex', alignItems: 'center' }}>FCR
          {(() => {
            const src = detectBreedFcrSource(fcrCurrent, watchedStandardKey, null);
            const source = fcrHint.overridden ? 'manual' : src.source;
            return <SourceBadge source={source} label={src.label} />;
          })()}
        </span>}
        hint="کیلوگرم دان برای هر کیلوگرم رشد"
        error={errors.fcr?.message}
      >
        <Controller
          name="fcr"
          control={control}
          render={({ field }) => (
            <NumField placeholder="۲٫۰" value={field.value} onChange={field.onChange}
              min={0.5} max={5} unit="FCR" autoClamp />
          )}
        />
        <OverrideHint {...fcrHint} />
        <FieldHint
          fieldPath="brd.fcr"
          value={fcrCurrent}
          context={{
            standardKey: watchedStandardKey,
            expected: fcrBaseline.value ?? undefined,
            expectedSource: 'context',
            expectedLabel: fcrBaseline.kind === 'standard'
              ? `استاندارد ${fcrBaseline.label}`
              : fcrBaseline.kind === 'parent' ? 'FCR والد' : undefined,
          }}
        />
      </Field>

      <ErrorBox>{businessError}</ErrorBox>
    </Modal>
  );
}

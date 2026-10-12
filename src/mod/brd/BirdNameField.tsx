/**
 * BirdNameField.tsx — انتخاب پرنده (گونه) با Bottom Sheet
 *
 * طبق FOUNDATION قانون ۱۶ (Master Data vs Operations):
 *   - Master: /set?tab=config (افزودن پرنده + نژاد)
 *   - Operations: /brd?tab=birds (فقط انتخاب)
 *
 * اگه پرنده نبود → پیام + دکمه به Master
 */
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AutocompleteSheet, { type AutoOption } from '../../shr/components/AutocompleteSheet';
import { Btn, BtnRow, Modal } from '../../shr/components/ui';
import { DEFAULT_SPECIES, type Species } from './species';
import { useSet } from '../set/store';
import { getMasterPath } from './data-ownership';

export interface BirdPresetPick {
  name: string;
  standardKey?: string;
  isCustom: boolean;
  birdKind?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick: (pick: BirdPresetPick) => void;
  error?: string;
  openManageSignal?: number;
}

export default function BirdNameField({ value, onChange, onPick, error, openManageSignal }: Props) {
  const navigate = useNavigate();
  const customSpecies = useSet((st: any) => st.customSpecies || []);
  const [notFound, setNotFound] = useState<string | null>(null);

  // signal از parent
  useEffect(() => {
    if (openManageSignal && openManageSignal > 0) {
      setNotFound(value || 'پرنده');
    }
  }, [openManageSignal, value]);

  const allSpecies: Species[] = useMemo(() => {
    return [...DEFAULT_SPECIES, ...customSpecies];
  }, [customSpecies]);

  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];

    for (const sp of allSpecies) {
      opts.push({
        value: 'species:' + sp.kind,
        label: sp.nameFa,
        icon: sp.icon,
        group: sp.builtIn ? 'builtin' : 'custom',
        groupLabel: sp.builtIn ? 'پرنده‌های اصلی' : 'پرنده‌های سفارشی',
        groupIcon: sp.builtIn ? '🐔' : '⭐',
      });
    }

    return opts;
  }, [allSpecies]);

  const handleSelect = (opt: AutoOption) => {
    const kind = opt.value.replace('species:', '');
    const sp = allSpecies.find(s => s.kind === kind);
    if (!sp) return;

    onPick({
      name: sp.nameFa,
      standardKey: undefined,
      isCustom: !sp.builtIn,
      birdKind: sp.kind,
    });
  };

  const handleCustomText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // چک کن که قبلاً توی گونه‌ها هست یا نه
    const existing = allSpecies.find(
      s => s.nameFa.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      onPick({
        name: existing.nameFa,
        isCustom: !existing.builtIn,
        birdKind: existing.kind,
      });
      return;
    }

    // نیست → Master Data Modal
    setNotFound(trimmed);
  };

  return (
    <>
      <Modal
        open={!!notFound}
        onClose={() => setNotFound(null)}
        title="پرنده پیدا نشد"
        footer={
          <BtnRow>
            <Btn variant="primary" onClick={() => {
              setNotFound(null);
              navigate(getMasterPath('species'));
            }}>رفتن به تنظیمات</Btn>
            <Btn onClick={() => setNotFound(null)}>بستن</Btn>
          </BtnRow>
        }
      >
        <div style={{ padding: 'var(--pad-normal)', lineHeight: 1.8, textAlign: 'center' }}>
          <div style={{ fontSize: '2em', marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>«{notFound}» توی استانداردها نیست</div>
          <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
            برای ساختنش برو تنظیمات → پیکربندی → استانداردها
          </div>
        </div>
      </Modal>

      <AutocompleteSheet
        value={value}
        onChange={onChange}
        onSelect={handleSelect}
        onSubmit={handleCustomText}
        hideCustom
        options={options}
        placeholder="مثلاً — مرغ یا بوقلمون"
        title="انتخاب پرنده"
        error={error}
      />
    </>
  );
}

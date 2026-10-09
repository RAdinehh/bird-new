/**
 * BirdNameField.tsx — فیلد نام پرنده با Bottom Sheet
 *
 * طبق استاندارد docs/STANDARDS.md بخش ۷.۵:
 *   - Bottom Sheet (نه Dropdown)
 *   - ۵ مورد اول + «نمایش N مورد دیگر»
 *   - جستجو اختیاری (بدون focus)
 */
import { useMemo } from 'react';
import AutocompleteSheet, { type AutoOption } from '../../shr/components/AutocompleteSheet';
import { BIRD_PRESETS } from './presets';

export interface BirdPresetPick {
  name: string;
  cycleDays: number | null;
  fcrStandard: number | null;
  standardKey?: string;
  isCustom: boolean;
  /** 🆕 نوع پرنده */
  birdKind?: 'chicken' | 'duck' | 'turkey' | 'quail' | 'goose';
  /** 🆕 هدف پرورش */
  purpose?: 'broiler' | 'layer' | 'breeder' | 'dual' | 'ornamental';
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick: (pick: BirdPresetPick) => void;
  error?: string;
  excludeNames?: string[];
}

function birdIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('اردک')) return '🦆';
  if (n.includes('بوقلمون')) return '🦃';
  if (n.includes('بلدرچین')) return '🐦';
  if (n.includes('غاز')) return '🦢';
  if (n.includes('مرغ') || n.includes('جوجه')) return '🐔';
  return '🥚';
}

function birdGroup(name: string): { group: string; groupLabel: string } {
  const n = name.toLowerCase();
  if (n.includes('اردک')) return { group: 'duck', groupLabel: '🦆 اردک' };
  if (n.includes('بوقلمون')) return { group: 'turkey', groupLabel: '🦃 بوقلمون' };
  if (n.includes('بلدرچین')) return { group: 'quail', groupLabel: '🐦 بلدرچین' };
  if (n.includes('غاز')) return { group: 'goose', groupLabel: '🦢 غاز' };
  if (n.includes('مرغ') || n.includes('جوجه')) return { group: 'chicken', groupLabel: '🐔 مرغ' };
  return { group: 'other', groupLabel: 'سایر' };
}

export default function BirdNameField({ value, onChange, onPick, error, excludeNames = [] }: Props) {
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    for (const [name, preset] of Object.entries(BIRD_PRESETS)) {
      if (exclude.has(name.toLowerCase())) continue;
      const g = birdGroup(name);
      opts.push({
        value: 'preset:' + name,
        label: name,
        icon: birdIcon(name),
        group: g.group,
        groupLabel: g.groupLabel,
      });
    }

    return opts;
  }, [excludeNames]);

  const handleSelect = (opt: AutoOption) => {
    const presetName = opt.value.replace('preset:', '');
    const preset = BIRD_PRESETS[presetName];
    if (preset) {
      onPick({
        name: preset.name,
        cycleDays: preset.cycleDays,
        fcrStandard: preset.fcrStandard,
        isCustom: false,
        birdKind: preset.birdKind,
        purpose: preset.purpose,
      });
    }
  };

  const handleCustom = (text: string) => {
    onPick({
      name: text,
      cycleDays: null,
      fcrStandard: null,
      isCustom: true,
    });
  };

  return (
    <AutocompleteSheet
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      onSubmit={handleCustom}
      options={options}
      placeholder="مثلاً — مرغ یا شترمرغ"
      customLabel="افزودن پرنده دلخواه"
      title="انتخاب پرنده"
      error={error}
    />
  );
}

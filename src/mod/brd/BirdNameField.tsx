/**
 * BirdNameField.tsx — فیلد نام پرنده با Bottom Sheet
 *
 * طبق استاندارد Material Design 3 و GOV.UK:
 *   - Bottom Sheet به جای Dropdown (چون موبایلیم)
 *   - حداکثر ۵ پیشنهاد (GOV.UK)
 *   - «افزودن دلخواه» همیشه در دسترس
 */
import { useMemo } from 'react';
import AutocompleteInline, { type AutoOption } from '../../shr/components/AutocompleteInline';
import { BIRD_PRESETS } from './presets';

export interface BirdPresetPick {
  name: string;
  cycleDays: number | null;
  fcrStandard: number | null;
  standardKey?: string;
  isCustom: boolean;
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

export default function BirdNameField({ value, onChange, onPick, error, excludeNames = [] }: Props) {
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    for (const [name, preset] of Object.entries(BIRD_PRESETS)) {
      if (exclude.has(name.toLowerCase())) continue;
      opts.push({
        value: 'preset:' + name,
        label: name,
        icon: birdIcon(name),
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
    <AutocompleteInline
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      onSubmit={handleCustom}
      options={options}
      placeholder="مثلاً — مرغ یا شترمرغ"
      customLabel="افزودن پرنده دلخواه"
      maxSuggestions={5}
      error={error}
    />
  );
}

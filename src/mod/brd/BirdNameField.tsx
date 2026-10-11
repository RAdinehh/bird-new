/**
 * BirdNameField.tsx — فیلد نام پرنده با Bottom Sheet
 *
 * مدل سه‌سطحی (طبق FOUNDATION بخش ۵):
 *   Species → Purpose → Breed/Standard
 *   بجای «مرغ» خالی، مستقیم استاندارد خاص پیشنهاد می‌شه.
 */
import { useMemo } from 'react';
import AutocompleteSheet, { type AutoOption } from '../../shr/components/AutocompleteSheet';
import { DEFAULT_STANDARDS } from '../set/standards/data';

export interface BirdPresetPick {
  name: string;
  cycleDays: number | null;
  fcrStandard: number | null;
  standardKey?: string;
  isCustom: boolean;
  birdKind?: 'chicken' | 'duck' | 'turkey' | 'quail' | 'goose';
  purpose?: 'broiler' | 'layer' | 'breeder' | 'dual' | 'ornamental';
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick: (pick: BirdPresetPick) => void;
  error?: string;
  excludeNames?: string[];
}

// ═══ گروه‌بندی بر اساس هدف پرورش ═══
const PURPOSE_GROUPS: Record<string, { label: string; icon: string; order: number }> = {
  broiler:    { label: 'گوشتی',    icon: '🍗', order: 1 },
  layer:      { label: 'تخم‌گذار', icon: '🥚', order: 2 },
  breeder:    { label: 'مادر',     icon: '🐣', order: 3 },
  dual:       { label: 'دوگانه',   icon: '🔄', order: 4 },
  ornamental: { label: 'تزئینی',   icon: '🎨', order: 5 },
};

const KIND_ICONS: Record<string, string> = {
  chicken: '🐔', duck: '🦆', turkey: '🦃', quail: '🐦', goose: '🦢',
};

export default function BirdNameField({ value, onChange, onPick, error, excludeNames = [] }: Props) {
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    for (const [key, std] of Object.entries(DEFAULT_STANDARDS)) {
      if (exclude.has(std.nameFa.toLowerCase())) continue;

      const purpose = std.primaryPurpose || 'broiler';
      const group = PURPOSE_GROUPS[purpose] || PURPOSE_GROUPS.broiler;
      const kindIcon = KIND_ICONS[std.birdKind || 'chicken'] || '🥚';

      opts.push({
        value: 'standard:' + key,
        label: std.nameFa,
        icon: kindIcon,
        group: purpose,
        groupLabel: `${group.icon} ${group.label}`,
        groupIcon: group.icon,
      });
    }

    // مرتب‌سازی بر اساس ترتیب گروه
    return opts.sort((a, b) => {
      const oa = PURPOSE_GROUPS[a.group || '']?.order || 99;
      const ob = PURPOSE_GROUPS[b.group || '']?.order || 99;
      return oa - ob;
    });
  }, [excludeNames]);

  const handleSelect = (opt: AutoOption) => {
    const key = opt.value.replace('standard:', '');
    const std = (DEFAULT_STANDARDS as any)[key];
    if (!std) return;

    const lastGrowth = std.growth?.weightByAge?.[std.growth.weightByAge.length - 1];

    onPick({
      name: std.nameFa,
      cycleDays: std.biology?.cullDay ?? null,
      fcrStandard: lastGrowth?.fcr ?? null,
      standardKey: key,
      isCustom: false,
      birdKind: std.birdKind,
      purpose: std.primaryPurpose,
    });
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
      placeholder="مثلاً — راس ۳۰۸ یا مرندی"
      customLabel="افزودن پرنده دلخواه"
      title="انتخاب پرنده / نژاد"
      error={error}
    />
  );
}

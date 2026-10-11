/**
 * BirdNameField.tsx — فیلد نام پرنده با Bottom Sheet
 *
 * مدل سه‌سطحی (طبق FOUNDATION بخش ۵):
 *   Species → Purpose → Breed
 *
 * این فیلد فقط «دسته» رو انتخاب می‌کنه (مرغ گوشتی، اردک تخم‌گذار، ...)
 * نژاد خاص در BreedNameField انتخاب می‌شه.
 */
import { useMemo } from 'react';
import AutocompleteSheet, { type AutoOption } from '../../shr/components/AutocompleteSheet';
import { BIRD_CATEGORIES, type BirdCategory } from './birdCategories';

export interface BirdPresetPick {
  name: string;
  cycleDays: number | null;
  fcrStandard: number | null;
  standardKey?: string;
  isCustom: boolean;
  birdKind?: 'chicken' | 'duck' | 'turkey' | 'quail' | 'goose';
  purpose?: 'broiler' | 'layer' | 'breeder' | 'dual' | 'ornamental';
  /** 🆕 شناسه‌ی دسته (مثلاً 'chicken-broiler') */
  categoryId?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick: (pick: BirdPresetPick) => void;
  error?: string;
  excludeNames?: string[];
}

// ═══ گروه‌بندی بر اساس گونه ═══
const KIND_GROUPS: Record<string, { label: string; icon: string; order: number }> = {
  chicken: { label: 'مرغ',     icon: '🐔', order: 1 },
  duck:    { label: 'اردک',    icon: '🦆', order: 2 },
  turkey:  { label: 'بوقلمون', icon: '🦃', order: 3 },
  quail:   { label: 'بلدرچین', icon: '🐦', order: 4 },
  goose:   { label: 'غاز',     icon: '🦢', order: 5 },
};

// ═══ ایموجی هدف ═══
const PURPOSE_EMOJI: Record<string, string> = {
  broiler: '🍗',
  layer: '🥚',
  breeder: '🐣',
  dual: '🔄',
  ornamental: '🎨',
};

export default function BirdNameField({ value, onChange, onPick, error, excludeNames = [] }: Props) {
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    for (const cat of BIRD_CATEGORIES) {
      if (exclude.has(cat.label.toLowerCase())) continue;

      const group = KIND_GROUPS[cat.kind] || KIND_GROUPS.chicken;
      const star = cat.isCommon ? '⭐ ' : '';

      opts.push({
        value: 'category:' + cat.id,
        label: `${star}${cat.label}`,
        icon: cat.icon,
        group: cat.kind,
        groupLabel: `${group.icon} ${group.label}`,
        groupIcon: group.icon,
      });
    }

    // مرتب‌سازی: اول گونه، بعد رایج‌ها
    return opts.sort((a, b) => {
      const oa = KIND_GROUPS[a.group || '']?.order || 99;
      const ob = KIND_GROUPS[b.group || '']?.order || 99;
      if (oa !== ob) return oa - ob;
      // رایج‌ها اول
      const sa = a.label.startsWith('⭐') ? 0 : 1;
      const sb = b.label.startsWith('⭐') ? 0 : 1;
      return sa - sb;
    });
  }, [excludeNames]);

  const handleSelect = (opt: AutoOption) => {
    const id = opt.value.replace('category:', '');
    const cat = BIRD_CATEGORIES.find(c => c.id === id);
    if (!cat) return;

    onPick({
      name: cat.label,
      cycleDays: cat.fallbackCycleDays,
      fcrStandard: cat.fallbackFcr,
      standardKey: undefined,
      isCustom: false,
      birdKind: cat.kind,
      purpose: cat.purpose,
      categoryId: cat.id,
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
      placeholder="مثلاً — مرغ گوشتی یا اردک تخم‌گذار"
      customLabel="افزودن پرنده دلخواه"
      title="انتخاب دسته‌ی پرنده"
      error={error}
    />
  );
}

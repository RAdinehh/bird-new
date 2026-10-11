/**
 * BreedNameField.tsx — فیلد نام نژاد با Bottom Sheet
 *
 * گروه‌بندی بر اساس هدف (primaryPurpose):
 *   🍗 گوشتی · 🥚 تخم‌گذار · 🐣 مادر · 🔄 دوگانه · 🎨 تزئینی
 *
 * Cascade: فقط نژادهای matching با kind پرنده والد
 */
import { useMemo } from 'react';
import AutocompleteSheet, { type AutoOption } from '../../shr/components/AutocompleteSheet';
import { DEFAULT_STANDARDS } from '../set/standards/data';

export interface BreedPick {
  name: string;
  standardKey?: string;
  fcr: number | null;
  isCustom: boolean;
  linked: boolean;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick: (pick: BreedPick) => void;
  error?: string;
  excludeNames?: string[];
  /** نام پرنده والد — برای placeholder */
  parentBirdName?: string;
  /** شناسه‌ی گونه‌ی پرنده والد — برای cascade */
  parentKind?: string;
  /** استانداردهای سفارشی کاربر */
  customStandards?: Record<string, any>;
}

// ═══ گروه‌بندی بر اساس هدف پرورش ═══
const PURPOSE_GROUPS: Record<string, { label: string; icon: string; order: number }> = {
  broiler:    { label: 'گوشتی',    icon: '🍗', order: 1 },
  layer:      { label: 'تخم‌گذار', icon: '🥚', order: 2 },
  breeder:    { label: 'مادر',     icon: '🐣', order: 3 },
  dual:       { label: 'دوگانه',   icon: '🔄', order: 4 },
  ornamental: { label: 'تزئینی',   icon: '🎨', order: 5 },
};

const KIND_EMOJI: Record<string, string> = {
  chicken: '🐔', duck: '🦆', turkey: '🦃', quail: '🐦', goose: '🦢',
};

export default function BreedNameField({
  value, onChange, onPick, error, excludeNames = [],
  parentBirdName, parentKind, customStandards = {},
}: Props) {
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    const allStandards = { ...(DEFAULT_STANDARDS as any), ...customStandards };

    for (const [key, std] of Object.entries(allStandards) as [string, any][]) {
      const name = std.nameFa;
      if (!name || exclude.has(name.toLowerCase())) continue;

      // 🆕 فیلتر cascade: فقط نژادهای matching با گونه‌ی والد
      if (parentKind && std.birdKind && std.birdKind !== parentKind) continue;

      // گروه بر اساس هدف
      const purpose = std.primaryPurpose || 'broiler';
      const group = PURPOSE_GROUPS[purpose] || PURPOSE_GROUPS.broiler;

      // آیکن بر اساس گونه
      const stdKind = std.birdKind || parentKind || 'chicken';
      const icon = KIND_EMOJI[stdKind] || '🧬';

      opts.push({
        value: key,
        label: name,
        icon,
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
  }, [excludeNames, parentKind, customStandards]);

  const handleSelect = (opt: AutoOption) => {
    const key = opt.value;
    const std = (DEFAULT_STANDARDS as any)[key] || customStandards[key];
    const lastGrowth = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];

    onPick({
      name: std?.nameFa || opt.label,
      standardKey: key,
      fcr: lastGrowth?.fcr ?? null,
      isCustom: false,
      linked: true,
    });
  };

  const handleCustom = (text: string) => {
    onPick({
      name: text,
      standardKey: undefined,
      fcr: null,
      isCustom: true,
      linked: false,
    });
  };

  const title = parentBirdName
    ? `نژاد ${parentBirdName}`
    : 'انتخاب نژاد';

  return (
    <AutocompleteSheet
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      onSubmit={handleCustom}
      options={options}
      placeholder={parentBirdName ? `نژاد ${parentBirdName}...` : 'مثلاً — لوهمن یا مرندی'}
      customLabel="افزودن نژاد دلخواه"
      title={title}
      error={error}
    />
  );
}

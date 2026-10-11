/**
 * BreedNameField.tsx — فیلد نام نژاد با Bottom Sheet
 *
 * طبق استاندارد (docs/STANDARDS.md بخش ۷.۵):
 *   - Bottom Sheet + گروه‌بندی
 *   - 🆕 فیلتر دو مرحله‌ای:
 *       ۱) birdKind (مرغ/اردک/بوقلمون/...)
 *       ۲) purpose (گوشتی/تخم‌گذار/مادر/دوگانه)
 *   - ⭐ برای هدف اصلی
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
  /** نام پرنده والد (مثلاً «مرغ مادر») */
  parentBirdName?: string;
  /** استانداردهای سفارشی کاربر */
  customStandards?: Record<string, any>;
}

/** تبدیل نام پرنده به birdKind */
function nameToKind(name?: string): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  if (n.includes('مرغ') || n.includes('جوجه')) return 'chicken';
  if (n.includes('اردک')) return 'duck';
  if (n.includes('بوقلمون')) return 'turkey';
  if (n.includes('بلدرچین')) return 'quail';
  if (n.includes('غاز')) return 'goose';
  return null;
}

function breedIcon(category?: string): string {
  if (category === 'native') return '🌾';
  if (category === 'industrial') return '🏭';
  return '🧬';
}

/** ایموجی بر اساس نوع پرنده والد */
function kindEmoji(kind: string | null | undefined): string {
  if (kind === 'chicken') return '🐔';
  if (kind === 'duck') return '🦆';
  if (kind === 'turkey') return '🦃';
  if (kind === 'quail') return '🐦';
  if (kind === 'goose') return '🦢';
  return '🧬';
}

export default function BreedNameField({
  value, onChange, onPick, error, excludeNames = [],
  parentBirdName, customStandards = {},
}: Props) {
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    // تشخیص نوع پرنده و هدف
    const parentKind = nameToKind(parentBirdName);

    const allStandards = { ...(DEFAULT_STANDARDS as any), ...customStandards };
    for (const [key, std] of Object.entries(allStandards) as [string, any][]) {
      const name = std.nameFa;
      if (!name || exclude.has(name.toLowerCase())) continue;

      // 🆕 فیلتر ۱: birdKind
      if (parentKind && std.birdKind && std.birdKind !== parentKind) continue;
      // اگه std.birdKind نیست، از birdName fallback استفاده کن
      if (parentKind && !std.birdKind) {
        const stdKind = nameToKind(std.birdName);
        if (stdKind && stdKind !== parentKind) continue;
      }      const stdKind = nameToKind(std.birdName) || parentKind;
      const icon = kindEmoji(stdKind);
      const label = name;

      opts.push({
        value: key,
        label,
        icon,
        group: std.category === 'native' ? 'native' : 'industrial',
        groupLabel: std.category === 'native' ? 'بومی' : 'صنعتی',
        groupIcon: std.category === 'native' ? '🌾' : '🏭',
      });
    }

    return opts;
  }, [excludeNames, parentBirdName, customStandards]);

  const handleSelect = (opt: AutoOption) => {
    const key = opt.value;
    const std = (DEFAULT_STANDARDS as any)[key] || customStandards[key];
    const lastGrowth = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
    // اسم اصلی رو از std بگیر (نه label چون ممکنه ⭐ داشته باشه)
    onPick({
      name: std?.nameFa || opt.label.replace('⭐ ', ''),
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

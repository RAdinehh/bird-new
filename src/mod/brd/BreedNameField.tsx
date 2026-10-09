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
  /** purpose پرنده والد (broiler/layer/breeder/dual) */
  parentPurpose?: string;
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

/** تبدیل نام پرنده به purpose (نرم) */
function nameToPurpose(name?: string): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  if (n.includes('گوشتی')) return 'broiler';
  if (n.includes('تخم') || n.includes('لِی') || n.includes('لیر')) return 'layer';
  if (n.includes('مادر')) return 'breeder';
  if (n.includes('تزئین')) return 'ornamental';
  return null;
}

function breedIcon(category?: string): string {
  if (category === 'native') return '🌾';
  if (category === 'industrial') return '🏭';
  return '🧬';
}

export default function BreedNameField({
  value, onChange, onPick, error, excludeNames = [],
  parentBirdName, parentPurpose,
}: Props) {
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    // تشخیص نوع پرنده و هدف
    const parentKind = nameToKind(parentBirdName);
    const parentPurposeFinal = parentPurpose || nameToPurpose(parentBirdName);

    for (const [key, std] of Object.entries(DEFAULT_STANDARDS as any) as [string, any][]) {
      const name = std.nameFa;
      if (!name || exclude.has(name.toLowerCase())) continue;

      // 🆕 فیلتر ۱: birdKind
      if (parentKind && std.birdKind && std.birdKind !== parentKind) continue;
      // اگه std.birdKind نیست، از birdName fallback استفاده کن
      if (parentKind && !std.birdKind) {
        const stdKind = nameToKind(std.birdName);
        if (stdKind && stdKind !== parentKind) continue;
      }

      // 🆕 فیلتر ۲: purpose
      if (parentPurposeFinal && std.purposes && Array.isArray(std.purposes)) {
        const hasMatch = std.purposes.includes(parentPurposeFinal);
        // dual همیشه مجازه
        const hasDual = std.purposes.includes('dual');
        if (!hasMatch && !hasDual) continue;
      }

      // آیکون + ⭐ برای primary
      const isPrimary = parentPurposeFinal && std.primaryPurpose === parentPurposeFinal;
      const icon = breedIcon(std.category);
      const label = isPrimary ? `⭐ ${name}` : name;

      opts.push({
        value: key,
        label,
        icon,
        group: std.category === 'native' ? 'native' : 'industrial',
        groupLabel: std.category === 'native' ? '🌾 بومی' : '🏭 صنعتی',
      });
    }

    return opts;
  }, [excludeNames, parentBirdName, parentPurpose]);

  const handleSelect = (opt: AutoOption) => {
    const key = opt.value;
    const std = (DEFAULT_STANDARDS as any)[key];
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

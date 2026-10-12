/**
 * BreedNameField.tsx — فیلد نام نژاد با Bottom Sheet
 *
 * گروه‌بندی بر اساس دسته‌بندی (native/industrial/ornamental)
 * هر نژاد یه بار نشون داده می‌شه — هدف توی BreedForm انتخاب می‌شه.
 *
 * Cascade: فقط نژادهای matching با kind پرنده والد
 */
import { useMemo } from 'react';
import AutocompleteSheet, { type AutoOption } from '../../shr/components/AutocompleteSheet';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { toastMsg } from '../../cor/store/toast';

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
  /** 🆕 ویرایش‌های Diff-based */
  customOverrides?: Record<string, any>;
}

// ═══ گروه‌بندی بر اساس دسته‌بندی ═══
const CATEGORY_GROUPS: Record<string, { label: string; icon: string; order: number }> = {
  native:     { label: 'بومی',    icon: '🌾', order: 1 },
  industrial: { label: 'صنعتی',   icon: '🏭', order: 2 },
  fancy:      { label: 'تزئینی',  icon: '🎨', order: 3 },
};

const KIND_EMOJI: Record<string, string> = {
  chicken: '🐔', duck: '🦆', turkey: '🦃', quail: '🐦', goose: '🦢',
};

export default function BreedNameField({
  value, onChange, onPick, error, excludeNames = [],
  parentBirdName, parentKind, customStandards = {}, customOverrides = {},
}: Props) {
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    // merge با overrides
    const baseStandards = { ...(DEFAULT_STANDARDS as any), ...customStandards };
    const allStandards: Record<string, any> = {};
    for (const [k, v] of Object.entries(baseStandards)) {
      const ov = customOverrides[k];
      allStandards[k] = ov?.nameFa ? { ...(v as any), nameFa: ov.nameFa } : v;
    }

    for (const [key, std] of Object.entries(allStandards) as [string, any][]) {
      const name = std.nameFa;
      if (!name || exclude.has(name.toLowerCase())) continue;

      // 🆕 حذف breeder-only (فقط از چک‌باکس هدف انتخاب می‌شن)
      if (key.endsWith('-breeder')) continue;

      // 🆕 فیلتر cascade سخت‌گیرانه
      if (parentKind) {
        // ۱. custom bird → هیچ استانداردی نشون نده
        if (parentKind.startsWith('custom-')) continue;
        // ۲. std.birdKind داره → فقط matching
        if (std.birdKind && std.birdKind !== parentKind) continue;
        // ۳. std.birdKind نداره → فقط اگه chicken باشه مجاز (fallback)
        if (!std.birdKind && parentKind !== 'chicken') continue;
      }

      // آیکن بر اساس گونه
      const stdKind = std.birdKind || parentKind || 'chicken';
      const icon = KIND_EMOJI[stdKind] || '🧬';

      // گروه بر اساس دسته‌بندی (نه هدف)
      const cat = std.category || 'industrial';
      const group = CATEGORY_GROUPS[cat] || CATEGORY_GROUPS.industrial;

      opts.push({
        value: key,
        label: name,
        icon,
        group: cat,
        groupLabel: group.label,
        groupIcon: group.icon,
      });
    }

    // مرتب‌سازی: اول بومی، بعد صنعتی، بعد تزئینی
    return opts.sort((a, b) => {
      const oa = CATEGORY_GROUPS[a.group || '']?.order || 99;
      const ob = CATEGORY_GROUPS[b.group || '']?.order || 99;
      return oa - ob;
    });
  }, [excludeNames, parentKind, customStandards]);

  const handleSelect = (opt: AutoOption) => {
    const key = opt.value;

    // 🆕 merge با overrides (همون منطق useMemo)
    const base = (DEFAULT_STANDARDS as any)[key] || customStandards[key] || {};
    const ov = customOverrides[key];
    const std = ov?.nameFa ? { ...base, nameFa: ov.nameFa } : base;

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
    const typed = text.trim();
    if (!typed) return;

    // چک کن که این نام توی استانداردها هست یا نه
    const allStandards = { ...(DEFAULT_STANDARDS as any), ...customStandards };
    const match = Object.entries(allStandards).find(
      ([_, std]: [string, any]) =>
        std?.nameFa?.trim().toLowerCase() === typed.toLowerCase()
    ) as [string, any] | undefined;

    if (match) {
      const [key, std] = match;

      // اگه پرنده‌ی سفارشیه → هیچ استانداردی مجاز نیست
      if (parentKind?.startsWith('custom-')) {
        toastMsg.error(`«${typed}» یه نژاد ثبت‌شده‌ست. برای ${parentBirdName} نمی‌تونی ازش استفاده کنی.`);
        return;
      }

      // اگه گونه‌ی نژاد با پرنده فرق می‌کنه → بلاک
      if (parentKind && std.birdKind && std.birdKind !== parentKind) {
        toastMsg.error(`«${typed}» مخصوص ${std.birdKind} ئه، نه ${parentBirdName}.`);
        return;
      }

      // استاندارد معتبر → انتخاب به‌جای custom
      const lastGrowth = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
      onPick({
        name: std.nameFa,
        standardKey: key,
        fcr: lastGrowth?.fcr ?? null,
        isCustom: false,
        linked: true,
      });
      return;
    }

    // نژاد واقعاً جدید — ولی اجازه نمی‌دیم که از استاندارد ساخته شه
    // طبق طراحی: کاربر باید نژاد رو توی تنظیمات → استانداردها بسازه
    toastMsg.error(`«${typed}» توی استانداردها نیست. اول توی تنظیمات → استانداردها بسازش.`);
  };

  const title = parentBirdName
    ? `نژاد ${parentBirdName}`
    : 'انتخاب نژاد';

  const emptyMessage = options.length === 0
    ? (parentBirdName ? `${parentBirdName} نژادی نداره` : 'نژادی برای انتخاب نیست')
    : undefined;

  const emptyHint = options.length === 0
    ? 'برو به تب تنظیمات → استانداردها و اولین نژاد رو بساز، بعد اینجا انتخابش کن.'
    : undefined;

  return (
    <AutocompleteSheet
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      onSubmit={handleCustom}
      hideCustom
      options={options}
      placeholder={parentBirdName ? `نژاد ${parentBirdName}...` : 'مثلاً — لوهمن یا مرندی'}
      title={title}
      error={error}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
    />
  );
}

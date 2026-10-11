/**
 * birdCategories.ts — دسته‌بندی پرنده‌ها (گونه × هدف)
 *
 * مدل سه‌سطحی (طبق FOUNDATION بخش ۵):
 *   Species (۵ گونه) × Purpose (۴ هدف) = ۲۰ ترکیب
 *
 * کاربر اول «دسته» رو انتخاب می‌کنه (مثلاً «مرغ گوشتی»)،
 * بعد توی نژادها نژاد خاص رو (مثلاً «راس ۳۰۸»).
 */
import type { BirdKind, BirdPurpose } from '../set/standards/types';

export interface BirdCategory {
  /** شناسه یکتا مثل 'chicken-broiler' */
  id: string;
  kind: BirdKind;
  purpose: BirdPurpose;
  /** برچسب فارسی مثل «مرغ گوشتی» */
  label: string;
  /** ایموجی */
  icon: string;
  /** آیا این ترکیب رایجه؟ (برای نشان ⭐) */
  isCommon: boolean;
  /** توضیح کوتاه */
  desc: string;
  /** FCR مرجع (اگه نژاد انتخاب نشه) */
  fallbackFcr: number | null;
  /** چرخه‌ی مرجع (روز) */
  fallbackCycleDays: number | null;
}

const KIND_LABEL: Record<BirdKind, string> = {
  chicken: 'مرغ',
  duck: 'اردک',
  turkey: 'بوقلمون',
  quail: 'بلدرچین',
  goose: 'غاز',
};

const KIND_ICON: Record<BirdKind, string> = {
  chicken: '🐔',
  duck: '🦆',
  turkey: '🦃',
  quail: '🐦',
  goose: '🦢',
};

const PURPOSE_INFO: Record<BirdPurpose, {
  label: string;
  icon: string;
  desc: string;
  fallbackFcr: number | null;
  fallbackCycleDays: number | null;
}> = {
  broiler: {
    label: 'گوشتی',
    icon: '🍗',
    desc: 'پرورش برای تولید گوشت',
    fallbackFcr: 1.7,
    fallbackCycleDays: 42,
  },
  layer: {
    label: 'تخم‌گذار',
    icon: '🥚',
    desc: 'پرورش برای تولید تخم خوراکی',
    fallbackFcr: 2.1,
    fallbackCycleDays: 500,
  },
  breeder: {
    label: 'مادر',
    icon: '🐣',
    desc: 'پرورش برای تولید تخم نطفه‌دار',
    fallbackFcr: 3.3,
    fallbackCycleDays: 450,
  },
  dual: {
    label: 'دوگانه',
    icon: '🔄',
    desc: 'پرورش هم برای گوشت و هم تخم',
    fallbackFcr: 2.5,
    fallbackCycleDays: 400,
  },
  ornamental: {
    label: 'تزئینی',
    icon: '🎨',
    desc: 'پرورش تزئینی / نمایشی',
    fallbackFcr: 3.5,
    fallbackCycleDays: 700,
  },
};

// ═══ ترکیب‌های رایج (⭐) ═══
const COMMON_IDS = new Set([
  'chicken-broiler',
  'chicken-layer',
  'chicken-breeder',
  'chicken-ornamental',
  'duck-broiler',
  'duck-dual',
  'turkey-broiler',
  'quail-broiler',
  'quail-layer',
  'goose-broiler',
]);

// ═══ ساخت ۲۰+ ترکیب ═══
const ALL_KINDS: BirdKind[] = ['chicken', 'duck', 'turkey', 'quail', 'goose'];
const ALL_PURPOSES: BirdPurpose[] = ['broiler', 'layer', 'breeder', 'dual'];
const CHICKEN_EXTRA: BirdPurpose[] = ['ornamental'];  // تزئینی فقط برای مرغ

function buildCategories(): BirdCategory[] {
  const cats: BirdCategory[] = [];

  for (const kind of ALL_KINDS) {
    const purposes = kind === 'chicken'
      ? [...ALL_PURPOSES, ...CHICKEN_EXTRA]
      : ALL_PURPOSES;

    for (const purpose of purposes) {
      const id = `${kind}-${purpose}`;
      const kindFa = KIND_LABEL[kind];
      const pInfo = PURPOSE_INFO[purpose];

      cats.push({
        id,
        kind,
        purpose,
        label: `${kindFa} ${pInfo.label}`,
        icon: KIND_ICON[kind],
        isCommon: COMMON_IDS.has(id),
        desc: `${pInfo.desc} — ${kindFa}`,
        fallbackFcr: pInfo.fallbackFcr,
        fallbackCycleDays: pInfo.fallbackCycleDays,
      });
    }
  }

  return cats;
}

export const BIRD_CATEGORIES: BirdCategory[] = buildCategories();

/** پیدا کردن یک دسته با id */
export function findBirdCategory(id: string): BirdCategory | undefined {
  return BIRD_CATEGORIES.find(c => c.id === id);
}

/** پیدا کردن دسته بر اساس نام (برای migration داده‌های قدیمی) */
export function findCategoryByName(name: string): BirdCategory | undefined {
  const n = name.trim();
  if (!n) return undefined;

  // تلاش مستقیم
  const found = BIRD_CATEGORIES.find(c => c.label === n);
  if (found) return found;

  // تلاش با کلمات کلیدی
  const lower = n.toLowerCase();
  let kind: BirdKind | null = null;
  if (lower.includes('مرغ') || lower.includes('جوجه')) kind = 'chicken';
  else if (lower.includes('اردک')) kind = 'duck';
  else if (lower.includes('بوقلمون')) kind = 'turkey';
  else if (lower.includes('بلدرچین')) kind = 'quail';
  else if (lower.includes('غاز')) kind = 'goose';
  if (!kind) return undefined;

  let purpose: BirdPurpose = 'broiler';
  if (lower.includes('مادر')) purpose = 'breeder';
  else if (lower.includes('تخم') || lower.includes('لیر') || lower.includes('لِی')) purpose = 'layer';
  else if (lower.includes('دوگانه')) purpose = 'dual';
  else if (lower.includes('تزئین')) purpose = 'ornamental';
  else if (lower.includes('گوشتی')) purpose = 'broiler';

  return BIRD_CATEGORIES.find(c => c.kind === kind && c.purpose === purpose);
}

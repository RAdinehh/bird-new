/**
 * types.ts — انواع استانداردهای محیطی، تغذیه‌ای، رشد و تولیدی
 *
 * Priority Chain:
 *   1. Override (کاربر در Hall/Flock) — بالاترین
 *   2. Settings (پنل تنظیمات)
 *   3. Default (استاندارد صنعتی داخلی)
 *   4. Fallback
 */

export type BirdCategory = 'native' | 'industrial';

/** 🆕 نوع پرنده (برای فیلتر نژادها) */
export type BirdKind = 'chicken' | 'duck' | 'turkey' | 'quail' | 'goose';

/** 🆕 هدف پرورش (نژادها می‌تونن چندتایی داشته باشن) */
export type BirdPurpose =
  | 'broiler'      // گوشتی
  | 'layer'        // تخم‌گذار
  | 'breeder'      // مادر
  | 'dual'         // دوگانه (گوشتی + تخم‌گذار)
  | 'ornamental';  // تزئینی

export const BIRD_KIND_LABEL: Record<BirdKind, string> = {
  chicken: '🐔 مرغ',
  duck: '🦆 اردک',
  turkey: '🦃 بوقلمون',
  quail: '🐦 بلدرچین',
  goose: '🦢 غاز',
};

export const BIRD_PURPOSE_LABEL: Record<BirdPurpose, string> = {
  broiler: 'گوشتی',
  layer: 'تخم‌گذار',
  breeder: 'مادر',
  dual: 'دوگانه',
  ornamental: 'تزئینی',
};

export type BirdType =
  | 'marandi'
  | 'golpaygani'
  | 'gilini'
  | 'broiler'
  | 'layer';

// ═══ محیط ═══
export interface EnvRange {
  dayFrom: number;
  dayTo: number;
  temp: { min: number; max: number; target: number };
  humidity: { min: number; max: number };
  light: { hours: number; lux?: number };
}

// ═══ تغذیه ═══
export interface FeedRange {
  dayFrom: number;
  dayTo: number;
  feedG: number;
  waterMl: number;
  proteinPct?: number;
  energyKcal?: number;
  /** نام فاز (استارتر، گروئر، فینیشر، لِی...) */
  phaseName?: string;
  lysinePct?: number;
  methioninePct?: number;
  calciumPct?: number;
  availablePhosphorusPct?: number;
  saltPct?: number;
  mainIngredients?: string[];
}

// ═══ تولید ═══
export interface ProductionStandard {
  layingStartDay: number;
  peakLayingPct: number;
  eggsPerYear: number;
  eggWeightG: number;
  cycleDays: number;
  fertilityPct?: number;
  hatchabilityPct?: number;
}

// ═══ تلفات ═══
export interface MortalityRange {
  dayFrom: number;
  dayTo: number;
  maxPct: number;
}

// ═══ 🆕 بیولوژی ═══
export interface BiologyStandard {
  sexualMaturityDay: number | null;
  layingStartDay: number | null;
  peakLayingDay: number | null;
  endOfCycleDay: number | null;
  cullDay: number | null;
  incubationDays: number | null;
  maleFemaleRatio: number | null;
}

// ═══ 🆕 رشد ═══
export interface GrowthRange {
  dayFrom: number;
  dayTo: number;
  weightG: number;
  adgG: number;
  fcr: number;
}

export interface GrowthStandard {
  weightByAge: GrowthRange[];
  finalWeightG: number;
}

// ═══ 🆕 فضا ═══
export interface SpaceStandard {
  densityMax: number;
  feederSpaceCm: number;
  drinkerSpaceCm: number;
}

// ═══ 🆕 تجهیزات (نسبت‌ها) ═══
export interface EquipmentRatios {
  feeder: {
    chainCmPerBird: number | null;
    panBirdsPerUnit: number | null;
    tubeCmPerBird: number | null;
    manualCmPerBird: number | null;
  };
  drinker: {
    nippleBirdsPerUnit: number | null;
    cupBirdsPerUnit: number | null;
    troughCmPerBird: number | null;
    manualCmPerBird: number | null;
  };
  lampWattPerM2: number;
  fanM3PerKg: number;
}

// ═══ 🆕 انکوباسیون ═══
export interface IncubationStandard {
  totalDays: number;
  lockdownDay: number;
  setterTemp: number;
  setterHumidity: number;
  hatcherTemp: number;
  hatcherHumidity: number;
  turningPerDay?: number;
  candlingDays?: number[];
  chickYieldPct?: number;
  airExchangePer1000Eggs?: number;
}

// ═══ 🆕 بستر ═══
export type LitterMaterial =
  | 'wood_shavings' | 'straw' | 'sand' | 'rice_hull' | 'paper_roll'
  | 'sawdust' | 'peat' | 'none';

export interface LitterStandard {
  recommended: LitterMaterial[];
  kgPerM2: number;
  thicknessCm: number;
  lifetimeDays: number;
  replacementsPerCycle?: number;
  notes?: string;
}

// ═══ استاندارد کامل پرنده ═══
export interface BirdStandard {
  key: string;              // کلید نژاد (marandi, golpaygani, ...)
  birdName: string;         // پرنده مادر (مرغ، بوقلمون، ...) — legacy
  /** 🆕 نوع پرنده — برای فیلتر دقیق‌تر */
  birdKind?: BirdKind;
  /** 🆕 اهداف پرورش — می‌تونه چندتایی باشه (مثلاً مرندی: layer, breeder, dual) */
  purposes?: BirdPurpose[];
  /** 🆕 هدف اصلی (برای نمایش با ⭐) */
  primaryPurpose?: BirdPurpose;
  nameFa: string;           // نام نژاد
  nameEn: string;
  category: BirdCategory;

  biology: BiologyStandard;
  env: EnvRange[];
  feed: FeedRange[];
  growth: GrowthStandard;
  space: SpaceStandard;
  equipment: EquipmentRatios;
  incubation: IncubationStandard;
  litter?: LitterStandard;
  production?: ProductionStandard;
  mortality: MortalityRange[];
  mortalityTotalPct: number;
  notes?: string;
}

// ═══ Resolve ═══
export type ResolveSource = 'override' | 'settings' | 'default' | 'fallback';

export interface EffectiveEnv {
  temp: { min: number; max: number; target: number };
  humidity: { min: number; max: number };
  light: { hours: number; lux?: number };
  source: ResolveSource;
}

export interface EffectiveFeed {
  feedG: number;
  waterMl: number;
  proteinPct?: number;
  energyKcal?: number;
  source: ResolveSource;
}

export interface EffectiveGrowth {
  weightG: number;
  adgG: number;
  fcr: number;
  source: ResolveSource;
}

/**
 * _schema.ts — اعتبارسنجی Zod برای Import استانداردها
 *
 * فرمت فایل صادرات/واردات:
 *   {
 *     format: "bird-standards",
 *     version: "1.0",
 *     exportedAt: "2026-10-09T...",
 *     totalCount: 23,
 *     standards: [ {...}, {...} ]
 *   }
 *
 * مزیت: کاربر می‌تونه فایل رو دستی یا با AI ویرایش کنه،
 *       اگه خراب باشه، Zod خطا می‌ده و import نمی‌شه.
 */
import { z } from 'zod';

// ═══ انواع پایه ═══
const TempSchema = z.object({
  min: z.number(),
  max: z.number(),
  target: z.number(),
});

const HumiditySchema = z.object({
  min: z.number(),
  max: z.number(),
});

const LightSchema = z.object({
  hours: z.number().min(0).max(24),
  lux: z.number().optional(),
});

const EnvRangeSchema = z.object({
  dayFrom: z.number().int().min(0),
  dayTo: z.number().int().min(0),
  temp: TempSchema,
  humidity: HumiditySchema,
  light: LightSchema,
});

const FeedRangeSchema = z.object({
  dayFrom: z.number().int().min(0),
  dayTo: z.number().int().min(0),
  feedG: z.number().min(0),
  waterMl: z.number().min(0),
  proteinPct: z.number().optional(),
  energyKcal: z.number().optional(),
  phaseName: z.string().optional(),
  lysinePct: z.number().optional(),
  methioninePct: z.number().optional(),
  calciumPct: z.number().optional(),
  availablePhosphorusPct: z.number().optional(),
  saltPct: z.number().optional(),
  mainIngredients: z.array(z.string()).optional(),
});

const GrowthRangeSchema = z.object({
  dayFrom: z.number().int().min(0),
  dayTo: z.number().int().min(0),
  weightG: z.number().min(0),
  adgG: z.number().min(0),
  fcr: z.number().min(0),
});

const GrowthStandardSchema = z.object({
  weightByAge: z.array(GrowthRangeSchema),
  finalWeightG: z.number().min(0),
});

const BiologySchema = z.object({
  sexualMaturityDay: z.number().nullable(),
  layingStartDay: z.number().nullable(),
  peakLayingDay: z.number().nullable(),
  endOfCycleDay: z.number().nullable(),
  cullDay: z.number().nullable(),
  incubationDays: z.number().nullable(),
  maleFemaleRatio: z.number().nullable(),
});

const SpaceSchema = z.object({
  densityMax: z.number().min(0),
  feederSpaceCm: z.number().min(0),
  drinkerSpaceCm: z.number().min(0),
});

const EquipmentSchema = z.object({
  feeder: z.object({
    chainCmPerBird: z.number().nullable(),
    panBirdsPerUnit: z.number().nullable(),
    tubeCmPerBird: z.number().nullable(),
    manualCmPerBird: z.number().nullable(),
  }),
  drinker: z.object({
    nippleBirdsPerUnit: z.number().nullable(),
    cupBirdsPerUnit: z.number().nullable(),
    troughCmPerBird: z.number().nullable(),
    manualCmPerBird: z.number().nullable(),
  }),
  lampWattPerM2: z.number().min(0),
  fanM3PerKg: z.number().min(0),
});

const IncubationSchema = z.object({
  totalDays: z.number().int().min(1),
  lockdownDay: z.number().int().min(1),
  setterTemp: z.number(),
  setterHumidity: z.number(),
  hatcherTemp: z.number(),
  hatcherHumidity: z.number(),
  turningPerDay: z.number().optional(),
  candlingDays: z.array(z.number()).optional(),
  chickYieldPct: z.number().optional(),
  airExchangePer1000Eggs: z.number().optional(),
});

const MortalityRangeSchema = z.object({
  dayFrom: z.number().int().min(0),
  dayTo: z.number().int().min(0),
  maxPct: z.number().min(0),
});

const ProductionSchema = z.object({
  layingStartDay: z.number(),
  peakLayingPct: z.number(),
  eggsPerYear: z.number(),
  eggWeightG: z.number(),
  cycleDays: z.number(),
  fertilityPct: z.number().optional(),
  hatchabilityPct: z.number().optional(),
});

const LitterSchema = z.object({
  recommended: z.array(z.string()),
  kgPerM2: z.number(),
  thicknessCm: z.number(),
  lifetimeDays: z.number(),
  replacementsPerCycle: z.number().optional(),
  notes: z.string().optional(),
});

// ═══ استاندارد اصلی ═══
export const BirdStandardSchema = z.object({
  // شناسه
  key: z.string().min(1),
  birdName: z.string(),
  birdKind: z.enum(['chicken', 'duck', 'turkey', 'quail', 'goose']).optional(),
  purposes: z.array(z.enum(['broiler', 'layer', 'breeder', 'dual', 'ornamental'])).optional(),
  primaryPurpose: z.enum(['broiler', 'layer', 'breeder', 'dual', 'ornamental']).optional(),
  nameFa: z.string().min(1),
  nameEn: z.string(),
  category: z.enum(['native', 'industrial', 'fancy']),

  // متادیتا
  source: z.string().optional(),
  publishYear: z.number().optional(),
  version: z.number().optional(),
  lastUpdated: z.string().optional(),
  region: z.enum(['iran', 'international']).optional(),
  references: z.array(z.string()).optional(),

  // استانداردها
  biology: BiologySchema,
  env: z.array(EnvRangeSchema),
  feed: z.array(FeedRangeSchema),
  growth: GrowthStandardSchema,
  space: SpaceSchema,
  equipment: EquipmentSchema,
  incubation: IncubationSchema,
  litter: LitterSchema.optional(),
  production: ProductionSchema.optional(),
  mortality: z.array(MortalityRangeSchema),
  mortalityTotalPct: z.number().min(0),

  // استانداردهای تکمیلی
  lightingProgram: z.any().optional(),
  ventilation: z.any().optional(),
  waterQuality: z.any().optional(),
  targets: z.any().optional(),
  keyMilestones: z.any().optional(),
  hatchingParams: z.any().optional(),

  notes: z.string().optional(),
}).passthrough();  // فیلدهای اضافی مجاز

// ═══ فایل کامل ═══
export const StandardsFileSchema = z.object({
  format: z.literal('bird-standards'),
  version: z.string(),
  exportedAt: z.string(),
  totalCount: z.number().int().min(0),
  standards: z.array(BirdStandardSchema).min(1),
});

export type StandardsFile = z.infer<typeof StandardsFileSchema>;
export type ValidatedStandard = z.infer<typeof BirdStandardSchema>;

// ═══ اعتبارسنجی با پیام فارسی ═══
export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: StandardsFile;
}

export function validateStandardsFile(jsonText: string): ValidationResult {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e: any) {
    return { valid: false, error: 'فایل JSON نیست — ساختار معتبر نداره' };
  }

  const result = StandardsFileSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.errors[0];
    const path = first.path.join('.');
    return {
      valid: false,
      error: `خطا در "${path}": ${first.message}`,
    };
  }

  return { valid: true, data: result.data };
}

// ═══ ساخت فایل صادراتی ═══
export function buildStandardsFile(standards: any[]): StandardsFile {
  return {
    format: 'bird-standards',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalCount: standards.length,
    standards,
  };
}

export type BirdType = 'broiler' | 'layer' | 'breeder';
export type Region = 'iran' | 'international';

export interface TempPoint {
  day: number;
  tempC: number;
  humidityMin: number;
  humidityMax: number;
}

export interface VentPoint {
  weightKg: number;
  m3hPerBird: number;
}

export interface WeightPoint {
  day: number;
  weightG: number;
}

export interface FeedPoint {
  day: number;
  gramsPerBird: number;
}

export interface StandardDrinker {
  nippleBirdsPerUnit?: number;
  cupBirdsPerUnit?: number;
  troughCmPerBird?: number;
  fountainBirdsPerUnit?: number;
}

export interface StandardFeeder {
  panBirdsPerUnit?: number;
  chainCmPerBird?: number;
  tubeBirdsPerUnit?: number;
  manualBirdsPerUnit?: number;
}

export interface StandardEquipment {
  waterPool?: { required: boolean; areaM2PerBird?: number; notes?: string };
  drinker: StandardDrinker;
  feeder: StandardFeeder;
  lampWattPerM2: number;
  fanM3PerKg: number;
  heaterKWPerM2?: number;
}

export interface StandardSpace {
  densityMax: number;
  densityMin: number;
}

/** پارامترهای جوجه‌کشی (انکوباسیون) */
export interface IncubationParams {
  totalDays: number;
  setterTempC: number;
  setterHumidityPct: number;
  hatcherTempC: number;
  hatcherHumidityPct: number;
  turningPerDay: number;
  /** سن شروع تخم‌گذاری (روز) */
  layStartDay?: number;
  /** پیک تخم‌گذاری (درصد) */
  layPeakPct?: number;
  /** تعداد تخم در سال */
  eggsPerYear?: number;
  /** وزن تخم (گرم) */
  eggWeightG?: number;
}

export interface Standard {
  id: string;
  name: string;
  birdType: BirdType;
  region: Region;
  source: string;
  publishYear: number;
  version: number;
  lastUpdated?: string;
  temperature: TempPoint[];
  ventilationByWeight: VentPoint[];
  equipment: StandardEquipment;
  space: StandardSpace;
  weightByAge: WeightPoint[];
  feedByAge?: FeedPoint[];
  incubation?: IncubationParams;
  notes?: string;
}

// قالب‌های برنامه واکسن — صنعت ایران + استاندارد بین‌المللی

export interface VaccineItem {
  day: number;
  name: string;
  method: string;
  notes?: string;
}

export interface VaccineSchedule {
  id: string;
  label: string;
  origin: 'iran' | 'international';
  birdType: 'layer' | 'broiler' | 'breeder';
  description: string;
  items: VaccineItem[];
}

export const VACCINE_SCHEDULES: VaccineSchedule[] = [
  // ═══ تخم‌گذار — صنعت ایران ═══
  {
    id: 'iran-layer',
    label: 'تخم‌گذار — صنعت ایران',
    origin: 'iran',
    birdType: 'layer',
    description: 'برنامه رایج مرغداری‌های تخم‌گذار ایران',
    items: [
      { day: 1,  name: 'نیوکاسل B1 + برونشیت', method: 'اسپری / قطره چشمی' },
      { day: 7,  name: 'نیوکاسل لاسوتا', method: 'آشامیدنی / قطره' },
      { day: 14, name: 'گامبورو (IBD)', method: 'آشامیدنی' },
      { day: 21, name: 'نیوکاسل لاسوتا یادآور', method: 'آشامیدنی' },
      { day: 28, name: 'برونشیت یادآور', method: 'آشامیدنی' },
      { day: 35, name: 'نیوکاسل لاسوتا', method: 'آشامیدنی' },
      { day: 42, name: 'گامبورو یادآور', method: 'آشامیدنی' },
      { day: 56, name: 'نیوکاسل + برونشیت (Killed)', method: 'تزریق عضلانی' },
      { day: 70, name: 'آویر (ILT)', method: 'قطره چشمی' },
      { day: 84, name: 'آنفلوانزا (AI)', method: 'تزریق' },
      { day: 112, name: 'نیوکاسل + برونشیت یادآور', method: 'آشامیدنی' },
    ],
  },

  // ═══ گوشتی — صنعت ایران ═══
  {
    id: 'iran-broiler',
    label: 'گوشتی — صنعت ایران',
    origin: 'iran',
    birdType: 'broiler',
    description: 'برنامه کوتاه برای دوره‌های ۳۵-۴۵ روزه',
    items: [
      { day: 1,  name: 'نیوکاسل B1 + برونشیت', method: 'اسپری درشت' },
      { day: 7,  name: 'نیوکاسل لاسوتا', method: 'آشامیدنی' },
      { day: 14, name: 'گامبورو (IBD)', method: 'آشامیدنی' },
      { day: 21, name: 'نیوکاسل لاسوتا یادآور', method: 'آشامیدنی' },
      { day: 28, name: 'برونشیت یادآور', method: 'آشامیدنی' },
    ],
  },

  // ═══ تخم‌گذار — Hy-Line International ═══
  {
    id: 'intl-layer',
    label: 'تخم‌گذار — Hy-Line',
    origin: 'international',
    birdType: 'layer',
    description: 'استاندارد Hy-Line برای مرغ‌های تخم‌گذار تجاری',
    items: [
      { day: 1,  name: 'Marek (در هچری)', method: 'تزریق' },
      { day: 1,  name: 'ND + IB', method: 'اسپری' },
      { day: 10, name: 'ND + IB', method: 'آشامیدنی' },
      { day: 18, name: 'IBD (Gumboro)', method: 'آشامیدنی' },
      { day: 24, name: 'ND + IB', method: 'آشامیدنی' },
      { day: 35, name: 'IBD یادآور', method: 'آشامیدنی' },
      { day: 42, name: 'ND (Lasota)', method: 'آشامیدنی' },
      { day: 56, name: 'ND + IB + EDS', method: 'تزریق' },
      { day: 70, name: 'ILT (آویر)', method: 'قطره چشمی' },
      { day: 84, name: 'AI (آنفلوانزا)', method: 'تزریق' },
      { day: 112, name: 'ND + IB یادآور', method: 'آشامیدنی' },
    ],
  },

  // ═══ گوشتی — Cobb/Ross International ═══
  {
    id: 'intl-broiler',
    label: 'گوشتی — Cobb/Ross',
    origin: 'international',
    birdType: 'broiler',
    description: 'استاندارد جهانی برای جوجه‌های گوشتی پرتولید',
    items: [
      { day: 1,  name: 'Marek (در هچری)', method: 'تزریق' },
      { day: 1,  name: 'ND + IB', method: 'اسپری درشت' },
      { day: 10, name: 'ND + IB', method: 'آشامیدنی' },
      { day: 18, name: 'IBD (Gumboro)', method: 'آشامیدنی' },
      { day: 24, name: 'ND (Lasota)', method: 'آشامیدنی' },
    ],
  },

  // ═══ مادر — عمومی ═══
  {
    id: 'iran-breeder',
    label: 'مادر — صنعت ایران',
    origin: 'iran',
    birdType: 'breeder',
    description: 'برنامه گله‌های مادر گوشتی و تخم‌گذار',
    items: [
      { day: 1,   name: 'نیوکاسل B1 + برونشیت', method: 'اسپری' },
      { day: 10,  name: 'نیوکاسل لاسوتا', method: 'آشامیدنی' },
      { day: 21,  name: 'گامبورو', method: 'آشامیدنی' },
      { day: 35,  name: 'نیوکاسل یادآور', method: 'آشامیدنی' },
      { day: 49,  name: 'گامبورو یادآور', method: 'آشامیدنی' },
      { day: 70,  name: 'آویر', method: 'قطره چشمی' },
      { day: 84,  name: 'نیوکاسل + برونشیت (Killed)', method: 'تزریق' },
      { day: 112, name: 'آنفلوانزا', method: 'تزریق' },
      { day: 140, name: 'نیوکاسل یادآور', method: 'آشامیدنی' },
      { day: 168, name: 'IBD + ND + IB (Killed)', method: 'تزریق' },
    ],
  },
];

export function getSchedule(id: string): VaccineSchedule | undefined {
  return VACCINE_SCHEDULES.find(s => s.id === id);
}

export function schedulesByType(birdType: 'layer' | 'broiler' | 'breeder'): VaccineSchedule[] {
  return VACCINE_SCHEDULES.filter(s => s.birdType === birdType);
}

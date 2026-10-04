import type { Standard } from './types';

export const QUAIL_LAYER: Standard = {
  id: 'quail-layer',
  name: 'بلدرچین تخم‌گذار',
  birdType: 'layer',
  region: 'iran',
  source: 'مرکز تحقیقات بلدرچین ایران',
  publishYear: 2024,
  version: 1,
  lastUpdated: '2026-10-05',
  temperature: [
    { day: 0,   tempC: 33, humidityMin: 60, humidityMax: 70 },
    { day: 7,   tempC: 30, humidityMin: 60, humidityMax: 65 },
    { day: 21,  tempC: 26, humidityMin: 60, humidityMax: 65 },
    { day: 84,  tempC: 20, humidityMin: 50, humidityMax: 65 },
    { day: 300, tempC: 22, humidityMin: 50, humidityMax: 65 },
  ],
  ventilationByWeight: [
    { weightKg: 0.5, m3hPerBird: 0.5 },
    { weightKg: 1.0, m3hPerBird: 0.85 },
    { weightKg: 1.5, m3hPerBird: 1.15 },
    { weightKg: 2.0, m3hPerBird: 1.45 },
  ],
  equipment: {
    drinker: { nippleBirdsPerUnit: 8, cupBirdsPerUnit: 20, fountainBirdsPerUnit: 40 },
    feeder: { panBirdsPerUnit: 22, chainCmPerBird: 12, tubeBirdsPerUnit: 18, manualBirdsPerUnit: 22 },
    lampWattPerM2: 3.5,
    fanM3PerKg: 4.5,
  },
  space: { densityMax: 8, densityMin: 5.5 },
  weightByAge: [
    { day: 0,   weightG: 35 },
    { day: 42,  weightG: 350 },
    { day: 84,  weightG: 800 },
    { day: 168, weightG: 1400 },
    { day: 365, weightG: 2000 },
  ],
  feedByAge: [
    { day: 0,   gramsPerBird: 11 },
    { day: 42,  gramsPerBird: 28 },
    { day: 84,  gramsPerBird: 50 },
    { day: 168, gramsPerBird: 95 },
    { day: 365, gramsPerBird: 115 },
  ],
  notes: 'بلدرچین تخم‌گذار',
};

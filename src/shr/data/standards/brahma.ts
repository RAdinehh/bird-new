import type { Standard } from './types';

export const BRAHMA: Standard = {
  id: 'brahma',
  name: 'برهما',
  birdType: 'broiler',
  region: 'international',
  source: 'APA',
  publishYear: 2024,
  version: 1,
  lastUpdated: '2026-10-05',
  temperature: [
    { day: 0,  tempC: 33, humidityMin: 60, humidityMax: 70 },
    { day: 7,  tempC: 30, humidityMin: 60, humidityMax: 65 },
    { day: 14, tempC: 27, humidityMin: 60, humidityMax: 65 },
    { day: 21, tempC: 24, humidityMin: 55, humidityMax: 65 },
    { day: 42, tempC: 20, humidityMin: 55, humidityMax: 65 },
  ],
  ventilationByWeight: [
    { weightKg: 0.5, m3hPerBird: 0.55 },
    { weightKg: 1.0, m3hPerBird: 1.0 },
    { weightKg: 2.0, m3hPerBird: 1.7 },
    { weightKg: 3.0, m3hPerBird: 2.5 },
  ],
  equipment: {
    drinker: { nippleBirdsPerUnit: 12, cupBirdsPerUnit: 25, fountainBirdsPerUnit: 40 },
    feeder: { panBirdsPerUnit: 35, chainCmPerBird: 14, tubeBirdsPerUnit: 25, manualBirdsPerUnit: 25 },
    lampWattPerM2: 3,
    fanM3PerKg: 5,
  },
  space: { densityMax: 5, densityMin: 3.5 },
  weightByAge: [
    { day: 0,   weightG: 40 },
    { day: 42,  weightG: 500 },
    { day: 84,  weightG: 1200 },
    { day: 180, weightG: 3000 },
    { day: 365, weightG: 4000 },
  ],
  feedByAge: [
    { day: 0,   gramsPerBird: 13 },
    { day: 42,  gramsPerBird: 40 },
    { day: 84,  gramsPerBird: 75 },
    { day: 180, gramsPerBird: 120 },
    { day: 365, gramsPerBird: 140 },
  ],
  notes: 'برهما',
};

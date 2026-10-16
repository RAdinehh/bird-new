/**
 * types.ts — نوع‌های مشترک ماژول dlg
 */
import type { Death, Vaccine, Medication, Activity } from './store';

export interface F {
  id?: string;
  flockId: string; date: string; entryTime: string;
  temperature: string; temperatureMin: string; temperatureMax: string;
  humidity: string; humidityMin: string; humidityMax: string;
  ventilation: string; litter: string;
  lightHours: string;
  behavior: string; distribution: string; appearance: string; sound: string;
  feedType: string; feedAmount: string; feedRemaining: string;
  feedSourceType: 'formula' | 'item' | ''; feedSourceId: string; feedMovementIds: string[];
  feedMethod: 'manual' | 'auto' | '';
  waterMethod: 'manual' | 'nipple' | 'trough' | 'tank' | '';
  waterAmount: string; waterFillCount: string; waterFillVolume: string;
  weightSamples: { id: string; weight: string }[];
  eatingEggs: string; fertileEggs: string; brokenEggs: string; otherEggs: string;
  brokenTarget?: 'consumption' | 'eating';
  otherTarget?: 'consumption' | 'eating';
  weightGender: '' | 'male' | 'female' | 'mixed';
  deaths: Death[];
  vaccines: Vaccine[]; medications: Medication[]; activities: Activity[];
  notes: string;
}

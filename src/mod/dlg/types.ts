/**
 * types.ts — نوع‌های مشترک ماژول dlg
 */
import type { Death, Vaccine, Medication, FeedSource } from './store';

export interface F {
  id?: string;
  flockId: string; date: string; entryTime: string;
  temperature: string; temperatureMin: string; temperatureMax: string;
  humidity: string; humidityMin: string; humidityMax: string;
  ventilation: string; litter: string;
  behavior: string; distribution: string; appearance: string; sound: string;
  feedType: string; feedDelivered: string; feedRemaining: string; feedWaste: string;
  feedSourceType: 'formula' | 'item' | ''; feedSourceId: string; feedSources?: FeedSource[]; feedMovementIds: string[];
  feedMethod: 'scoop' | 'bag' | 'semi_auto' | 'auto_sensor' | 'auto_chain' | '';
  waterMethod: 'manual' | 'nipple' | 'trough' | 'tank' | '';
  feedMethodSource?: 'hall' | 'manual';
  waterMethodSource?: 'hall' | 'manual';
  feedMethodFromHall?: string;
  waterMethodFromHall?: string;
  waterAmount: string; waterFillCount: string; waterFillVolume: string;
  weightSamples: { id: string; weight: string }[];
  eatingEggs: string; fertileEggs: string; brokenEggs: string; otherEggs: string;
  weightGender: '' | 'male' | 'female' | 'mixed';
  deaths: Death[];
  vaccines: Vaccine[]; medications: Medication[];
  notes: string;
}

/**
 * api/toEgg.ts — sync تولید تخم از ثبت روزانه به ماژول egg
 *
 * توابع خالص (pure) — caller وظیفه داره add/update/delete رو صدا بزنه.
 */
import type { EggProduction } from '../../egg/store';

export interface EggSyncInput {
  logId: string;
  flockId: string;
  date: string;
  isLayerFlock: boolean;
  eatingEggs: number;
  fertileEggs: number;
  brokenEggs: number;
  otherEggs: number;
}

export interface EggSyncData {
  flockId: string;
  date: string;
  eatingCount: number;
  fertileCount: number;
  totalCount: number;
  brokenCount: number;
  softCount: number;
  dirtyCount: number;
  avgWeight: number | null;
  notes: string;
  sourceLogId: string;
}

/** آیا این log نیاز به egg.production داره؟ */
export function shouldSyncToEgg(input: EggSyncInput): boolean {
  if (!input.isLayerFlock) return false;
  const total = input.eatingEggs + input.fertileEggs + input.brokenEggs + input.otherEggs;
  return total > 0;
}

/** ساخت داده‌ی egg.production از ورودی dlg */
export function buildEggProductionData(input: EggSyncInput): EggSyncData {
  const { logId, flockId, date, eatingEggs, fertileEggs, brokenEggs, otherEggs } = input;
  return {
    flockId,
    date,
    eatingCount: eatingEggs,
    fertileCount: fertileEggs,
    totalCount: eatingEggs + fertileEggs + brokenEggs + otherEggs,
    brokenCount: brokenEggs,
    softCount: 0,
    dirtyCount: otherEggs,
    avgWeight: null,
    notes: '',
    sourceLogId: logId,
  };
}

/** تصمیم‌گیری sync: نوع عمل (add/update/delete/noop) */
export type SyncAction =
  | { type: 'add'; data: EggSyncData }
  | { type: 'update'; id: string; data: EggSyncData }
  | { type: 'delete'; id: string }
  | { type: 'noop' };

export function decideEggAction(params: {
  input: EggSyncInput;
  existing: EggProduction | undefined;
}): SyncAction {
  const { input, existing } = params;
  const should = shouldSyncToEgg(input);

  if (should) {
    const data = buildEggProductionData(input);
    if (existing) return { type: 'update', id: existing.id, data };
    return { type: 'add', data };
  }
  // نباید sync بشه — اگه قبلاً بود، پاک کن
  if (existing) return { type: 'delete', id: existing.id };
  return { type: 'noop' };
}

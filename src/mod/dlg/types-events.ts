/**
 * types-events.ts — رویدادهای ثبت روزانه
 * الگو: flk/types-store.ts (FlockEvent)
 */

export type DlgEventType =
  | 'create'
  | 'reading'
  | 'feed'
  | 'water'
  | 'death'
  | 'egg'
  | 'vaccine'
  | 'medication'
  | 'weight'
  | 'correction';

export type DlgEventReasonCode =
  | 'data_entry_error'
  | 'sensor_error'
  | 'forgot_entry'
  | 'wrong_count'
  | 'wrong_dose'
  | 'other';

export type DlgReadingField =
  | 'temperature' | 'temperatureMin' | 'temperatureMax'
  | 'humidity'    | 'humidityMin'    | 'humidityMax';

export type DlgEggField = 'eatingEggs' | 'fertileEggs' | 'brokenEggs' | 'otherEggs';

export interface DlgEvent {
  id: string;
  logId: string;
  date: string;
  entryTime: string;
  type: DlgEventType;

  // reading / egg
  field?: DlgReadingField | DlgEggField | string;
  value?: number | null;

  // feed / water
  amount?: number;
  unit?: string;

  // death
  count?: number;
  cause?: string;

  // correction
  before?: number | null;
  after?: number | null;

  // common
  reasonCode?: DlgEventReasonCode;
  reason?: string;
  notes?: string;

  createdAt: string;
  updatedAt?: string;
  version?: number;

  revoked?: boolean;
  linkedEventId?: string;
  revokedBy?: string;
}

/**
 * types-devices.ts — نوع‌ها و ثابت‌های DevicesPage
 */
import type { DeviceMode, DeviceStatus, DeviceCapacity } from './store';

export const STATUS_FA: Record<DeviceStatus, string> = {
  active: '✅ فعال',
  idle: '⏸ غیرفعال',
  maintenance: '🔧 تعمیر',
  broken: '❌ خراب',
};

export const MODE_FA: Record<DeviceMode, string> = {
  'setter': 'ستر',
  'hatcher': 'هچر',
  'setter+hatcher': 'ستر + هچر',
};

export interface F {
  id?: string;
  name: string;
  capacityByBird: DeviceCapacity[];
  mode: DeviceMode;
  status: DeviceStatus;
  temp: string;
  humidity: string;
  purchasedAt: string;
  price: string;
  warranty: string;
  racks: string;
  trays: string;
  fans: string;
  tempSensors: string;
  humiditySensors: string;
  motorPower: string;
  extraCost: string;
  notes: string;
  /** 🆕 پایش زنده */
  estCurrent: string;
  co2Current: string;
  o2Current: string;
}

export const emptyForm: F = {
  name: '',
  capacityByBird: [],
  mode: 'setter+hatcher',
  status: 'active',
  temp: '',
  humidity: '',
  purchasedAt: '',
  price: '',
  warranty: '',
  racks: '',
  trays: '',
  fans: '',
  tempSensors: '',
  humiditySensors: '',
  motorPower: '',
  extraCost: '',
  notes: '',
  estCurrent: '',
  co2Current: '',
  o2Current: '',
};

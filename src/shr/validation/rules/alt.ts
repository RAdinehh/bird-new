/**
 * validation/rules/alt.ts — هشدارها
 */
import { z } from 'zod';
import {
  requiredStr, optionalStr, optionalId, oneOf, persianDateOpt,
} from '../helpers';
import type { ValidationContext } from '../types';

export const AlertSchema = z.object({
  level: oneOf('سطح', ['critical', 'important', 'info'] as const),
  category: oneOf('دسته', ['stock', 'vaccine', 'payment', 'temp', 'mortality', 'reproduction', 'other'] as const),
  title: requiredStr('عنوان', 3, 100),
  message: requiredStr('متن', 5, 500),
  targetHallOrFlockId: optionalId(),
  targetContactId: optionalId(),
  status: oneOf('وضعیت', ['active', 'dismissed', 'snoozed'] as const).default('active'),
  createdAt: persianDateOpt('تاریخ'),
});

export type AlertFormData = z.infer<typeof AlertSchema>;

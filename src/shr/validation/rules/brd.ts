/**
 * validation/rules/brd.ts — پرنده و نژاد
 */
import { z } from 'zod';
import {
  requiredStr, optionalStr, requiredId, oneOf,
  intRange, floatRange,
} from '../helpers';

// ═══ پرنده ═══
export const BirdSchema = z.object({
  name: requiredStr('نام پرنده', 1, 100),
  cycleDays: intRange('چرخه زندگی', 1, 2000).nullable().optional(),
  fcrStandard: floatRange('FCR استاندارد', 0.5, 5).nullable().optional(),
  standardKey: optionalStr(100),
  birdKind: oneOf('نوع پرنده', ['chicken', 'duck', 'turkey', 'quail', 'goose'] as const).optional(),
  purpose: oneOf('هدف پرورش', ['broiler', 'layer', 'breeder', 'dual', 'ornamental'] as const).optional(),
});
export type BirdFormDataZ = z.infer<typeof BirdSchema>;

// ═══ نژاد ═══
export const BreedSchema = z.object({
  birdId: requiredId('پرنده'),
  name: requiredStr('نام نژاد', 1, 100),
  fcr: floatRange('FCR', 0.5, 5).nullable().optional(),
  standardKey: optionalStr(100),
});
export type BreedFormDataZ = z.infer<typeof BreedSchema>;

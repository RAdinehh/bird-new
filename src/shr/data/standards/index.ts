import { COBB_500 } from './cobb-500';
import { ROSS_308 } from './ross-308';
import { IRAN_BROILER } from './iran-broiler';
import { HY_LINE_W36 } from './hy-line-w36';
import { IRAN_LAYER } from './iran-layer';
import type { Standard } from './types';

export type { Standard, BirdType, Region } from './types';

export const BUILTIN_STANDARDS: Standard[] = [
  COBB_500,
  ROSS_308,
  IRAN_BROILER,
  HY_LINE_W36,
  IRAN_LAYER,
];

export function getStandard(id: string): Standard | undefined {
  return BUILTIN_STANDARDS.find(s => s.id === id);
}

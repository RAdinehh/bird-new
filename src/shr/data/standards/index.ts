import { COBB_500 } from './cobb-500';
import { ROSS_308 } from './ross-308';
import { IRAN_BROILER } from './iran-broiler';
import { HY_LINE_W36 } from './hy-line-w36';
import { IRAN_LAYER } from './iran-layer';
import { MARANDI } from './marandi';
import { GOLPAYEGANI } from './golpayegani';
import { LARI } from './lari';
import { GOLIN } from './golin';
import { AUSTRALORP } from './australorp';
import { LOHMANN } from './lohmann';
import { LEGHORN } from './leghorn';
import { COCHIN } from './cochin';
import { BRAHMA } from './brahma';
import { SULTAN } from './sultan';
import { MINIATURE } from './miniature';
import { QUAIL_BROILER } from './quail-broiler';
import { QUAIL_LAYER } from './quail-layer';
import { DUCK_PEKIN } from './duck-pekin';
import { DUCK_MUSCOVY } from './duck-muscovy';
import { DUCK_UKRAINIAN } from './duck-ukrainian';
import { TURKEY } from './turkey';
import { GOOSE } from './goose';
import type { Standard } from './types';

export type { Standard, BirdType, Region } from './types';

export const BUILTIN_STANDARDS: Standard[] = [
  // مرغ گوشتی
  COBB_500,
  ROSS_308,
  IRAN_BROILER,
  // مرغ تخم‌گذار
  HY_LINE_W36,
  IRAN_LAYER,
  LOHMANN,
  LEGHORN,
  // مرغ بومی ایران
  MARANDI,
  GOLPAYEGANI,
  LARI,
  GOLIN,
  // مرغ دو منظوره / زینتی
  AUSTRALORP,
  COCHIN,
  BRAHMA,
  SULTAN,
  MINIATURE,
  // بلدرچین
  QUAIL_BROILER,
  QUAIL_LAYER,
  // اردک
  DUCK_PEKIN,
  DUCK_MUSCOVY,
  DUCK_UKRAINIAN,
  // بوقلمون
  TURKEY,
  // غاز
  GOOSE,
];

export function getStandard(id: string): Standard | undefined {
  return BUILTIN_STANDARDS.find(s => s.id === id);
}

/**
 * data-breeds.ts — ۲۳ نژاد جدید (نسخه ۳)
 * منابع: Cobb/Aviagen 2024، وزارت جهاد ۱۴۰۳، مراکز تحقیقات استانی، منابع داخلی و بین‌المللی
 */

import type { BirdStandard } from '../types';


export * from './broilers';
export * from './breeders';
export * from './layers';
export * from './native';
export * from './ornamental';
export * from './quail';
export * from './ducks';
export * from './turkey_goose';
export * from './turkeys';

import { COBB_500 } from './broilers';
import { ROSS_308_BREEDER, COBB_500_BREEDER, HY_LINE_BROWN_BREEDER } from './breeders';
import { ROSS_308 } from './broilers';
import { IRAN_BROILER } from './broilers';
import { HY_LINE_W36 } from './layers';
import { IRAN_LAYER } from './layers';
import { LOHMANN } from './layers';
import { LEGHORN } from './layers';
import { MARANDI } from './native';
import { GOLPAYGANI } from './native';
import { LARI } from './native';
import { GOLIN } from './native';
import { AUSTRALORP } from './ornamental';
import { COCHIN } from './ornamental';
import { BRAHMA } from './ornamental';
import { SULTAN } from './ornamental';
import { MINIATURE } from './ornamental';
import { QUAIL_BROILER } from './quail';
import { QUAIL_LAYER } from './quail';
import { DUCK_PEKIN } from './ducks';
import { DUCK_MUSCOVY } from './ducks';
import { DUCK_UKRAINIAN } from './ducks';
import { TURKEY } from './turkey_goose';
import { TURKEY_BRONZE, TURKEY_WHITE, TURKEY_BOURBON, TURKEY_BREEDER } from './turkeys';
import { GOOSE } from './turkey_goose';

export const NEW_BREEDS: Record<string, BirdStandard> = {
  'cobb-500': COBB_500,
  'ross-308': ROSS_308,
  'ross-308-breeder': ROSS_308_BREEDER,
  'cobb-500-breeder': COBB_500_BREEDER,
  'hy-line-brown-breeder': HY_LINE_BROWN_BREEDER,
  'iran-broiler': IRAN_BROILER,
  'hy-line-w36': HY_LINE_W36,
  'iran-layer': IRAN_LAYER,
  'lohmann': LOHMANN,
  'leghorn': LEGHORN,
  'marandi': MARANDI,
  'golpaygani': GOLPAYGANI,
  'lari': LARI,
  'golin': GOLIN,
  'australorp': AUSTRALORP,
  'cochin': COCHIN,
  'brahma': BRAHMA,
  'sultan': SULTAN,
  'miniature': MINIATURE,
  'quail-broiler': QUAIL_BROILER,
  'quail-layer': QUAIL_LAYER,
  'duck-pekin': DUCK_PEKIN,
  'duck-muscovy': DUCK_MUSCOVY,
  'duck-ukrainian': DUCK_UKRAINIAN,
  'turkey': TURKEY,
  'turkey-bronze': TURKEY_BRONZE,
  'turkey-white': TURKEY_WHITE,
  'turkey-bourbon': TURKEY_BOURBON,
  'turkey-breeder': TURKEY_BREEDER,
  'goose': GOOSE,
};

/**
 * atomic/index.ts — نقطه ورود
 */
export { atomicTransaction } from './transaction';
export {
  dlgStore,
  whsStore,
  eggStore,
  flkStore,
  traStore,
  ALL_STORES,
} from './stores';
export type {
  AtomicStore,
  AtomicOptions,
  AtomicResult,
} from './types';

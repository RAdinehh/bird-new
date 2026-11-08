/**
 * atomic/index.ts — نقطه ورود
 */
export { atomicTransaction, atomicTransactionSync } from './transaction';
export {
  dlgStore,
  whsStore,
  eggStore,
  flkStore,
  traStore,
  ctcStore,
  ALL_STORES,
} from './stores';
export type {
  AtomicStore,
  AtomicOptions,
  AtomicOptionsSync,
  AtomicResult,
} from './types';

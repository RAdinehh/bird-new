/**
 * intelligence/index.ts — API عمومی سیستم هوشمند
 */
export * from './types';
export { FIELD_PROFILES, getProfile } from './fieldProfiles';
export {
  localHistoryStore, recordHistory, getHistory, markConfirmed,
  clearHistory, getUserPattern, computeStats,
} from './historyStore';
export {
  analyzeAnomaly, analyzeAndRecord, getCrossFieldExpected,
} from './anomalyDetector';
export { useAnomalyHint } from './useAnomalyHint';
export { AnomalyHint } from './AnomalyHint';
export { FieldHint } from './FieldHint';
export { formatWarning } from './formatWarning';

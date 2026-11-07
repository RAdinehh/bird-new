import { describe, it, expect } from 'vitest';
import { migrateFeedLogsToConsumption, buildExistingNotesSet, MIGRATED_NOTES_PREFIX } from '../mod/flk/migrations-feed';
import type { ConsumptionEvent } from '../mod/flk/types-store';

const log = (o: any = {}) => ({
  id: 'l-' + Math.random().toString(36).slice(2, 7),
  flockId: 'f1',
  date: '1405/08/01',
  feedAmount: 25,
  ...o,
});

const evtWithNote = (note: string): ConsumptionEvent => ({
  id: 'e1', flockId: 'f1', type: 'feed',
  date: '1405/08/01', amount: 25, unit: 'kg', sex: '',
  source: 'daily_manual', confidence: 'exact', notes: note,
  createdAt: '', updatedAt: '',
});

describe('migrateFeedLogsToConsumption', () => {
  it('یک log با feedAmount → یک candidate', () => {
    const out = migrateFeedLogsToConsumption([log({ feedAmount: 25 })], new Set());
    expect(out).toHaveLength(1);
    expect(out[0].amount).toBe(25);
    expect(out[0].type).toBe('feed');
    expect(out[0].unit).toBe('kg');
    expect(out[0].source).toBe('daily_manual');
    expect(out[0].confidence).toBe('exact');
    expect(out[0].flockId).toBe('f1');
    expect(out[0].date).toBe('1405/08/01');
  });

  it('feedAmount=0 → skip', () => {
    const out = migrateFeedLogsToConsumption([log({ feedAmount: 0 })], new Set());
    expect(out).toHaveLength(0);
  });

  it('feedAmount=null → skip', () => {
    const out = migrateFeedLogsToConsumption([log({ feedAmount: null })], new Set());
    expect(out).toHaveLength(0);
  });

  it('بدون flockId → skip', () => {
    const out = migrateFeedLogsToConsumption([log({ flockId: '' })], new Set());
    expect(out).toHaveLength(0);
  });

  it('بدون date → skip', () => {
    const out = migrateFeedLogsToConsumption([log({ date: '' })], new Set());
    expect(out).toHaveLength(0);
  });

  it('existingNotes حاوی marker → skip', () => {
    const l = log({ id: 'l-fixed', feedAmount: 25 });
    const existing = new Set([`${MIGRATED_NOTES_PREFIX}l-fixed]`]);
    const out = migrateFeedLogsToConsumption([l], existing);
    expect(out).toHaveLength(0);
  });

  it('چند log → چند candidate، amount گرد شده', () => {
    const out = migrateFeedLogsToConsumption([
      log({ id: 'a', feedAmount: 25.567 }),
      log({ id: 'b', feedAmount: 10 }),
      log({ id: 'c', feedAmount: 0 }),
    ], new Set());
    expect(out).toHaveLength(2);
    expect(out[0].amount).toBe(25.57);
    expect(out[1].amount).toBe(10);
  });

  it('notes حاوی marker درست', () => {
    const out = migrateFeedLogsToConsumption([log({ id: 'XYZ' })], new Set());
    expect(out[0].notes).toBe(`${MIGRATED_NOTES_PREFIX}XYZ]`);
  });

  it('array خالی → []', () => {
    expect(migrateFeedLogsToConsumption([], new Set())).toEqual([]);
  });

  it('undefined → []', () => {
    expect(migrateFeedLogsToConsumption(undefined as any, new Set())).toEqual([]);
  });
});

describe('buildExistingNotesSet', () => {
  it('خالی → Set خالی', () => {
    expect(buildExistingNotesSet([]).size).toBe(0);
  });
  it('notes با marker → وارد Set', () => {
    const s = buildExistingNotesSet([evtWithNote(`${MIGRATED_NOTES_PREFIX}abc]`)]);
    expect(s.has(`${MIGRATED_NOTES_PREFIX}abc]`)).toBe(true);
  });
  it('notes بدون marker → نادیده', () => {
    const s = buildExistingNotesSet([evtWithNote('فقط یک یادداشت')]);
    expect(s.size).toBe(0);
  });
  it('چند event → همه markerها', () => {
    const s = buildExistingNotesSet([
      evtWithNote(`${MIGRATED_NOTES_PREFIX}a]`),
      evtWithNote(`${MIGRATED_NOTES_PREFIX}b]`),
      evtWithNote('یادداشت عادی'),
    ]);
    expect(s.size).toBe(2);
  });
});

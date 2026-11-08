import { describe, it, expect, vi } from 'vitest';
import { runFeedMigrationIfNeeded, FEED_MIGRATION_FLAG_KEY } from '../mod/flk/migrations-feed-trigger';
import type { ConsumptionEvent } from '../mod/flk/types-store';

const evtWithNote = (note: string): ConsumptionEvent => ({
  id: 'e1', flockId: 'f1', type: 'feed',
  date: '1405/08/01', amount: 25, unit: 'kg', sex: '',
  source: 'daily_manual', confidence: 'exact', notes: note,
  createdAt: '', updatedAt: '',
});

const log = (o: any = {}) => ({
  id: 'l1', flockId: 'f1', date: '1405/08/01', feedDelivered: 25, ...o,
});

describe('runFeedMigrationIfNeeded', () => {
  it('flag موجود → already-done، هیچ تغییری', () => {
    const addEvent = vi.fn();
    const setFlag = vi.fn();
    const result = runFeedMigrationIfNeeded({
      getLogs: () => [log()],
      getExistingEvents: () => [],
      addEvent,
      getFlag: (k) => k === FEED_MIGRATION_FLAG_KEY ? 'yes' : null,
      setFlag,
    });
    expect(result.ran).toBe(false);
    expect(result.reason).toBe('already-done');
    expect(addEvent).not.toHaveBeenCalled();
    expect(setFlag).not.toHaveBeenCalled();
  });

  it('flag خالی + logs → success + migrate', () => {
    const addEvent = vi.fn();
    const setFlag = vi.fn();
    const result = runFeedMigrationIfNeeded({
      getLogs: () => [log()],
      getExistingEvents: () => [],
      addEvent,
      getFlag: () => null,
      setFlag,
    });
    expect(result.ran).toBe(true);
    expect(result.migrated).toBe(1);
    expect(result.reason).toBe('success');
    expect(addEvent).toHaveBeenCalledTimes(1);
    expect(setFlag).toHaveBeenCalledWith(FEED_MIGRATION_FLAG_KEY, expect.any(String));
  });

  it('flag خالی + no data → no-data + flag ست می‌شود', () => {
    const addEvent = vi.fn();
    const setFlag = vi.fn();
    const result = runFeedMigrationIfNeeded({
      getLogs: () => [],
      getExistingEvents: () => [],
      addEvent,
      getFlag: () => null,
      setFlag,
    });
    expect(result.ran).toBe(true);
    expect(result.migrated).toBe(0);
    expect(result.reason).toBe('no-data');
    expect(addEvent).not.toHaveBeenCalled();
    expect(setFlag).toHaveBeenCalled();
  });

  it('existing marker → آین log skip', () => {
    const addEvent = vi.fn();
    const result = runFeedMigrationIfNeeded({
      getLogs: () => [log({ id: 'l1' })],
      getExistingEvents: () => [evtWithNote('[migrated:l1]')],
      addEvent,
      getFlag: () => null,
      setFlag: vi.fn(),
    });
    expect(result.migrated).toBe(0);
    expect(addEvent).not.toHaveBeenCalled();
    expect(result.reason).toBe('no-data');
  });

  it('چند log، یکی موجود در existing → فقط جدیدها', () => {
    const addEvent = vi.fn();
    const result = runFeedMigrationIfNeeded({
      getLogs: () => [
        log({ id: 'a' }),
        log({ id: 'b' }),
      ],
      getExistingEvents: () => [evtWithNote('[migrated:a]')],
      addEvent,
      getFlag: () => null,
      setFlag: vi.fn(),
    });
    expect(result.migrated).toBe(1);
    expect(addEvent).toHaveBeenCalledTimes(1);
  });

  it('exception در getLogs → reason=error، flag ست نمی‌شود', () => {
    const setFlag = vi.fn();
    const result = runFeedMigrationIfNeeded({
      getLogs: () => { throw new Error('boom'); },
      getExistingEvents: () => [],
      addEvent: vi.fn(),
      getFlag: () => null,
      setFlag,
    });
    expect(result.ran).toBe(false);
    expect(result.reason).toBe('error');
    expect(setFlag).not.toHaveBeenCalled();
  });

  it('exception در addEvent → reason=error', () => {
    const result = runFeedMigrationIfNeeded({
      getLogs: () => [log()],
      getExistingEvents: () => [],
      addEvent: () => { throw new Error('add fail'); },
      getFlag: () => null,
      setFlag: vi.fn(),
    });
    expect(result.reason).toBe('error');
  });
});

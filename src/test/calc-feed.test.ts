import { describe, it, expect } from 'vitest';
import { calculateFeedMetrics } from '../shr/calc/formulas/feed';

describe('calculateFeedMetrics — scoop (precision)', () => {
  it('با remaining قبل و بعد → precision', () => {
    const r = calculateFeedMetrics({
      feedMethod: 'scoop',
      feedDeliveredKg: 50,
      feedRemainingKg: 8,
      previousRemainingKg: 5,
      aliveCount: 1000,
    });
    // consumed = 50 - (8 - 5) = 47
    expect(r.feedConsumedKg).toBe(47);
    expect(r.mode).toBe('precision');
    expect(r.feedPerBirdG).toBe(47);
  });

  it('بدون previousRemaining → simple fallback', () => {
    const r = calculateFeedMetrics({
      feedMethod: 'scoop',
      feedDeliveredKg: 50,
      feedRemainingKg: 8,
      previousRemainingKg: null,
      aliveCount: 1000,
    });
    expect(r.feedConsumedKg).toBe(50);
    expect(r.mode).toBe('simple');
  });
});

describe('calculateFeedMetrics — auto', () => {
  it('auto_sensor → precision، همان delivered', () => {
    const r = calculateFeedMetrics({
      feedMethod: 'auto_sensor',
      feedDeliveredKg: 47,
      feedRemainingKg: null,
      previousRemainingKg: null,
      aliveCount: 1000,
    });
    expect(r.feedConsumedKg).toBe(47);
    expect(r.mode).toBe('precision');
  });

  it('auto_chain → simple', () => {
    const r = calculateFeedMetrics({
      feedMethod: 'auto_chain',
      feedDeliveredKg: 50,
      feedRemainingKg: null,
      previousRemainingKg: null,
      aliveCount: 1000,
    });
    expect(r.feedConsumedKg).toBe(50);
    expect(r.mode).toBe('simple');
  });
});

describe('calculateFeedMetrics — هشدارها', () => {
  it('مصرف منفی → هشدار danger', () => {
    const r = calculateFeedMetrics({
      feedMethod: 'scoop',
      feedDeliveredKg: 20,
      feedRemainingKg: 30,
      previousRemainingKg: 5,
      aliveCount: 1000,
    });
    // consumed = 20 - 25 = -5 → 0
    expect(r.feedConsumedKg).toBe(0);
    expect(r.warning).toContain('منفی');
  });

  it('perBird > 300 → هشدار', () => {
    const r = calculateFeedMetrics({
      feedMethod: 'scoop',
      feedDeliveredKg: 500,
      feedRemainingKg: null,
      previousRemainingKg: null,
      aliveCount: 1000,
    });
    // 500 kg / 1000 bird = 500 g/bird → > 300
    expect(r.feedPerBirdG).toBe(500);
    expect(r.warning).toContain('بالا');
  });

  it('perBird < 5 → هشدار', () => {
    const r = calculateFeedMetrics({
      feedMethod: 'scoop',
      feedDeliveredKg: 2,
      feedRemainingKg: null,
      previousRemainingKg: null,
      aliveCount: 1000,
    });
    // 2 kg / 1000 = 2 g/bird → < 5
    expect(r.feedPerBirdG).toBe(2);
    expect(r.warning).toContain('پایین');
  });
});

describe('calculateFeedMetrics — edge', () => {
  it('aliveCount = 0 → perBird = 0', () => {
    const r = calculateFeedMetrics({
      feedMethod: 'scoop',
      feedDeliveredKg: 50,
      feedRemainingKg: null,
      previousRemainingKg: null,
      aliveCount: 0,
    });
    expect(r.feedPerBirdG).toBe(0);
  });
});

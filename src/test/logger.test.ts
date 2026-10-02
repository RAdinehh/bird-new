import { describe, it, expect } from 'vitest';
import * as logger from '../cor/logger/logger';

describe('logger', () => {
  it('exports موجودن', () => {
    expect(Object.keys(logger).length).toBeGreaterThan(0);
  });
});

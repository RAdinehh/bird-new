import { describe, it, expect } from 'vitest';
import * as exp from '../shr/utils/export';

describe('export', () => {
  it('exports موجودن', () => {
    expect(Object.keys(exp).length).toBeGreaterThan(0);
  });
});

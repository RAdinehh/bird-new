import { describe, it, expect } from 'vitest';
import * as theme from '../cor/store/theme';

describe('theme store', () => {
  it('exports موجودن', () => {
    expect(Object.keys(theme).length).toBeGreaterThan(0);
  });
});

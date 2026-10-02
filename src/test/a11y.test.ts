import { describe, it, expect } from 'vitest';
import * as a11y from '../cor/ui/a11y';

describe('a11y', () => {
  it('exports موجودن', () => {
    expect(Object.keys(a11y).length).toBeGreaterThan(0);
  });
});

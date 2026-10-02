import { describe, it, expect } from 'vitest';
import * as m from '../mod/cal/manual';

describe('cal-manual', () => {
  it('exports موجودن', () => {
    expect(Object.keys(m).length).toBeGreaterThan(0);
  });
});

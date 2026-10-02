import { describe, it, expect } from 'vitest';
import * as m from '../mod/cal/vaccineSchedules';

describe('cal-vaccine', () => {
  it('exports موجودن', () => {
    expect(Object.keys(m).length).toBeGreaterThan(0);
  });
});

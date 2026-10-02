import { describe, it, expect } from 'vitest';
import * as m from '../mod/inc/hooks';

describe('inc-hooks', () => {
  it('exports موجودن', () => {
    expect(Object.keys(m).length).toBeGreaterThan(0);
  });
});

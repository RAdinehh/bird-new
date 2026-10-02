import { describe, it, expect } from 'vitest';
import * as m from '../mod/dsh/cards';

describe('dsh-cards', () => {
  it('exports موجودن', () => {
    expect(Object.keys(m).length).toBeGreaterThan(0);
  });
});

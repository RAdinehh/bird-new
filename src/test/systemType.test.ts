import { describe, it, expect } from 'vitest';
import * as st from '../shr/utils/systemType';

describe('systemType', () => {
  it('exports موجودن', () => {
    expect(Object.keys(st).length).toBeGreaterThan(0);
  });
});

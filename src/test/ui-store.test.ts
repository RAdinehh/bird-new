import { describe, it, expect } from 'vitest';
import * as ui from '../cor/store/ui';

describe('ui store', () => {
  it('exports موجودن', () => {
    expect(Object.keys(ui).length).toBeGreaterThan(0);
  });
});

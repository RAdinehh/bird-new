import { describe, it, expect } from 'vitest';
import * as itemDetails from '../shr/utils/itemDetails';

describe('itemDetails', () => {
  it('exports موجودن', () => {
    expect(Object.keys(itemDetails).length).toBeGreaterThan(0);
  });
});

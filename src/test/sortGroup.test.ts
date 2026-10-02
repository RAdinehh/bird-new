import { describe, it, expect } from 'vitest';
import * as sg from '../cor/ui/sortGroup';

describe('sortGroup', () => {
  it('exports موجودن', () => {
    expect(Object.keys(sg).length).toBeGreaterThan(0);
  });
});

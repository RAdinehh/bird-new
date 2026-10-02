import { describe, it, expect } from 'vitest';
import * as pareto from '../shr/utils/pareto';

describe('pareto', () => {
  it('exports موجودن', () => {
    expect(Object.keys(pareto).length).toBeGreaterThan(0);
  });
});

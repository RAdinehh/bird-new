import { describe, it, expect } from 'vitest';
import * as mod from '../shr/hooks/useKeyboard';

describe('useKeyboard', () => {
  it('export شده', () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});

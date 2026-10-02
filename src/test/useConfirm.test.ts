import { describe, it, expect } from 'vitest';
import * as useConfirmMod from '../cor/ui/useConfirm';

describe('useConfirm', () => {
  it('export شده', () => {
    expect(Object.keys(useConfirmMod).length).toBeGreaterThan(0);
  });
});

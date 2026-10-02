import { describe, it, expect } from 'vitest';
import * as useUndoMod from '../cor/ui/useUndo';

describe('useUndo', () => {
  it('export شده', () => {
    expect(Object.keys(useUndoMod).length).toBeGreaterThan(0);
  });
});

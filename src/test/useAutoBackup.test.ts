import { describe, it, expect } from 'vitest';
import * as mod from '../shr/hooks/useAutoBackup';

describe('useAutoBackup', () => {
  it('export شده', () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});

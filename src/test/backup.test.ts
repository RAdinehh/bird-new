import { describe, it, expect } from 'vitest';
import * as backup from '../shr/utils/backup';

describe('backup', () => {
  it('exports موجودن', () => {
    expect(Object.keys(backup).length).toBeGreaterThan(0);
  });
});

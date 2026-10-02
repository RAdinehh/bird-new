import { describe, it, expect } from 'vitest';
import * as EB from '../mod/rep/ExportButtons';

describe('ExportButtons', () => {
  it('exports موجودن', () => {
    expect(Object.keys(EB).length).toBeGreaterThan(0);
  });
});

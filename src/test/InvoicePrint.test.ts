import { describe, it, expect } from 'vitest';
import * as IP from '../mod/tra/InvoicePrint';

describe('InvoicePrint', () => {
  it('exports موجودن', () => {
    expect(Object.keys(IP).length).toBeGreaterThan(0);
  });
});

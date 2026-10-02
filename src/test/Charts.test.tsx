import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as Charts from '../shr/components/Charts';

describe('Charts module', () => {
  it('export شده', () => {
    expect(Object.keys(Charts).length).toBeGreaterThan(0);
  });
});

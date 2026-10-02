import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';

// چک exports
import * as mod from '../shr/hooks/useUrlFilter';

describe('useUrlFilter', () => {
  it('exports موجودن', () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});

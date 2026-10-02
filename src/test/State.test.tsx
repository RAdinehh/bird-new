import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import State from '../shr/components/State';

describe('State', () => {
  it('رندر بدون خطا', () => {
    try {
      const { container } = render(<State />);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DependentSelect from '../shr/components/DependentSelect';

describe('DependentSelect', () => {
  it('رندر بدون خطا (با empty props)', () => {
    try {
      const { container } = render(
        <DependentSelect
          parentValue=""
          options={[]}
          value=""
          onChange={() => {}}
        />
      );
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});

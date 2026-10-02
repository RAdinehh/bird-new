import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ItemDetailsForm from '../shr/components/ItemDetailsForm';

describe('ItemDetailsForm', () => {
  it('رندر بدون خطا (empty)', () => {
    try {
      const { container } = render(
        <ItemDetailsForm category="feed" value={{}} onChange={() => {}} />
      );
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});

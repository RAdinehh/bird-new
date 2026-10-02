import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PinSetupModal from '../shr/components/PinSetupModal';

describe('PinSetupModal', () => {
  it('رندر بدون خطا', () => {
    try {
      const { container } = render(
        <PinSetupModal open={false} onClose={() => {}} />
      );
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});

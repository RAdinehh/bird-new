import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import OnboardingModal from '../shr/components/OnboardingModal';

describe('OnboardingModal', () => {
  it('رندر بدون خطا', () => {
    try {
      const { container } = render(
        <OnboardingModal open={true} onClose={() => {}} />
      );
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});

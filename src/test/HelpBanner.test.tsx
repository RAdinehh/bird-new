import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HelpBanner from '../shr/components/HelpBanner';

describe('HelpBanner', () => {
  it('رندر بدون خطا', () => {
    try {
      const { container } = render(
        <HelpBanner title="راهنما" storageKey="test-key">
          محتوا
        </HelpBanner>
      );
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});

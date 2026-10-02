import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HelpModal from '../shr/components/HelpModal';

describe('HelpModal', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<HelpModal />);
    expect(container).toBeTruthy();
  });
});

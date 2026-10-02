import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ShortcutsModal from '../shr/components/ShortcutsModal';

describe('ShortcutsModal', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<ShortcutsModal />);
    expect(container).toBeTruthy();
  });
});

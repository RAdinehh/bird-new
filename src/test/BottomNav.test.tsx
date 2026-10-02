import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '../shr/components/BottomNav';

describe('BottomNav', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<MemoryRouter><BottomNav /></MemoryRouter>);
    expect(container).toBeTruthy();
  });
});

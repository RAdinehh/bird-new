import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MenuDrawer from '../shr/components/MenuDrawer';

describe('MenuDrawer', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<MemoryRouter><MenuDrawer /></MemoryRouter>);
    expect(container).toBeTruthy();
  });
});

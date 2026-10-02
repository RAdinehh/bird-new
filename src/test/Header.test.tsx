import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../shr/components/Header';

vi.mock('../mod/set/store', () => ({
  useSet: () => ({ theme: 'light' }),
}));

describe('Header', () => {
  it('عنوان رو نشون میده', () => {
    render(<MemoryRouter><Header title="داشبورد" /></MemoryRouter>);
    expect(screen.getByText('داشبورد')).toBeInTheDocument();
  });
});

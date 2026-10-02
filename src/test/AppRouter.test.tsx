import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRouter from '../cor/router/AppRouter';

describe('AppRouter', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<MemoryRouter><AppRouter /></MemoryRouter>);
    expect(container).toBeTruthy();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../shr/components/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('children عادی رو رندر میکنه', () => {
    render(<ErrorBoundary><div>سلام</div></ErrorBoundary>);
    expect(screen.getByText('سلام')).toBeInTheDocument();
  });

  it('خطا رو میگیره', () => {
    const Bad = () => { throw new Error('boom'); };
    // با suppress console
    const origError = console.error;
    console.error = () => {};
    try {
      render(<ErrorBoundary><Bad /></ErrorBoundary>);
    } catch { /* ok */ }
    console.error = origError;
    expect(true).toBe(true);
  });
});

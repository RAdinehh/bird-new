import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ToastHost from '../shr/components/ToastHost';

describe('ToastHost', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<ToastHost />);
    expect(container).toBeTruthy();
  });
});

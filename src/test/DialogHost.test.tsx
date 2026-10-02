import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DialogHost from '../shr/components/DialogHost';

describe('DialogHost', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(<DialogHost />);
    expect(container).toBeTruthy();
  });
});

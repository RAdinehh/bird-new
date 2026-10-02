import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimePicker from '../shr/components/TimePicker';

describe('TimePicker', () => {
  it('placeholder رو نشون میده وقتی خالیه', () => {
    render(<TimePicker value="" onChange={() => {}} />);
    expect(screen.getByText('انتخاب ساعت')).toBeInTheDocument();
  });

  it('مقدار رو نشون میده', () => {
    render(<TimePicker value="14:30" onChange={() => {}} />);
    expect(screen.getByText('۱۴:۳۰')).toBeInTheDocument();
  });

  it('کلیک → Sheet باز میشه', () => {
    render(<TimePicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    // دکمه تأیید فقط توی Sheet هست
    expect(screen.getByText(/تأیید/)).toBeInTheDocument();
  });

  it('دکمه اکنون هست', () => {
    render(<TimePicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/اکنون/)).toBeInTheDocument();
  });

  it('دکمه پاک هست', () => {
    render(<TimePicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('پاک')).toBeInTheDocument();
  });

  it('disabled کار نمیکنه', () => {
    render(<TimePicker value="" onChange={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from '../shr/components/DatePicker';

describe('DatePicker', () => {
  it('placeholder رو نشون میده وقتی value خالیه', () => {
    render(<DatePicker value="" onChange={() => {}} placeholder="انتخاب تاریخ" />);
    expect(screen.getByText('انتخاب تاریخ')).toBeInTheDocument();
  });

  it('value رو نشون میده وقتی مقدار داره', () => {
    render(<DatePicker value="1405/07/09" onChange={() => {}} />);
    expect(screen.getByText('۱۴۰۵/۰۷/۰۹')).toBeInTheDocument();
  });

  it('روی کلیک باز میشه و دکمه تأیید ظاهر میشه', () => {
    render(<DatePicker value="" onChange={() => {}} />);
    const btns = screen.getAllByRole('button');
    fireEvent.click(btns[0]);
    // دکمه تأیید که فقط توی Modal هست
    expect(screen.getByText(/تأیید/)).toBeInTheDocument();
  });

  it('disabled کار نمیکنه', () => {
    render(<DatePicker value="" onChange={() => {}} disabled />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('autoToday خودکار امروز رو ست میکنه', () => {
    const onChange = vi.fn();
    render(<DatePicker value="" onChange={onChange} autoToday />);
    expect(onChange).toHaveBeenCalled();
  });
});

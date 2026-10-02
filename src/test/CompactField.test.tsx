import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CompactField } from '../mod/set/standards/ui/components/CompactField';

describe('CompactField — decimal', () => {
  it('نقطه انگلیسی پذیرفته میشه', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CompactField label="دما" value={0} onChange={onChange} unit="C" />
    );
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '36.5' } });
    expect(onChange).toHaveBeenCalledWith(36.5);
  });

  it('کاما انگلیسی هم به نقطه تبدیل میشه', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CompactField label="دما" value={0} onChange={onChange} unit="C" />
    );
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '36,5' } });
    expect(onChange).toHaveBeenCalledWith(36.5);
  });

  it('ممیز عربی هم پذیرفته میشه', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CompactField label="دما" value={0} onChange={onChange} unit="C" />
    );
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '36٫5' } });
    expect(onChange).toHaveBeenCalledWith(36.5);
  });

  it('دو نقطه پشت سر هم → فقط اولی میمونه', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CompactField label="دما" value={0} onChange={onChange} unit="C" />
    );
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '36.5.2' } });
    expect(onChange).toHaveBeenCalledWith(36.52);
  });

  it('خالی → null', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CompactField label="دما" value={0} onChange={onChange} unit="C" />
    );
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

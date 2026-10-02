import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input, Field } from '../shr/components/ui';

describe('Input', () => {
  it('value رو نشون میده', () => {
    render(<Input value="سلام" onChange={() => {}} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('سلام');
  });

  it('onChange کار میکنه', () => {
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('disabled کار میکنه', () => {
    render(<Input value="" onChange={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('placeholder نشون داده میشه', () => {
    render(<Input value="" onChange={() => {}} placeholder="تایپ کن..." />);
    expect(screen.getByPlaceholderText('تایپ کن...')).toBeInTheDocument();
  });
});

describe('Field', () => {
  it('label رو نشون میده', () => {
    render(<Field label="نام"><Input value="" onChange={() => {}} /></Field>);
    expect(screen.getByText('نام')).toBeInTheDocument();
  });

  it('required * نشون میده', () => {
    const { container } = render(<Field label="نام" required><Input value="" onChange={() => {}} /></Field>);
    expect(container.textContent).toContain('*');
  });

  it('hint رو نشون میده', () => {
    render(<Field label="نام" hint="متن راهنما"><Input value="" onChange={() => {}} /></Field>);
    expect(screen.getByText('متن راهنما')).toBeInTheDocument();
  });

  it('children رو رندر میکنه', () => {
    render(<Field label="X"><Input value="test" onChange={() => {}} /></Field>);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

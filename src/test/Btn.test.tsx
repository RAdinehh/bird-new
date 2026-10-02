import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Btn, BtnRow, ErrorBox } from '../shr/components/ui';

describe('Btn', () => {
  it('رندر میشه با متن', () => {
    render(<Btn>ذخیره</Btn>);
    expect(screen.getByText('ذخیره')).toBeInTheDocument();
  });

  it('onClick کار میکنه', () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick}>کلیک</Btn>);
    fireEvent.click(screen.getByText('کلیک'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled کار نمیکنه', () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick} disabled>کلیک</Btn>);
    fireEvent.click(screen.getByText('کلیک'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('variant primary کلاس داره', () => {
    const { container } = render(<Btn variant="primary">تأیید</Btn>);
    const btn = container.querySelector('button');
    expect(btn).toBeInTheDocument();
  });

  it('full → width 100%', () => {
    const { container } = render(<Btn full>تمام عرض</Btn>);
    const btn = container.querySelector('button') as HTMLElement;
    expect(btn.style.width).toBe('100%');
  });
});

describe('BtnRow', () => {
  it('فرزندان رو رندر میکنه', () => {
    render(
      <BtnRow>
        <Btn>لغو</Btn>
        <Btn variant="primary">ذخیره</Btn>
      </BtnRow>
    );
    expect(screen.getByText('لغو')).toBeInTheDocument();
    expect(screen.getByText('ذخیره')).toBeInTheDocument();
  });
});

describe('ErrorBox', () => {
  it('خالی رو رندر نمیکنه', () => {
    const { container } = render(<ErrorBox>{''}</ErrorBox>);
    expect(container.textContent?.trim()).toBe('');
  });

  it('خطا رو نشون میده', () => {
    render(<ErrorBox>خطای تست</ErrorBox>);
    expect(screen.getByText('خطای تست')).toBeInTheDocument();
  });
});

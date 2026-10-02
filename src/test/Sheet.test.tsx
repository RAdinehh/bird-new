import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sheet, Btn } from '../shr/components/ui';

describe('Sheet', () => {
  it('وقتی open=false رندر نمیشه', () => {
    render(<Sheet open={false} onClose={() => {}}><div>محتوا</div></Sheet>);
    expect(screen.queryByText('محتوا')).not.toBeInTheDocument();
  });

  it('وقتی open=true رندر میشه', () => {
    render(<Sheet open={true} onClose={() => {}}><div>محتوا</div></Sheet>);
    expect(screen.getByText('محتوا')).toBeInTheDocument();
  });

  it('title رو نشون میده', () => {
    render(<Sheet open={true} onClose={() => {}} title="عنوان تست"><div>x</div></Sheet>);
    expect(screen.getByText('عنوان تست')).toBeInTheDocument();
  });

  it('کلیک روی backdrop → onClose', () => {
    const onClose = vi.fn();
    render(<Sheet open={true} onClose={onClose}><div>محتوا</div></Sheet>);
    // backdrop = highest z-index fixed overlay in body
    const backdrop = document.body.querySelector('div[style*="fixed"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    // fire click on backdrop itself (target === currentTarget)
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('Esc → onClose', () => {
    const onClose = vi.fn();
    render(<Sheet open={true} onClose={onClose}><div>محتوا</div></Sheet>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('footer رو نشون میده', () => {
    render(
      <Sheet open={true} onClose={() => {}} footer={<Btn>ذخیره</Btn>}>
        <div>x</div>
      </Sheet>
    );
    expect(screen.getByText('ذخیره')).toBeInTheDocument();
  });
});

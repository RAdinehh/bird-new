import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpandableCard from '../shr/components/ExpandableCard';

describe('ExpandableCard', () => {
  it('title و subtitle رندر میشن', () => {
    render(
      <ExpandableCard title="عنوان" subtitle="زیرعنوان" isOpen={false} onToggle={() => {}}>
        <div>محتوا</div>
      </ExpandableCard>
    );
    expect(screen.getByText('عنوان')).toBeInTheDocument();
    expect(screen.getByText('زیرعنوان')).toBeInTheDocument();
  });

  it('کلیک → onToggle', () => {
    const onToggle = vi.fn();
    render(
      <ExpandableCard title="x" subtitle="y" isOpen={false} onToggle={onToggle}>
        <div>z</div>
      </ExpandableCard>
    );
    fireEvent.click(screen.getByLabelText('باز کردن x'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('isOpen → محتوا دیده میشه', () => {
    render(
      <ExpandableCard title="x" subtitle="y" isOpen={true} onToggle={() => {}}>
        <div>محتوای باز</div>
      </ExpandableCard>
    );
    expect(screen.getByText('محتوای باز')).toBeInTheDocument();
  });

  it('aria-expanded درست', () => {
    render(
      <ExpandableCard title="x" subtitle="y" isOpen={true} onToggle={() => {}}>
        <div>z</div>
      </ExpandableCard>
    );
    expect(screen.getByLabelText('بستن x')).toHaveAttribute('aria-expanded', 'true');
  });
});

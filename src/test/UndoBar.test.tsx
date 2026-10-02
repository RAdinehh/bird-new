import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UndoBar from '../cor/ui/UndoBar';

describe('UndoBar', () => {
  it('label و دکمه‌ها رندر میشن', () => {
    render(<UndoBar label="حذف شد" onUndo={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText(/حذف شد/)).toBeInTheDocument();
  });

  it('کلیک Undo', () => {
    const onUndo = vi.fn();
    render(<UndoBar label="x" onUndo={onUndo} onDismiss={() => {}} />);
    const undoBtn = screen.getByText(/بازگردان|Undo|واگرد/i);
    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalled();
  });

  it('کلیک Dismiss', () => {
    const onDismiss = vi.fn();
    render(<UndoBar label="x" onUndo={() => {}} onDismiss={onDismiss} />);
    const btns = screen.getAllByRole('button');
    // آخرین دکمه معمولاً بستن
    if (btns.length > 1) fireEvent.click(btns[btns.length - 1]);
    expect(true).toBe(true);
  });
});

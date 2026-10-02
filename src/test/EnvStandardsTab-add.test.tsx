/**
 * تست integration: افزودن نژاد جدید باید در store ثبت بشه
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSet } from '../mod/set/store';

vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn(),
}));
vi.mock('../mod/brd/store', () => ({
  useBrd: () => ({ birds: [] }),
}));
vi.mock('../mod/flk/store', () => ({
  useFlk: () => ({ flocks: [] }),
}));

import EnvStandardsTab from '../mod/set/standards/ui/EnvStandardsTab';

describe('EnvStandardsTab — افزودن نژاد جدید', () => {
  beforeEach(() => {
    useSet.setState({ customStandards: {} });
    vi.clearAllMocks();
  });

  it('بعد از افزودن، نژاد جدید در store هست', async () => {
    render(<EnvStandardsTab />);

    // کلیک روی دکمه‌ی پایین (نه عنوان modal)
    const addBtn = screen.getByRole('button', { name: /➕ افزودن نژاد جدید/ });
    fireEvent.click(addBtn);

    // منتظر باز شدن modal
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/لاری/)).toBeInTheDocument();
    });

    // پر کردن فرم
    const birdInput = screen.getByPlaceholderText(/^مرغ$/);
    const faInput = screen.getByPlaceholderText(/لاری/);
    const enInput = screen.getByPlaceholderText(/Lari/);

    fireEvent.change(birdInput, { target: { value: 'بوقلمون' } });
    fireEvent.change(faInput, { target: { value: 'برنز' } });
    fireEvent.change(enInput, { target: { value: 'Bronze' } });

    // دکمه‌ی افزودن داخل footer modal (نه دکمه‌ی بالای صفحه)
    const allAddBtns = screen.getAllByRole('button', { name: /^افزودن$/ });
    // اولی داخل modal
    fireEvent.click(allAddBtns[0]);

    await waitFor(() => {
      const custom = useSet.getState().customStandards || {};
      const keys = Object.keys(custom);
      expect(keys.length).toBeGreaterThan(0);
      // نژاد جدید باید با یکی از این کلید‌ها باشه
      const newKey = keys.find(k => custom[k].nameFa === 'برنز');
      expect(newKey).toBeTruthy();
      expect(custom[newKey!].birdName).toBe('بوقلمون');
    });
  });
});

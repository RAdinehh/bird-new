import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './helpers';
import BirdsPage from '../mod/brd/BirdsPage';
import { useBrd } from '../mod/brd/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({
  showToast: vi.fn(),
  toastMsg: {
    added: vi.fn(), saved: vi.fn(), updated: vi.fn(),
    deleted: vi.fn(), deletedBulk: vi.fn(),
    archived: vi.fn(), archivedBulk: vi.fn(),
    restored: vi.fn(), restoredBulk: vi.fn(),
    hidden: vi.fn(), visible: vi.fn(),
    paused: vi.fn(), activated: vi.fn(),
    error: vi.fn(), warn: vi.fn(), info: vi.fn(),
  },
}));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

// helper: با id معتبر
const makeBird = (o: any = {}) => ({
  id: 'b-' + Math.random().toString(36).slice(2, 9),
  name: 'مرغ',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

function expandCard(title: string) {
  const btn = screen.getByLabelText(`باز کردن ${title}`);
  fireEvent.click(btn);
}

beforeEach(() => {
  useBrd.setState({ birds: [], breeds: [] });
  vi.clearAllMocks();
});

describe('BirdsPage — حالت خالی', () => {
  it('پیام خالی', () => {
    renderWithRouter(<BirdsPage />);
    expect(screen.getByText('هنوز پرنده‌ای اضافه نکرده‌اید')).toBeInTheDocument();
  });
  it('دکمه افزودن', () => {
    renderWithRouter(<BirdsPage />);
    expect(screen.getAllByLabelText(/افزودن پرنده/).length).toBeGreaterThan(0);
  });
});

describe('BirdsPage — نمایش لیست', () => {
  it('پرنده‌ها دیده میشن', () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' }), makeBird({ name: 'بوقلمون' })] as any });
    renderWithRouter(<BirdsPage />);
    expect(screen.getByText('مرغ')).toBeInTheDocument();
    expect(screen.getByText('بوقلمون')).toBeInTheDocument();
  });

  it('badge نژاد صفر', () => {
    useBrd.setState({ birds: [makeBird()] as any });
    renderWithRouter(<BirdsPage />);
    expect(screen.getByText(/۰ نژاد/)).toBeInTheDocument();
  });

  it('با ۲ نژاد → badge ۲', () => {
    const bid = 'b1';
    useBrd.setState({
      birds: [makeBird({ id: bid })] as any,
      breeds: [
        { id: 'br1', birdId: bid, name: 'لگهورن', fcr: 1.5 } as any,
        { id: 'br2', birdId: bid, name: 'پلیموث', fcr: 1.7 } as any,
      ],
    });
    renderWithRouter(<BirdsPage />);
    expect(screen.getByText(/۲ نژاد/)).toBeInTheDocument();
  });


});

describe('BirdsPage — افزودن', () => {
  it('باز شدن Modal', () => {
    renderWithRouter(<BirdsPage />);
    fireEvent.click(screen.getAllByLabelText(/افزودن پرنده/)[0]);
    expect(screen.getByText('افزودن پرنده')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('مثلاً — مرغ یا بوقلمون')).toBeInTheDocument();
  });

  it('پر کردن + ذخیره → اضافه میشه', async () => {
    renderWithRouter(<BirdsPage />);
    fireEvent.click(screen.getAllByLabelText(/افزودن پرنده/)[0]);
    fireEvent.change(screen.getByPlaceholderText('مثلاً — مرغ یا بوقلمون'), { target: { value: 'اردک' } });
    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => {
      expect(useBrd.getState().birds).toHaveLength(1);
    });
    expect(useBrd.getState().birds[0].name).toBe('اردک');
  });

  it('نام خالی → ذخیره نشه', async () => {
    renderWithRouter(<BirdsPage />);
    fireEvent.click(screen.getAllByLabelText(/افزودن پرنده/)[0]);
    fireEvent.click(screen.getByText('ذخیره'));
    await new Promise(r => setTimeout(r, 50));
    expect(useBrd.getState().birds).toHaveLength(0);
  });

  it('لغو → بسته میشه', async () => {
    renderWithRouter(<BirdsPage />);
    fireEvent.click(screen.getAllByLabelText(/افزودن پرنده/)[0]);
    fireEvent.click(screen.getByText('لغو'));
    await waitFor(() => {
      expect(screen.queryByText('افزودن پرنده')).not.toBeInTheDocument();
    });
  });

  it('نام تکراری → خطای inline', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });

    renderWithRouter(<BirdsPage />);
    fireEvent.click(screen.getAllByLabelText(/افزودن پرنده/)[0]);
    fireEvent.change(screen.getByPlaceholderText('مثلاً — مرغ یا بوقلمون'), { target: { value: 'مرغ' } });
    fireEvent.click(screen.getByText('ذخیره'));

    // حالا inline error نشون داده می‌شه
    await waitFor(() => expect(screen.getByText(/تکراریه/)).toBeInTheDocument());
  });

  it('نام جدید → ذخیره بدون هشدار', async () => {
    const { showAlert } = await import('../cor/store/dialog');
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });

    renderWithRouter(<BirdsPage />);
    fireEvent.click(screen.getAllByLabelText(/افزودن پرنده/)[0]);
    fireEvent.change(screen.getByPlaceholderText('مثلاً — مرغ یا بوقلمون'), { target: { value: 'بوقلمون' } });
    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => expect(useBrd.getState().birds).toHaveLength(2));
    expect(showAlert).not.toHaveBeenCalled();
  });
});

describe('BirdsPage — Expand / ویرایش / حذف', () => {
  it('expand → مشخصات', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    renderWithRouter(<BirdsPage />);
    expandCard('مرغ');

    await waitFor(() => expect(screen.getByText(/مشخصات کامل/)).toBeInTheDocument());
  });

  it('expand → دکمه‌ها', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    renderWithRouter(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => {
      expect(screen.getByText('ویرایش')).toBeInTheDocument();
      expect(screen.getByText('حذف')).toBeInTheDocument();
    });
  });

  it('نمایش نژادها', async () => {
    const bid = 'b1';
    useBrd.setState({
      birds: [makeBird({ id: bid, name: 'مرغ' })] as any,
      breeds: [{ id: 'br1', birdId: bid, name: 'لگهورن', fcr: 1.5 } as any],
    });
    renderWithRouter(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText(/لگهورن/)).toBeInTheDocument());
  });

  it('کلیک ویرایش → Modal', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    renderWithRouter(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText('ویرایش')).toBeInTheDocument());
    fireEvent.click(screen.getByText('ویرایش'));

    await waitFor(() => expect(screen.getByText('ویرایش پرنده')).toBeInTheDocument());
  });

  it('ویرایش + save → آپدیت', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'قدیم' })] as any });
    renderWithRouter(<BirdsPage />);
    expandCard('قدیم');
    await waitFor(() => expect(screen.getByText('ویرایش')).toBeInTheDocument());
    fireEvent.click(screen.getByText('ویرایش'));

    await waitFor(() => expect(screen.getByText('ویرایش پرنده')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('مثلاً — مرغ یا بوقلمون'), { target: { value: 'بوقلمون' } });
    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => expect(useBrd.getState().birds[0].name).toBe('بوقلمون'));
  });

  it('کلیک حذف → showConfirmAsync صدا زده میشه', async () => {
    const { showConfirmAsync } = await import('../cor/store/dialog');
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    renderWithRouter(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText('حذف')).toBeInTheDocument());
    fireEvent.click(screen.getByText('حذف'));

    await waitFor(() => expect(showConfirmAsync).toHaveBeenCalled());
  });

  it('تأیید حذف → پاک میشه', async () => {
    const { showConfirmAsync } = await import('../cor/store/dialog');
    (showConfirmAsync as any).mockResolvedValueOnce(true);
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    renderWithRouter(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText('حذف')).toBeInTheDocument());
    fireEvent.click(screen.getByText('حذف'));

    await waitFor(() => expect(useBrd.getState().birds).toHaveLength(0));
  });

  it('لغو حذف → باقی میمونه', async () => {
    const { showConfirmAsync } = await import('../cor/store/dialog');
    (showConfirmAsync as any).mockResolvedValueOnce(false);
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    renderWithRouter(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText('حذف')).toBeInTheDocument());
    fireEvent.click(screen.getByText('حذف'));

    await new Promise(r => setTimeout(r, 100));
    expect(useBrd.getState().birds).toHaveLength(1);
  });
});
